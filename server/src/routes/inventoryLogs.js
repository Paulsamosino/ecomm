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

// POST /api/inventory-logs — auth required, upserts by sourceId if provided
router.post("/", auth, async (req, res) => {
  try {
    const { itemName, category, qty, action, note, sourceId } = req.body;

    const payload = {
      user: req.user._id,
      sellerName: req.user.name || req.user.email || "Unknown",
      sellerAvatar: req.user.avatar || req.user.profilePicture || null,
      itemName: itemName || "Unknown Item",
      category: category || "Uncategorized",
      qty: qty || 0,
      action: action || "posted",
      note: note || "",
      sourceId: sourceId || null,
    };

    // If sourceId provided, upsert — prevents duplicates from rapid syncs
    if (sourceId) {
      const log = await InventoryLog.findOneAndUpdate(
        { user: req.user._id, sourceId },
        { $set: payload },
        { new: true, upsert: true, setDefaultsOnInsert: true }
      );
      return res.status(200).json(log);
    }

    const log = new InventoryLog(payload);
    await log.save();
    res.status(201).json(log);
  } catch (err) {
    console.error("Error creating inventory log:", err);
    res.status(500).json({ message: "Failed to create inventory log" });
  }
});

// PATCH /api/inventory-logs/:id — auth required, update qty / fields in real-time
router.patch("/:id", auth, async (req, res) => {
  try {
    const log = await InventoryLog.findOne({ _id: req.params.id, user: req.user._id });
    if (!log) return res.status(404).json({ message: "Log not found" });

    const { qty, itemName, category, action } = req.body;
    if (qty !== undefined) log.qty = qty;
    if (itemName !== undefined) log.itemName = itemName;
    if (category !== undefined) log.category = category;
    if (action !== undefined) log.action = action;

    await log.save();
    res.json(log);
  } catch (err) {
    console.error("Error updating inventory log:", err);
    res.status(500).json({ message: "Failed to update inventory log" });
  }
});

// DELETE /api/inventory-logs/:id — auth required, remove own log (unpost)
router.delete("/:id", auth, async (req, res) => {
  try {
    const log = await InventoryLog.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!log) return res.status(404).json({ message: "Log not found" });
    res.json({ message: "Log removed" });
  } catch (err) {
    console.error("Error deleting inventory log:", err);
    res.status(500).json({ message: "Failed to delete inventory log" });
  }
});

module.exports = router;
