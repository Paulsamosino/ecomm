const cron = require('node-cron');
const mongoose = require('mongoose');
const Order = require('../models/Order');
const lalamoveService = require('../services/lalamoveService');

class DeliveryStatusSyncService {
  constructor() {
    this.isRunning = false;
    this.cronJob = null;
  }

  // Start the automated sync service
  start() {
    if (this.isRunning) {
      console.log('🔄 Delivery sync service is already running');
      return;
    }

    console.log('🚀 Starting automatic delivery status sync service...');
    
    // Run every 30 seconds to sync delivery statuses
    this.cronJob = cron.schedule('*/30 * * * * *', async () => {
      await this.syncAllActiveDeliveries();
    }, {
      scheduled: false
    });

    this.cronJob.start();
    this.isRunning = true;
    
    console.log('✅ Delivery sync service started (runs every 30 seconds)');
    
    // Run an initial sync immediately
    this.syncAllActiveDeliveries();
  }

  // Stop the automated sync service
  stop() {
    if (this.cronJob) {
      this.cronJob.stop();
      this.cronJob = null;
    }
    this.isRunning = false;
    console.log('🛑 Delivery sync service stopped');
  }

  // Sync all active deliveries
  async syncAllActiveDeliveries() {
    try {
      // Find orders with active deliveries that need status updates
      const activeOrders = await Order.find({
        'delivery.lalamoveOrderId': { $exists: true },
        'delivery.status': { 
          $in: ['ASSIGNING_DRIVER', 'ON_GOING', 'PICKED_UP'] 
        }
      });

      if (activeOrders.length === 0) {
        return; // No orders to sync
      }

      console.log(`\n🔄 [${new Date().toLocaleTimeString()}] Syncing ${activeOrders.length} active deliveries...`);

      let updatedCount = 0;
      for (const order of activeOrders) {
        const wasUpdated = await this.syncSingleOrder(order);
        if (wasUpdated) updatedCount++;
        
        // Rate limiting - wait 500ms between requests
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      if (updatedCount > 0) {
        console.log(`✅ Updated ${updatedCount} orders with new statuses`);
      } else {
        console.log(`⏸️  No status changes detected`);
      }

    } catch (error) {
      console.error('❌ Sync error:', error.message);
    }
  }

  // Sync a single order's delivery status
  async syncSingleOrder(order) {
    try {
      const lalamoveOrderId = order.delivery.lalamoveOrderId;
      
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
      
      // Always update lastStatusCheck, even if status didn't change
      order.delivery.lastStatusCheck = new Date();
      
      if (oldStatus !== mappedStatus) {
        console.log(`   📦 Order ${order._id.toString().substr(-8)}: ${oldStatus} → ${mappedStatus}`);
        
        // Update delivery status
        order.delivery.status = mappedStatus;
        
        // Update driver info if available
        if (statusResult.driverInfo) {
          order.delivery.driver = {
            name: statusResult.driverInfo.name,
            phone: statusResult.driverInfo.phone,
            plate: statusResult.driverInfo.plateNumber,
            photo: statusResult.driverInfo.photo
          };
          console.log(`   👤 Driver: ${statusResult.driverInfo.name}`);
        }
        
        // Update order status based on delivery status
        if (mappedStatus === 'COMPLETED' && order.status !== 'delivered') {
          order.status = 'delivered';
          order.delivery.completedAt = new Date();
          console.log(`   🎉 Order marked as DELIVERED!`);
        } else if (mappedStatus === 'ON_GOING' && order.status === 'pending') {
          order.status = 'processing';
          console.log(`   📤 Order marked as PROCESSING (delivery in progress)`);
        } else if (mappedStatus === 'PICKED_UP' && order.status !== 'shipped') {
          order.status = 'shipped';
          console.log(`   📦 Order marked as SHIPPED (package picked up)`);
        } else if (['EXPIRED', 'CANCELLED', 'REJECTED', 'DRIVER_CANCELLED', 'SYSTEM_CANCELLED'].includes(mappedStatus) && order.status !== 'cancelled') {
          // Cancel the order and restore inventory
          await order.cancel(`Delivery ${mappedStatus.toLowerCase()}`);
          order.delivery.cancelledAt = new Date();
          console.log(`   ❌ Order marked as CANCELLED (delivery ${mappedStatus.toLowerCase()}) - inventory restored`);
          // order.cancel() already saves, so skip the save below
          return true;
        }
        
        await order.save();
        return true; // Status was updated
      } else {
        // No status change, but still save the lastStatusCheck
        await order.save();
        return false; // No status change
      }
      
    } catch (error) {
      console.error(`   ❌ Failed to sync order ${order._id}: ${error.message}`);
      return false;
    }
  }

  // Manual sync for a specific order (for testing)
  async syncSpecificOrder(orderId) {
    try {
      const order = await Order.findById(orderId);
      if (!order || !order.delivery?.lalamoveOrderId) {
        throw new Error('Order not found or has no Lalamove delivery');
      }

      console.log(`🔄 Manually syncing order ${orderId}...`);
      const wasUpdated = await this.syncSingleOrder(order);
      
      if (wasUpdated) {
        console.log('✅ Order status updated successfully');
      } else {
        console.log('⏸️  No status change needed');
      }

      return order;
    } catch (error) {
      console.error('❌ Manual sync failed:', error.message);
      throw error;
    }
  }
}

module.exports = new DeliveryStatusSyncService();
