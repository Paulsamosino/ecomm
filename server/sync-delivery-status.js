// Automatic delivery status synchronization scheduler
const mongoose = require('mongoose');
require('dotenv').config();
const Order = require('./src/models/Order');
const lalamoveService = require('./src/services/lalamoveService');

class DeliveryStatusSync {
  constructor() {
    this.isRunning = false;
    this.syncInterval = 30 * 1000; // 30 seconds
    this.intervalId = null;
  }

  async start() {
    if (this.isRunning) {
      console.log('⚠️  Status sync is already running');
      return;
    }

    try {
      await mongoose.connect(process.env.MONGODB_URI);
      console.log('✅ Connected to MongoDB');
      
      this.isRunning = true;
      console.log('🚀 Starting automatic delivery status synchronization...');
      console.log(`⏰ Checking for status updates every ${this.syncInterval / 1000} seconds`);
      
      // Run initial sync
      await this.syncDeliveryStatuses();
      
      // Set up recurring sync
      this.intervalId = setInterval(async () => {
        try {
          await this.syncDeliveryStatuses();
        } catch (error) {
          console.error('❌ Sync interval error:', error.message);
        }
      }, this.syncInterval);
      
      console.log('✅ Automatic sync started successfully');
      console.log('💡 Press Ctrl+C to stop');
      
    } catch (error) {
      console.error('❌ Failed to start sync:', error);
      process.exit(1);
    }
  }

  async syncDeliveryStatuses() {
    try {
      // Find orders with active deliveries
      const activeOrders = await Order.find({
        'delivery.lalamoveOrderId': { $exists: true },
        'delivery.status': { 
          $in: ['ASSIGNING_DRIVER', 'ON_GOING', 'PICKED_UP'] 
        }
      });

      if (activeOrders.length === 0) {
        console.log('📋 No active deliveries to sync');
        return;
      }

      console.log(`\n🔄 Syncing ${activeOrders.length} active deliveries...`);

      for (const order of activeOrders) {
        try {
          const lalamoveOrderId = order.delivery.lalamoveOrderId;
          console.log(`   📦 Checking order ${order._id.toString().substr(-8)}... (Lalamove: ${lalamoveOrderId})`);

          // Get current status from Lalamove
          const statusResult = await lalamoveService.getOrderStatus(lalamoveOrderId);
          
          const oldStatus = order.delivery.status;
          const newStatus = statusResult.status?.toUpperCase();
          
          // Map Lalamove status to our enum values
          const statusMapping = {
            'ASSIGNING_DRIVER': 'ASSIGNING_DRIVER',
            'ON_GOING': 'ON_GOING', 
            'PICKED_UP': 'PICKED_UP',
            'COMPLETED': 'COMPLETED',
            'CANCELLED': 'CANCELLED',
            'EXPIRED': 'EXPIRED',
            'REJECTED': 'REJECTED',
            'DRIVER_CANCELLED': 'DRIVER_CANCELLED',
            'SYSTEM_CANCELLED': 'SYSTEM_CANCELLED'
          };
          
          const mappedStatus = statusMapping[newStatus] || newStatus;
          
          if (oldStatus !== mappedStatus) {
            console.log(`   📊 Status changed: ${oldStatus} → ${mappedStatus}`);
            
            // Update delivery status
            order.delivery.status = mappedStatus;
            order.delivery.lastStatusCheck = new Date();
            
            // Update driver info if available
            if (statusResult.driverInfo) {
              order.delivery.driver = {
                name: statusResult.driverInfo.name,
                phone: statusResult.driverInfo.phone,
                plate: statusResult.driverInfo.plateNumber,
                photo: statusResult.driverInfo.photo
              };
              console.log(`   👤 Driver assigned: ${statusResult.driverInfo.name}`);
            }
            
            // Update order status based on delivery status
            if (mappedStatus === 'COMPLETED' && order.status !== 'delivered') {
              order.status = 'delivered';
              order.delivery.completedAt = new Date();
              console.log(`   🎉 Order marked as DELIVERED!`);
            } else if (['EXPIRED', 'CANCELLED', 'REJECTED', 'DRIVER_CANCELLED', 'SYSTEM_CANCELLED'].includes(mappedStatus) && order.status !== 'cancelled') {
              order.status = 'cancelled';
              order.delivery.cancelledAt = new Date();
              console.log(`   ❌ Order marked as CANCELLED (delivery ${mappedStatus.toLowerCase()})`);
            }
            
            await order.save();
            console.log(`   ✅ Order updated successfully`);
            
          } else {
            console.log(`   ⏸️  No status change (still ${oldStatus})`);
          }
          
          // Rate limiting between requests
          await new Promise(resolve => setTimeout(resolve, 500));
          
        } catch (orderError) {
          console.log(`   ❌ Failed to sync order ${order._id}: ${orderError.message}`);
        }
      }
      
      console.log(`✅ Sync completed at ${new Date().toLocaleTimeString()}`);
      
    } catch (error) {
      console.error('❌ Sync error:', error.message);
    }
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    console.log('🛑 Automatic sync stopped');
  }
}

// Handle graceful shutdown
const sync = new DeliveryStatusSync();

process.on('SIGINT', () => {
  console.log('\n📊 Final sync status check...');
  sync.stop();
  mongoose.disconnect();
  process.exit(0);
});

// Start the sync
sync.start().catch(error => {
  console.error('Failed to start sync:', error);
  process.exit(1);
});
