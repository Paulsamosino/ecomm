const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");
const { auth } = require("../middleware/auth");
const checkRole = require("../middleware/checkRole");

// Middleware to check if user is admin
const isAdmin = checkRole("admin");

// User management routes
router.get("/users", auth, isAdmin, adminController.getAllUsers);
router.put("/users/:id/role", auth, isAdmin, adminController.updateUserRole);
router.delete("/users/:id", auth, isAdmin, adminController.deleteUser);

// Dashboard stats
router.get("/stats", auth, isAdmin, adminController.getAdminStats);

// Product management routes
router.get("/products", auth, isAdmin, adminController.getAllProducts);
router.put(
  "/products/:id/status",
  auth,
  isAdmin,
  adminController.updateProductStatus
);
router.delete("/products/:id", auth, isAdmin, adminController.deleteProduct);

// Analytics routes
router.get("/analytics", auth, isAdmin, adminController.getAnalytics);

// Settings routes
router.get("/settings", auth, isAdmin, adminController.getSettings);
router.put("/settings", auth, isAdmin, adminController.updateSettings);

// Report management routes
router.get("/reports", auth, isAdmin, adminController.getAllReports);
router.get("/reports/stats", auth, isAdmin, adminController.getReportStats);
router.put(
  "/reports/:id/status",
  auth,
  isAdmin,
  adminController.updateReportStatus
);
router.delete("/reports/:id", auth, isAdmin, adminController.deleteReport);

module.exports = router;
