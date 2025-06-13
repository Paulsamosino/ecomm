const authRoutes = require("./routes/auth");
const productRoutes = require("./routes/products");
const orderRoutes = require("./routes/orders");
const sellerRoutes = require("./routes/seller");
const reportRoutes = require("./routes/reports");
const cors = require("cors");
const express = require("express");

// Serve uploaded files
const app = express();
app.use("/uploads", express.static("uploads"));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", require("./routes/users"));
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/seller", sellerRoutes); // Fixed path to match server.js
app.use("/api/reports", reportRoutes);
app.use("/api/chat", require("./routes/chat"));
app.use("/api/upload", require("./routes/upload"));
