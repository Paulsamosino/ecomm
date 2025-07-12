const lalamoveService = require("../services/lalamoveService");
const Order = require("../models/Order");

const deliveryController = {
  // Geocode address to get latitude and longitude
  // Only NCR + South Luzon
  async _geocodeAddress(address) {
    const CITY_LOOKUP = {
      // Metro Manila
      "manila":         { lat: 14.5995, lng: 120.9842 },
      "quezon city":    { lat: 14.6760, lng: 121.0437 },
      "makati":         { lat: 14.5547, lng: 121.0244 },
      "taguig":         { lat: 14.5176, lng: 121.0509 },
      "pasig":          { lat: 14.5764, lng: 121.0851 },
      "mandaluyong":    { lat: 14.5832, lng: 121.0409 },
      "parañaque":      { lat: 14.4793, lng: 121.0198 },
      "las piñas":      { lat: 14.4542, lng: 120.9936 },
      "muntinlupa":     { lat: 14.4116, lng: 121.0390 },
      "san juan":       { lat: 14.6019, lng: 121.0355 },
      "marikina":       { lat: 14.6507, lng: 121.1029 },
      "pasay":          { lat: 14.5378, lng: 120.9956 },
      "caloocan":       { lat: 14.6588, lng: 120.9672 },
      "malabon":        { lat: 14.6572, lng: 120.9565 },
      "navotas":        { lat: 14.6686, lng: 120.9472 },
      "valenzuela":     { lat: 14.7086, lng: 120.9830 },
      "pateros":        { lat: 14.5433, lng: 121.0697 },
      
      // Cavite
      "cavite city":    { lat: 14.2834, lng: 120.8531 },
      "bacoor":         { lat: 14.4584, lng: 120.9526 },
      "imus":           { lat: 14.4297, lng: 120.9370 },
      "dasmariñas":     { lat: 14.3294, lng: 120.9367 },
      "general trias":  { lat: 14.3874, lng: 120.8810 },
      "kawit":          { lat: 14.4408, lng: 120.9045 },
      "noveleta":       { lat: 14.4282, lng: 120.8764 },
      "rosario":        { lat: 14.4156, lng: 120.8587 },
      "silang":         { lat: 14.2306, lng: 120.9722 },
      "carmona":        { lat: 14.3167, lng: 121.0500 },
      
      // Laguna
      "santa rosa":     { lat: 14.3119, lng: 121.1115 },
      "biñan":          { lat: 14.3386, lng: 121.0860 },
      "san pedro":      { lat: 14.3583, lng: 121.0474 },
      "calamba":        { lat: 14.2119, lng: 121.1652 },
      "los baños":      { lat: 14.1692, lng: 121.2264 },
      "cabuyao":        { lat: 14.2789, lng: 121.1253 },
      "san pablo":      { lat: 14.0683, lng: 121.3256 },
      "sta. cruz":      { lat: 14.2811, lng: 121.4158 },
      "pagsanjan":      { lat: 14.2725, lng: 121.4567 },
      "calauan":        { lat: 14.1453, lng: 121.3189 },
      
      // Batangas
      "batangas city":  { lat: 13.7564, lng: 121.0581 },
      "lipa":           { lat: 13.9411, lng: 121.1624 },
      "tanauan":        { lat: 14.0865, lng: 121.1487 },
      "santo tomas":    { lat: 14.1078, lng: 121.1418 },
      "malvar":         { lat: 14.0447, lng: 121.1603 },
      "lemery":         { lat: 13.9167, lng: 120.8833 },
      "taal":           { lat: 14.0022, lng: 120.9250 },
      "nasugbu":        { lat: 14.0717, lng: 120.6347 },
      
      // Rizal
      "antipolo":       { lat: 14.5878, lng: 121.1760 },
      "cainta":         { lat: 14.5833, lng: 121.1217 },
      "taytay":         { lat: 14.5674, lng: 121.1324 },
      "marikina":       { lat: 14.6507, lng: 121.1029 },
      "san mateo":      { lat: 14.6969, lng: 121.1219 },
      "angono":         { lat: 14.5261, lng: 121.1531 },
      "binangonan":     { lat: 14.4644, lng: 121.1928 },
      "teresa":         { lat: 14.5597, lng: 121.2067 },
      "morong":         { lat: 14.5181, lng: 121.2378 },
    };

    const FALLBACK = CITY_LOOKUP["manila"];

    try {
      const addr = address.toLowerCase();
      for (const [city, coords] of Object.entries(CITY_LOOKUP)) {
        if (addr.includes(city)) return coords;
      }
      // if not in NCR/South Luzon, default to Manila
      return FALLBACK;
    } catch (error) {
      console.error('Geocoding error:', error);
      // Return Manila coordinates as fallback
      return FALLBACK;
    }
  },

  // Format phone number to ensure it starts with +63
  _formatPhoneNumber(phone) {
    if (!phone) return "+639000000000";

    // Remove all non-digit characters
    let digits = phone.replace(/\D/g, "");

    // Handle different phone number formats
    if (digits.startsWith("0")) {
      // Convert 09XXXXXXXX to +639XXXXXXXX
      return `+63${digits.substring(1)}`;
    } else if (digits.startsWith("63")) {
      // Ensure it's in +63XXXXXXXXX format (11 digits total including 63)
      if (digits.length === 12) {
        // If it's 639XXXXXXXXX
        return `+${digits}`;
      } else if (digits.length === 11) {
        // If it's 633XXXXXXXX (with extra 3)
        return `+63${digits.substring(3)}`;
      }
      return `+${digits}`;
    } else if (digits.length === 9) {
      // Convert 9-digit local number to +63XXXXXXXXX
      return `+63${digits}`;
    } else if (digits.length === 10 && digits.startsWith("9")) {
      // Handle 9XXXXXXXXX format (no country code, 10 digits starting with 9)
      return `+63${digits}`;
    }

    // For any other format, return as is with + prefix
    return `+${digits}`;
  },

  // Automatically create delivery when order is placed
  async autoCreateDelivery(order) {
    try {
      console.log("Creating delivery for order:", order._id);

      // 1. Define pickup location using a known-good Lalamove sandbox address.
      const pickupLocation = {
        lat: 14.5838,
        lng: 121.0565,
        address: "SM Megamall, Mandaluyong, Metro Manila",
        contact: {
          name: order.seller?.name || "Store Manager",
          phone: this._formatPhoneNumber(
            process.env.LALAMOVE_API_USER || "+639171234567"
          ),
        },
      };

      // 2. Get real coordinates for customer's delivery address
      const customerFullAddress = order.shippingAddress ? 
        `${order.shippingAddress.street}, ${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.zipCode}, ${order.shippingAddress.country}` :
        "Greenbelt 1, Makati, Metro Manila"; // Fallback address

      const dropoffCoords = await this._geocodeAddress(customerFullAddress);

      const dropoffLocation = {
        lat: dropoffCoords.lat,
        lng: dropoffCoords.lng,
        address: customerFullAddress,
        contact: {
          name: order.buyer?.name || "Customer",
          phone: this._formatPhoneNumber(
            order.shippingAddress?.phone ||
              order.buyer?.phone ||
              "+639761271147"
          ),
        },
      };

      // 3. Build stops array with proper format for Lalamove v3
      const stops = [
        // Pickup location (seller)
        {
          location: {
            lat: pickupLocation.lat.toString(),
            lng: pickupLocation.lng.toString(),
          },
          address: pickupLocation.address,
          contacts: [
            {
              name: pickupLocation.contact.name,
              phone: this._formatPhoneNumber(pickupLocation.contact.phone),
            },
          ],
        },
        // Dropoff location (customer)
        {
          location: {
            lat: dropoffLocation.lat.toString(),
            lng: dropoffLocation.lng.toString(),
          },
          address: dropoffLocation.address,
          contacts: [
            {
              name: dropoffLocation.contact.name,
              phone: this._formatPhoneNumber(dropoffLocation.contact.phone),
            },
          ],
        },
      ];

      console.log(
        "Sending quote request with stops:",
        JSON.stringify(stops, null, 2)
      );

      // 4. Get a quote from Lalamove with minimal required fields
      const quote = await lalamoveService.getQuote({
        serviceType: "MOTORCYCLE",
        language: "en_PH",
        stops: stops,
      });

      // Then create the order using the quotation ID
      const deliveryOrder = await lalamoveService.createOrder({
        quotationId: quote.quotationId,
        sender: {
          stopId: quote.stops[0].stopId,
          name: pickupLocation.contact.name,
          phone: this._formatPhoneNumber(pickupLocation.contact.phone),
        },
        recipients: [
          {
            stopId: quote.stops[1].stopId,
            name: dropoffLocation.contact.name,
            phone: this._formatPhoneNumber(dropoffLocation.contact.phone),
            remarks: `Order #${order._id}`,
          },
        ],
        metadata: {
          orderId: order._id.toString(),
          reference: `ORDER-${order._id}`,
        },
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
        stops: quote.stops.map((stop) => ({
          type: stop.type,
          address: stop.address,
          coordinates: stop.coordinates,
          stopId: stop.stopId,
        })),
        quoteId: quote.quotationId,
        createdAt: new Date(),
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

  // Get delivery quotation (for shipping fee calculation)
  async getQuotation(req, res) {
    try {
      const { vehicleType = "MOTORCYCLE", dropoff } = req.body;
      
      // For demo, use a fixed pickup location (store address)
      const pickupLocation = {
        lat: 14.5838,
        lng: 121.0565,
        address: "SM Megamall, Mandaluyong, Metro Manila",
        contact: {
          name: "Store Manager",
          phone: this._formatPhoneNumber(
            process.env.LALAMOVE_API_USER || "+639171234567"
          ),
        },
      };
      
      // Use provided dropoff address (customer)
      if (
        !dropoff ||
        !dropoff.street ||
        !dropoff.city ||
        !dropoff.state ||
        !dropoff.zipCode ||
        !dropoff.country ||
        !dropoff.phone
      ) {
        return res.status(400).json({ message: "Incomplete dropoff address" });
      }
      
      // Build full address string for geocoding
      const fullAddress = dropoff.fullAddress || 
        `${dropoff.street}, ${dropoff.city}, ${dropoff.state} ${dropoff.zipCode}, ${dropoff.country}`;
      
      // Get coordinates for the dropoff address
      const dropoffCoords = await this._geocodeAddress(fullAddress);
      
      const dropoffLocation = {
        lat: dropoffCoords.lat,
        lng: dropoffCoords.lng,
        address: fullAddress,
        contact: {
          name: dropoff.name || "Customer",
          phone: this._formatPhoneNumber(dropoff.phone),
        },
      };

      const stops = [
        {
          location: {
            lat: pickupLocation.lat.toString(),
            lng: pickupLocation.lng.toString(),
          },
          address: pickupLocation.address,
          contacts: [
            {
              name: pickupLocation.contact.name,
              phone: this._formatPhoneNumber(pickupLocation.contact.phone),
            },
          ],
        },
        {
          location: {
            lat: dropoffLocation.lat.toString(),
            lng: dropoffLocation.lng.toString(),
          },
          address: dropoffLocation.address,
          contacts: [
            {
              name: dropoffLocation.contact.name,
              phone: this._formatPhoneNumber(dropoffLocation.contact.phone),
            },
          ],
        },
      ];

      console.log(`Getting quote for delivery from ${pickupLocation.address} to ${fullAddress} via ${vehicleType}`);

      const quote = await lalamoveService.getQuote({
        serviceType: vehicleType,
        language: "en_PH",
        stops,
      });

      res.json({
        fee: quote.totalFee || quote.price || 0,
        currency: quote.currency || "PHP",
        estimatedDistance: quote.distance || "N/A",
        estimatedTime: quote.duration || "N/A",
        vehicleType: vehicleType,
        pickupAddress: pickupLocation.address,
        dropoffAddress: fullAddress,
        ...quote,
      });
    } catch (error) {
      console.error("Error getting delivery quote:", error);
      res.status(500).json({
        message: "Failed to get delivery quote",
        error: error.message,
      });
    }
  },
};

module.exports = deliveryController;
