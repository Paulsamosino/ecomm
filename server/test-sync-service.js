require('dotenv').config();
const mongoose = require('mongoose');
const deliveryStatusSyncService = require('./src/services/deliveryStatusSyncService');

async function testSyncService() {
  try {
    console.log('🔧 Testing delivery status sync service...');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ecommerce', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ Connected to MongoDB');
    
    // Test the sync service
    console.log('\n🔄 Running manual sync test...');
    await deliveryStatusSyncService.syncAllActiveDeliveries();
    
    console.log('\n✅ Sync test completed!');
    
    // Test specific order sync
    const specificOrderId = '687675bbf1000d781196b61d'; // Your order #96b61d
    console.log(`\n🎯 Testing specific order sync for: ${specificOrderId}`);
    
    try {
      const order = await deliveryStatusSyncService.syncSpecificOrder(specificOrderId);
      console.log('✅ Specific order sync successful');
      console.log('📦 Order details:');
      console.log(`   - ID: ${order._id}`);
      console.log(`   - Status: ${order.status}`);
      console.log(`   - Delivery Status: ${order.delivery?.status}`);
      console.log(`   - Lalamove ID: ${order.delivery?.lalamoveOrderId}`);
      console.log(`   - Last Check: ${order.delivery?.lastStatusCheck}`);
    } catch (error) {
      console.error('❌ Specific order sync failed:', error.message);
    }
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

testSyncService();
