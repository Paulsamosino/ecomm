const crypto = require('crypto');
const lalamoveService = require('../services/lalamoveService');

// Secure webhook signature validation middleware
const validateLalamoveWebhook = (req, res, next) => {
  // Immediately respond with 200 (best practice for webhooks)
  res.status(200);
  
  try {
    const signature = req.headers['x-lalamove-signature'];
    const timestamp = req.headers['x-request-timestamp'];
    const rawBody = req.rawBody; // Need raw body middleware
    
    if (!signature) {
      console.error('Webhook rejected: Missing signature');
      return res.json({ error: 'Missing signature' });
    }
    
    if (!timestamp) {
      console.error('Webhook rejected: Missing timestamp');
      return res.json({ error: 'Missing timestamp' });
    }
    
    // Validate timestamp to prevent replay attacks (±5 minutes tolerance)
    const requestTime = parseInt(timestamp);
    const currentTime = Date.now();
    const timeDiff = Math.abs(currentTime - requestTime);
    
    if (timeDiff > 5 * 60 * 1000) {
      console.error('Webhook rejected: Timestamp too old/future', { 
        timeDiff: timeDiff / 1000, 
        maxAllowed: 300 
      });
      return res.json({ error: 'Invalid timestamp' });
    }
    
    // Validate signature using timing-safe comparison
    const isValid = lalamoveService.validateWebhookSecure(signature, rawBody, timestamp);
    
    if (!isValid) {
      console.error('Webhook rejected: Invalid signature');
      return res.json({ error: 'Invalid signature' });
    }
    
    // Add webhook event ordering (events may arrive out of order)
    req.webhookTimestamp = requestTime;
    next();
    
  } catch (error) {
    console.error('Webhook validation error:', error);
    return res.json({ error: 'Validation failed' });
  }
};

// Raw body capture middleware (must be before express.json())
const captureRawBody = (req, res, next) => {
  req.rawBody = '';
  req.setEncoding('utf8');
  
  req.on('data', (chunk) => {
    req.rawBody += chunk;
  });
  
  req.on('end', () => {
    next();
  });
};

module.exports = {
  validateLalamoveWebhook,
  captureRawBody
};
