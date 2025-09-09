const User = require("../models/User");
const axios = require("axios");

// Create a PayPal order for a wallet top-up. Client will use PayPal JS to capture.
exports.createTopupOrder = async (req, res) => {
  try {
    const { amount } = req.body;
    if (!amount || amount <= 0) return res.status(400).json({ message: "Invalid amount" });

    // Generate a client-side order is usually done via PayPal JS; we can just return intent data
    // For now we return a minimal payload; client will call PayPal Buttons to create and capture.
    res.json({ message: "ok" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to create topup order" });
  }
};

// Capture confirmation from client: credit the user's wallet
exports.captureTopup = async (req, res) => {
  try {
    const { orderId, amount } = req.body;
    if (!orderId || !amount) return res.status(400).json({ message: "Missing parameters" });

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Record wallet credit with meta information including PayPal orderId
    await user.creditWallet(amount, "topup", { provider: "paypal", orderId });

    res.json({ message: "Topup credited", wallet: user.wallet });
  } catch (err) {
    console.error("Error capturing topup:", err);
    res.status(500).json({ message: "Failed to capture topup" });
  }
};

module.exports = exports;
