const mongoose = require('mongoose');
require('dotenv').config();
const Order = require('./src/models/Order');
const lalamoveService = require('./src/services/lalamoveService');

async function testStatusSync() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    // Get the order with the real Lalamove ID
    const order = await Order.findOne({ 
      'delivery.lalamoveOrderId': '3274670782483423678' 
    });
    
    if (!order) {
      console.log('❌ Order not found');
      process.exit(1);
    }
    
    console.log('\n📦 Current Order Status:');
    console.log(`   Order ID: ${order._id}`);
    console.log(`   Order Status: ${order.status}`);
    console.log(`   Delivery Status: ${order.delivery.status}`);
    console.log(`   Lalamove ID: ${order.delivery.lalamoveOrderId}`);
    
    console.log('\n🔄 Checking status from Lalamove...');
    
    try {
      const statusResult = await lalamoveService.getOrderStatus(order.delivery.lalamoveOrderId);
      
      console.log('\n✅ Lalamove Response:');
      console.log(`   Status: ${statusResult.status}`);
      console.log(`   Driver: ${statusResult.driverInfo?.name || 'Not assigned yet'}`);
      console.log(`   Share Link: ${statusResult.shareLink || 'N/A'}`);
      
      const oldStatus = order.delivery.status;
      const newStatus = statusResult.status?.toUpperCase();
      
      if (oldStatus !== newStatus) {
        console.log(`\n📊 Status Update: ${oldStatus} → ${newStatus}`);
        
        // Update the order
        order.delivery.status = newStatus;
        order.delivery.lastStatusCheck = new Date();
        
        if (statusResult.driverInfo) {
          order.delivery.driver = {
            name: statusResult.driverInfo.name,
            phone: statusResult.driverInfo.phone,
            plate: statusResult.driverInfo.plateNumber,
            photo: statusResult.driverInfo.photo
          };
        }
        
        if (newStatus === 'COMPLETED' && order.status !== 'delivered') {
          order.status = 'delivered';
          order.delivery.completedAt = new Date();
          console.log('🎉 Order marked as DELIVERED!');
        }
        
        await order.save();
        console.log('✅ Order updated in database');
        
      } else {
        console.log(`\n⏸️  No status change needed (still ${oldStatus})`);
      }
      
      console.log('\n📱 IMPORTANT: Check your order interface now!');
      console.log('🔄 The status should now reflect the current Lalamove delivery status.');
      console.log('💡 This process will automatically happen via webhooks or scheduled syncs.');
      
    } catch (apiError) {
      console.log(`\n❌ Lalamove API Error: ${apiError.message}`);
      console.log('This could mean:');
      console.log('1. The delivery order is very new and not yet in the system');
      console.log('2. There might be an API configuration issue');
      console.log('3. The order might have been cancelled or expired');
    }
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

testStatusSync();
