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

// POST /api/breeding-logs — create or upsert a log entry
router.post("/", auth, async (req, res) => {
  try {
    const { parent1, parent2, offspring, notes, sourceId } = req.body;

    const payload = {
      user: req.user._id,
      sellerName: req.user.name || req.user.email || "Unknown Seller",
      sellerAvatar: req.user.avatar || req.user.profilePicture || null,
      parent1: parent1 || {},
      parent2: parent2 || {},
      offspring: offspring || {},
      notes: notes || "",
      sourceId: sourceId || null,
    };

    // If sourceId provided, upsert — prevents duplicates from rapid syncs
    if (sourceId) {
      const log = await BreedingLog.findOneAndUpdate(
        { user: req.user._id, sourceId },
        { $set: payload },
        { new: true, upsert: true, setDefaultsOnInsert: true }
      );
      return res.status(200).json(log);
    }

    const log = new BreedingLog(payload);
    await log.save();
    res.status(201).json(log);
  } catch (err) {
    console.error("Error creating breeding log:", err);
    res.status(500).json({ message: "Failed to create breeding log" });
  }
});

// PATCH /api/breeding-logs/:id — auth required, update own log in real-time
router.patch("/:id", auth, async (req, res) => {
  try {
    const log = await BreedingLog.findOne({ _id: req.params.id, user: req.user._id });
    if (!log) return res.status(404).json({ message: "Log not found" });

    const { parent1, parent2, offspring, notes } = req.body;
    if (parent1 !== undefined) log.parent1 = parent1;
    if (parent2 !== undefined) log.parent2 = parent2;
    if (offspring !== undefined) log.offspring = offspring;
    if (notes !== undefined) log.notes = notes;

    await log.save();
    res.json(log);
  } catch (err) {
    console.error("Error updating breeding log:", err);
    res.status(500).json({ message: "Failed to update breeding log" });
  }
});

// DELETE /api/breeding-logs/:id — auth required, remove own log
router.delete("/:id", auth, async (req, res) => {
  try {
    const log = await BreedingLog.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!log) return res.status(404).json({ message: "Log not found" });
    res.json({ message: "Log removed" });
  } catch (err) {
    console.error("Error deleting breeding log:", err);
    res.status(500).json({ message: "Failed to delete breeding log" });
  }
});

module.exports = router;
