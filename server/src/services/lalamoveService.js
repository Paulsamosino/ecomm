const axios = require('axios');
const crypto = require('crypto');
const stringify = require('json-stable-stringify'); // Deterministic JSON for HMAC signature

class LalamoveService {
  constructor() {
    // Initialize with environment variables
    this.apiKey = process.env.LALAMOVE_API_KEY;
    this.secret = process.env.LALAMOVE_API_SECRET;
    this.baseUrl =
      process.env.LALAMOVE_SANDBOX_URL || "https://rest.sandbox.lalamove.com";
    this.market = process.env.LALAMOVE_MARKET || "PH";
    this.currency = "PHP"; // Default currency for Philippines
    this.version = "v3";
    this.defaultPhoneNumber = process.env.LALAMOVE_API_USER || "+639000000000";

    if (!this.apiKey || !this.secret) {
      throw new Error("Lalamove API key and secret are required");
    }

    // Log initialization
    console.log('LalamoveService initialized with:', {
      baseUrl: this.baseUrl,
      market: this.market,
      apiKey: this.apiKey ? '***' + this.apiKey.slice(-4) : 'Not set',
      secret: this.secret ? '***' + this.secret.slice(-4) : 'Not set',
      defaultPhone: this.defaultPhoneNumber
    });
  }

  /**
   * Get default phone number for contacts
   * @private
   * @returns {string} Default phone number
   */
  _getDefaultPhoneNumber() {
    return this.defaultPhoneNumber;
  }

  /**
   * Generate authentication headers for Lalamove API
   * @private
   * @param {*} obj - Object to clean
   * @returns {*} Cleaned object
   */
  _cleanAndSortObject(obj) {
    if (Array.isArray(obj)) {
      return obj
        .map(item => this._cleanAndSortObject(item))
        .filter(item => item !== null && item !== undefined);
    }

    if (typeof obj !== 'object' || obj === null) {
      return obj;
    }

    const result = {};
    Object.keys(obj)
      .sort()
      .forEach(key => {
        const value = this._cleanAndSortObject(obj[key]);
        // Only include non-empty values
        if (value !== null && value !== undefined && value !== '') {
          // Skip empty objects and arrays
          if (typeof value === 'object' && Object.keys(value).length === 0) {
            return;
          }
          result[key] = value;
        }
      });

    return result;
  }

  /**
   * Generate authentication headers for Lalamove API requests
   * @private
   * @param {string} method - HTTP method (GET, POST, etc.)
   * @param {string} path - API endpoint path
   * @param {Object} [body] - Request body (for POST/PUT requests)
   * @returns {Object} Headers object
   */
  /**
   * Generate authentication headers for Lalamove API requests
   * @private
   * @param {string} method - HTTP method (GET, POST, etc.)
   * @param {string} path - API endpoint path (must be exact, e.g. '/v3/quotations', no trailing slash)
   * @param {Object} [body] - Request body (for POST/PUT requests)
   * @returns {Object} Headers object
   */
  /**
   * Generate the signature string for HMAC
   * @private
   */
  _generateSignatureString(method, path, bodyString = '') {
    const timestamp = Date.now().toString();
    const methodUpper = method.toUpperCase();
    return `${timestamp}\r\n${methodUpper}\r\n${path}\r\n\r\n${bodyString}`;
  }

  _generateAuthHeaders(method, path, body = {}) {
    const timestamp = Date.now().toString();
    const requestId = `req-${Date.now()}`;
    const methodUpper = method.toUpperCase();

    // Clean and sort the body for consistent signing
    const cleanBody = this._cleanAndSortObject(body);
    // Use json-stable-stringify for deterministic JSON serialization
    const bodyString = Object.keys(cleanBody).length > 0
      ? stringify(cleanBody)
      : '';

    // Create signature string with proper CRLF line endings
    const signatureString = this._generateSignatureString(method, path, bodyString);

    // Generate HMAC signature
    const signature = crypto
      .createHmac('sha256', this.secret)
      .update(signatureString)
      .digest('hex');

    // Debug logs for troubleshooting signature issues
    console.log('[Lalamove Signature Debug]');
    console.log('Signature String:', JSON.stringify(signatureString));
    console.log('HMAC Signature:', signature);
    console.log('Authorization Header:', `hmac ${this.apiKey}:${timestamp}:${signature}`);

    return {
      'Authorization': `hmac ${this.apiKey}:${timestamp}:${signature}`,
      'Market': this.market,
      'Request-ID': requestId,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'X-API-Version': '3.0'
    };
  }

  /**
   * Get a delivery quote
   * @param {Object} quoteData - Quote request data
   * @param {string} [quoteData.serviceType='MOTORCYCLE'] - Type of service
   * @param {Array} quoteData.stops - Array of stop objects with location and address
   * @param {string} [quoteData.language='en_PH'] - Language code (use underscore)
   * @returns {Promise<Object>} Quote response
   */
  async getQuote(quoteData) {
    try {
      console.log('Starting getQuote with data:', JSON.stringify(quoteData, null, 2));
      
      // Validate input
      if (!quoteData.stops || !Array.isArray(quoteData.stops) || quoteData.stops.length < 2) {
        throw new Error('At least 2 stops are required');
      }

      // Utility functions for validation
      function isValidLatLng(val) {
        const num = parseFloat(val);
        return !isNaN(num) && isFinite(num) && Math.abs(num) <= 90;
      }
      
      function isValidLng(lng) {
        const num = parseFloat(lng);
        return !isNaN(num) && isFinite(num) && Math.abs(num) <= 180;
      }
      
      function isValidPhone(phone) {
        return typeof phone === 'string' && /^\+63\d{10}$/.test(phone);
      }

      // Process each stop
      const processedStops = quoteData.stops.map((stop, index) => {
        // Validate stop data
        if (!stop.location || stop.location.lat === undefined || stop.location.lng === undefined) {
          throw new Error(`Stop ${index + 1} is missing required location data`);
        }
        
        // Convert lat/lng to strings and validate
        const lat = stop.location.lat.toString();
        const lng = stop.location.lng.toString();
        
        if (!isValidLatLng(lat) || !isValidLng(lng)) {
          throw new Error(`Stop ${index + 1} has invalid coordinates (${lat}, ${lng})`);
        }
        
        if (!stop.address || typeof stop.address !== 'string' || stop.address.trim() === '') {
          throw new Error(`Stop ${index + 1} is missing a valid address`);
        }
        
        if (!stop.contacts || !Array.isArray(stop.contacts) || stop.contacts.length === 0) {
          throw new Error(`Stop ${index + 1} must have at least one contact`);
        }

        // Process contacts
        const processedContacts = stop.contacts.map((contact, contactIndex) => {
          if (!contact || typeof contact !== 'object') {
            throw new Error(`Contact ${contactIndex + 1} in stop ${index + 1} is invalid`);
          }
          
          if (!contact.name || typeof contact.name !== 'string' || contact.name.trim() === '') {
            throw new Error(`Contact ${contactIndex + 1} in stop ${index + 1} is missing a valid name`);
          }
          
          if (!contact.phone || typeof contact.phone !== 'string' || contact.phone.trim() === '') {
            throw new Error(`Contact ${contactIndex + 1} in stop ${index + 1} is missing a valid phone number`);
          }
          
          // Format phone number if needed
          let phone = contact.phone.trim();
          if (!phone.startsWith('+63') && phone.startsWith('09')) {
            phone = `+63${phone.substring(1)}`;
          } else if (!phone.startsWith('+63') && phone.startsWith('9')) {
            phone = `+63${phone}`;
          } else if (phone.startsWith('63')) {
            phone = `+${phone}`;
          }
          
          if (!isValidPhone(phone)) {
            throw new Error(`Contact ${contactIndex + 1} in stop ${index + 1} has an invalid phone number format: ${contact.phone}`);
          }
          
          return {
            name: contact.name.trim(),
            phone: phone
          };
        });

        return {
          location: {
            lat: lat,
            lng: lng
          },
          address: stop.address.trim(),
          contacts: processedContacts
        };
      });

      // Prepare the final payload
      const quotePayload = {
        serviceType: (quoteData.serviceType || 'MOTORCYCLE').toUpperCase(),
        language: quoteData.language || 'en_PH',
        stops: processedStops,
        // Add any additional required fields here
      };

      console.log('Processed quote payload:', JSON.stringify(quotePayload, null, 2));

      // The quotePayload is already fully processed and validated above
      const finalPayload = {
        serviceType: quotePayload.serviceType,
        language: quotePayload.language,
        stops: quotePayload.stops.map(stop => ({
          location: stop.location,
          address: stop.address,
          contacts: stop.contacts.map(contact => ({
            name: contact.name,
            phone: contact.phone
          }))
        }))
      };

      console.log('Final payload for Lalamove:', JSON.stringify(finalPayload, null, 2));

      const path = '/v3/quotations';
      const url = `${this.baseUrl}${path}`;
      
      // For quotation endpoint, we only need coordinates and address
      // Contacts are not needed until order creation
      const lalamovePayload = {
        data: {
          serviceType: finalPayload.serviceType,
          language: finalPayload.language,
          stops: finalPayload.stops.map(stop => ({
            coordinates: {
              lat: stop.location.lat,
              lng: stop.location.lng
            },
            address: stop.address
          }))
        }
      };
      
      // Use json-stable-stringify for consistent key ordering in both signature and request body
      const bodyString = stringify(lalamovePayload);
      const headers = this._generateAuthHeaders('POST', path, lalamovePayload);

      // Define colors for better log readability
      const colors = {
        reset: '\x1b[0m',
        bright: '\x1b[1m',
        dim: '\x1b[2m',
        underscore: '\x1b[4m',
        blink: '\x1b[5m',
        reverse: '\x1b[7m',
        hidden: '\x1b[8m',
        black: '\x1b[30m',
        red: '\x1b[31m',
        green: '\x1b[32m',
        yellow: '\x1b[33m',
        blue: '\x1b[34m',
        magenta: '\x1b[35m',
        cyan: '\x1b[36m',
        white: '\x1b[37m',
        bgBlack: '\x1b[40m',
        bgRed: '\x1b[41m',
        bgGreen: '\x1b[42m',
        bgYellow: '\x1b[43m',
        bgBlue: '\x1b[44m',
        bgMagenta: '\x1b[45m',
        bgCyan: '\x1b[46m',
        bgWhite: '\x1b[47m'
      };

      // Format timestamp
      const timestamp = new Date().toISOString();
      
      // Log request header
      console.log(`\n${colors.bgBlue}${colors.white}${colors.bright} LALAMOVE API REQUEST ${colors.reset} ${colors.dim}${timestamp}${colors.reset}`);
      console.log(`${colors.blue}${colors.bright}${'➤'.padEnd(3)} ${'URL:'.padEnd(12)}${colors.reset} ${url}`);
      
      // Log headers in a clean format
      console.log(`\n${colors.cyan}${colors.bright}Headers:${colors.reset}`);
      Object.entries(headers).forEach(([key, value]) => {
        const maskedValue = key.toLowerCase().includes('authorization') 
          ? `${value.split(':')[0]}:***` 
          : value;
        console.log(`  ${colors.cyan}${key.padEnd(20)}:${colors.reset} ${maskedValue}`);
      });
      
      // Log request body
      console.log(`\n${colors.green}${colors.bright}Request Body:${colors.reset}`);
      console.log(JSON.stringify(JSON.parse(bodyString), null, 2));
      
      // Log signature details
      console.log(`\n${colors.magenta}${colors.bright}Signature Details:${colors.reset}`);
      console.log(`  ${colors.magenta}Signature String:${colors.reset}`);
      console.log(`  ${colors.dim}${this._generateSignatureString('POST', path, bodyString).replace(/\r\n/g, '\\r\\n\\n  ')}${colors.reset}`);
      
      console.log(`${colors.dim}${'─'.repeat(80)}${colors.reset}`);

      try {
        const response = await axios.post(url, bodyString, {
          headers: {
            ...headers,
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(bodyString),
            'Accept': 'application/json',
            'X-API-Version': '3.0',
            'Market': this.market
          },
          timeout: 15000,
          validateStatus: () => true
        });

        // Log response with better formatting
        console.log(`\n${colors.bgGreen}${colors.white}${colors.bright} LALAMOVE API RESPONSE ${colors.reset} ${colors.dim}${new Date().toISOString()}${colors.reset}`);
        console.log(`${colors.green}${colors.bright}${'✓'.padEnd(3)} ${'Status:'.padEnd(10)}${colors.reset} ${response.status} ${response.statusText}`);
        
        if (response.data) {
          console.log(`\n${colors.green}${colors.bright}Response Data:${colors.reset}`);
          console.log(JSON.stringify(response.data, null, 2));
        }

        if (response.status >= 400) {
          const errorMsg = response.data?.message || 'Unknown error';
          const errorDetails = response.data?.errors || [];
          
          // Format error response
          console.error(`\n${colors.bgRed}${colors.white}${colors.bright} LALAMOVE API ERROR ${colors.reset} ${colors.dim}${new Date().toISOString()}${colors.reset}`);
          console.error(`${colors.red}${colors.bright}✗${colors.reset} ${'Status:'.padEnd(10)}${colors.reset} ${response.status} ${response.statusText}`);
          console.error(`${colors.red}${colors.bright}✗${colors.reset} ${'Error:'.padEnd(10)}${colors.reset} ${errorMsg}`);
          
          if (errorDetails && errorDetails.length > 0) {
            console.error(`\n${colors.red}${colors.bright}Error Details:${colors.reset}`);
            errorDetails.forEach((detail, index) => {
              console.error(`  ${colors.red}${index + 1}.${colors.reset} ${JSON.stringify(detail, null, 2)}`);
            });
          }
          
          throw new Error(`Lalamove API Error (${response.status}): ${errorMsg}`);
        }

        return response.data.data || response.data;

      } catch (error) {
        console.error('Error in getQuote:', {
          message: error.message,
          stack: error.stack,
          response: error.response ? {
            status: error.response.status,
            data: error.response.data,
            headers: error.response.headers
          } : undefined
        });
        throw error;
        
        throw new Error(`Failed to get delivery quote: ${error.message}`);
      }
      
      return response.data.data || response.data;
    } catch (error) {
      const errorDetails = {
        message: error.message,
        status: error.response?.status,
        response: {
          data: error.response?.data,
          headers: error.response?.headers,
          statusText: error.response?.statusText
        },
        request: {
          method: error.config?.method?.toUpperCase(),
          url: error.config?.url,
          headers: error.config?.headers,
          data: error.config?.data ? JSON.parse(error.config.data) : null
        }
      };

      console.error('Lalamove V3 Quote Error:', JSON.stringify(errorDetails, null, 2));
      
      // Extract and format validation errors if available
      let errorMessage = 'Failed to get delivery quote';
      if (error.response?.data?.errors) {
        const errorMessages = Object.entries(error.response.data.errors)
          .map(([field, messages]) => `${field}: ${Array.isArray(messages) ? messages.join(', ') : messages}`)
          .join('; ');
        errorMessage = `Validation error: ${errorMessage}. ${errorMessages}`;
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      
      throw new Error(errorMessage);
    }
  }

  /**
   * Create a new delivery order
   * @param {Object} orderData - Order data
   * @returns {Promise<Object>} Order response
   */
  /**
   * Create a new delivery order
   * @param {Object} orderData - Order data
   * @returns {Promise<Object>} Order response
   */
  /**
   * Create a new delivery order using v3 API
   * @param {Object} orderData - Order data
   * @returns {Promise<Object>} Order response
  /**
   * Create a new delivery order using a quotation ID
   * @param {Object} orderData - Order data
   * @param {string} orderData.quotationId - The quotation ID from getQuote response
   * @param {Object} orderData.sender - Sender contact information
   * @param {string} orderData.sender.stopId - Stop ID from the quotation
   * @param {string} orderData.sender.name - Sender's name
   * @param {string} orderData.sender.phone - Sender's phone number
   * @param {Array<Object>} orderData.recipients - Array of recipient objects
   * @param {string} orderData.recipients[].stopId - Stop ID from the quotation
   * @param {string} orderData.recipients[].name - Recipient's name
   * @param {string} orderData.recipients[].phone - Recipient's phone number
   * @param {string} [orderData.recipients[].remarks] - Special instructions
   * @param {Object} [orderData.metadata] - Additional metadata for the order
   * @returns {Promise<Object>} Order response
   */
  async createOrder(orderData) {
    try {
      const path = '/v3/orders';
      const url = `${this.baseUrl}${path}`;

      // Validate required fields
      if (!orderData.quotationId) {
        throw new Error('quotationId is required');
      }
      if (!orderData.sender || !orderData.sender.stopId || !orderData.sender.name || !orderData.sender.phone) {
        throw new Error('sender object with stopId, name, and phone is required');
      }
      if (!orderData.recipients || orderData.recipients.length === 0) {
        throw new Error('At least one recipient is required');
      }

      // Build the payload according to V3 API
      const payload = {
        data: {
          quotationId: orderData.quotationId,
          sender: {
            stopId: orderData.sender.stopId,
            name: orderData.sender.name,
            phone: orderData.sender.phone
          },
          recipients: orderData.recipients.map(recipient => ({
            stopId: recipient.stopId,
            name: recipient.name,
            phone: recipient.phone,
            ...(recipient.remarks && { remarks: recipient.remarks })
          }))
        }
      };

      // Add metadata if provided
      if (orderData.metadata) {
        payload.data.metadata = orderData.metadata;
      }

      // Stringify the payload for the request body.
      // Use json-stable-stringify to ensure keys are sorted for consistency.
      const bodyString = stringify(payload);

      // Generate auth headers using the original payload object.
      const headers = this._generateAuthHeaders('POST', path, payload);

      console.log('Order Payload for signature:', bodyString);

      // Log the request details for debugging
      console.log('Sending order request to:', url);
      console.log('Order Request headers:', JSON.stringify(headers, null, 2));

      // Make the API request using the pre-stringified body
      const response = await axios.post(
        url,
        bodyString,
        {
          headers,
          timeout: 15000,
          validateStatus: () => true,
        }
      );

      return response.data.data;
    } catch (error) {
      console.error("Lalamove V3 Create Order Error:", {
        status: error.response?.status,
        data: error.response?.data,
        errors: JSON.stringify(error.response?.data?.errors),
        message: error.message,
      });
      throw new Error(
        error.response?.data?.message || "Failed to create delivery order"
      );
    }
  }

  /**
   * Get order status by ID
   * @param {string} orderId - Lalamove order ID
   * @returns {Promise<Object>} Order status
   */
  /**
   * Get order status by ID
   * @param {string} orderId - Lalamove order ID
   * @returns {Promise<Object>} Order status
   */
  /**
   * Get order status by ID using v3 API
   * @param {string} orderId - Lalamove order ID
   * @returns {Promise<Object>} Order status
   */
  async getOrderStatus(orderId) {
    try {
      const path = `/v3/orders/${orderId}`;
      const url = `${this.baseUrl}${path}`;

      const headers = this._generateAuthHeaders("GET", path);

      const response = await axios.get(url, {
        headers,
        timeout: 10000,
      });

      return response.data.data;
    } catch (error) {
      console.error("Lalamove V3 Order Status Error:", {
        orderId,
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      });
      throw new Error(
        error.response?.data?.message || "Failed to get order status"
      );
    }
  }

  /**
   * Cancel an existing order
   * @param {string} orderId - Lalamove order ID
   * @returns {Promise<Object>} Cancellation response
   */
  /**
   * Cancel an existing order
   * @param {string} orderId - Lalamove order ID
   * @returns {Promise<Object>} Cancellation response
   */
  /**
   * Cancel an existing order using v3 API
   * @param {string} orderId - Lalamove order ID
   * @returns {Promise<Object>} Cancellation response
   */
  async cancelOrder(orderId) {
    try {
      const path = `/v3/orders/${orderId}/cancel`;
      const url = `${this.baseUrl}${path}`;

      const headers = this._generateAuthHeaders("PUT", path);

      const response = await axios.put(
        url,
        {},
        {
          headers,
          timeout: 10000,
        }
      );

      return response.data.data;
    } catch (error) {
      console.error("Lalamove V3 Cancel Order Error:", {
        orderId,
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      });
      throw new Error(
        error.response?.data?.message || "Failed to cancel order"
      );
    }
  }

  /**
   * Get driver location
   * @param {string} orderId - Lalamove order ID
   * @returns {Promise<Object>} Driver location data
   */
  /**
   * Get driver location for an order
   * @param {string} orderId - Lalamove order ID
   * @returns {Promise<Object>} Driver location data
   */
  /**
   * Get driver location for an order using v3 API
   * @param {string} orderId - Lalamove order ID
   * @returns {Promise<Object>} Driver location data
   */
  async getDriverLocation(orderId) {
    try {
      const path = `/v3/orders/${orderId}/driver-location`;
      const url = `${this.baseUrl}${path}`;

      const headers = this._generateAuthHeaders("GET", path);

      const response = await axios.get(url, {
        headers,
        timeout: 10000,
      });

      return response.data.data;
    } catch (error) {
      console.error("Lalamove V3 Driver Location Error:", {
        orderId,
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      });
      throw new Error(
        error.response?.data?.message || "Failed to get driver location"
      );
    }
  }

  /**
   * Get driver info and contact details
   * @param {string} orderId - Lalamove order ID
   * @returns {Promise<Object>} Driver information
   */
  /**
   * Get driver info and contact details using v3 API
   * @param {string} orderId - Lalamove order ID
   * @returns {Promise<Object>} Driver information
   */
  async getDriverInfo(orderId) {
    try {
      const path = `/v3/orders/${orderId}/driver`;
      const url = `${this.baseUrl}${path}`;

      const headers = this._generateAuthHeaders("GET", path);

      const response = await axios.get(url, {
        headers,
        timeout: 10000,
      });

      return response.data.data;
    } catch (error) {
      console.error("Lalamove V3 Driver Info Error:", {
        orderId,
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      });
      throw new Error(
        error.response?.data?.message || "Failed to get driver information"
      );
    }
  }

  /**
   * Validate webhook signature
   * @param {string} signature - X-Request-Signature header
   * @param {string} body - Raw request body
   * @returns {boolean} True if signature is valid
   */
  /**
   * Validate webhook signature
   * @param {string} signature - X-Request-Signature header
   * @param {Object|string} body - Request body (object or string)
   * @returns {boolean} True if signature is valid
   */
  validateWebhook(signature, body) {
    try {
      const requestBody =
        typeof body === "string" ? body : JSON.stringify(body);
      const hmac = crypto.createHmac("sha256", this.secret);
      const computedSignature = hmac.update(requestBody).digest("hex");

      return signature === computedSignature;
    } catch (error) {
      console.error("Webhook Validation Error:", error);
      return false;
    }
  }
}

module.exports = new LalamoveService();
