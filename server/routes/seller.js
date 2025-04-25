const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const sellerController = require("../controllers/sellerController");

// Get seller dashboard stats
router.get("/stats", protect, sellerController.getSellerStats);

// Product routes
router.get("/products", protect, sellerController.getSellerProducts);
router.post("/products", protect, sellerController.createProduct);
router.put("/products/:id", protect, sellerController.updateProduct);
router.delete("/products/:id", protect, sellerController.deleteProduct);

// Order routes
router.get("/orders", protect, sellerController.getSellerOrders);
router.put("/orders/:id", protect, sellerController.updateOrderStatus);

// Customer routes
router.get("/customers", protect, sellerController.getSellerCustomers);

// Analytics routes
router.get("/analytics", protect, sellerController.getSellerAnalytics);

// Review routes
router.get("/reviews", protect, sellerController.getSellerReviews);

// Get all sellers
router.get("/all", protect, sellerController.getAllSellers);

module.exports = router;
