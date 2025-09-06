const mongoose = require("mongoose");
require("dotenv").config();

async function clearDatabase() {
  try {
    console.log("🔗 Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log("✅ Connected to MongoDB");
    console.log("Database:", mongoose.connection.db.databaseName);

    // Get all collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log(`📦 Found ${collections.length} collections`);

    // Clear each collection
    for (const collection of collections) {
      const collectionName = collection.name;
      console.log(`🗑️  Clearing collection: ${collectionName}`);
      await mongoose.connection.db.collection(collectionName).deleteMany({});
      const count = await mongoose.connection.db.collection(collectionName).countDocuments();
      console.log(`✅ ${collectionName}: ${count} documents remaining`);
    }

    console.log("🎉 Database cleared successfully!");
    
  } catch (error) {
    console.error("❌ Error clearing database:", error);
  } finally {
    await mongoose.connection.close();
    console.log("🔌 MongoDB connection closed");
    process.exit(0);
  }
}

// Run the script
clearDatabase();
