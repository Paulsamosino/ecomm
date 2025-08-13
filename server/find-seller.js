const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI);

// Import models
const User = require('./src/models/User');

async function findSeller() {
  try {
    console.log('🔍 Finding seller users...');
    
    // Find users who are sellers
    const sellers = await User.find({ isSeller: true });
    console.log('Found sellers:', sellers.length);
    
    sellers.forEach(seller => {
      console.log('Seller:', seller.name, 'Email:', seller.email, 'ID:', seller._id);
    });
    
    // Also find users who have products (are de-facto sellers)
    const Product = require('./src/models/Product');
    const distinctSellers = await Product.distinct('seller');
    console.log('\nUsers with products:', distinctSellers.length);
    
    for (const sellerId of distinctSellers) {
      const user = await User.findById(sellerId);
      if (user) {
        console.log('Product seller:', user.name, 'Email:', user.email, 'ID:', user._id);
      }
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    mongoose.connection.close();
  }
}

findSeller();
