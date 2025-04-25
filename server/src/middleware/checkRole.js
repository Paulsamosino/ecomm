/**
 * Middleware to check if user has the required role(s)
 * @param {string|string[]} roles - Single role string or array of roles that are allowed
 * @returns {function} - Express middleware function
 */
const checkRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    // Convert roles parameter to array if it's a string
    const allowedRoles = Array.isArray(roles) ? roles : [roles];

    // Check if user's role is in the allowed roles array
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        message: "Access denied. Insufficient permissions.",
      });
    }

    next();
  };
};

module.exports = checkRole;
