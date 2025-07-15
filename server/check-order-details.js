const mongoose = require('mongoose');
require('dotenv').config();
const Order = require('./src/models/Order');
const User = require('./src/models/User');

async function checkOrderDetails() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    const orders = await Order.find()
      .populate('buyer', 'name phone email address')
      .populate('seller', 'name phone email address sellerProfile')
      .select('_id status shippingAddress delivery createdAt')
      .sort({ createdAt: -1 })
      .limit(2);
    
    console.log('\n📦 Order Details:');
    console.log('='.repeat(100));
    
    orders.forEach((order, index) => {
      console.log(`\n${index + 1}. Order ID: ${order._id}`);
      console.log(`   📊 Status: ${order.status}`);
      console.log(`   📅 Created: ${order.createdAt}`);
      
      console.log(`\n   👤 Buyer: ${order.buyer?.name || 'N/A'}`);
      console.log(`      Phone: ${order.buyer?.phone || 'N/A'}`);
      if (order.buyer?.address) {
        console.log(`      Address: ${order.buyer.address.street}, ${order.buyer.address.city}, ${order.buyer.address.state}`);
      }
      
      console.log(`\n   🏪 Seller: ${order.seller?.name || 'N/A'}`);
      console.log(`      Phone: ${order.seller?.phone || 'N/A'}`);
      if (order.seller?.address) {
        console.log(`      Address: ${order.seller.address.street}, ${order.seller.address.city}, ${order.seller.address.state}`);
      }
      
      console.log(`\n   🚚 Delivery Info:`);
      if (order.delivery) {
        console.log(`      Status: ${order.delivery.status}`);
        console.log(`      Lalamove Order ID: ${order.delivery.lalamoveOrderId || 'MISSING!'}`);
        console.log(`      Error: ${order.delivery.error || 'None'}`);
        console.log(`      Created At: ${order.delivery.createdAt || 'N/A'}`);
        console.log(`      Last Status Check: ${order.delivery.lastStatusCheck || 'Never'}`);
      }
      
      console.log(`\n   📍 Shipping Address:`);
      if (order.shippingAddress) {
        console.log(`      ${order.shippingAddress.street || 'N/A'}`);
        console.log(`      ${order.shippingAddress.city || 'N/A'}, ${order.shippingAddress.state || 'N/A'}`);
        console.log(`      Phone: ${order.shippingAddress.phone || 'N/A'}`);
      }
      
      console.log('='.repeat(100));
    });
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkOrderDetails();
