const mongoose = require('mongoose');
require('dotenv').config();
const Order = require('./src/models/Order');

async function checkAllOrders() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    const totalOrders = await Order.countDocuments();
    console.log(`📊 Total orders in database: ${totalOrders}`);
    
    if (totalOrders > 0) {
      const recentOrders = await Order.find()
        .select('_id status shippingAddress delivery createdAt')
        .sort({ createdAt: -1 })
        .limit(5);
      
      console.log('\n📦 Recent orders:');
      console.log('='.repeat(80));
      
      recentOrders.forEach((order, index) => {
        console.log(`${index + 1}. Order ID: ${order._id}`);
        console.log(`   📊 Status: ${order.status}`);
        console.log(`   📅 Created: ${order.createdAt}`);
        console.log(`   🏠 Has Shipping Address: ${!!order.shippingAddress ? 'Yes' : 'No'}`);
        console.log(`   🚚 Has Delivery: ${!!order.delivery ? 'Yes' : 'No'}`);
        if (order.delivery) {
          console.log(`      - Status: ${order.delivery.status || 'N/A'}`);
          console.log(`      - Lalamove ID: ${order.delivery.lalamoveOrderId || 'N/A'}`);
        }
        console.log('-'.repeat(50));
      });
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkAllOrders();
