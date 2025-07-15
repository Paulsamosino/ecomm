const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");

// Public route to get active ads
router.get("/active", adminController.getActiveAds);

// Public route to track ad clicks (no authentication required)
router.post("/:id/click", adminController.trackAdClick);

// Public route to track ad impressions (no authentication required)
router.post("/:id/impression", adminController.trackAdImpression);

module.exports = router;
