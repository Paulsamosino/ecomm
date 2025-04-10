const jwt = require("jsonwebtoken");
const User = require("../models/User");

const auth = async (req, res, next) => {
  try {
    // Get token from header
    const token = req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      console.log("No token provided");
      return res.status(401).json({ message: "Authentication required" });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("Token decoded:", decoded);

    // Get user from token
    const user = await User.findOne({ _id: decoded.id });
    console.log("User found:", user ? "Yes" : "No");

    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    // Set user and user ID
    req.user = user;
    req.user.id = user._id;
    console.log("User ID set:", req.user.id);

    next();
  } catch (error) {
    console.error("Auth error:", error);
    console.error("Error stack:", error.stack);
    res.status(401).json({
      message: "Invalid token",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

exports.isSeller = async (req, res, next) => {
  try {
    if (!req.user.isSeller) {
      console.log("Access denied - User is not a seller");
      return res
        .status(403)
        .json({ message: "Access denied. Seller privileges required." });
    }
    next();
  } catch (err) {
    console.error("isSeller error:", err);
    res.status(500).json({ message: "Server Error" });
  }
};

module.exports = auth;
