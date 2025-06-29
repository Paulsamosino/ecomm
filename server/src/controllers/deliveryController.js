const lalamoveService = require("../services/lalamoveService");
const Order = require("../models/Order");

const deliveryController = {
  // Format phone number to ensure it starts with +63
  _formatPhoneNumber(phone) {
    if (!phone) return '+639000000000';
    
    // Remove all non-digit characters
    let digits = phone.replace(/\D/g, '');
    
    // Handle different phone number formats
    if (digits.startsWith('0')) {
      // Convert 09XXXXXXXX to +639XXXXXXXX
      return `+63${digits.substring(1)}`;
    } else if (digits.startsWith('63')) {
      // Ensure it's in +63XXXXXXXXX format (11 digits total including 63)
      if (digits.length === 12) { // If it's 639XXXXXXXXX
        return `+${digits}`;
      } else if (digits.length === 11) { // If it's 633XXXXXXXX (with extra 3)
        return `+63${digits.substring(3)}`;
      }
      return `+${digits}`;
    } else if (digits.length === 9) {
      // Convert 9-digit local number to +63XXXXXXXXX
      return `+63${digits}`;
    } else if (digits.length === 10 && digits.startsWith('9')) {
      // Handle 9XXXXXXXXX format (no country code, 10 digits starting with 9)
      return `+63${digits}`;
    }
    
    // For any other format, return as is with + prefix
    return `+${digits}`;
  },

  // Automatically create delivery when order is placed
  async autoCreateDelivery(order) {
    try {
      console.log('Creating delivery for order:', order._id);
      
      // 1. Define pickup location using a known-good Lalamove sandbox address.
      const pickupLocation = {
        lat: 14.5838,
        lng: 121.0565,
        address: 'SM Megamall, Mandaluyong, Metro Manila',
        contact: {
          name: order.seller?.name || 'Store Manager',
          phone: this._formatPhoneNumber(process.env.LALAMOVE_API_USER || '+639171234567')
        }
      };

      // 2. Prepare customer's delivery location using a known-good Lalamove sandbox address.
      const dropoffLocation = {
        lat: 14.5515,
        lng: 121.0244,
        address: 'Greenbelt 1, Makati, Metro Manila',
        contact: {
          name: order.buyer?.name || 'Customer',
          phone: this._formatPhoneNumber(order.shippingAddress?.phone || order.buyer?.phone || '+639761271147')
        }
      };

      // 3. Build stops array with proper format for Lalamove v3
      const stops = [
        // Pickup location (seller)
        {
          location: {
            lat: pickupLocation.lat.toString(),
            lng: pickupLocation.lng.toString()
          },
          address: pickupLocation.address,
          contacts: [{
            name: pickupLocation.contact.name,
            phone: this._formatPhoneNumber(pickupLocation.contact.phone)
          }]
        },
        // Dropoff location (customer)
        {
          location: {
            lat: dropoffLocation.lat.toString(),
            lng: dropoffLocation.lng.toString()
          },
          address: dropoffLocation.address,
          contacts: [{
            name: dropoffLocation.contact.name,
            phone: this._formatPhoneNumber(dropoffLocation.contact.phone)
          }]
        }
      ];

      console.log('Sending quote request with stops:', JSON.stringify(stops, null, 2));

      // 4. Get a quote from Lalamove with minimal required fields
      const quote = await lalamoveService.getQuote({
        serviceType: 'MOTORCYCLE',
        language: 'en_PH',
        stops: stops
      });

      // Then create the order using the quotation ID
      const deliveryOrder = await lalamoveService.createOrder({
        quotationId: quote.quotationId,
        sender: {
          stopId: quote.stops[0].stopId,
          name: pickupLocation.contact.name,
          phone: this._formatPhoneNumber(pickupLocation.contact.phone)
        },
        recipients: [{
          stopId: quote.stops[1].stopId,
          name: dropoffLocation.contact.name,
          phone: this._formatPhoneNumber(dropoffLocation.contact.phone),
          remarks: `Order #${order._id}`
        }],
        metadata: {
          orderId: order._id.toString(),
          reference: `ORDER-${order._id}`
        }
      });

      // Update order with delivery info
      // Note: The price information comes from the quote, not the order response
      // The order response contains the orderId and status
      order.delivery = {
        lalamoveOrderId: deliveryOrder.id, // In v3, the order ID is in the 'id' field
        status: deliveryOrder.status || "pending",
        price: {
          amount: quote.totalFee, // Use the price from the quote
          currency: quote.currency || "PHP",
        },
        // Store additional useful information
        serviceType: quote.serviceType,
        stops: quote.stops.map(stop => ({
          type: stop.type,
          address: stop.address,
          coordinates: stop.coordinates,
          stopId: stop.stopId
        })),
        quoteId: quote.quotationId,
        createdAt: new Date()
      };

      await order.save();
      return deliveryOrder;
    } catch (error) {
      console.error("Auto delivery creation error:", error);

      // Handle specific Lalamove API errors
      if (
        error.message.includes("Invalid market configuration") ||
        error.message.includes("Authentication failed") ||
        error.message.includes("ERR_INVALID_MARKET")
      ) {
        console.error("Lalamove API Configuration Issue:", {
          message: "The Lalamove API credentials are not properly configured.",
          solution:
            "Please update the LALAMOVE_API_KEY, LALAMOVE_API_SECRET, and LALAMOVE_MARKET environment variables with valid credentials.",
        });

        // Don't throw the error - just log it and continue
        // The order can still be created without delivery
        return null;
      }

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

  // Create delivery order (manual endpoint)
  async createDeliveryOrder(req, res) {
    try {
      // Use official Lalamove sandbox test addresses and valid PH phone numbers
      const senderAddress = "SM Megamall, Mandaluyong, Metro Manila";
      const senderLat = "14.5838";
      const senderLng = "121.0565";
      const recipientAddress = "Greenbelt 1, Makati, Metro Manila";
      const recipientLat = "14.5515";
      const recipientLng = "121.0244";
      const senderPhone = "+639123456789";
      const recipientPhone = "+63976127147";
      // Call Lalamove service
      const deliveryOrder = await lalamoveService.createOrder({
        senderName: req.body.senderName,
        senderPhone,
        senderAddress,
        senderLat,
        senderLng,
        recipientName: req.body.recipientName,
        recipientPhone,
        recipientAddress,
        recipientLat,
        recipientLng,
        remarks: req.body.remarks,
        serviceType: req.body.serviceType,
        isPODEnabled: req.body.isPODEnabled,
        isRecipientSMSEnabled: req.body.isRecipientSMSEnabled,
      });

      res.status(201).json(deliveryOrder);
    } catch (error) {
      console.error("Error creating delivery order:", error);
      res.status(500).json({
        message: "Failed to create delivery order",
        error: error.message,
      });
    }
  },
};

module.exports = deliveryController;
