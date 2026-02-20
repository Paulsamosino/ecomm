const authRoutes = require("./routes/auth");
const productRoutes = require("./routes/products");
const orderRoutes = require("./routes/orders");
const sellerRoutes = require("./routes/seller");
const deliveryRoutes = require("./routes/delivery");
const webhookRoutes = require("./routes/webhook");
const reportRoutes = require("./routes/reports");
const reviewRoutes = require("./routes/reviews");
const blogRoutes = require("./routes/blog");
const socialRoutes = require("./routes/social");
const notificationRoutes = require("./routes/notifications");
const wishlistRoutes = require("./routes/wishlist");
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
app.use("/api/reviews", reviewRoutes);
app.use("/api/blog", blogRoutes);
app.use("/api/social", socialRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/wishlist", wishlistRoutes);
app.use("/api/test-notifications", require("./routes/testAllNotifications"));
app.use("/api/upload", require("./routes/upload"));
app.use("/api/breeding-logs", require("./routes/breedingLogs"));
app.use("/api/inventory-logs", require("./routes/inventoryLogs"));

// Webhook Routes (no /api prefix for external service webhooks)
app.use("/webhook", webhookRoutes);

module.exports = app;
