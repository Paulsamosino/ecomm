const Order = require("../models/Order");
const lalamoveService = require("../services/lalamoveService");
const crypto = require('crypto');

// Event ordering cache (prevent duplicate/out-of-order processing)
const processedEvents = new Map();
const EVENT_CACHE_TTL = 10 * 60 * 1000; // 10 minutes

const webhookController = {
  // Secure webhook handler with early response
  async handleDeliveryUpdate(req, res) {
    // CRITICAL: Send 200 response immediately (webhook best practice)
    res.status(200).json({ received: true });
    
    try {
      // Validate signature was already checked by middleware
      const { data } = req.body;
      const { orderId, status, driver, location } = data;
      const eventTimestamp = req.webhookTimestamp;
      
      // Event deduplication and ordering
      const eventKey = `${orderId}-${status}-${eventTimestamp}`;
      if (processedEvents.has(eventKey)) {
        console.log(`Duplicate webhook event ignored: ${eventKey}`);
        return;
      }
      
      // Check if this is an older event than already processed
      const existingOrder = await Order.findOne({
        "delivery.lalamoveOrderId": orderId,
      });
      
      if (existingOrder?.delivery?.lastWebhookTimestamp && 
          eventTimestamp < existingOrder.delivery.lastWebhookTimestamp) {
        console.log(`Out-of-order webhook ignored: ${eventKey}`);
        return;
      }

      // Process webhook (rest of existing logic...)
      let order = await Order.findOne({
        "delivery.lalamoveOrderId": orderId,
      }).populate("buyer", "email");

      if (!order) {
        console.error(`Webhook order not found: ${orderId}`);
        return;
      }

      // Update with timestamp tracking
      order.delivery.status = status;
      order.delivery.lastWebhookTimestamp = eventTimestamp;
      order.delivery.lastUpdated = new Date();
      
      if (driver) {
        order.delivery.driver = {
          name: driver.name,
          phone: driver.phone,
          plate: driver.plate,
          photo: driver.photo,
        };
      }

      if (location) {
        order.delivery.tracking = order.delivery.tracking || {};
        order.delivery.tracking.currentLocation = {
          lat: location.lat,
          lng: location.lng,
        };
      }

      await order.save();
      
      // Mark event as processed
      processedEvents.set(eventKey, Date.now());
      
      // Clean old events periodically
      this._cleanProcessedEvents();

      // Emit status update through socket
      io.to(`order:${order._id}`).emit("deliveryUpdate", {
        orderId: order._id,
        deliveryStatus: status,
        driver: order.delivery.driver,
        currentLocation: order.delivery.tracking?.currentLocation,
      });

      // Special handling for completed deliveries
      if (status === "completed") {
        // Update order status to "delivered"
        order.status = "delivered";
        await order.save();

        // Emit order status update
        io.to(`user:${order.buyer._id}`).emit("orderUpdate", {
          orderId: order._id,
          status: "delivered",
        });
      }
    } catch (error) {
      console.error("Webhook processing error:", error);
      // Note: Don't change response status here, already sent 200
    }
  },

  // Clean processed events cache
  _cleanProcessedEvents() {
    const now = Date.now();
    for (const [key, timestamp] of processedEvents.entries()) {
      if (now - timestamp > EVENT_CACHE_TTL) {
        processedEvents.delete(key);
      }
    }
  },

  // Handle delivery cancellation webhook
  async handleDeliveryCancellation(req, res) {
    try {
      const { data } = req.body;
      const { orderId, reason } = data;

      const order = await Order.findOne({
        "delivery.lalamoveOrderId": orderId,
      });

      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      order.delivery.status = "cancelled";
      order.notes = `Delivery cancelled: ${reason}`;
      await order.save();

      // Emit cancellation event
      io.to(`order:${order._id}`).emit("deliveryCancelled", {
        orderId: order._id,
        reason,
      });

      res.status(200).json({ message: "Cancellation processed successfully" });
    } catch (error) {
      console.error("Cancellation webhook error:", error);
      res.status(500).json({ message: "Cancellation processing failed" });
    }
  },

  // Handle driver assignment webhook
  async handleDriverAssignment(req, res) {
    try {
      const { data } = req.body;
      const { orderId, driver } = data;

      const order = await Order.findOne({
        "delivery.lalamoveOrderId": orderId,
      });

      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      order.delivery.driver = {
        name: driver.name,
        phone: driver.phone,
        plate: driver.plate,
        photo: driver.photo,
      };
      order.delivery.status = "assigned";
      await order.save();

      // Emit driver assignment event
      io.to(`order:${order._id}`).emit("driverAssigned", {
        orderId: order._id,
        driver: order.delivery.driver,
      });

      res
        .status(200)
        .json({ message: "Driver assignment processed successfully" });
    } catch (error) {
      console.error("Driver assignment webhook error:", error);
      res.status(500).json({ message: "Driver assignment processing failed" });
    }
  },
};

module.exports = webhookController;
