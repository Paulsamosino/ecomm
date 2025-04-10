const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const path = require("path");
const http = require("http");
const setupSocketServer = require("./socket");
require("dotenv").config();

const app = express();
const server = http.createServer(app);

// CORS configuration with specific allowed origins
const corsOptions = {
  origin: [
    "https://ecomm-tau-nine.vercel.app",
    "https://ecomm-peach-five.vercel.app",
    "http://localhost:5173",
    "https://ecomm-mbnor9lqm-ecomms-projects-807aa19d.vercel.app",
    "https://ecomm-server-vercel.vercel.app",
    // Allow any subdomain of vercel.app
    /\.vercel\.app$/
  ],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
};

// Middleware
app.use(cors(corsOptions));
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
