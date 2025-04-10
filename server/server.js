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
  "https://chickenpoultry.shop",
  "https://www.chickenpoultry.shop",
  "https://api.chickenpoultry.shop",
  "https://chickenpoultry.netlify.app",
  "https://poultrymart-client.onrender.com",
  "https://poultrymart-api.onrender.com",
];

// CORS configuration with enhanced preflight handling
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, curl requests)
    if (!origin) return callback(null, true);

    // Check if the origin is in the allowed list
    if (allowedDomains.indexOf(origin) !== -1) {
      return callback(null, origin);
    }

    // Allow any vercel.app domain
    if (origin && origin.endsWith(".vercel.app")) {
      return callback(null, origin);
    }

    // Allow chickenpoultry.shop subdomains
    if (origin && origin.endsWith(".chickenpoultry.shop")) {
      return callback(null, origin);
    }

    // By default, deny the request
    callback(new Error("Not allowed by CORS"));
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "Origin",
    "X-Requested-With",
    "Accept",
  ],
  credentials: true,
  preflightContinue: false,
  optionsSuccessStatus: 204,
};

// Apply CORS middleware
app.use(cors(corsOptions));

// Handle OPTIONS requests explicitly
app.options("*", function (req, res) {
  const origin = req.headers.origin;

  // Check if the origin is allowed
  if (
    allowedDomains.includes(origin) ||
    (origin && origin.endsWith(".vercel.app")) ||
    (origin && origin.endsWith(".chickenpoultry.shop"))
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
    (origin && origin.endsWith(".chickenpoultry.shop"))
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

// Serve static files from the React app
app.use(express.static(path.join(__dirname, "../client/dist")));

// Register routes with proper error handling
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/seller", sellerRoutes);
app.use("/api/blog", blogRoutes);
app.use("/api/orders", require("./src/routes/orders"));

// Basic route for testing
app.get("/", (req, res) => {
  res.json({ message: "Welcome to PoultryMart API" });
});

// Health check endpoint for Render.com and monitoring
app.get("/health", async (req, res) => {
  const healthStatus = {
    status: "ok",
    timestamp: new Date(),
    services: {
      server: "up",
      mongodb: "unknown",
      cloudinary: "unknown",
    },
    uptime: process.uptime(),
  };

  // Check MongoDB connection
  try {
    const mongoStatus = mongoose.connection.readyState;
    switch (mongoStatus) {
      case 0:
        healthStatus.services.mongodb = "disconnected";
        break;
      case 1:
        healthStatus.services.mongodb = "connected";
        break;
      case 2:
        healthStatus.services.mongodb = "connecting";
        break;
      case 3:
        healthStatus.services.mongodb = "disconnecting";
        break;
      default:
        healthStatus.services.mongodb = "unknown";
    }
  } catch (error) {
    healthStatus.services.mongodb = "error";
    healthStatus.mongoError = error.message;
  }

  // Check Cloudinary connection
  try {
    const { isCloudinaryConfigured } = require("./src/config/cloudinary");
    if (isCloudinaryConfigured) {
      healthStatus.services.cloudinary = "configured";
    } else {
      healthStatus.services.cloudinary = "not_configured";
    }
  } catch (error) {
    healthStatus.services.cloudinary = "error";
    healthStatus.cloudinaryError = error.message;
  }

  // Set overall status
  if (
    healthStatus.services.mongodb !== "connected" ||
    healthStatus.services.cloudinary !== "configured"
  ) {
    healthStatus.status = "degraded";
  }

  // Return status code based on health
  const statusCode = healthStatus.status === "ok" ? 200 : 503;
  res.status(statusCode).json(healthStatus);
});

// Handle React routing, return all requests to React app
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../client/dist/index.html"));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Error stack:", err.stack);
  console.error("Error details:", {
    message: err.message,
    name: err.name,
    code: err.code,
  });

  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Something went wrong!",
    error: process.env.NODE_ENV === "development" ? err.stack : undefined,
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

const PORT = process.env.PORT || 3001;
server.listen(PORT, "0.0.0.0", () => {
  console.log(`Server is running on port ${PORT}`);
});
