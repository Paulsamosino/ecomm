const User = require("../models/User");

// Get all seller profiles
exports.getAllSellers = async (req, res) => {
  try {
    const sellers = await User.find({ isSeller: true })
      .select("name email sellerProfile isOnline lastActive")
      .populate("sellerProfile", "businessName description storeType rating")
      .sort({ "sellerProfile.rating": -1 });

    res.json(sellers);
  } catch (error) {
    console.error("Error fetching sellers:", error);
    res.status(500).json({ message: "Error fetching sellers" });
  }
};
