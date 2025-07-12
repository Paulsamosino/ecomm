const axios = require('axios');
const crypto = require('crypto');
const stringify = require('json-stable-stringify');
class LalamoveService {
  constructor() {
    // Environment variables
    this.apiKey = process.env.LALAMOVE_API_KEY;
    this.secret = process.env.LALAMOVE_API_SECRET;
    this.baseUrl = process.env.LALAMOVE_SANDBOX_URL || "https://rest.sandbox.lalamove.com";
    this.market = process.env.LALAMOVE_MARKET || "PH";
    this.currency = "PHP";
    this.version = "v3";
    this.defaultPhoneNumber = process.env.LALAMOVE_API_USER || "+639000000000";
    
    // Settings
    this.maxRetries = parseInt(process.env.LALAMOVE_MAX_RETRIES) || 3;
    this.retryDelay = parseInt(process.env.LALAMOVE_RETRY_DELAY) || 1000;
    this.requestTimeout = parseInt(process.env.LALAMOVE_REQUEST_TIMEOUT) || 15000;
    this.rateLimitDelay = parseInt(process.env.LALAMOVE_RATE_LIMIT_DELAY) || 100;

    if (!this.apiKey || !this.secret) {
      throw new Error("Lalamove API key and secret are required");
    }

    this._validateCredentials();
  }

  // Validate credentials
  _validateCredentials() {
    if (typeof this.apiKey !== 'string' || this.apiKey.length < 10) {
      throw new Error('Invalid API key format');
    }
    if (typeof this.secret !== 'string' || this.secret.length < 20) {
      throw new Error('Invalid API secret format');
    }
    const validMarkets = ['PH', 'SG', 'TH', 'MY', 'VN', 'ID', 'HK', 'TW'];
    if (!validMarkets.includes(this.market)) {
      throw new Error(`Invalid market: ${this.market}. Valid markets: ${validMarkets.join(', ')}`);
    }
  }

  // Validate phone
  _validateAndFormatPhone(phone, countryCode = 'PH') {
    if (!phone || typeof phone !== 'string') {
      throw new Error('Phone number is required and must be a string');
    }

    phone = phone.trim().replace(/\s+/g, '');

    if (countryCode === 'PH') {
      if (phone.startsWith('09')) {
        phone = `+63${phone.substring(1)}`;
      } else if (phone.startsWith('9') && phone.length === 10) {
        phone = `+63${phone}`;
      } else if (phone.startsWith('63') && !phone.startsWith('+')) {
        phone = `+${phone}`;
      }

      if (!/^\+63[0-9]{10}$/.test(phone)) {
        throw new Error(`Invalid Philippines phone number format: ${phone}. Expected format: +639XXXXXXXXX`);
      }
    }

    return phone;
  }

  // Validate coordinates
  _validateCoordinates(lat, lng, location = 'coordinates') {
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);

    if (isNaN(latitude) || isNaN(longitude)) {
      throw new Error(`Invalid ${location}: latitude and longitude must be valid numbers`);
    }

    if (latitude < -90 || latitude > 90) {
      throw new Error(`Invalid ${location}: latitude must be between -90 and 90 degrees`);
    }

    if (longitude < -180 || longitude > 180) {
      throw new Error(`Invalid ${location}: longitude must be between -180 and 180 degrees`);
    }

    if (this.market === 'PH') {
      if (latitude < 4.0 || latitude > 21.0 || longitude < 116.0 || longitude > 127.0) {
        console.warn(`Warning: Coordinates (${latitude}, ${longitude}) appear to be outside Philippines`);
      }
    }

    return { lat: latitude.toString(), lng: longitude.toString() };
  }

  // Validate address
  _validateAddress(address, location = 'address') {
    if (!address || typeof address !== 'string') {
      throw new Error(`${location} is required and must be a string`);
    }

    address = address.trim();
    if (address.length < 5) {
      throw new Error(`${location} must be at least 5 characters long`);
    }

    if (address.length > 500) {
      throw new Error(`${location} must be less than 500 characters`);
    }

    address = address
      .replace(/[<>]/g, '')
      .replace(/[\x00-\x1F\x7F]/g, '')
      .replace(/[\uFEFF\u200B-\u200D\uFFFE\uFFFF]/g, '');

    return address;
  }

  // Rate limiting
  async _rateLimit() {
    await new Promise(resolve => setTimeout(resolve, this.rateLimitDelay));
  }

  // Retry with backoff
  async _retryRequest(requestFn, maxRetries = this.maxRetries) {
    let lastError;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        await this._rateLimit();
        return await requestFn();
      } catch (error) {
        lastError = error;
        
        if (error.response?.status === 401 || error.response?.status === 403 || error.response?.status === 422) {
          throw error;
        }
        
        if (attempt < maxRetries) {
          const delay = this.retryDelay * Math.pow(2, attempt - 1);
          console.log(`Request failed (attempt ${attempt}/${maxRetries}), retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    throw lastError;
  }

  _getDefaultPhoneNumber() {
    return this.defaultPhoneNumber;
  }

  // Clean object
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
        if (value !== null && value !== undefined && value !== '') {
          if (typeof value === 'object' && Object.keys(value).length === 0) {
            return;
          }
          result[key] = value;
        }
      });

    return result;
  }

  // Generate signature string with EXACT CRLF format
  _generateSignatureString(method, path, bodyString = '', timestamp) {
    const methodUpper = method.toUpperCase();
    // CRITICAL: Use exact CRLF format as specified by Lalamove
    return `${timestamp}\r\n${methodUpper}\r\n${path}\r\n\r\n${bodyString}`;
  }

  _generateAuthHeaders(method, path, body = {}) {
    // CRITICAL: Generate timestamp ONCE and reuse
    const timestamp = Date.now().toString();
    const requestId = `req-${timestamp}-${crypto.randomUUID().replace(/-/g, '').substring(0, 12)}`;

    // Clean and deterministically stringify the body ONCE
    const cleanBody = this._cleanAndSortObject(body);
    const bodyString = Object.keys(cleanBody).length > 0 ? stringify(cleanBody) : '';

    // Create signature string with proper CRLF line endings
    const signatureString = this._generateSignatureString(method.toUpperCase(), path, bodyString, timestamp);

    // Generate HMAC signature
    const signature = crypto
      .createHmac('sha256', this.secret)
      .update(signatureString)
      .digest('hex');

    // Debug logging (development only)
    if (process.env.NODE_ENV !== 'production' || process.env.LALAMOVE_DEBUG === 'true') {
      console.log('[Lalamove Signature Debug]');
      console.log('Timestamp (reused):', timestamp);
      console.log('Method:', method.toUpperCase());
      console.log('Path:', path);
      console.log('Body String (exact):', JSON.stringify(bodyString));
      console.log('Signature String (with CRLF):', JSON.stringify(signatureString));
      console.log('HMAC Signature:', signature);
      console.log('Authorization Header:', `hmac ${this.apiKey}:${timestamp}:${signature}`);
    }

    return {
      headers: {
        'Authorization': `hmac ${this.apiKey}:${timestamp}:${signature}`,
        'X-Request-Timestamp': timestamp, // Same timestamp reused
        'Market': this.market,
        'Request-ID': requestId,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-API-Version': '3.0'
      },
      bodyString // Return the EXACT string that was signed
    };
  }

  // Centralized API request method to ensure signature consistency
  async _makeAuthenticatedRequest(method, path, payload = null, options = {}) {
    const url = `${this.baseUrl}${path}`;
    
    // Generate auth headers and get the exact signed body string
    const { headers, bodyString } = this._generateAuthHeaders(method, path, payload || {});
    
    // Log the request in development
    if (payload) {
      this._logRequest(method, url, headers, payload);
    }

    // Prepare axios config
    const axiosConfig = {
      headers: {
        ...headers,
        ...(bodyString && { 'Content-Length': Buffer.byteLength(bodyString) })
      },
      timeout: options.timeout || this.requestTimeout,
      validateStatus: () => true,
      ...options
    };

    // Make the request with the EXACT signed body string
    let response;
    if (method.toUpperCase() === 'GET' || method.toUpperCase() === 'DELETE') {
      response = await axios[method.toLowerCase()](url, axiosConfig);
    } else {
      response = await axios[method.toLowerCase()](url, bodyString || '', axiosConfig);
    }

    this._logResponse(response);
    return response;
  }

  // Get quote
  async getQuote(quoteData) {
    return this._retryRequest(async () => {
      try {
        console.log('Starting getQuote with data:', JSON.stringify(quoteData, null, 2));
        
        if (!quoteData || typeof quoteData !== 'object') {
          throw new Error('Quote data is required and must be an object');
        }

        if (!quoteData.stops || !Array.isArray(quoteData.stops) || quoteData.stops.length < 2) {
          throw new Error('At least 2 stops are required for a delivery quote');
        }

        if (quoteData.stops.length > 10) {
          throw new Error('Maximum 10 stops allowed per delivery');
        }

        const validServiceTypes = ['MOTORCYCLE', 'CAR', 'VAN', 'TRUCK'];
        const serviceType = (quoteData.serviceType || 'MOTORCYCLE').toUpperCase();
        if (!validServiceTypes.includes(serviceType)) {
          throw new Error(`Invalid service type: ${serviceType}. Valid types: ${validServiceTypes.join(', ')}`);
        }

        // Process stops
        const processedStops = quoteData.stops.map((stop, index) => {
          if (!stop || typeof stop !== 'object') {
            throw new Error(`Stop ${index + 1} must be an object`);
          }

          if (!stop.location || typeof stop.location !== 'object') {
            throw new Error(`Stop ${index + 1} is missing location object`);
          }

          const coordinates = this._validateCoordinates(
            stop.location.lat, 
            stop.location.lng, 
            `stop ${index + 1} location`
          );

          const address = this._validateAddress(stop.address, `stop ${index + 1} address`);

          let processedContacts = [];
          if (stop.contacts && Array.isArray(stop.contacts)) {
            processedContacts = stop.contacts.map((contact, contactIndex) => {
              if (!contact || typeof contact !== 'object') {
                throw new Error(`Contact ${contactIndex + 1} in stop ${index + 1} must be an object`);
              }
              
              if (!contact.name || typeof contact.name !== 'string' || contact.name.trim() === '') {
                throw new Error(`Contact ${contactIndex + 1} in stop ${index + 1} is missing a valid name`);
              }
              
              const formattedPhone = this._validateAndFormatPhone(contact.phone);
              
              return {
                name: contact.name.trim(),
                phone: formattedPhone
              };
            });
          }

          return {
            location: coordinates,
            address,
            ...(processedContacts.length > 0 && { contacts: processedContacts })
          };
        });

        // Prepare payload
        const quotePayload = {
          data: {
            serviceType,
            language: quoteData.language || 'en_PH',
            stops: processedStops.map(stop => ({
              coordinates: {
                lat: stop.location.lat,
                lng: stop.location.lng
              },
              address: stop.address
            }))
          }
        };

        console.log('Final quote payload:', JSON.stringify(quotePayload, null, 2));

        const path = '/v3/quotations';
        
        // Use centralized method to ensure signature consistency
        const response = await this._makeAuthenticatedRequest('POST', path, quotePayload);

        if (response.status >= 400) {
          throw this._handleApiError(new Error('API Error'), { 
            operation: 'getQuote',
            status: response.status,
            response: response.data 
          });
        }

        return response.data.data || response.data;

      } catch (error) {
        if (error.response) {
          throw this._handleApiError(error, { operation: 'getQuote' });
        }
        throw error;
      }
    });
  }

  // Get quotation by ID
  async getQuotationById(quotationId) {
    try {
      const path = `/v3/quotations/${quotationId}`;
      const url = `${this.baseUrl}${path}`;

      const { headers } = this._generateAuthHeaders("GET", path);

      const response = await axios.get(url, {
        headers,
        timeout: 10000,
        validateStatus: () => true
      });

      console.log(`Get quotation ${quotationId} response:`, {
        status: response.status,
        data: response.data
      });

      if (response.status >= 400) {
        const errorMsg = response.data?.message || 'Failed to get quotation';
        throw new Error(`Lalamove API Error (${response.status}): ${errorMsg}`);
      }

      return response.data.data || response.data;
    } catch (error) {
      console.error("Lalamove V3 Get Quotation Error:", {
        quotationId,
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      });
      throw new Error(
        error.response?.data?.message || "Failed to get quotation details"
      );
    }
  }

  // Create order
  async createOrder(orderData) {
    try {
      // Validate fields
      if (!orderData.quotationId) {
        throw new Error('quotationId is required');
      }
      if (!orderData.sender || !orderData.sender.stopId || !orderData.sender.name || !orderData.sender.phone) {
        throw new Error('sender object with stopId, name, and phone is required');
      }
      if (!orderData.recipients || orderData.recipients.length === 0) {
        throw new Error('At least one recipient is required');
      }

      // Build payload
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

      // CRITICAL FIX: Use centralized method to ensure signature consistency
      const orderPath = '/v3/orders';
      const response = await this._makeAuthenticatedRequest('POST', orderPath, payload, { timeout: 15000 });

      console.log('Lalamove Order Creation Response:', {
        status: response.status,
        data: JSON.stringify(response.data, null, 2)
      });

      if (response.status >= 400) {
        const errorMsg = response.data?.message || 'Unknown error';
        console.error('Lalamove Order Creation Error:', errorMsg);
        throw new Error(errorMsg);
      }

      if (!response.data) {
        console.error('No data in response:', response);
        throw new Error('Invalid response from Lalamove API - no data');
      }

      const responseOrderData = response.data.data || response.data;
      
      if (!responseOrderData) {
        console.error('No order data in response:', response.data);
        throw new Error('Invalid response from Lalamove API - no order data');
      }

      return responseOrderData;
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

  // Create order with options
  async createOrderWithOptions(orderData) {
    return this._retryRequest(async () => {
      try {
        if (!orderData?.quotationId) {
          throw new Error('quotationId is required');
        }

        if (!orderData.sender?.stopId || !orderData.sender?.name || !orderData.sender?.phone) {
          throw new Error('sender object with stopId, name, and phone is required');
        }

        if (!orderData.recipients?.length) {
          throw new Error('At least one recipient is required');
        }

        // Validate sender
        const validatedSender = {
          stopId: orderData.sender.stopId,
          name: this._validateAddress(orderData.sender.name, 'sender name'),
          phone: this._validateAndFormatPhone(orderData.sender.phone)
        };

        // Validate recipients
        const validatedRecipients = orderData.recipients.map((recipient, index) => {
          if (!recipient.stopId || !recipient.name || !recipient.phone) {
            throw new Error(`Recipient ${index + 1} missing required fields (stopId, name, phone)`);
          }

          return {
            stopId: recipient.stopId,
            name: this._validateAddress(recipient.name, `recipient ${index + 1} name`),
            phone: this._validateAndFormatPhone(recipient.phone),
            ...(recipient.remarks && { 
              remarks: this._validateAddress(recipient.remarks, `recipient ${index + 1} remarks`) 
            })
          };
        });

        // Build payload
        const payload = {
          data: {
            quotationId: orderData.quotationId,
            sender: validatedSender,
            recipients: validatedRecipients
          }
        };

        // Optional features
        if (orderData.options?.priorityFee) {
          payload.data.isPriorityFee = true;
        }

        if (orderData.options?.notes) {
          payload.data.remarks = this._validateAddress(orderData.options.notes, 'delivery notes');
        }

        if (orderData.metadata && typeof orderData.metadata === 'object') {
          payload.data.metadata = orderData.metadata;
        }

        // Use centralized method to ensure signature consistency
        const ordersPath = '/v3/orders';
        const response = await this._makeAuthenticatedRequest('POST', ordersPath, payload);

        if (response.status >= 400) {
          throw this._handleApiError(new Error('Create Order Failed'), {
            operation: 'createOrder',
            status: response.status,
            response: response.data
          });
        }

        return response.data.data || response.data;

      } catch (error) {
        if (error.response) {
          throw this._handleApiError(error, { operation: 'createOrder' });
        }
        throw error;
      }
    });
  }

  // Get order details
  async getOrderDetails(orderId, includeDriver = false) {
    try {
      if (!orderId || typeof orderId !== 'string') {
        throw new Error('Valid order ID is required');
      }

      const orderStatus = await this.getOrderStatus(orderId);

      if (!includeDriver) {
        return orderStatus;
      }

      let driverInfo = null;
      let driverLocation = null;

      try {
        [driverInfo, driverLocation] = await Promise.allSettled([
          this.getDriverInfo(orderId),
          this.getDriverLocation(orderId)
        ]);

        return {
          ...orderStatus,
          driver: {
            info: driverInfo.status === 'fulfilled' ? driverInfo.value : null,
            location: driverLocation.status === 'fulfilled' ? driverLocation.value : null,
            lastUpdated: new Date().toISOString()
          }
        };
      } catch (driverError) {
        console.warn('Failed to get driver information:', driverError.message);
        return orderStatus;
      }

    } catch (error) {
      throw this._handleApiError(error, { operation: 'getOrderDetails', orderId });
    }
  }

  // Get order status
  async getOrderStatus(orderId) {
    return this._retryRequest(async () => {
      try {
        if (!orderId || typeof orderId !== 'string') {
          throw new Error('Valid order ID is required');
        }

        const path = `/v3/orders/${orderId}`;
        const url = `${this.baseUrl}${path}`;
        const authResult = this._generateAuthHeaders('GET', path);

        const response = await axios.get(url, {
          headers: authResult.headers,
          timeout: this.requestTimeout,
          validateStatus: () => true
        });

        this._logResponse(response);

        if (response.status >= 400) {
          throw this._handleApiError(new Error('Get Order Status Failed'), {
            operation: 'getOrderStatus',
            orderId,
            status: response.status,
            response: response.data
          });
        }

        return response.data.data || response.data;

      } catch (error) {
        if (error.response) {
          throw this._handleApiError(error, { operation: 'getOrderStatus', orderId });
        }
        throw error;
      }
    });
  }

  // Get driver info
  async getDriverInfo(orderId) {
    return this._retryRequest(async () => {
      try {
        if (!orderId || typeof orderId !== 'string') {
          throw new Error('Valid order ID is required');
        }

        const path = `/v3/orders/${orderId}/driver`;
        const url = `${this.baseUrl}${path}`;
        const authResult = this._generateAuthHeaders('GET', path);

        const response = await axios.get(url, {
          headers: authResult.headers,
          timeout: this.requestTimeout,
          validateStatus: () => true
        });

        if (response.status >= 400) {
          throw this._handleApiError(new Error('Get Driver Info Failed'), {
            operation: 'getDriverInfo',
            orderId,
            status: response.status,
            response: response.data
          });
        }

        return response.data.data || response.data;

      } catch (error) {
        if (error.response) {
          throw this._handleApiError(error, { operation: 'getDriverInfo', orderId });
        }
        throw error;
      }
    });
  }

  // Get driver location
  async getDriverLocation(orderId) {
    return this._retryRequest(async () => {
      try {
        if (!orderId || typeof orderId !== 'string') {
          throw new Error('Valid order ID is required');
        }

        const path = `/v3/orders/${orderId}/driver/location`;
        const url = `${this.baseUrl}${path}`;
        const authResult = this._generateAuthHeaders('GET', path);

        const response = await axios.get(url, {
          headers: authResult.headers,
          timeout: this.requestTimeout,
          validateStatus: () => true
        });

        if (response.status >= 400) {
          throw this._handleApiError(new Error('Get Driver Location Failed'), {
            operation: 'getDriverLocation',
            orderId,
            status: response.status,
            response: response.data
          });
        }

        return response.data.data || response.data;

      } catch (error) {
        if (error.response) {
          throw this._handleApiError(error, { operation: 'getDriverLocation', orderId });
        }
        throw error;
      }
    });
  }

  // Enhanced webhook validation with proper signature parsing
  validateWebhookSecure(signature, body, timestamp) {
    try {
      if (!signature || typeof signature !== 'string') {
        console.error('Invalid webhook signature format');
        return false;
      }

      // Parse signature format: "hmac apiKey:timestamp:signature" or just "signature"
      let extractedSignature = signature;
      let extractedTimestamp = timestamp;
      
      if (signature.startsWith('hmac ')) {
        const parts = signature.replace('hmac ', '').split(':');
        if (parts.length === 3) {
          const [apiKey, sigTimestamp, sig] = parts;
          
          // Validate API key matches
          if (apiKey !== this.apiKey) {
            console.error('Webhook signature API key mismatch');
            return false;
          }
          
          extractedSignature = sig;
          extractedTimestamp = sigTimestamp;
        }
      }

      // Validate timestamp (prevent replay attacks)
      if (extractedTimestamp) {
        const requestTime = parseInt(extractedTimestamp);
        const currentTime = Date.now();
        const timeDiff = Math.abs(currentTime - requestTime);
        
        // 5 minute tolerance
        if (timeDiff > 5 * 60 * 1000) {
          console.error('Webhook timestamp outside tolerance:', {
            requestTime: new Date(requestTime).toISOString(),
            currentTime: new Date(currentTime).toISOString(),
            diffMinutes: timeDiff / (60 * 1000)
          });
          return false;
        }
      }

      // Generate expected signature
      const requestBody = typeof body === 'string' ? body : stringify(body);
      const hmac = crypto.createHmac('sha256', this.secret);
      const computedSignature = hmac.update(requestBody).digest('hex');

      // Timing-safe comparison
      const isValid = crypto.timingSafeEqual(
        Buffer.from(extractedSignature, 'hex'),
        Buffer.from(computedSignature, 'hex')
      );

      if (!isValid) {
        console.error('Webhook signature verification failed', {
          expectedLength: computedSignature.length,
          receivedLength: extractedSignature.length,
          timestamp: extractedTimestamp
        });
      }

      return isValid;

    } catch (error) {
      console.error('Webhook validation error:', error);
      return false;
    }
  }

  // Health check
  async healthCheck() {
    try {
      const startTime = Date.now();
      
      const testQuote = {
        serviceType: 'MOTORCYCLE',
        language: 'en_PH',
        stops: [
          {
            location: { lat: '14.5995', lng: '120.9842' },
            address: 'Manila, Philippines'
          },
          {
            location: { lat: '14.5764', lng: '121.0851' },
            address: 'Makati, Philippines'
          }
        ]
      };

      await this.getQuote(testQuote);
      
      const responseTime = Date.now() - startTime;

      return {
        status: 'healthy',
        responseTime,
        timestamp: new Date().toISOString(),
        market: this.market,
        baseUrl: this.baseUrl
      };

    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString(),
        market: this.market,
        baseUrl: this.baseUrl
      };
    }
  }

  // Error handler
  _handleApiError(error, context = {}) {
    const errorInfo = {
      timestamp: new Date().toISOString(),
      context,
      request: {
        method: error.config?.method?.toUpperCase(),
        url: error.config?.url,
        headers: this._sanitizeHeaders(error.config?.headers),
        data: error.config?.data ? this._sanitizeRequestData(error.config.data) : null
      },
      response: error.response ? {
        status: error.response.status,
        statusText: error.response.statusText,
        headers: error.response.headers,
        data: error.response.data
      } : null,
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    };

    console.error('Lalamove API Error:', JSON.stringify(errorInfo, null, 2));

    let errorMessage = 'API request failed';
    
    if (error.response?.data?.message) {
      errorMessage = error.response.data.message;
    } else if (error.response?.data?.errors) {
      const errors = error.response.data.errors;
      if (typeof errors === 'object') {
        errorMessage = Object.entries(errors)
          .map(([field, messages]) => `${field}: ${Array.isArray(messages) ? messages.join(', ') : messages}`)
          .join('; ');
      } else {
        errorMessage = errors.toString();
      }
    } else if (error.code === 'ECONNABORTED') {
      errorMessage = 'Request timeout';
    } else if (error.code === 'ECONNREFUSED') {
      errorMessage = 'Connection refused';
    }

    const enhancedError = new Error(errorMessage);
    enhancedError.status = error.response?.status;
    enhancedError.code = error.code;
    enhancedError.context = context;
    enhancedError.response = error.response?.data;
    
    return enhancedError;
  }

  // Sanitize headers
  _sanitizeHeaders(headers) {
    if (!headers) return null;
    
    const sanitized = { ...headers };
    if (sanitized.Authorization) {
      sanitized.Authorization = sanitized.Authorization.split(':')[0] + ':***:***';
    }
    return sanitized;
  }

  // Sanitize data
  _sanitizeRequestData(data) {
    try {
      const parsed = typeof data === 'string' ? JSON.parse(data) : data;
      const sanitized = JSON.parse(JSON.stringify(parsed));
      return sanitized;
    } catch {
      return '[Invalid JSON]';
    }
  }

  // Request logging
  _logRequest(method, url, headers, payload) {
    if (process.env.NODE_ENV === 'production' && !process.env.LALAMOVE_DEBUG) {
      return;
    }

    const colors = this._getLogColors();
    const timestamp = new Date().toISOString();
    
    console.log(`\n${colors.bgBlue}${colors.white}${colors.bright} LALAMOVE API REQUEST ${colors.reset} ${colors.dim}${timestamp}${colors.reset}`);
    console.log(`${colors.blue}${colors.bright}${'➤'.padEnd(3)} ${'Method:'.padEnd(12)}${colors.reset} ${method}`);
    console.log(`${colors.blue}${colors.bright}${'➤'.padEnd(3)} ${'URL:'.padEnd(12)}${colors.reset} ${url}`);
    
    console.log(`\n${colors.cyan}${colors.bright}Headers:${colors.reset}`);
    Object.entries(this._sanitizeHeaders(headers)).forEach(([key, value]) => {
      console.log(`  ${colors.cyan}${key.padEnd(20)}:${colors.reset} ${value}`);
    });
    
    if (payload && Object.keys(payload).length > 0) {
      console.log(`\n${colors.green}${colors.bright}Request Body:${colors.reset}`);
      console.log(JSON.stringify(payload, null, 2));
    }
    
    console.log(`${colors.dim}${'─'.repeat(80)}${colors.reset}`);
  }

  // Response logging
  _logResponse(response) {
    if (process.env.NODE_ENV === 'production' && !process.env.LALAMOVE_DEBUG) {
      return;
    }

    const colors = this._getLogColors();
    const timestamp = new Date().toISOString();
    const isSuccess = response.status < 400;
    
    if (isSuccess) {
      console.log(`\n${colors.bgGreen}${colors.white}${colors.bright} LALAMOVE API RESPONSE ${colors.reset} ${colors.dim}${timestamp}${colors.reset}`);
      console.log(`${colors.green}${colors.bright}${'✓'.padEnd(3)} ${'Status:'.padEnd(10)}${colors.reset} ${response.status} ${response.statusText}`);
    } else {
      console.log(`\n${colors.bgRed}${colors.white}${colors.bright} LALAMOVE API ERROR ${colors.reset} ${colors.dim}${timestamp}${colors.reset}`);
      console.log(`${colors.red}${colors.bright}${'✗'.padEnd(3)} ${'Status:'.padEnd(10)}${colors.reset} ${response.status} ${response.statusText}`);
    }
    
    if (response.data) {
      const colorKey = isSuccess ? 'green' : 'red';
      console.log(`\n${colors[colorKey]}${colors.bright}Response Data:${colors.reset}`);
      console.log(JSON.stringify(response.data, null, 2));
    }
  }

  /**
   * Get console colors for logging
   * @private
   */
  _getLogColors() {
    return {
      reset: '\x1b[0m',
      bright: '\x1b[1m',
      dim: '\x1b[2m',
      red: '\x1b[31m',
      green: '\x1b[32m',
      yellow: '\x1b[33m',
      blue: '\x1b[34m',
      magenta: '\x1b[35m',
      cyan: '\x1b[36m',
      white: '\x1b[37m',
      bgRed: '\x1b[41m',
      bgGreen: '\x1b[42m',
      bgBlue: '\x1b[44m',
    };
  }

  /**
   * Cancel an existing order
   * @param {string} orderId - Order ID to cancel
   * @returns {Promise<Object>} Cancellation response
   */
  async cancelOrder(orderId) {
    return this._retryRequest(async () => {
      try {
        if (!orderId || typeof orderId !== 'string') {
          throw new Error('Valid order ID is required');
        }

        const path = `/v3/orders/${orderId}`;
        const url = `${this.baseUrl}${path}`;
        const { headers } = this._generateAuthHeaders('DELETE', path);

        this._logRequest('DELETE', url, headers, null);

        const response = await axios.delete(url, {
          headers,
          timeout: this.requestTimeout,
          validateStatus: () => true
        });

        this._logResponse(response);

        if (response.status >= 400) {
          throw this._handleApiError(new Error('Cancel Order Failed'), {
            operation: 'cancelOrder',
            orderId,
            status: response.status,
            response: response.data
          });
        }

        return response.data.data || response.data;

      } catch (error) {
        if (error.response) {
          throw this._handleApiError(error, { operation: 'cancelOrder', orderId });
        }
        throw error;
      }
    });
  }
}

module.exports = new LalamoveService();
