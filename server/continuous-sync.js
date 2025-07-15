require('dotenv').config();
const mongoose = require('mongoose');
const deliveryStatusSyncService = require('./src/services/deliveryStatusSyncService');

async function runContinuousSync() {
  try {
    console.log('🔄 Starting continuous delivery status sync...');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ Connected to MongoDB');
    
    // Function to run sync
    const runSync = async () => {
      console.log(`\n⏰ [${new Date().toLocaleTimeString()}] Running delivery sync...`);
      try {
        await deliveryStatusSyncService.syncAllActiveDeliveries();
      } catch (error) {
        console.error('❌ Sync error:', error.message);
      }
    };
    
    // Run initial sync
    await runSync();
    
    // Run sync every 30 seconds
    const interval = setInterval(runSync, 30000);
    
    console.log('\n✅ Continuous sync running every 30 seconds');
    console.log('📱 Your seller dashboard will now show real-time delivery status updates!');
    console.log('🛑 Press Ctrl+C to stop\n');
    
    // Graceful shutdown
    process.on('SIGINT', () => {
      console.log('\n🛑 Shutting down continuous sync...');
      clearInterval(interval);
      mongoose.disconnect();
      process.exit(0);
    });
    
  } catch (error) {
    console.error('❌ Failed to start continuous sync:', error.message);
    process.exit(1);
  }
}

runContinuousSync();
