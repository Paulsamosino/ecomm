require('dotenv').config();
const mongoose = require('mongoose');
const deliveryStatusSyncService = require('./src/services/deliveryStatusSyncService');

async function startSyncService() {
  try {
    console.log('🚀 Starting standalone delivery sync service...');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ecommerce', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ Connected to MongoDB');
    console.log('🔄 Starting automatic sync every 30 seconds...\n');
    
    // Start the sync service
    deliveryStatusSyncService.start();
    
    // Keep the process running
    process.on('SIGINT', () => {
      console.log('\n🛑 Shutting down sync service...');
      deliveryStatusSyncService.stop();
      mongoose.disconnect();
      process.exit(0);
    });
    
    console.log('✅ Sync service is running! Press Ctrl+C to stop.');
    console.log('📊 Check your orders - statuses should update automatically every 30 seconds.');
    
  } catch (error) {
    console.error('❌ Failed to start sync service:', error.message);
    process.exit(1);
  }
}

startSyncService();
