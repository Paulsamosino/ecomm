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

    // Convert to string and remove all non-digit characters
    let digits = phone.toString().replace(/\D/g, "");

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
    } else if (digits.startsWith("1") || digits.length > 12) {
      // Invalid US number or too long - use default Philippine number
      console.warn(`⚠️ Invalid phone number format: ${phone}, using default Philippine number`);
      return "+639000000000";
    }

    // For any other format, try to salvage it or use default
    if (digits.length >= 10) {
      // Try to extract last 10 digits if it's a long number
      const last10 = digits.slice(-10);
      if (last10.startsWith("9")) {
        return `+63${last10}`;
      }
    }
    
    // If all else fails, use default
    console.warn(`⚠️ Could not format phone number: ${phone}, using default`);
    return "+639000000000";
  },

  // Automatically create delivery when order is placed
  async autoCreateDelivery(order) {
    try {
      console.log("🚚 Creating delivery for order:", order._id);
      console.log("📦 Order details check:", {
        hasOrder: !!order,
        hasSeller: !!order.seller,
        sellerName: order.seller?.name,
        hasSellerProfile: !!order.seller?.sellerProfile,
        hasSellerLocation: !!order.seller?.sellerProfile?.location,
        hasShippingAddress: !!order.shippingAddress,
        hasBuyer: !!order.buyer
      });

      // 1. Get seller's location from their profile
      let pickupLocation;
      
      if (order.seller?.sellerProfile?.location) {
        const sellerLocation = order.seller.sellerProfile.location;
        console.log("📍 Using seller's location:", sellerLocation);
        
        // Validate that all required location fields are present and not empty
        const hasValidLocation = sellerLocation.street && 
                               sellerLocation.city && 
                               sellerLocation.state && 
                               sellerLocation.zipCode && 
                               sellerLocation.country;
        
        if (hasValidLocation) {
          const sellerFullAddress = `${sellerLocation.street}, ${sellerLocation.city}, ${sellerLocation.state} ${sellerLocation.zipCode}, ${sellerLocation.country}`;
          const pickupCoords = await this._geocodeAddress(sellerFullAddress);
          
          // Get valid phone number (try seller location phone, then seller phone, then default)
          let sellerPhone = sellerLocation.phone || order.seller?.phone;
          
          // If phone is not Philippine format, use default
          if (!sellerPhone || !sellerPhone.startsWith('+63') && !sellerPhone.startsWith('09') && !sellerPhone.startsWith('9')) {
            console.warn(`⚠️ Seller ${order.seller._id} has invalid phone (${sellerPhone}), using default`);
            sellerPhone = process.env.LALAMOVE_API_USER || "+639171234567";
          }
          
          pickupLocation = {
            lat: pickupCoords.lat,
            lng: pickupCoords.lng,
            address: sellerFullAddress,
            contact: {
              name: order.seller?.name || "Store Manager",
              phone: this._formatPhoneNumber(sellerPhone),
            },
          };
          console.log("✅ Pickup location set from seller profile");
        } else {
          console.warn(`⚠️ Seller ${order.seller?._id} has incomplete location data:`, {
            street: !!sellerLocation.street,
            city: !!sellerLocation.city,
            state: !!sellerLocation.state,
            zipCode: !!sellerLocation.zipCode,
            country: !!sellerLocation.country
          });
          pickupLocation = null; // Will use default below
        }
      } else {
        console.warn(`⚠️ Seller ${order.seller?._id} has no sellerProfile.location`);
        pickupLocation = null;
      }
      
      // Use default location if seller location is invalid or missing
      if (!pickupLocation) {
        console.warn(`⚠️ Using default pickup location for seller ${order.seller?._id}`);
        
        // Get valid phone number for seller
        let sellerPhone = order.seller?.phone;
        if (!sellerPhone || !sellerPhone.startsWith('+63') && !sellerPhone.startsWith('09') && !sellerPhone.startsWith('9')) {
          console.warn(`⚠️ Seller has invalid phone (${sellerPhone}), using default`);
          sellerPhone = process.env.LALAMOVE_API_USER || "+639171234567";
        }
        
        pickupLocation = {
          lat: 14.5838,
          lng: 121.0565,
          address: "SM Megamall, Mandaluyong, Metro Manila (Default Store Location)",
          contact: {
            name: order.seller?.name || "Store Manager",
            phone: this._formatPhoneNumber(sellerPhone),
          },
        };
        console.log("⚠️ Using default pickup location");
      }

      // 2. Get real coordinates for customer's delivery address
      if (!order.shippingAddress) {
        throw new Error("Order missing shipping address");
      }

      const customerFullAddress = order.shippingAddress ? 
        `${order.shippingAddress.street}, ${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.zipCode}, ${order.shippingAddress.country}` :
        "Greenbelt 1, Makati, Metro Manila"; // Fallback address

      console.log("📍 Customer delivery address:", customerFullAddress);
      const dropoffCoords = await this._geocodeAddress(customerFullAddress);

      // Get valid customer phone number
      let customerPhone = order.shippingAddress?.phone || order.buyer?.phone;
      if (!customerPhone || (!customerPhone.startsWith('+63') && !customerPhone.startsWith('09') && !customerPhone.startsWith('9'))) {
        console.warn(`⚠️ Customer has invalid phone (${customerPhone}), using fallback`);
        customerPhone = "+639761271147"; // Fallback customer phone
      }

      const dropoffLocation = {
        lat: dropoffCoords.lat,
        lng: dropoffCoords.lng,
        address: customerFullAddress,
        contact: {
          name: order.buyer?.name || "Customer",
          phone: this._formatPhoneNumber(customerPhone),
        },
      };

      console.log("📍 Final delivery locations:", {
        pickup: `${pickupLocation.address} (${pickupLocation.lat}, ${pickupLocation.lng})`,
        dropoff: `${dropoffLocation.address} (${dropoffLocation.lat}, ${dropoffLocation.lng})`
      });

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

      console.log("📋 Sending quote request for delivery:", {
        serviceType: "MOTORCYCLE",
        stopsCount: stops.length,
        pickup: stops[0].address,
        dropoff: stops[1].address
      });

      // 4. Get a quote from Lalamove with minimal required fields
      const quote = await lalamoveService.getQuote({
        serviceType: "MOTORCYCLE",
        language: "en_PH",
        stops: stops,
      });

      console.log("💰 Quote received:", {
        quotationId: quote.quotationId,
        totalFee: quote.totalFee,
        currency: quote.currency,
        stops: quote.stops?.length
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

      console.log("🎉 Delivery order created:", {
        lalamoveOrderId: deliveryOrder.orderId || deliveryOrder.id,
        status: deliveryOrder.status,
        orderId: order._id
      });

      // Update order with delivery info
      // Note: The price information comes from the quote, not the order response
      // The order response contains the orderId and status
      order.delivery = {
        lalamoveOrderId: deliveryOrder.orderId || deliveryOrder.id, // In v3, check both possible fields
        status: deliveryOrder.status || "ASSIGNING_DRIVER",
        price: {
          amount: quote.totalFee || quote.priceBreakdown?.total, // Use the price from the quote
          currency: quote.currency || quote.priceBreakdown?.currency || "PHP",
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
        lastStatusCheck: new Date(),
      };

      await order.save();
      
      console.log("✅ Order updated with delivery information");
      return deliveryOrder;
      
    } catch (error) {
      console.error("❌ Auto delivery creation error:", error);
      console.error("Error details:", {
        message: error.message,
        stack: error.stack,
        orderId: order?._id
      });

      // Handle specific Lalamove API errors
      if (
        error.message.includes("Invalid market configuration") ||
        error.message.includes("Authentication failed") ||
        error.message.includes("ERR_INVALID_MARKET") ||
        error.message.includes("API key") ||
        error.message.includes("secret")
      ) {
        console.error("🔑 Lalamove API Configuration Issue:", {
          message: "The Lalamove API credentials are not properly configured.",
          solution: "Please update the LALAMOVE_API_KEY, LALAMOVE_API_SECRET, and LALAMOVE_MARKET environment variables with valid credentials.",
          currentMarket: process.env.LALAMOVE_MARKET,
          hasApiKey: !!process.env.LALAMOVE_API_KEY,
          hasSecret: !!process.env.LALAMOVE_API_SECRET
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

      // Enhanced status mapping
      const statusMapping = {
        'ASSIGNING_DRIVER': 'assigning_driver',
        'ON_GOING': 'ongoing', 
        'PICKED_UP': 'picked_up',
        'COMPLETED': 'completed',
        'CANCELLED': 'cancelled',
        'EXPIRED': 'expired'
      };

      const normalizedStatus = statusMapping[status.status] || status.status.toLowerCase();

      // Update order with latest status
      const previousStatus = order.delivery.status;
      order.delivery.status = normalizedStatus;
      order.delivery.lastStatusCheck = new Date();

      // Auto-update order status based on delivery status
      if (normalizedStatus === 'completed' && order.status !== 'delivered') {
        order.status = 'delivered';
        order.delivery.completedAt = new Date();
        console.log(`Order ${orderId} marked as delivered - Lalamove delivery completed`);
      }

      if (status.driver) {
        order.delivery.driver = {
          name: status.driver.name,
          phone: status.driver.phone,
          plate: status.driver.plate,
          photo: status.driver.photo,
        };
      }

      await order.save();

      // Log status change
      if (previousStatus !== normalizedStatus) {
        console.log(`Order ${orderId} delivery status changed: ${previousStatus} → ${normalizedStatus}`);
      }

      res.json({
        ...status,
        previousStatus,
        currentStatus: normalizedStatus,
        orderStatus: order.status
      });
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
      const { vehicleType = "MOTORCYCLE", dropoff, sellerId } = req.body;
      
      // Get seller's location from their profile
      let pickupLocation;
      
      if (sellerId) {
        const User = require("../models/User");
        const seller = await User.findById(sellerId);
        
        if (seller?.sellerProfile?.location) {
          const sellerLocation = seller.sellerProfile.location;
          const sellerFullAddress = `${sellerLocation.street}, ${sellerLocation.city}, ${sellerLocation.state} ${sellerLocation.zipCode}, ${sellerLocation.country}`;
          const pickupCoords = await this._geocodeAddress(sellerFullAddress);
          
          pickupLocation = {
            lat: pickupCoords.lat,
            lng: pickupCoords.lng,
            address: sellerFullAddress,
            contact: {
              name: seller.name || "Store Manager",
              phone: this._formatPhoneNumber(
                sellerLocation.phone || seller.phone || process.env.LALAMOVE_API_USER || "+639171234567"
              ),
            },
          };
        }
      }
      
      // Fallback to default location if no seller specified or seller has no location
      if (!pickupLocation) {
        pickupLocation = {
          lat: 14.5838,
          lng: 121.0565,
          address: "SM Megamall, Mandaluyong, Metro Manila (Default Store Location)",
          contact: {
            name: "Store Manager",
            phone: this._formatPhoneNumber(
              process.env.LALAMOVE_API_USER || "+639171234567"
            ),
          },
        };
      }
      
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

  // Manual status synchronization
  async syncDeliveryStatus(req, res) {
    try {
      const { orderId } = req.params;

      const order = await Order.findById(orderId);
      if (!order || !order.delivery?.lalamoveOrderId) {
        return res.status(404).json({
          message: "Order or delivery information not found",
        });
      }

      console.log(`Syncing delivery status for order ${orderId}, Lalamove ID: ${order.delivery.lalamoveOrderId}`);

      // Force refresh status from Lalamove
      const latestStatus = await lalamoveService.getOrderStatus(
        order.delivery.lalamoveOrderId
      );

      const previousStatus = order.delivery.status;
      
      // Enhanced status mapping
      const statusMapping = {
        'ASSIGNING_DRIVER': 'assigning_driver',
        'ON_GOING': 'ongoing', 
        'PICKED_UP': 'picked_up',
        'COMPLETED': 'completed',
        'CANCELLED': 'cancelled',
        'EXPIRED': 'expired'
      };

      const normalizedStatus = statusMapping[latestStatus.status] || latestStatus.status.toLowerCase();

      // Update order with latest status
      order.delivery.status = normalizedStatus;
      order.delivery.lastStatusCheck = new Date();
      
      // If completed, update order status too
      if (normalizedStatus === 'completed' && order.status !== 'delivered') {
        order.status = 'delivered';
        order.delivery.completedAt = new Date();
        console.log(`Order ${orderId} marked as delivered - Lalamove delivery completed`);
      }

      if (latestStatus.driver) {
        order.delivery.driver = {
          name: latestStatus.driver.name,
          phone: latestStatus.driver.phone,
          plate: latestStatus.driver.plate,
          photo: latestStatus.driver.photo,
        };
      }

      await order.save();

      console.log(`Order ${orderId} delivery status synced: ${previousStatus} → ${normalizedStatus}`);

      res.json({
        message: "Status synchronized successfully",
        previousStatus,
        currentStatus: normalizedStatus,
        orderStatus: order.status,
        data: latestStatus
      });
    } catch (error) {
      console.error("Error syncing delivery status:", error);
      res.status(500).json({
        message: "Failed to sync delivery status",
        error: error.message,
      });
    }
  },

  // Webhook handler for Lalamove status updates
  async handleWebhook(req, res) {
    try {
      const signature = req.headers['x-lalamove-signature'] || req.headers['authorization'];
      const timestamp = req.headers['x-request-timestamp'];
      
      console.log('Lalamove webhook received:', {
        signature: signature ? 'present' : 'missing',
        timestamp,
        body: JSON.stringify(req.body, null, 2)
      });

      // Validate webhook signature if available
      if (signature) {
        try {
          if (!lalamoveService.validateWebhookSecure(signature, req.body, timestamp)) {
            console.warn('Invalid webhook signature, but processing anyway for debugging');
            // Don't return error in development to allow testing
            if (process.env.NODE_ENV === 'production') {
              return res.status(401).json({ message: "Invalid webhook signature" });
            }
          }
        } catch (validationError) {
          console.warn('Webhook signature validation error:', validationError.message);
          if (process.env.NODE_ENV === 'production') {
            return res.status(401).json({ message: "Webhook validation failed" });
          }
        }
      }

      const webhookData = req.body;

      // Extract order ID and status from webhook - handle different formats
      const lalamoveOrderId = webhookData.orderId || 
                             webhookData.data?.orderId || 
                             webhookData.id ||
                             webhookData.orderShareId;
      
      const newStatus = webhookData.status || 
                       webhookData.data?.status ||
                       webhookData.orderStatus;

      if (!lalamoveOrderId) {
        console.error('Missing order ID in webhook:', webhookData);
        return res.status(400).json({ message: "Missing order ID in webhook" });
      }

      if (!newStatus) {
        console.error('Missing status in webhook:', webhookData);
        return res.status(400).json({ message: "Missing status in webhook" });
      }

      console.log(`Processing webhook for Lalamove order ${lalamoveOrderId}, new status: ${newStatus}`);

      // Find order by Lalamove order ID
      const order = await Order.findOne({ 'delivery.lalamoveOrderId': lalamoveOrderId });
      
      if (!order) {
        console.warn(`Webhook received for unknown Lalamove order: ${lalamoveOrderId}`);
        return res.status(404).json({ message: "Order not found" });
      }

      // Update delivery status
      const previousStatus = order.delivery.status;
      const normalizedStatus = newStatus.toLowerCase();
      
      order.delivery.status = normalizedStatus;
      order.delivery.lastWebhookUpdate = new Date();

      // Update order status if delivery completed
      if (normalizedStatus === 'completed' && order.status !== 'delivered') {
        order.status = 'delivered';
        order.delivery.completedAt = new Date();
        console.log(`Order ${order._id} marked as delivered via webhook`);
      }

      // Update driver info if provided
      const driverData = webhookData.driver || webhookData.data?.driver;
      if (driverData) {
        order.delivery.driver = {
          name: driverData.name,
          phone: driverData.phone,
          plate: driverData.plate || driverData.plateNumber,
          photo: driverData.photo || driverData.photoUrl,
        };
      }

      await order.save();

      console.log(`Webhook processed successfully - Order ${order._id} delivery status: ${previousStatus} → ${normalizedStatus}`);

      res.status(200).json({ 
        message: "Webhook processed successfully",
        orderId: order._id.toString(),
        lalamoveOrderId,
        statusChange: `${previousStatus} → ${normalizedStatus}`,
        orderStatus: order.status
      });

    } catch (error) {
      console.error("Webhook processing error:", error);
      res.status(500).json({
        message: "Webhook processing failed",
        error: error.message,
      });
    }
  },

  // Sync all pending deliveries (utility function)
  async syncAllPendingDeliveries(req, res) {
    try {
      const pendingOrders = await Order.find({
        'delivery.lalamoveOrderId': { $exists: true },
        'delivery.status': { $in: ['pending', 'assigning_driver', 'ongoing', 'picked_up'] }
      });

      console.log(`Found ${pendingOrders.length} orders with pending deliveries`);

      const results = [];

      for (const order of pendingOrders) {
        try {
          const status = await lalamoveService.getOrderStatus(order.delivery.lalamoveOrderId);
          
          const oldStatus = order.delivery.status;
          const normalizedStatus = status.status.toLowerCase();
          
          order.delivery.status = normalizedStatus;
          order.delivery.lastStatusCheck = new Date();
          
          if (normalizedStatus === 'completed' && order.status !== 'delivered') {
            order.status = 'delivered';
            order.delivery.completedAt = new Date();
          }
          
          await order.save();
          
          results.push({
            orderId: order._id.toString(),
            lalamoveOrderId: order.delivery.lalamoveOrderId,
            statusChange: `${oldStatus} → ${normalizedStatus}`,
            success: true
          });
          
          console.log(`✓ Order ${order._id}: ${oldStatus} → ${normalizedStatus}`);
          
          // Rate limiting
          await new Promise(resolve => setTimeout(resolve, 500));
          
        } catch (error) {
          console.error(`✗ Failed to sync order ${order._id}:`, error.message);
          results.push({
            orderId: order._id.toString(),
            lalamoveOrderId: order.delivery.lalamoveOrderId,
            error: error.message,
            success: false
          });
        }
      }

      res.json({
        message: `Sync completed for ${pendingOrders.length} orders`,
        results,
        successCount: results.filter(r => r.success).length,
        errorCount: results.filter(r => !r.success).length
      });
      
    } catch (error) {
      console.error('Sync all pending deliveries error:', error);
      res.status(500).json({
        message: 'Failed to sync pending deliveries',
        error: error.message
      });
    }
  },

  // Manual delivery creation for existing orders
  async createDeliveryForOrder(req, res) {
    try {
      const { orderId } = req.params;
      
      console.log(`🚚 Manual delivery creation requested for order: ${orderId}`);
      
      // Find and populate the order
      const order = await Order.findById(orderId)
        .populate("buyer", "name phone email")
        .populate({
          path: "seller", 
          select: "name phone email address sellerProfile",
          populate: {
            path: "sellerProfile.location",
            select: "street city state zipCode country phone"
          }
        })
        .populate("items.product");

      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      // Check if delivery already exists
      if (order.delivery?.lalamoveOrderId) {
        return res.status(400).json({ 
          message: "Delivery already exists for this order",
          lalamoveOrderId: order.delivery.lalamoveOrderId,
          status: order.delivery.status
        });
      }

      console.log("📦 Creating delivery for existing order:", {
        orderId: order._id,
        buyer: order.buyer?.name,
        seller: order.seller?.name,
        hasShippingAddress: !!order.shippingAddress
      });

      // Create the delivery
      const deliveryResult = await this.autoCreateDelivery(order);
      
      if (deliveryResult) {
        res.json({
          message: "Delivery created successfully",
          orderId: order._id,
          lalamoveOrderId: deliveryResult.id,
          status: deliveryResult.status,
          deliveryInfo: order.delivery
        });
      } else {
        res.status(500).json({
          message: "Delivery creation failed (likely configuration issue)",
          orderId: order._id
        });
      }

    } catch (error) {
      console.error("Manual delivery creation error:", error);
      res.status(500).json({
        message: "Failed to create delivery",
        error: error.message,
        orderId: req.params.orderId
      });
    }
  },

  // Check if Lalamove service is properly configured
  async checkDeliveryConfig(req, res) {
    try {
      console.log("🔧 Checking Lalamove configuration...");
      
      const config = {
        hasApiKey: !!process.env.LALAMOVE_API_KEY,
        hasSecret: !!process.env.LALAMOVE_API_SECRET,
        market: process.env.LALAMOVE_MARKET || 'PH',
        baseUrl: process.env.LALAMOVE_SANDBOX_URL || "https://rest.sandbox.lalamove.com",
        apiKeyLength: process.env.LALAMOVE_API_KEY?.length || 0,
        secretLength: process.env.LALAMOVE_API_SECRET?.length || 0
      };

      console.log("📋 Configuration status:", config);

      // Test the service
      let healthCheck = null;
      try {
        healthCheck = await lalamoveService.healthCheck();
      } catch (healthError) {
        console.error("Health check failed:", healthError.message);
        healthCheck = { 
          status: 'unhealthy', 
          error: healthError.message 
        };
      }

      res.json({
        message: "Delivery configuration status",
        configuration: {
          ...config,
          // Don't expose actual secrets
          apiKey: config.hasApiKey ? `${process.env.LALAMOVE_API_KEY.substring(0, 8)}...` : null,
          secret: config.hasSecret ? `${process.env.LALAMOVE_API_SECRET.substring(0, 8)}...` : null
        },
        healthCheck,
        isConfigured: config.hasApiKey && config.hasSecret && config.market,
        recommendedAction: !config.hasApiKey || !config.hasSecret ? 
          "Set LALAMOVE_API_KEY and LALAMOVE_API_SECRET environment variables" :
          healthCheck?.status === 'healthy' ? "Configuration looks good!" : "Check API credentials"
      });

    } catch (error) {
      console.error("Config check error:", error);
      res.status(500).json({
        message: "Failed to check configuration",
        error: error.message
      });
    }
  },

  // ...existing code...
};

module.exports = deliveryController;
