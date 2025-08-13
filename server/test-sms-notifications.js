require('dotenv').config();
const {
  sendPurchaseNotification,
  sendOrderStatusUpdate,
  sendDeliveryNotification
} = require('./src/utils/smsService');

// Mock order data for testing
const mockOrder = {
  _id: "test123456789abcdef",
  createdAt: new Date(),
  status: "pending",
  totalAmount: 150.00,
  buyer: {
    name: "Test Buyer",
    email: "testbuyer@example.com",
  },
  seller: {
    name: "Test Seller", 
    email: "testseller@example.com",
    sellerProfile: {
      location: {
        phone: "+639123456789"
      }
    }
  },
  items: [
    {
      product: {
        name: "Rhode Island Red Chicks"
      },
      quantity: 10,
      price: 12.50
    },
    {
      product: {
        name: "Feed Supplement"
      },
      quantity: 2,
      price: 12.50
    }
  ],
  shippingAddress: {
    street: "123 Test Street",
    city: "Test City",
    state: "Test State",
    zipCode: "12345",
    country: "Philippines",
    phone: "+639123456789"
  }
};

async function testSMSNotifications() {
  console.log("🧪 Testing SMS notification functions...");
  console.log("📱 SMS Configuration:");
  console.log("   Account SID:", process.env.TWILIO_ACCOUNT_SID ? 'Set' : 'Not Set');
  console.log("   Auth Token:", process.env.TWILIO_AUTH_TOKEN ? 'Set' : 'Not Set');
  console.log("   From Number:", process.env.TWILIO_PHONE_NUMBER || 'Not Set');
  console.log("   Environment:", process.env.NODE_ENV || 'development');
  console.log("");

  try {
    console.log("TEST 1: 📱 Testing purchase notification SMS...");
    const sellerPhone = mockOrder.seller.sellerProfile.location.phone;
    console.log(`   Sending to seller phone: ${sellerPhone}`);
    const purchaseResult = await sendPurchaseNotification(sellerPhone, mockOrder);
    console.log("   RESULT:", JSON.stringify(purchaseResult, null, 2));
    console.log("=".repeat(80));

    console.log("TEST 2: 📱 Testing status update SMS...");
    const buyerPhone = mockOrder.shippingAddress.phone;
    console.log(`   Sending to buyer phone: ${buyerPhone}`);
    const statusResult = await sendOrderStatusUpdate(buyerPhone, mockOrder, 'shipped');
    console.log("   RESULT:", JSON.stringify(statusResult, null, 2));
    console.log("=".repeat(80));

    console.log("TEST 3: 📱 Testing delivery notification SMS...");
    const trackingNumber = 'TRK123456789';
    console.log(`   Tracking number: ${trackingNumber}`);
    const deliveryResult = await sendDeliveryNotification(buyerPhone, mockOrder, trackingNumber);
    console.log("   RESULT:", JSON.stringify(deliveryResult, null, 2));
    console.log("=".repeat(80));

    console.log("🎉 All SMS tests completed!");

    if (process.env.NODE_ENV === 'development') {
      console.log("");
      console.log("💡 Development Mode Notes:");
      console.log("   - SMS messages are simulated (not actually sent)");
      console.log("   - Set NODE_ENV=production to send real SMS messages");
      console.log("   - Make sure your Twilio credentials are correct");
    }

  } catch (error) {
    console.error("❌ Error testing SMS notifications:", error);
    console.error("Stack trace:", error.stack);
  }
}

// Show setup instructions if credentials are missing
if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
  console.log("⚠️  SMS SERVICE SETUP REQUIRED ⚠️");
  console.log("");
  console.log("To enable SMS notifications, you need to:");
  console.log("1. Sign up for a Twilio account at https://www.twilio.com");
  console.log("2. Get your Account SID and Auth Token from the Twilio Console");
  console.log("3. Purchase a Twilio phone number");
  console.log("4. Add these to your .env file:");
  console.log("");
  console.log("   TWILIO_ACCOUNT_SID=your_account_sid_here");
  console.log("   TWILIO_AUTH_TOKEN=your_auth_token_here");
  console.log("   TWILIO_PHONE_NUMBER=+1234567890");
  console.log("   SELLER_PHONE_NUMBER=+639123456789");
  console.log("");
  console.log("5. Run this test again to verify the setup");
  console.log("");
}

testSMSNotifications();
