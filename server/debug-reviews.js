const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI);

// Import models
const Product = require('./src/models/Product');
const Order = require('./src/models/Order');
const User = require('./src/models/User');

async function debugReviews() {
  try {
    console.log('🔍 Debugging reviews system...');
    
    // Check the specific product
    const productId = '687689fc91b72b9c97a953a4';
    const product = await Product.findById(productId).populate('reviews.user', 'name');
    
    if (product) {
      console.log('📦 Product found:', product.name);
      console.log('⭐ Product rating:', product.rating);
      console.log('📝 Number of reviews:', product.reviews.length);
      console.log('📋 Reviews:', JSON.stringify(product.reviews, null, 2));
      
      // Check if there are any orders for this product
      const orders = await Order.find({
        'items.product': productId,
        reviewed: true
      }).populate('buyer', 'name');
      
      console.log('📦 Orders with reviews for this product:', orders.length);
      orders.forEach(order => {
        console.log('Order ID:', order._id);
        console.log('Buyer:', order.buyer.name);
        console.log('Reviewed:', order.reviewed);
        console.log('Review data:', order.reviewData);
      });
      
      // Check seller's products
      const sellerId = product.seller;
      console.log('👤 Seller ID:', sellerId);
      
      const sellerProducts = await Product.find({ seller: sellerId }).populate('reviews.user', 'name');
      console.log('🏪 Seller has', sellerProducts.length, 'products');
      
      let totalReviews = 0;
      sellerProducts.forEach(prod => {
        totalReviews += prod.reviews.length;
        if (prod.reviews.length > 0) {
          console.log(`Product "${prod.name}" has ${prod.reviews.length} reviews:`, prod.reviews);
        }
      });
      
      console.log('📊 Total reviews across all seller products:', totalReviews);
      
    } else {
      console.log('❌ Product not found');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    mongoose.connection.close();
  }
}

debugReviews();
