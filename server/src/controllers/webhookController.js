const Order = require("../models/Order");
const io = require("../socket");

const webhookController = {
  // Handle Lalamove delivery status updates
  async handleDeliveryUpdate(req, res) {
    try {
      // Verify webhook signature
      const signature = req.headers["x-lalamove-signature"];
      // TODO: Implement signature verification

      const { data } = req.body;
      const { orderId, status, driver, location } = data;

      // Find order with this delivery
      const order = await Order.findOne({
        "delivery.lalamoveOrderId": orderId,
      }).populate("buyer", "email");

      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      // Update order delivery status
      order.delivery.status = status;
      if (driver) {
        order.delivery.driver = {
          name: driver.name,
          phone: driver.phone,
          plate: driver.plate,
          photo: driver.photo,
        };
      }

      if (location) {
        order.delivery.tracking.currentLocation = {
          lat: location.lat,
          lng: location.lng,
        };
      }

      await order.save();

      // Emit status update through socket
      io.to(`order:${order._id}`).emit("deliveryUpdate", {
        orderId: order._id,
        deliveryStatus: status,
        driver: order.delivery.driver,
        currentLocation: order.delivery.tracking.currentLocation,
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

      res.status(200).json({ message: "Webhook processed successfully" });
    } catch (error) {
      console.error("Webhook processing error:", error);
      res.status(500).json({ message: "Webhook processing failed" });
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
