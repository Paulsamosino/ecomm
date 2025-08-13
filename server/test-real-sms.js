require('dotenv').config();

// Temporarily set NODE_ENV to production for testing real SMS
const originalNodeEnv = process.env.NODE_ENV;
process.env.NODE_ENV = 'production';

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
        phone: "+639123456789"  // This will be the seller's phone from their profile
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
    phone: "+639395882712"  // This should be the buyer's phone (your phone number for testing)
  }
};

async function testRealSMS() {
  console.log("🧪 Testing REAL SMS notifications (PRODUCTION MODE)...");
  console.log("📱 SMS Configuration:");
  console.log("   Account SID:", process.env.TWILIO_ACCOUNT_SID ? 'Set' : 'Not Set');
  console.log("   Auth Token:", process.env.TWILIO_AUTH_TOKEN ? 'Set' : 'Not Set');
  console.log("   From Number:", process.env.TWILIO_PHONE_NUMBER || 'Not Set');
  console.log("   Environment:", process.env.NODE_ENV);
  console.log("");

  try {
    console.log("📱 Testing purchase notification SMS (to seller)...");
    console.log(`   Sending to seller phone: ${mockOrder.seller.sellerProfile.location.phone}`);
    const purchaseResult = await sendPurchaseNotification(mockOrder.seller.sellerProfile.location.phone, mockOrder);
    console.log("✅ Purchase notification SMS result:", purchaseResult);
    console.log("");

    console.log("📱 Testing status update SMS (to buyer)...");
    console.log(`   Sending to buyer phone: ${mockOrder.shippingAddress.phone}`);
    const statusResult = await sendOrderStatusUpdate(mockOrder.shippingAddress.phone, mockOrder, 'confirmed');
    console.log("✅ Status update SMS result:", statusResult);
    console.log("");

    console.log("🎉 Real SMS tests completed!");
    console.log("");
    console.log("💡 Check the phone numbers above to see if you received the messages!");

  } catch (error) {
    console.error("❌ Error testing real SMS notifications:", error);
    console.error("Stack trace:", error.stack);
  } finally {
    // Restore original NODE_ENV
    process.env.NODE_ENV = originalNodeEnv;
  }
}

// Show configuration check
if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN || !process.env.TWILIO_PHONE_NUMBER) {
  console.log("❌ Missing Twilio configuration!");
  console.log("Please check your .env file for:");
  console.log("   TWILIO_ACCOUNT_SID");
  console.log("   TWILIO_AUTH_TOKEN");
  console.log("   TWILIO_PHONE_NUMBER");
  process.exit(1);
}

testRealSMS();
