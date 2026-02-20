const express = require("express");
const router = express.Router();
const BreedingLog = require("../models/BreedingLog");
const auth = require("../middleware/auth");

// GET /api/breeding-logs — paginated global feed, newest first (public)
router.get("/", async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, parseInt(req.query.limit) || 20);
    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      BreedingLog.find()
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      BreedingLog.countDocuments(),
    ]);

    res.json({
      logs,
      total,
      page,
      pages: Math.ceil(total / limit),
    });
  } catch (err) {
    console.error("Error fetching breeding logs:", err);
    res.status(500).json({ message: "Failed to fetch breeding logs" });
  }
});

// POST /api/breeding-logs — create a new log entry
router.post("/", auth, async (req, res) => {
  try {
    const { parent1, parent2, offspring, notes } = req.body;

    const log = new BreedingLog({
      user: req.user._id,
      sellerName: req.user.name || req.user.email || "Unknown Seller",
      sellerAvatar: req.user.avatar || req.user.profilePicture || null,
      parent1: parent1 || {},
      parent2: parent2 || {},
      offspring: offspring || {},
      notes: notes || "",
    });

    await log.save();
    res.status(201).json(log);
  } catch (err) {
    console.error("Error creating breeding log:", err);
    res.status(500).json({ message: "Failed to create breeding log" });
  }
});

module.exports = router;
