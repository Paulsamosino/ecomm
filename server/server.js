const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const path = require("path");
const http = require("http");
const setupSocketServer = require("./socket");
require("dotenv").config();

const app = express();
const server = http.createServer(app);

// Basic middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// List of specific allowed domains
const allowedDomains = [
  "http://localhost:5173",
  "http://localhost:3000",
  "https://poultrymart-client.onrender.com",
  "https://poultrymart-api.onrender.com",
  "https://chickenpoultry.shop",
  "https://www.chickenpoultry.shop",
  "https://poultrymart.onrender.com",
];

// CORS configuration
app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      if (
        allowedDomains.includes(origin) ||
        origin.endsWith(".render.com") ||
        origin.endsWith(".chickenpoultry.shop")
      ) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Requested-With",
      "Origin",
      "Accept",
    ],
  })
);

// Handle OPTIONS requests explicitly
app.options("*", function (req, res) {
  const origin = req.headers.origin;

  // Check if the origin is allowed
  if (
    allowedDomains.includes(origin) ||
    (origin && origin.endsWith(".vercel.app")) ||
    (origin && origin.endsWith(".chickenpoultry.shop")) ||
    (origin && origin.endsWith(".render.com"))
  ) {
    res.header("Access-Control-Allow-Origin", origin);
    res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE,OPTIONS");
    res.header(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization, Content-Length, X-Requested-With, Accept, Origin"
    );
    res.header("Access-Control-Allow-Credentials", "true");
    res.sendStatus(204);
  } else {
    res.sendStatus(403);
  }
});

// Custom preflight handler for auth endpoints
app.options("/api/auth/*", (req, res) => {
  const origin = req.headers.origin;

  if (
    allowedDomains.includes(origin) ||
    (origin && origin.endsWith(".vercel.app")) ||
    (origin && origin.endsWith(".chickenpoultry.shop")) ||
    (origin && origin.endsWith(".render.com"))
  ) {
    res
      .status(204)
      .set({
        "Access-Control-Allow-Origin": origin,
        "Access-Control-Allow-Methods": "POST, GET, OPTIONS, PUT, DELETE",
        "Access-Control-Allow-Headers":
          "Content-Type, Authorization, Origin, X-Requested-With, Accept",
        "Access-Control-Allow-Credentials": "true",
        "Access-Control-Max-Age": "86400",
      })
      .end();
  } else {
    // Make sure we respond with 204 for OPTIONS requests, not 403
    res.status(204).end();
  }
});

// Log all requests for debugging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  console.log("Request origin:", req.headers.origin);
  console.log("Request headers:", req.headers);
  console.log("Request body:", req.body);
  next();
});

// Check for required dependencies and setup uploads directory
const fs = require("fs");
const uploadDir = path.join(__dirname, "uploads");
const productUploadsDir = path.join(uploadDir, "products");

// Ensure upload directories exist
[uploadDir, productUploadsDir].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`Created directory: ${dir}`);
  }
});

// Verify critical dependencies
["multer", "cloudinary", "mongoose"].forEach((dep) => {
  try {
    require.resolve(dep);
    console.log(`✓ ${dep} is installed`);
  } catch (err) {
    console.error(
      `Critical dependency ${dep} is missing. Please run npm install`
    );
    process.exit(1);
  }
});

// Serve uploaded files
app.use("/uploads", express.static(uploadDir));

// Connect to MongoDB
mongoose
  .connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 10000,
    socketTimeoutMS: 45000,
    family: 4, // Force IPv4
  })
  .then(() => {
    console.log("Connected to MongoDB");
    console.log("Database:", mongoose.connection.db.databaseName);
    console.log("Host:", mongoose.connection.host);
  })
  .catch((err) => {
    console.error("MongoDB connection error details:");
    console.error("Error name:", err.name);
    console.error("Error message:", err.message);
    console.error("Error code:", err.code);
    console.error("Full error:", err);
  });

// Initialize Socket.IO
setupSocketServer(server);

// Import routes
const authRoutes = require("./src/routes/auth");
const productRoutes = require("./src/routes/products");
const chatRoutes = require("./src/routes/chat");
const sellerRoutes = require("./src/routes/seller");
const blogRoutes = require("./src/routes/blog");
const adminRoutes = require("./src/routes/admin");

// Register routes with proper error handling
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/seller", sellerRoutes);
app.use("/api/blog", blogRoutes);
app.use("/api/orders", require("./src/routes/orders"));
app.use("/api/admin", adminRoutes);
app.use("/api/reports", require("./src/routes/reports"));
app.use("/api/upload", require("./src/routes/upload"));

// Basic route for API health check
app.get("/", (req, res) => {
  res.json({
    message: "PoultryMart API is running",
    environment: process.env.NODE_ENV,
    time: new Date().toISOString(),
  });
});

// 404 handler
app.use((req, res) => {
  console.log("404 - Route not found:", req.method, req.url);
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

// Use PORT from environment variable, defaulting to 3001 only in development
const PORT = process.env.NODE_ENV === "production" ? process.env.PORT : 3001;
server.listen(PORT, "0.0.0.0", () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
});
