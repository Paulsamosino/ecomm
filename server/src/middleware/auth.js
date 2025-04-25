const jwt = require("jsonwebtoken");
const User = require("../models/User");

const auth = async (req, res, next) => {
  try {
    // Get token from header and log the attempt
    const token = req.header("Authorization")?.replace("Bearer ", "");
    console.log("Auth middleware - Token received:", token ? "Yes" : "No");
    console.log("Auth middleware - Headers:", req.headers);

    if (!token) {
      console.log("No token provided");
      return res.status(401).json({ message: "Authentication required" });
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log("Token decoded successfully:", decoded);

      // Get user from token
      const user = await User.findOne({ _id: decoded.id });
      console.log("User found:", user ? user._id : "No user");

      if (!user) {
        console.log("No user found for token");
        return res.status(401).json({ message: "User not found" });
      }

      // Set user and user ID
      req.user = user;
      req.user.id = user._id;
      console.log("User set in request:", req.user.id);

      next();
    } catch (error) {
      console.error("Token verification error:", error);
      console.error("Error stack:", error.stack);
      return res.status(401).json({
        message: "Invalid token",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  } catch (error) {
    console.error("Auth middleware error:", error);
    console.error("Error stack:", error.stack);
    return res.status(500).json({ message: "Server Error" });
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
