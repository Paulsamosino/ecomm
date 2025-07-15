const mongoose = require('mongoose');
require('dotenv').config();
const Order = require('./src/models/Order');
const lalamoveService = require('./src/services/lalamoveService');

async function testDirectSync() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    // Get the orders with Lalamove IDs
    const orders = await Order.find({ 'delivery.lalamoveOrderId': { $exists: true } });
    console.log(`\n📦 Found ${orders.length} orders with Lalamove delivery`);
    
    for (const order of orders) {
      console.log(`\n🔄 Checking status for Order ${order._id}`);
      console.log(`   Lalamove ID: ${order.delivery.lalamoveOrderId}`);
      console.log(`   Current Status: ${order.delivery.status}`);
      
      try {
        // Test if we can get the status from Lalamove
        console.log('   📡 Calling Lalamove API...');
        const statusResult = await lalamoveService.getOrderStatus(order.delivery.lalamoveOrderId);
        
        console.log('   ✅ Lalamove Response:');
        console.log(`      Status: ${statusResult.status}`);
        console.log(`      Driver: ${statusResult.driverInfo?.name || 'Not assigned'}`);
        console.log(`      Price: ${statusResult.priceBreakdown?.totalFee || 'N/A'}`);
        
        // Update the order with the real status
        const oldStatus = order.delivery.status;
        const normalizedStatus = statusResult.status?.toUpperCase() || 'UNKNOWN';
        
        // Map Lalamove status to our enum values
        const statusMapping = {
          'ASSIGNING_DRIVER': 'ASSIGNING_DRIVER',
          'ON_GOING': 'ON_GOING', 
          'PICKED_UP': 'PICKED_UP',
          'COMPLETED': 'COMPLETED',
          'CANCELLED': 'CANCELLED',
          'EXPIRED': 'EXPIRED',
          'REJECTED': 'REJECTED'
        };
        
        const mappedStatus = statusMapping[normalizedStatus] || 'ON_GOING';
        
        order.delivery.status = mappedStatus;
        order.delivery.lastStatusCheck = new Date();
        
        // Update order status if delivery is completed
        if (mappedStatus === 'COMPLETED' && order.status !== 'delivered') {
          order.status = 'delivered';
          order.delivery.completedAt = new Date();
          console.log('   🎉 Order marked as delivered!');
        }
        
        await order.save();
        
        console.log(`   📊 Status Updated: ${oldStatus} → ${mappedStatus}`);
        
      } catch (apiError) {
        console.log(`   ❌ Lalamove API Error: ${apiError.message}`);
        console.log('      This might be expected if the order was created outside the system');
      }
      
      console.log('   ' + '-'.repeat(50));
    }
    
    console.log('\n🎉 Direct sync completed! Check your order interface now.');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

testDirectSync();
