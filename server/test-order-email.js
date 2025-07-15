require('dotenv').config();
const {
  sendOrderConfirmationEmail,
  sendSellerOrderNotification,
} = require('./src/utils/emailService');

// Mock order data for testing
const mockOrder = {
  _id: "67890abcdef123456789",
  createdAt: new Date(),
  status: "pending",
  totalAmount: 150.00,
  buyer: {
    name: "Test Buyer",
    email: process.env.SMTP_USER, // Send to yourself for testing
  },
  seller: {
    name: "Test Seller", 
    email: process.env.SMTP_USER, // Send to yourself for testing
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
  paymentInfo: {
    platformFee: 3.00,
    method: "paypal",
    transactionId: "TEST123456789"
  },
  delivery: {
    price: {
      amount: 25.00
    }
  },
  shippingAddress: {
    street: "123 Test Street",
    city: "Test City",
    state: "Test State",
    zipCode: "12345",
    country: "Philippines",
    phone: "+639123456789"
  }
};

async function testOrderEmails() {
  console.log("🧪 Testing order email functions...");
  console.log("📧 Test emails will be sent to:", process.env.SMTP_USER);
  console.log("");

  try {
    console.log("📤 Sending buyer confirmation email...");
    await sendOrderConfirmationEmail(mockOrder);
    console.log("✅ Buyer confirmation email test completed");
    console.log("");

    console.log("📤 Sending seller notification email...");
    await sendSellerOrderNotification(mockOrder);
    console.log("✅ Seller notification email test completed");
    console.log("");

    console.log("🎉 All email tests completed successfully!");
    console.log("📥 Check your inbox for the test emails.");

  } catch (error) {
    console.error("❌ Error testing order emails:", error);
    console.error("Stack trace:", error.stack);
  }
}

testOrderEmails();
