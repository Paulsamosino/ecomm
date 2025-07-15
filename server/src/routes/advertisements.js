const express = require("express");
const { body } = require("express-validator");
const router = express.Router();
const auth = require("../middleware/auth");
const checkRole = require("../middleware/checkRole");
const advertisementController = require("../controllers/advertisementController");

// Validation middleware
const validateAd = [
  body("title")
    .trim()
    .notEmpty()
    .withMessage("Title is required")
    .isLength({ max: 100 })
    .withMessage("Title must be less than 100 characters"),
  body("description")
    .trim()
    .notEmpty()
    .withMessage("Description is required")
    .isLength({ max: 500 })
    .withMessage("Description must be less than 500 characters"),
  body("type")
    .isIn(["banner", "square", "small"])
    .withMessage("Type must be banner, square, or small"),
  body("url")
    .isURL()
    .withMessage("URL must be a valid URL"),
  body("cta")
    .trim()
    .notEmpty()
    .withMessage("Call to action is required")
    .isLength({ max: 50 })
    .withMessage("CTA must be less than 50 characters"),
  body("sponsor")
    .trim()
    .notEmpty()
    .withMessage("Sponsor is required")
    .isLength({ max: 100 })
    .withMessage("Sponsor must be less than 100 characters"),
  body("price")
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage("Price must be less than 50 characters"),
  body("status")
    .optional()
    .isIn(["draft", "active", "paused", "expired"])
    .withMessage("Status must be draft, active, paused, or expired"),
];

// Public routes (no authentication required)
// Get active ads for display
router.get("/active", advertisementController.getActiveAds);

// Track ad impression (can be called by anonymous users)
router.post("/:id/impression", advertisementController.trackImpression);

// Track ad click (can be called by anonymous users)
router.post("/:id/click", advertisementController.trackClick);

// Admin routes (authentication + admin role required)
// Get all advertisements
router.get("/", auth, checkRole("admin"), advertisementController.getAllAds);

// Get advertisement by ID
router.get("/:id", auth, checkRole("admin"), advertisementController.getAdById);

// Create new advertisement
router.post("/", auth, checkRole("admin"), validateAd, advertisementController.createAd);

// Update advertisement
router.put("/:id", auth, checkRole("admin"), validateAd, advertisementController.updateAd);

// Update advertisement status only
router.put("/:id/status", auth, checkRole("admin"), advertisementController.updateAdStatus);

// Delete advertisement
router.delete("/:id", auth, checkRole("admin"), advertisementController.deleteAd);

// Get advertisement statistics
router.get("/:id/stats", auth, checkRole("admin"), advertisementController.getAdStats);

// Get overall ads summary
router.get("/summary/overview", auth, checkRole("admin"), advertisementController.getAdsSummary);

module.exports = router;
