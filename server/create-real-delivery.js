const mongoose = require('mongoose');
require('dotenv').config();
const Order = require('./src/models/Order');
const User = require('./src/models/User');
const deliveryController = require('./src/controllers/deliveryController');

async function createRealDelivery() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    // Clear the existing fake Lalamove order IDs first
    console.log('🔄 Clearing fake Lalamove order IDs...');
    await Order.updateMany(
      { 'delivery.lalamoveOrderId': { $in: ['327467078248423642', '327467078248423646'] } },
      { 
        $unset: { 'delivery.lalamoveOrderId': '' },
        $set: { 'delivery.status': 'pending' }
      }
    );
    
    // Get an order that needs delivery
    const order = await Order.findOne({ 
      status: 'pending',
      'delivery': { $exists: true }
    })
    .populate('buyer', 'name phone email address')
    .populate('seller', 'name phone email address sellerProfile');
    
    if (!order) {
      console.log('❌ No orders found that need delivery creation');
      process.exit(0);
    }
    
    console.log('📦 Found order to create delivery for:');
    console.log(`   Order ID: ${order._id}`);
    console.log(`   Buyer: ${order.buyer?.name} (${order.buyer?.phone})`);
    console.log(`   Seller: ${order.seller?.name} (${order.seller?.phone})`);
    console.log(`   Shipping Address: ${order.shippingAddress?.street}, ${order.shippingAddress?.city}`);
    
    console.log('\n🚚 Creating Lalamove delivery...');
    
    try {
      // Use the delivery controller to create a real delivery
      const deliveryResult = await deliveryController.autoCreateDelivery(order);
      
      console.log('✅ Delivery created successfully!');
      console.log('   Lalamove Order ID:', deliveryResult.lalamoveOrderId);
      console.log('   Status:', deliveryResult.status);
      console.log('   Price:', deliveryResult.price);
      
      // Refresh the order from database
      const updatedOrder = await Order.findById(order._id);
      console.log('\n📊 Updated Order Status:');
      console.log(`   Order Status: ${updatedOrder.status}`);
      console.log(`   Delivery Status: ${updatedOrder.delivery.status}`);
      console.log(`   Lalamove ID: ${updatedOrder.delivery.lalamoveOrderId}`);
      
      console.log('\n🎉 Success! Now the order status will automatically sync with Lalamove.');
      console.log('💡 The status will update via webhooks or manual sync as the delivery progresses.');
      
    } catch (deliveryError) {
      console.log('❌ Failed to create delivery:', deliveryError.message);
      
      console.log('\n🔧 Checking order data for issues...');
      console.log('Buyer address:', JSON.stringify(order.buyer?.address, null, 2));
      console.log('Seller address:', JSON.stringify(order.seller?.address, null, 2));
      console.log('Seller location:', JSON.stringify(order.seller?.sellerProfile?.location, null, 2));
      console.log('Shipping address:', JSON.stringify(order.shippingAddress, null, 2));
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

createRealDelivery();
