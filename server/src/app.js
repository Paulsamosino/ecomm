const authRoutes = require("./routes/auth");
const productRoutes = require("./routes/products");
const orderRoutes = require("./routes/orders");
const sellerRoutes = require("./routes/seller");
const deliveryRoutes = require("./routes/delivery");
const webhookRoutes = require("./routes/webhook");
const reportRoutes = require("./routes/reports");
const cors = require("cors");
const express = require("express");

// Create Express app
const app = express();

// Configure CORS
app.use(
  cors({
    origin: "http://localhost:5173", // Vite dev server
    credentials: true,
  })
);

// Parse JSON bodies
app.use(express.json());

// Serve uploaded files
app.use("/uploads", express.static("uploads"));

// Regular API Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", require("./routes/users"));
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/seller", sellerRoutes);
app.use("/api/delivery", deliveryRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/chat", require("./routes/chat"));
app.use("/api/upload", require("./routes/upload"));

// Webhook Routes (no /api prefix for external service webhooks)
app.use("/webhook", webhookRoutes);

module.exports = app;
