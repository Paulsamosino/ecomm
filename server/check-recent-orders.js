require('dotenv').config();
const mongoose = require('mongoose');

// Import models
const Order = require('./src/models/Order');

async function checkRecentOrders() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    // Find recent orders (last 24 hours)
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentOrders = await Order.find({
      createdAt: { $gte: yesterday }
    })
    .populate('buyer', 'name email phone')
    .populate('seller', 'name email phone sellerProfile')
    .sort({ createdAt: -1 })
    .limit(10);

    console.log(`\n📦 Found ${recentOrders.length} recent orders:`);
    console.log("=" * 80);

    if (recentOrders.length === 0) {
      console.log("No recent orders found. Try placing a test order.");
      return;
    }

    recentOrders.forEach((order, index) => {
      console.log(`\n${index + 1}. Order #${order._id.toString().slice(-6)}`);
      console.log(`   Created: ${order.createdAt}`);
      console.log(`   Status: ${order.status}`);
      console.log(`   Total: ₱${order.totalAmount}`);
      
      console.log(`\n   👤 Buyer: ${order.buyer?.name || 'N/A'}`);
      console.log(`      Email: ${order.buyer?.email || 'N/A'}`);
      console.log(`      Phone: ${order.buyer?.phone || 'N/A'}`);
      
      console.log(`\n   🏪 Seller: ${order.seller?.name || 'N/A'}`);
      console.log(`      Email: ${order.seller?.email || 'N/A'}`);
      console.log(`      Phone: ${order.seller?.phone || 'N/A'}`);
      console.log(`      Profile Phone: ${order.seller?.sellerProfile?.location?.phone || 'N/A'}`);
      
      console.log(`\n   📍 Shipping Address:`);
      if (order.shippingAddress) {
        console.log(`      Street: ${order.shippingAddress.street}`);
        console.log(`      City: ${order.shippingAddress.city}, ${order.shippingAddress.state}`);
        console.log(`      📞 BUYER PHONE: ${order.shippingAddress.phone || '❌ MISSING!'}`);
      } else {
        console.log(`      ❌ No shipping address found!`);
      }
      
      console.log(`\n   📱 SMS Notification Status:`);
      console.log(`      ✅ Seller has phone in profile: ${order.seller?.sellerProfile?.location?.phone ? 'YES' : '❌ NO'}`);
      console.log(`      ✅ Buyer has phone in shipping: ${order.shippingAddress?.phone ? 'YES' : '❌ NO'}`);
      
      console.log("-".repeat(50));
    });

    console.log(`\n💡 SMS Notification Analysis:`);
    console.log(`   • Buyers get SMS if shippingAddress.phone exists`);
    console.log(`   • Sellers get SMS if sellerProfile.location.phone exists`);
    console.log(`   • Check above to see if phone numbers are missing`);

  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await mongoose.disconnect();
  }
}

checkRecentOrders();
