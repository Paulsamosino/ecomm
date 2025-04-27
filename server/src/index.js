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
  "https://poultrymart-client.onrender.com",
  "https://poultrymart-api.onrender.com",
  "https://ecomm-git-main-ecomms-projects-807aa19d.vercel.app",
  "https://chickenpoultry.netlify.app",
];

// Request logging middleware - only in development
if (process.env.NODE_ENV !== "production") {
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    console.log("Request origin:", req.headers.origin);
    console.log("Request headers:", req.headers);
    console.log("Request body:", req.body);
    next();
  });
}

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

      // Allow render.com domains in production
      if (origin && origin.endsWith(".render.com")) {
        return callback(null, origin);
      }

      // Allow netlify.app domains
      if (origin && origin.endsWith(".netlify.app")) {
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

// Global error handler
const errorHandler = (err, req, res, next) => {
  console.error("Error details:");
  console.error("Error name:", err.name);
  console.error("Error message:", err.message);
  console.error("Stack trace:", err.stack);
  console.error("Request path:", req.path);
  console.error("Request method:", req.method);
  console.error("Request IP:", req.ip);

  // Determine status code
  let statusCode = err.status || 500;
  if (err.name === "ValidationError") statusCode = 400;
  if (err.name === "CastError") statusCode = 400;
  if (err.name === "JsonWebTokenError") statusCode = 401;
  if (err.name === "TokenExpiredError") statusCode = 401;

  // Prepare error response
  const errorResponse = {
    message: err.message || "Something went wrong!",
    status: statusCode,
    ...(process.env.NODE_ENV === "development" && {
      stack: err.stack,
      details: err,
    }),
  };

  res.status(statusCode).json(errorResponse);
};

// Register error handler
app.use(errorHandler);

// Import database connection
const connectDB = require("../config/db");

const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDB();

    // Start server only after successful DB connection
    const PORT = process.env.PORT || 5000;
    const server = app.listen(PORT, () => {
      console.log(
        `Server running in ${
          process.env.NODE_ENV || "development"
        } mode on port ${PORT}`
      );

      // Log application details
      console.log("Application Details:");
      console.log("==================");
      console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
      console.log(
        `API URL: ${
          process.env.NODE_ENV === "production"
            ? "https://poultrymart-api.onrender.com"
            : `http://localhost:${PORT}`
        }`
      );
      console.log(`MongoDB Host: ${mongoose.connection.host}`);
      console.log(`Database Name: ${mongoose.connection.db.databaseName}`);
    });

    // Handle unhandled promise rejections
    process.on("unhandledRejection", (err) => {
      console.error("Unhandled Promise Rejection:", err);
      // Close server & exit process
      server.close(() => process.exit(1));
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

// Start the server
startServer();
