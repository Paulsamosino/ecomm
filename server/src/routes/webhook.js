const express = require("express");
const router = express.Router();
const webhookController = require("../controllers/webhookController");

// Middleware to verify Lalamove webhook signatures
const verifyLalamoveWebhook = (req, res, next) => {
  const signature = req.headers["x-lalamove-signature"];
  // TODO: Implement proper signature verification using HMAC
  if (!signature) {
    return res.status(401).json({ message: "Missing signature" });
  }
  next();
};

// Lalamove delivery status webhook
router.post(
  "/lalamove/delivery",
  verifyLalamoveWebhook,
  webhookController.handleDeliveryUpdate
);

// Lalamove delivery cancellation webhook
router.post(
  "/lalamove/cancellation",
  verifyLalamoveWebhook,
  webhookController.handleDeliveryCancellation
);

// Lalamove driver assignment webhook
router.post(
  "/lalamove/driver",
  verifyLalamoveWebhook,
  webhookController.handleDriverAssignment
);

module.exports = router;
