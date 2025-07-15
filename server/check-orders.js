require('dotenv').config();
const mongoose = require('mongoose');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const Order = require('./src/models/Order');

async function checkRecentOrders() {
  try {
    console.log("🔍 Checking recent orders...");
    
    // Get orders from the last 24 hours
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    const recentOrders = await Order.find({
      createdAt: { $gte: yesterday }
    })
    .populate('buyer', 'name email')
    .populate('seller', 'name email')
    .populate('items.product', 'name')
    .sort({ createdAt: -1 })
    .limit(10);

    console.log(`📊 Found ${recentOrders.length} orders in the last 24 hours:`);
    
    if (recentOrders.length === 0) {
      console.log("📭 No recent orders found. This might be why you're not receiving emails.");
      console.log("💡 Try creating a test order through your application to trigger the email.");
    } else {
      recentOrders.forEach((order, index) => {
        console.log(`\n📦 Order ${index + 1}:`);
        console.log(`   ID: ${order._id}`);
        console.log(`   Created: ${order.createdAt}`);
        console.log(`   Status: ${order.status}`);
        console.log(`   Buyer: ${order.buyer?.name} (${order.buyer?.email})`);
        console.log(`   Seller: ${order.seller?.name} (${order.seller?.email})`);
        console.log(`   Items: ${order.items?.length || 0}`);
        console.log(`   Total: ₱${order.totalAmount}`);
      });
    }

    // Get total order count
    const totalOrders = await Order.countDocuments();
    console.log(`\n📈 Total orders in database: ${totalOrders}`);

  } catch (error) {
    console.error("❌ Error checking orders:", error);
  } finally {
    mongoose.disconnect();
    console.log("\n🔌 Database connection closed");
  }
}

checkRecentOrders();
