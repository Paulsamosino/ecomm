const jwt = require("jsonwebtoken");
const { v4: uuidv4 } = require("uuid");
const User = require("../models/User");
const { isTokenBlacklisted } = require("../controllers/authController");

// Rate limiter for auth endpoints
const rateLimit = require("express-rate-limit");

// Configure rate limiting
exports.authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    message: "Too many requests from this IP, please try again later",
  },
});

// Constants
const TOKEN_EXPIRY = "24h"; // Token expiry duration
const MAX_ACTIVE_SESSIONS = 5; // Maximum number of active sessions per user
const RESPONSE_MESSAGES = {
  AUTH_REQUIRED: "Authentication required",
  INVALID_TOKEN: "Invalid token",
  USER_NOT_FOUND: "User not found",
  INVALID_ROLE: "Invalid role configuration",
  SERVER_ERROR: "Server Error",
  ACCESS_DENIED: (role) => `Access denied. ${role} privileges required.`,
  TOKEN_EXPIRED: "Token has expired",
  TOKEN_MALFORMED: "Malformed authentication token",
};

/**
 * HTTP Security Headers
 */
const securityHeaders = {
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "X-XSS-Protection": "1; mode=block",
  "Content-Security-Policy": "default-src 'self'",
};

/**
 * Validates that a user has exactly one role assigned
 */
const validateUserRole = (user) => {
  const roles = [
    user.isAdmin,
    user.isSeller,
    !user.isAdmin && !user.isSeller, // isBuyer
  ].filter(Boolean);

  return roles.length === 1;
};

/**
 * Creates a standardized error response
 */
const createErrorResponse = (statusCode, message, error) => {
  const response = { message };
  if (process.env.NODE_ENV === "development" && error) {
    response.error = error.message;
  }
  return response;
};

/**
 * Main authentication middleware
 */
// Activity logging helper
const logAuthActivity = (userId, activity, success, details = {}) => {
  console.log(`Auth Activity [${userId}]: ${activity}`, {
    success,
    timestamp: new Date(),
    ...details,
  });
};

const auth = async (req, res, next) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({ message: RESPONSE_MESSAGES.AUTH_REQUIRED });
    }

    try {
      // Check if token is blacklisted
      if (await isTokenBlacklisted(token)) {
        logAuthActivity(null, "Token Use Attempt", false, {
          reason: "blacklisted",
        });
        return res.status(401).json({ message: "Token has been revoked" });
      }

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET, {
        algorithms: ["HS256"],
        maxAge: TOKEN_EXPIRY,
        complete: true, // Get full decoded token
      });

      // Check token ID (jti) is in user's active sessions
      const user = await User.findOne(
        {
          _id: decoded.payload.id,
          activeSessions: decoded.payload.jti,
          status: "active",
        },
        {
          isAdmin: 1,
          isSeller: 1,
          email: 1,
          name: 1,
          activeSessions: 1,
          status: 1,
          lastSeen: 1,
        }
      ).lean();

      // Update last seen
      await User.updateOne(
        { _id: decoded.payload.id },
        {
          $set: { lastSeen: new Date() },
          $pull: {
            activeSessions: {
              $nin: user.activeSessions.slice(-MAX_ACTIVE_SESSIONS),
            },
          },
        }
      );

      if (!user) {
        return res
          .status(401)
          .json({ message: RESPONSE_MESSAGES.USER_NOT_FOUND });
      }

      if (!validateUserRole(user)) {
        logAuthActivity(user._id, "Role Validation", false);
        return res
          .status(403)
          .json({ message: RESPONSE_MESSAGES.INVALID_ROLE });
      }

      if (user.status !== "active") {
        logAuthActivity(user._id, "Account Status Check", false, {
          status: user.status,
        });
        return res.status(403).json({
          message: `Account is ${user.status}. Please contact support.`,
        });
      }

      // Set user with normalized role information and session data
      req.user = {
        ...user,
        id: user._id,
        isBuyer: !user.isAdmin && !user.isSeller,
        sessionId: decoded.payload.jti,
        lastSeen: new Date(),
      };

      // Log successful auth
      logAuthActivity(user._id, "Authentication", true);

      // Apply security headers
      Object.entries(securityHeaders).forEach(([key, value]) => {
        res.setHeader(key, value);
      });

      next();
    } catch (error) {
      if (error.name === "TokenExpiredError") {
        return res
          .status(401)
          .json(
            createErrorResponse(401, RESPONSE_MESSAGES.TOKEN_EXPIRED, error)
          );
      } else if (error.name === "JsonWebTokenError") {
        return res
          .status(401)
          .json(
            createErrorResponse(401, RESPONSE_MESSAGES.TOKEN_MALFORMED, error)
          );
      }
      return res
        .status(401)
        .json(createErrorResponse(401, RESPONSE_MESSAGES.INVALID_TOKEN, error));
    }
  } catch (error) {
    return res
      .status(500)
      .json(createErrorResponse(500, RESPONSE_MESSAGES.SERVER_ERROR, error));
  }
};

/**
 * Creates a role-checking middleware
 */
const createRoleMiddleware = (roleCheck, roleName) => {
  const middleware = async (req, res, next) => {
    try {
      if (!roleCheck(req.user)) {
        return res.status(403).json({
          message: RESPONSE_MESSAGES.ACCESS_DENIED(roleName),
        });
      }
      next();
    } catch (error) {
      return res
        .status(500)
        .json(createErrorResponse(500, RESPONSE_MESSAGES.SERVER_ERROR, error));
    }
  };

  // Cache the middleware function name for better debugging
  Object.defineProperty(middleware, "name", {
    value: `${roleName}CheckMiddleware`,
    writable: false,
  });

  return middleware;
};

// Role-based middleware using factory function
const isBuyer = createRoleMiddleware((user) => user.isBuyer, "Buyer");

const isSeller = createRoleMiddleware((user) => user.isSeller, "Seller");

const isAdmin = createRoleMiddleware((user) => user.isAdmin, "Admin");

module.exports = {
  auth,
  isBuyer,
  isSeller,
  isAdmin,
};
