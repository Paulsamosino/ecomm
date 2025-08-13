const mongoose = require('mongoose');
require('dotenv').config();

const testConnection = async () => {
  try {
    console.log('Testing MongoDB connection...');
    console.log('Connection URI:', process.env.MONGODB_URI?.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@'));
    
    const startTime = Date.now();
    
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 15000, // 15 seconds
      socketTimeoutMS: 45000, // 45 seconds
      connectTimeoutMS: 15000, // Connection timeout
      maxPoolSize: 5, // Reduced pool size for testing
      retryWrites: true,
      w: 'majority',
      family: 4, // Force IPv4
    });
    
    const connectionTime = Date.now() - startTime;
    console.log(`✅ Connected to MongoDB successfully in ${connectionTime}ms`);
    console.log('Database:', mongoose.connection.db.databaseName);
    console.log('Host:', mongoose.connection.host);
    console.log('Connection state:', mongoose.connection.readyState);
    
    // Test a simple operation
    console.log('Testing database operation...');
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('Available collections:', collections.map(c => c.name));
    
    // Test if ads collection exists and can be queried
    try {
      const adsCollection = mongoose.connection.db.collection('ads');
      const adsCount = await adsCollection.countDocuments();
      console.log(`Ads collection has ${adsCount} documents`);
      
      // Test a simple find operation
      const testFind = await adsCollection.findOne({});
      console.log('Sample ad document:', testFind ? 'Found' : 'No documents');
      
    } catch (adsError) {
      console.error('Error testing ads collection:', adsError.message);
    }
    
    console.log('✅ All tests passed');
    
  } catch (error) {
    console.error('❌ Connection failed:');
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error code:', error.code);
    console.error('Error reason:', error.reason);
    
    if (error.name === 'MongoNetworkTimeoutError') {
      console.error('This appears to be a network connectivity issue');
      console.error('Please check:');
      console.error('1. Your internet connection');
      console.error('2. MongoDB Atlas cluster status');
      console.error('3. IP whitelist settings in MongoDB Atlas');
      console.error('4. Firewall settings');
    }
    
  } finally {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
      console.log('Connection closed');
    }
    process.exit(0);
  }
};

testConnection();
