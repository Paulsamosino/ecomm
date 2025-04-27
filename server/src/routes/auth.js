const express = require("express");
const router = express.Router();
const { auth, isSeller } = require("../middleware/auth");
const {
  register,
  protectLoginRoute,
  getCurrentUser,
  updateProfile,
  updateSellerProfile,
  addSellerReview,
  logout,
} = require("../controllers/authController");
const { validateSchema } = require("../middleware/validateSchema");
const {
  registerSchema,
  loginSchema,
  updateProfileSchema,
  sellerProfileSchema,
  reviewSchema,
} = require("../schemas/authSchemas");

// Apply security headers to all routes
router.use((req, res, next) => {
  res.set({
    "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "X-XSS-Protection": "1; mode=block",
  });
  next();
});

// Public routes
router.post("/register", validateSchema(registerSchema), register);
router.post("/login", validateSchema(loginSchema), protectLoginRoute);
router.post("/logout", auth, logout);

// Protected routes
router.get("/me", auth, getCurrentUser);
router.put(
  "/profile",
  [auth, validateSchema(updateProfileSchema)],
  updateProfile
);

// Seller routes
router.put(
  "/seller-profile",
  [auth, isSeller, validateSchema(sellerProfileSchema)],
  updateSellerProfile
);

// Review routes
router.post(
  "/seller/:id/reviews",
  [auth, validateSchema(reviewSchema)],
  addSellerReview
);

module.exports = router;
