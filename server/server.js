const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const path = require("path");
const http = require("http");
const setupSocketServer = require("./socket");
require("dotenv").config();

const app = express();
const server = http.createServer(app);

// CORS configuration with enhanced preflight handling
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, curl requests)
    if (!origin) return callback(null, true);

    // Always allow the request with a specific origin
    callback(null, origin);
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

// Apply CORS middleware early in the middleware chain
app.use(cors(corsOptions));

// Handle OPTIONS requests explicitly
app.options("*", cors(corsOptions));

// Custom preflight handler for auth endpoints (helps with Vercel serverless functions)
app.options("/api/auth/*", (req, res) => {
  res
    .status(200)
    .set({
      "Access-Control-Allow-Origin": req.headers.origin || "*",
      "Access-Control-Allow-Methods": "POST, GET, OPTIONS, PUT, DELETE",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Allow-Credentials": "true",
      "Content-Length": "0",
    })
    .send();
});

// Log all requests for debugging CORS issues
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  console.log("Request origin:", req.headers.origin);
  console.log("Request headers:", req.headers);
  next();
});

// Other middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Connect to MongoDB
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Initialize Socket.IO
setupSocketServer(server);

// Import routes
const authRoutes = require("./src/routes/auth");
const productRoutes = require("./src/routes/products");
const chatRoutes = require("./src/routes/chat");
const sellerRoutes = require("./src/routes/seller");
const blogRoutes = require("./src/routes/blog");

// Register routes
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

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: err.message || "Something went wrong!",
    error: process.env.NODE_ENV === "development" ? err.stack : undefined,
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, "0.0.0.0", () => {
  console.log(`Server is running on port ${PORT}`);
});
