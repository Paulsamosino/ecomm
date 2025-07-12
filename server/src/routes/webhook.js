const express = require("express");
const router = express.Router();
const webhookController = require("../controllers/webhookController");
const { validateLalamoveWebhook, captureRawBody } = require("../middleware/webhookValidation");

// IP allowlist middleware (additional security layer)
const allowedIPs = process.env.LALAMOVE_WEBHOOK_IPS ? 
  process.env.LALAMOVE_WEBHOOK_IPS.split(',') : [];

const validateWebhookIP = (req, res, next) => {
  if (allowedIPs.length === 0) {
    return next(); // Skip IP validation if no allowlist configured
  }
  
  const clientIP = req.ip || req.connection.remoteAddress;
  if (!allowedIPs.includes(clientIP)) {
    console.error(`Webhook rejected: Invalid IP ${clientIP}`);
    return res.status(403).json({ error: 'Forbidden' });
  }
  next();
};

// Lalamove delivery status webhook
router.post(
  "/lalamove/delivery",
  validateWebhookIP,
  captureRawBody,
  validateLalamoveWebhook,
  webhookController.handleDeliveryUpdate
);

// Lalamove delivery cancellation webhook
router.post(
  "/lalamove/cancellation",
  validateWebhookIP,
  captureRawBody,
  validateLalamoveWebhook,
  webhookController.handleDeliveryCancellation
);

// Lalamove driver assignment webhook
router.post(
  "/lalamove/driver",
  validateWebhookIP,
  captureRawBody,
  validateLalamoveWebhook,
  webhookController.handleDriverAssignment
);

module.exports = router;
