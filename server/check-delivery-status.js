const mongoose = require('mongoose');
require('dotenv').config();
const Order = require('./src/models/Order');

async function checkOrders() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    const orders = await Order.find({ 'delivery.lalamoveOrderId': { $exists: true } })
      .select('_id status delivery.status delivery.lalamoveOrderId delivery.lastStatusCheck delivery.lastWebhookUpdate')
      .limit(10);
    
    console.log('\n📦 Orders with Lalamove delivery:');
    console.log('='.repeat(80));
    
    if (orders.length === 0) {
      console.log('❌ No orders with Lalamove delivery found');
    } else {
      orders.forEach((order, index) => {
        console.log(`${index + 1}. Order ID: ${order._id}`);
        console.log(`   📊 Order Status: ${order.status}`);
        console.log(`   🚚 Delivery Status: ${order.delivery.status}`);
        console.log(`   🏷️  Lalamove ID: ${order.delivery.lalamoveOrderId}`);
        console.log(`   🕐 Last Status Check: ${order.delivery.lastStatusCheck || 'Never'}`);
        console.log(`   📨 Last Webhook: ${order.delivery.lastWebhookUpdate || 'Never'}`);
        console.log('-'.repeat(50));
      });
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkOrders();
