#!/usr/bin/env node
/**
 * Utility script to sync all pending delivery statuses
 * Run with: node scripts/syncDeliveryStatus.js
 */

const mongoose = require('mongoose');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

// Import models and services
const Order = require('../src/models/Order');
const lalamoveService = require('../src/services/lalamoveService');

async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ecomm');
    console.log('✓ Connected to MongoDB');
  } catch (error) {
    console.error('✗ MongoDB connection failed:', error.message);
    process.exit(1);
  }
}

async function syncAllPendingDeliveries() {
  try {
    console.log('🔄 Starting delivery status sync...\n');

    const pendingOrders = await Order.find({
      'delivery.lalamoveOrderId': { $exists: true },
      'delivery.status': { $in: ['pending', 'assigning_driver', 'ongoing', 'picked_up'] }
    });

    console.log(`📦 Found ${pendingOrders.length} orders with pending deliveries\n`);

    if (pendingOrders.length === 0) {
      console.log('✅ No pending deliveries to sync');
      return;
    }

    const results = {
      success: 0,
      errors: 0,
      statusChanges: [],
      completedOrders: []
    };

    for (const order of pendingOrders) {
      try {
        console.log(`🔍 Checking order ${order._id} (Lalamove: ${order.delivery.lalamoveOrderId})`);
        
        const status = await lalamoveService.getOrderStatus(order.delivery.lalamoveOrderId);
        
        const oldStatus = order.delivery.status;
        const normalizedStatus = status.status.toLowerCase();
        
        order.delivery.status = normalizedStatus;
        order.delivery.lastStatusCheck = new Date();
        
        if (normalizedStatus === 'completed' && order.status !== 'delivered') {
          order.status = 'delivered';
          order.delivery.completedAt = new Date();
          results.completedOrders.push(order._id.toString());
          console.log(`  🎉 Order marked as DELIVERED`);
        }
        
        await order.save();
        
        if (oldStatus !== normalizedStatus) {
          results.statusChanges.push({
            orderId: order._id.toString(),
            change: `${oldStatus} → ${normalizedStatus}`
          });
          console.log(`  ✅ Status updated: ${oldStatus} → ${normalizedStatus}`);
        } else {
          console.log(`  ➡️  Status unchanged: ${normalizedStatus}`);
        }
        
        results.success++;
        
        // Rate limiting to avoid overwhelming the API
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        console.error(`  ✗ Failed to sync order ${order._id}:`, error.message);
        results.errors++;
      }
    }
    
    console.log('\n📊 Sync Summary:');
    console.log(`✅ Successfully synced: ${results.success}`);
    console.log(`❌ Errors: ${results.errors}`);
    console.log(`🔄 Status changes: ${results.statusChanges.length}`);
    console.log(`🎉 Orders completed: ${results.completedOrders.length}`);

    if (results.statusChanges.length > 0) {
      console.log('\n📝 Status Changes:');
      results.statusChanges.forEach(change => {
        console.log(`  • Order ${change.orderId}: ${change.change}`);
      });
    }

    if (results.completedOrders.length > 0) {
      console.log('\n🎯 Newly Completed Orders:');
      results.completedOrders.forEach(orderId => {
        console.log(`  • ${orderId}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Sync script error:', error);
  }
}

async function main() {
  try {
    await connectDB();
    await syncAllPendingDeliveries();
    
    console.log('\n✅ Sync completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Script failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

// Handle process termination
process.on('SIGINT', async () => {
  console.log('\n⏹️  Script interrupted');
  await mongoose.disconnect();
  process.exit(0);
});

process.on('unhandledRejection', async (error) => {
  console.error('❌ Unhandled rejection:', error);
  await mongoose.disconnect();
  process.exit(1);
});

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { syncAllPendingDeliveries };
