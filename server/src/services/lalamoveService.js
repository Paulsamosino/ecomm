const axios = require("axios");
const crypto = require("crypto");

class LalamoveService {
  constructor() {
    this.apiKey = process.env.LALAMOVE_API_KEY;
    this.apiSecret = process.env.LALAMOVE_API_SECRET;
    this.baseURL =
      process.env.LALAMOVE_SANDBOX_URL || "https://rest.sandbox.lalamove.com";
    this.apiUser = process.env.LALAMOVE_API_USER;

    // Initialize axios instance with base configuration
    this.client = axios.create({
      baseURL: this.baseURL,
      headers: {
        "Content-Type": "application/json",
        Authorization: this.generateToken.bind(this),
      },
    });

    // Add rate limiting
    this.requestCount = 0;
    this.requestReset = Date.now();
    this.rateLimit = 50; // 50 queries per minute
  }

  // Generate HMAC token for authentication
  generateToken(method, path, body = "") {
    const timestamp = Date.now().toString();
    const rawSignature = `${timestamp}\r\n${method}\r\n${path}\r\n\r\n${JSON.stringify(
      body
    )}`;
    const signature = crypto
      .createHmac("sha256", this.apiSecret)
      .update(rawSignature)
      .digest("hex");

    return `hmac ${this.apiKey}:${timestamp}:${signature}`;
  }

  // Check rate limit
  checkRateLimit() {
    const now = Date.now();
    if (now - this.requestReset > 60000) {
      // Reset counter every minute
      this.requestCount = 0;
      this.requestReset = now;
    }

    if (this.requestCount >= this.rateLimit) {
      throw new Error("Rate limit exceeded. Please try again later.");
    }

    this.requestCount++;
  }

  // Create delivery order
  async createOrder(data) {
    try {
      this.checkRateLimit();

      const response = await this.client.post("/v3/orders", {
        serviceType: "MOTORCYCLE", // Default to motorcycle delivery
        stops: [
          {
            address: data.senderAddress,
          },
          {
            address: data.recipientAddress,
          },
        ],
        sender: {
          stopId: 0,
          name: data.senderName,
          phone: data.senderPhone,
        },
        recipients: [
          {
            stopId: 1,
            name: data.recipientName,
            phone: data.recipientPhone,
          },
        ],
        isPODEnabled: true, // Enable proof of delivery
        isRecipientSMSEnabled: true,
        remarks: data.remarks || "",
      });

      return response.data;
    } catch (error) {
      console.error("Lalamove order creation error:", error);
      throw error;
    }
  }

  // Get order status
  async getOrderStatus(orderId) {
    try {
      this.checkRateLimit();

      const response = await this.client.get(`/v3/orders/${orderId}`);
      return response.data;
    } catch (error) {
      console.error("Lalamove order status error:", error);
      throw error;
    }
  }

  // Get driver information
  async getDriverInfo(orderId) {
    try {
      this.checkRateLimit();

      const response = await this.client.get(`/v3/orders/${orderId}/driver`);
      return response.data;
    } catch (error) {
      console.error("Lalamove driver info error:", error);
      throw error;
    }
  }

  // Cancel order
  async cancelOrder(orderId) {
    try {
      this.checkRateLimit();

      const response = await this.client.delete(`/v3/orders/${orderId}`);
      return response.data;
    } catch (error) {
      console.error("Lalamove order cancellation error:", error);
      throw error;
    }
  }
}

module.exports = new LalamoveService();
