const express = require("express");
const router = express.Router();
const walletController = require("../controllers/walletController");
const { protect } = require("../middleware/authMiddleware");

// Create a top-up order (client handles PayPal flow)
router.post("/topup", protect, walletController.createTopupOrder);

// Client notifies server after capture to credit wallet
router.post("/topup/capture", protect, walletController.captureTopup);

// Get wallet balance
router.get("/balance", protect, async (req, res) => {
  try {
    const User = require("../models/User");
    const user = await User.findById(req.user._id).select("wallet");
    res.json({ wallet: user.wallet || { balance: 0, currency: 'PHP', transactions: [] } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to get wallet' });
  }
});

module.exports = router;
