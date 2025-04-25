const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const authRoutes = require("./routes/auth");
const productRoutes = require("./routes/products");
const sellerRoutes = require("./routes/seller");
const chatRoutes = require("./routes/chat");
const reportRoutes = require("./routes/reports");

const app = express();

// List of specific allowed domains
const allowedDomains = [
  "http://localhost:5173",
  "https://chickenpoultry.shop",
  "https://www.chickenpoultry.shop",
  "https://api.chickenpoultry.shop",
  "https://ecomm-git-main-ecomms-projects-807aa19d.vercel.app",
  "https://chickenpoultry.netlify.app",
];

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  console.log("Request origin:", req.headers.origin);
  console.log("Request headers:", req.headers);
  console.log("Request body:", req.body);
  next();
});

// CORS configuration with enhanced preflight handling
app.use(
  cors({
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

      // By default, allow the request but with specific origin
      callback(null, origin);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "Origin",
      "X-Requested-With",
      "Accept",
    ],
    preflightContinue: false,
    optionsSuccessStatus: 204,
  })
);

// Handle OPTIONS requests explicitly
app.options("*", function (req, res) {
  // Set CORS headers specifically for OPTIONS requests
  res.header("Access-Control-Allow-Origin", req.headers.origin);
  res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE,OPTIONS");
  res.header(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, Content-Length, X-Requested-With, Accept, Origin"
  );
  res.header("Access-Control-Allow-Credentials", "true");
  res.sendStatus(204);
});

// Body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/seller", sellerRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/reports", reportRoutes);

// Connect to MongoDB with enhanced error handling
mongoose
  .connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("Connected to MongoDB successfully");
    console.log("Database:", mongoose.connection.db.databaseName);
    console.log("Host:", mongoose.connection.host);
  })
  .catch((err) => {
    console.error("MongoDB connection error details:");
    console.error("Error name:", err.name);
    console.error("Error message:", err.message);
    console.error("Full error:", err);
    process.exit(1); // Exit if cannot connect to database
  });

// Error handling middleware with more details
app.use((err, req, res, next) => {
  console.error("Error details:");
  console.error("Error name:", err.name);
  console.error("Error message:", err.message);
  console.error("Stack trace:", err.stack);

  // Send more detailed error response in development
  const errorResponse = {
    message: "Something went wrong!",
    error: process.env.NODE_ENV === "development" ? err.message : undefined,
  };

  res.status(500).json(errorResponse);
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log("Environment:", process.env.NODE_ENV || "development");
});
