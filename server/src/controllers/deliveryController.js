const lalamoveService = require("../services/lalamoveService");
const Order = require("../models/Order");

const deliveryController = {
  // Automatically create delivery when order is placed
  async autoCreateDelivery(order) {
    try {
      // Create delivery order
      const deliveryOrder = await lalamoveService.createOrder({
        senderName: order.seller.name,
        senderPhone: order.seller.phone,
        senderAddress: `${order.seller.address.street}, ${order.seller.address.city}, ${order.seller.address.state}`,
        recipientName: order.buyer.name,
        recipientPhone: order.shippingAddress.phone,
        recipientAddress: `${order.shippingAddress.street}, ${order.shippingAddress.city}, ${order.shippingAddress.state}`,
        remarks: `Order #${order._id}`,
      });

      // Update order with delivery info
      order.delivery = {
        lalamoveOrderId: deliveryOrder.orderRef,
        status: "pending",
        price: {
          amount: deliveryOrder.amount,
          currency: deliveryOrder.currency,
        },
      };

      await order.save();
      return deliveryOrder;
    } catch (error) {
      console.error("Auto delivery creation error:", error);
      throw error;
    }
  },

  // Get delivery status
  async getDeliveryStatus(req, res) {
    try {
      const { orderId } = req.params;

      const order = await Order.findById(orderId);
      if (!order || !order.delivery?.lalamoveOrderId) {
        return res.status(404).json({
          message: "Order or delivery information not found",
        });
      }

      const status = await lalamoveService.getOrderStatus(
        order.delivery.lalamoveOrderId
      );

      // Update order with latest status
      order.delivery.status = status.status;
      if (status.driver) {
        order.delivery.driver = {
          name: status.driver.name,
          phone: status.driver.phone,
          plate: status.driver.plate,
          photo: status.driver.photo,
        };
      }

      await order.save();

      res.json(status);
    } catch (error) {
      console.error("Error getting delivery status:", error);
      res.status(500).json({
        message: "Failed to get delivery status",
        error: error.message,
      });
    }
  },

  // Get driver information
  async getDriverInfo(req, res) {
    try {
      const { orderId } = req.params;

      const order = await Order.findById(orderId);
      if (!order || !order.delivery?.lalamoveOrderId) {
        return res.status(404).json({
          message: "Order or delivery information not found",
        });
      }

      const driverInfo = await lalamoveService.getDriverInfo(
        order.delivery.lalamoveOrderId
      );

      res.json(driverInfo);
    } catch (error) {
      console.error("Error getting driver information:", error);
      res.status(500).json({
        message: "Failed to get driver information",
        error: error.message,
      });
    }
  },

  // Cancel delivery
  async cancelDelivery(req, res) {
    try {
      const { orderId } = req.params;

      const order = await Order.findById(orderId);
      if (!order || !order.delivery?.lalamoveOrderId) {
        return res.status(404).json({
          message: "Order or delivery information not found",
        });
      }

      await lalamoveService.cancelOrder(order.delivery.lalamoveOrderId);

      // Update order delivery status
      order.delivery.status = "cancelled";
      await order.save();

      // Auto-retry delivery creation after a delay
      setTimeout(async () => {
        try {
          await this.autoCreateDelivery(order);
        } catch (retryError) {
          console.error("Auto-retry delivery creation failed:", retryError);
        }
      }, 60000); // Retry after 1 minute

      res.json({
        message: "Delivery cancelled successfully",
      });
    } catch (error) {
      console.error("Error cancelling delivery:", error);
      res.status(500).json({
        message: "Failed to cancel delivery",
        error: error.message,
      });
    }
  },
};

module.exports = deliveryController;
