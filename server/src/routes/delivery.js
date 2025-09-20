const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const deliveryController = require("../controllers/deliveryController");
const deliveryStatusSyncService = require("../services/deliveryStatusSyncService");

// Check Lalamove configuration
router.get("/config", deliveryController.checkDeliveryConfig);

// Get delivery quotation (public — allow checkout users to get a quote without logging in)
router.post("/quote", deliveryController.getQuotation);

// Create delivery order
router.post("/create", protect, deliveryController.createDeliveryOrder);

// Create delivery for existing order
router.post("/orders/:orderId/create", protect, deliveryController.createDeliveryForOrder);

// Get delivery status
router.get("/:orderId/status", protect, deliveryController.getDeliveryStatus);

// Sync delivery status manually
router.get("/:orderId/status/sync", protect, deliveryController.syncDeliveryStatus);

// Sync all pending deliveries (admin only)
router.post("/sync-all", protect, deliveryController.syncAllPendingDeliveries);

// NEW: Manual sync controls for the automatic service
router.post("/sync/manual", protect, async (req, res) => {
  try {
    await deliveryStatusSyncService.syncAllActiveDeliveries();
    res.json({ 
      success: true, 
      message: "Manual sync completed" 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: "Manual sync failed", 
      error: error.message 
    });
  }
});

// NEW: Sync specific order
router.post("/sync/order/:orderId", protect, async (req, res) => {
  try {
    const order = await deliveryStatusSyncService.syncSpecificOrder(req.params.orderId);
    res.json({ 
      success: true, 
      message: "Order synced successfully",
      order: {
        id: order._id,
        status: order.status,
        deliveryStatus: order.delivery?.status,
        lastStatusCheck: order.delivery?.lastStatusCheck
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: "Order sync failed", 
      error: error.message 
    });
  }
});

// NEW: Control automatic sync service
router.post("/sync/service/start", protect, async (req, res) => {
  try {
    deliveryStatusSyncService.start();
    res.json({ 
      success: true, 
      message: "Automatic sync service started",
      isRunning: deliveryStatusSyncService.isRunning
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: "Failed to start sync service", 
      error: error.message 
    });
  }
});

router.post("/sync/service/stop", protect, async (req, res) => {
  try {
    deliveryStatusSyncService.stop();
    res.json({ 
      success: true, 
      message: "Automatic sync service stopped",
      isRunning: deliveryStatusSyncService.isRunning
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: "Failed to stop sync service", 
      error: error.message 
    });
  }
});

router.get("/sync/service/status", protect, async (req, res) => {
  try {
    res.json({ 
      success: true, 
      isRunning: deliveryStatusSyncService.isRunning,
      message: deliveryStatusSyncService.isRunning ? "Service is running" : "Service is stopped"
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: "Failed to get sync service status", 
      error: error.message 
    });
  }
});

// Webhook endpoint for Lalamove status updates (no auth required)
router.post("/webhook", deliveryController.handleWebhook);

// Get driver information
router.get("/:orderId/driver", protect, deliveryController.getDriverInfo);

// Cancel delivery
router.delete("/:orderId", protect, deliveryController.cancelDelivery);

module.exports = router;
