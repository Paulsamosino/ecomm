const mongoose = require('mongoose');
require('dotenv').config();
const Order = require('./src/models/Order');

async function linkLalamoveOrders() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    // Get the orders that need Lalamove IDs linked
    const orders = await Order.find({ 
      'delivery.status': 'ASSIGNING_DRIVER',
      'delivery.lalamoveOrderId': { $exists: false }
    }).sort({ createdAt: -1 });
    
    console.log(`\n📦 Found ${orders.length} orders needing Lalamove order IDs`);
    
    // Based on your screenshots, these are the Lalamove order IDs that exist:
    const lalamoveOrderIds = [
      '327467078248423642', // On Going status
      '327467078248423646'  // Rejected status
    ];
    
    if (orders.length > 0 && lalamoveOrderIds.length > 0) {
      console.log('\n🔗 Linking orders to Lalamove order IDs...');
      
      for (let i = 0; i < Math.min(orders.length, lalamoveOrderIds.length); i++) {
        const order = orders[i];
        const lalamoveId = lalamoveOrderIds[i];
        
        console.log(`\n${i + 1}. Linking Order ${order._id} to Lalamove ${lalamoveId}`);
        
        // Update the order with the Lalamove order ID
        order.delivery.lalamoveOrderId = lalamoveId;
        order.delivery.status = 'ON_GOING'; // Set initial status - must match enum values
        order.delivery.lastStatusCheck = new Date();
        
        await order.save();
        
        console.log(`   ✅ Successfully linked!`);
        console.log(`   📊 Order Status: ${order.status}`);
        console.log(`   🚚 Delivery Status: ${order.delivery.status}`);
        console.log(`   🏷️  Lalamove ID: ${order.delivery.lalamoveOrderId}`);
      }
      
      console.log('\n🎉 Linking completed! Now you can test status synchronization.');
      console.log('\nNext steps:');
      console.log('1. Run: node check-delivery-status.js (to verify linking)');
      console.log('2. Test webhook or manual sync to update statuses');
      
    } else {
      console.log('❌ No orders to link or no Lalamove order IDs available');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

linkLalamoveOrders();
