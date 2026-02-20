const express = require("express");
const router = express.Router();
const InventoryLog = require("../models/InventoryLog");
const auth = require("../middleware/auth");

// GET /api/inventory-logs — public, paginated newest-first
router.get("/", async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, parseInt(req.query.limit) || 20);
    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      InventoryLog.find().sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      InventoryLog.countDocuments(),
    ]);

    res.json({ logs, total, page, pages: Math.ceil(total / limit) });
  } catch (err) {
    console.error("Error fetching inventory logs:", err);
    res.status(500).json({ message: "Failed to fetch inventory logs" });
  }
});

// POST /api/inventory-logs — auth required
router.post("/", auth, async (req, res) => {
  try {
    const { itemName, category, qty, action, note } = req.body;

    const log = new InventoryLog({
      user: req.user._id,
      sellerName: req.user.name || req.user.email || "Unknown",
      sellerAvatar: req.user.avatar || req.user.profilePicture || null,
      itemName: itemName || "Unknown Item",
      category: category || "Uncategorized",
      qty: qty || 0,
      action: action || "posted",
      note: note || "",
    });

    await log.save();
    res.status(201).json(log);
  } catch (err) {
    console.error("Error creating inventory log:", err);
    res.status(500).json({ message: "Failed to create inventory log" });
  }
});

module.exports = router;
