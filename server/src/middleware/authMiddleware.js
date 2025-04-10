const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Protect routes
exports.protect = async (req, res, next) => {
  try {
    let token;

    // Get token from header (support both formats)
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    } else if (req.header("Authorization")) {
      token = req.header("Authorization").replace("Bearer ", "");
    }

    // Check if token exists
    if (!token) {
      console.log("No token provided in request");
      console.log("Headers:", req.headers);
      return res.status(401).json({
        success: false,
        message: "Not authorized to access this route",
      });
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log("Token decoded successfully:", decoded);

      // Get user from token
      const user = await User.findById(decoded.id);
      console.log("User found:", user ? user._id : "No user");

      if (!user) {
        console.log("No user found for token");
        return res.status(401).json({
          success: false,
          message: "User not found",
        });
      }

      // Set user in request
      req.user = user;
      req.user.id = user._id;
      console.log("User set in request:", user._id);
      next();
    } catch (error) {
      console.error("Token verification error:", error);
      return res.status(401).json({
        success: false,
        message: "Invalid or expired token",
      });
    }
  } catch (error) {
    console.error("Auth middleware error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Grant access to specific roles
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      console.log("Access denied for role:", req.user.role);
      console.log("Required roles:", roles);
      return res.status(403).json({
        success: false,
        message: `User role ${req.user.role} is not authorized to access this route`,
      });
    }
    next();
  };
};
