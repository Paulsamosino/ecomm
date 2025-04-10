const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const sellerController = require("../controllers/sellerController");

// ... existing routes ...

// Get all sellers
router.get("/all", protect, sellerController.getAllSellers);

// ... existing routes ...

module.exports = router;
