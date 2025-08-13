const twilio = require('twilio');

// Twilio configuration
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

// Function to get Twilio client (lazy initialization)
const getTwilioClient = () => {
  if (!accountSid || !authToken) {
    return null;
  }
  
  try {
    return twilio(accountSid, authToken);
  } catch (error) {
    console.error("❌ Error initializing Twilio client:", error.message);
    return null;
  }
};

// Test SMS configuration
const testSMSConfig = async () => {
  if (!accountSid || !authToken) {
    console.log("⚠️ Twilio credentials not found - SMS service disabled");
    return;
  }

  try {
    console.log("🔧 Testing SMS configuration...");
    const client = getTwilioClient();
    if (client) {
      console.log("✅ SMS service is ready");
    }
  } catch (error) {
    console.error("❌ SMS configuration error:", error.message);
  }
};

// Call test function
testSMSConfig();

// Send purchase notification to seller
const sendPurchaseNotification = async (phoneNumber, order) => {
  console.log(`\n🚀 SMS SERVICE: Starting purchase notification`);
  console.log(`   Target Phone: ${phoneNumber}`);
  console.log(`   Order ID: ${order._id}`);
  console.log(`   Order Total: ₱${order.totalAmount}`);
  console.log(`   Buyer: ${order.buyer.name}`);

  // Get Twilio client
  const client = getTwilioClient();
  
  // Check if SMS is configured
  if (!client || !fromPhoneNumber) {
    console.log("⚠️ SMS not configured - skipping purchase notification");
    console.log(`   Client exists: ${!!client}`);
    console.log(`   From number configured: ${!!fromPhoneNumber}`);
    return { status: 'skipped', reason: 'SMS not configured' };
  }

  // Check if development mode
  const isDevelopment = process.env.NODE_ENV === 'development';
  if (isDevelopment) {
    console.log('📱 DEV MODE - SMS would be sent to:', phoneNumber);
    const messageContent = `🛒 New Order Alert!\nOrder #${order._id.toString().slice(-6)}\nTotal: ₱${order.totalAmount}\nBuyer: ${order.buyer.name}\nItems: ${order.items.length} item(s)\n\nCheck your dashboard for details.`;
    console.log('📄 Message content:');
    console.log('   ---MESSAGE START---');
    console.log(`   ${messageContent.replace(/\n/g, '\n   ')}`);
    console.log('   ---MESSAGE END---');
    return { status: 'development', sid: 'dev-mode-message' };
  }

  try {
    const message = `🛒 New Order Alert!
Order #${order._id.toString().slice(-6)}
Total: ₱${order.totalAmount.toFixed(2)}
Buyer: ${order.buyer.name}
Items: ${order.items.length} item(s)

Check your dashboard for details.`.trim();

    console.log(`📱 PRODUCTION MODE - Sending SMS via Twilio`);
    console.log(`   From: ${fromPhoneNumber}`);
    console.log(`   To: ${phoneNumber}`);
    console.log('   Message:');
    console.log('   ---MESSAGE START---');
    console.log(`   ${message.replace(/\n/g, '\n   ')}`);
    console.log('   ---MESSAGE END---');
    
    const startTime = Date.now();
    const result = await client.messages.create({
      body: message,
      from: fromPhoneNumber,
      to: phoneNumber
    });
    const endTime = Date.now();

    console.log(`✅ SMS SENT SUCCESSFULLY! (${endTime - startTime}ms)`);
    console.log(`   Message SID: ${result.sid}`);
    console.log(`   Status: ${result.status}`);
    console.log(`   Price: ${result.price || 'N/A'}`);
    console.log(`   Direction: ${result.direction}`);
    console.log(`   Date Created: ${result.dateCreated}`);
    console.log(`   Account SID: ${result.accountSid}`);
    
    return { 
      status: 'sent', 
      sid: result.sid,
      twilioStatus: result.status,
      price: result.price,
      timeTaken: endTime - startTime
    };
  } catch (error) {
    console.error('❌ SMS SEND FAILED!');
    console.error(`   Error: ${error.message}`);
    
    // Log specific Twilio errors with more detail
    if (error.code) {
      console.error(`   Twilio Error Code: ${error.code}`);
      console.error(`   More Info: ${error.moreInfo || 'N/A'}`);
      console.error(`   Status: ${error.status || 'N/A'}`);
    }
    
    console.error(`   Full error:`, error);
    
    return { 
      status: 'failed', 
      error: error.message,
      errorCode: error.code,
      errorStatus: error.status
    };
  }
};

// Send order status update to buyer
const sendOrderStatusUpdate = async (phoneNumber, order, status) => {
  console.log(`\n🚀 SMS SERVICE: Starting status update notification`);
  console.log(`   Target Phone: ${phoneNumber}`);
  console.log(`   Order ID: ${order._id}`);
  console.log(`   New Status: ${status}`);
  console.log(`   Order Total: ₱${order.totalAmount}`);

  // Get Twilio client
  const client = getTwilioClient();
  
  // Check if SMS is configured
  if (!client || !fromPhoneNumber) {
    console.log("⚠️ SMS not configured - skipping status update");
    console.log(`   Client exists: ${!!client}`);
    console.log(`   From number configured: ${!!fromPhoneNumber}`);
    return { status: 'skipped', reason: 'SMS not configured' };
  }

  // Check if development mode
  const isDevelopment = process.env.NODE_ENV === 'development';
  if (isDevelopment) {
    console.log('📱 DEV MODE - Status SMS would be sent to:', phoneNumber);
    const messageContent = `📦 Order Update\nOrder #${order._id.toString().slice(-6)}\nStatus: ${status}\nTotal: ₱${order.totalAmount.toFixed(2)}\n\nThank you for your business!`;
    console.log('📄 Message content:');
    console.log('   ---MESSAGE START---');
    console.log(`   ${messageContent.replace(/\n/g, '\n   ')}`);
    console.log('   ---MESSAGE END---');
    return { status: 'development', sid: 'dev-mode-message' };
  }

  try {
    const message = `📦 Order Update
Order #${order._id.toString().slice(-6)}
Status: ${status}
Total: ₱${order.totalAmount.toFixed(2)}

Thank you for your business!`.trim();

    console.log(`📱 PRODUCTION MODE - Sending status SMS via Twilio`);
    console.log(`   From: ${fromPhoneNumber}`);
    console.log(`   To: ${phoneNumber}`);
    console.log('   Message:');
    console.log('   ---MESSAGE START---');
    console.log(`   ${message.replace(/\n/g, '\n   ')}`);
    console.log('   ---MESSAGE END---');

    const startTime = Date.now();
    const result = await client.messages.create({
      body: message,
      from: fromPhoneNumber,
      to: phoneNumber
    });
    const endTime = Date.now();

    console.log(`✅ STATUS SMS SENT SUCCESSFULLY! (${endTime - startTime}ms)`);
    console.log(`   Message SID: ${result.sid}`);
    console.log(`   Status: ${result.status}`);
    console.log(`   Price: ${result.price || 'N/A'}`);
    console.log(`   Direction: ${result.direction}`);
    console.log(`   Date Created: ${result.dateCreated}`);
    
    return { 
      status: 'sent', 
      sid: result.sid,
      twilioStatus: result.status,
      price: result.price,
      timeTaken: endTime - startTime
    };
  } catch (error) {
    console.error('❌ STATUS SMS SEND FAILED!');
    console.error(`   Error: ${error.message}`);
    
    // Log specific Twilio errors
    if (error.code) {
      console.error(`   Twilio Error Code: ${error.code}`);
      console.error(`   More Info: ${error.moreInfo || 'N/A'}`);
      console.error(`   Status: ${error.status || 'N/A'}`);
    }
    
    console.error(`   Full error:`, error);
    
    return { 
      status: 'failed', 
      error: error.message,
      errorCode: error.code,
      errorStatus: error.status
    };
  }
};

// Send delivery notification
const sendDeliveryNotification = async (phoneNumber, order, trackingNumber) => {
  console.log(`\n🚀 SMS SERVICE: Starting delivery notification`);
  console.log(`   Target Phone: ${phoneNumber}`);
  console.log(`   Order ID: ${order._id}`);
  console.log(`   Tracking Number: ${trackingNumber}`);

  // Get Twilio client
  const client = getTwilioClient();
  
  // Check if SMS is configured
  if (!client || !fromPhoneNumber) {
    console.log("⚠️ SMS not configured - skipping delivery notification");
    console.log(`   Client exists: ${!!client}`);
    console.log(`   From number configured: ${!!fromPhoneNumber}`);
    return { status: 'skipped', reason: 'SMS not configured' };
  }

  // Check if development mode
  const isDevelopment = process.env.NODE_ENV === 'development';
  if (isDevelopment) {
    console.log('📱 DEV MODE - Delivery SMS would be sent to:', phoneNumber);
    const messageContent = `🚚 Your order has shipped!\nOrder #${order._id.toString().slice(-6)}\nTracking: ${trackingNumber}\n\nYour order is on its way!`;
    console.log('📄 Message content:');
    console.log('   ---MESSAGE START---');
    console.log(`   ${messageContent.replace(/\n/g, '\n   ')}`);
    console.log('   ---MESSAGE END---');
    return { status: 'development', sid: 'dev-mode-message' };
  }

  try {
    const message = `🚚 Your order has shipped!
Order #${order._id.toString().slice(-6)}
Tracking: ${trackingNumber}

Your order is on its way!`.trim();

    console.log(`📱 PRODUCTION MODE - Sending delivery SMS via Twilio`);
    console.log(`   From: ${fromPhoneNumber}`);
    console.log(`   To: ${phoneNumber}`);
    console.log('   Message:');
    console.log('   ---MESSAGE START---');
    console.log(`   ${message.replace(/\n/g, '\n   ')}`);
    console.log('   ---MESSAGE END---');

    const startTime = Date.now();
    const result = await client.messages.create({
      body: message,
      from: fromPhoneNumber,
      to: phoneNumber
    });
    const endTime = Date.now();

    console.log(`✅ DELIVERY SMS SENT SUCCESSFULLY! (${endTime - startTime}ms)`);
    console.log(`   Message SID: ${result.sid}`);
    console.log(`   Status: ${result.status}`);
    console.log(`   Price: ${result.price || 'N/A'}`);
    console.log(`   Direction: ${result.direction}`);
    console.log(`   Date Created: ${result.dateCreated}`);
    
    return { 
      status: 'sent', 
      sid: result.sid,
      twilioStatus: result.status,
      price: result.price,
      timeTaken: endTime - startTime
    };
  } catch (error) {
    console.error('❌ DELIVERY SMS SEND FAILED!');
    console.error(`   Error: ${error.message}`);
    
    // Log specific Twilio errors
    if (error.code) {
      console.error(`   Twilio Error Code: ${error.code}`);
      console.error(`   More Info: ${error.moreInfo || 'N/A'}`);
      console.error(`   Status: ${error.status || 'N/A'}`);
    }
    
    console.error(`   Full error:`, error);
    
    return { 
      status: 'failed', 
      error: error.message,
      errorCode: error.code,
      errorStatus: error.status
    };
  }
};

module.exports = {
  sendPurchaseNotification,
  sendOrderStatusUpdate,
  sendDeliveryNotification
};
