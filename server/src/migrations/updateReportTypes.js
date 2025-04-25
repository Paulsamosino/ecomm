const mongoose = require("mongoose");
const Report = require("../models/Report");
require("dotenv").config();

async function updateReportTypes() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB");

    // Update all reports with lowercase types to uppercase
    const updates = await Promise.all([
      Report.updateMany({ type: "user" }, { $set: { type: "User" } }),
      Report.updateMany({ type: "product" }, { $set: { type: "Product" } }),
      Report.updateMany({ type: "comment" }, { $set: { type: "Comment" } }),
    ]);

    console.log("Migration completed:", {
      userUpdates: updates[0].modifiedCount,
      productUpdates: updates[1].modifiedCount,
      commentUpdates: updates[2].modifiedCount,
    });

    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
    process.exit(0);
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
}

updateReportTypes();
