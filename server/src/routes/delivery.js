const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const deliveryController = require("../controllers/deliveryController");

// Get delivery quotation
router.post("/quote", protect, deliveryController.getQuotation);

// Create delivery order
router.post("/create", protect, deliveryController.createDeliveryOrder);

// Get delivery status
router.get("/:orderId/status", protect, deliveryController.getDeliveryStatus);

// Get driver information
router.get("/:orderId/driver", protect, deliveryController.getDriverInfo);

// Cancel delivery
router.delete("/:orderId", protect, deliveryController.cancelDelivery);

module.exports = router;
