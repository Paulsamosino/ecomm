const axios = require('axios');
const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB directly to test the controller
mongoose.connect(process.env.MONGODB_URI);

const Product = require('./src/models/Product');
const Order = require('./src/models/Order');
const User = require('./src/models/User');
const sellerController = require('./src/controllers/sellerController');

async function testSellerAnalyticsDirectly() {
  try {
    console.log('🔍 Testing Seller Analytics directly...');
    
    // Get the seller
    const seller = await User.findOne({ email: 'seller1@gmail.com' });
    if (!seller) {
      console.log('❌ Seller not found');
      return;
    }
    
    console.log('👤 Testing with seller:', seller.name, seller._id);
    
    // Mock request and response objects
    const req = {
      user: { _id: seller._id }
    };
    
    const res = {
      json: (data) => {
        console.log('📊 Stats Response:', JSON.stringify(data, null, 2));
      },
      status: (code) => ({
        json: (data) => {
          console.log(`❌ Error Response (${code}):`, data);
        }
      })
    };
    
    console.log('\n📊 Testing getSellerStats...');
    await sellerController.getSellerStats(req, res);
    
    console.log('\n📈 Testing getSellerAnalytics...');
    const analyticsRes = {
      json: (data) => {
        console.log('📈 Analytics Response:', JSON.stringify(data, null, 2));
      },
      status: (code) => ({
        json: (data) => {
          console.log(`❌ Analytics Error (${code}):`, data);
        }
      })
    };
    
    await sellerController.getSellerAnalytics(req, analyticsRes);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    mongoose.connection.close();
  }
}

testSellerAnalyticsDirectly();
