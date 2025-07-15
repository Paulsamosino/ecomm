const Advertisement = require("../models/Advertisement");
const { validationResult } = require("express-validator");

// Get all advertisements (admin only)
exports.getAllAds = async (req, res) => {
  try {
    const ads = await Advertisement.find()
      .populate("createdBy", "name email")
      .populate("lastModifiedBy", "name email")
      .sort({ createdAt: -1 });
    
    res.json(ads);
  } catch (error) {
    console.error("Error fetching advertisements:", error);
    res.status(500).json({ message: "Error fetching advertisements" });
  }
};

// Get active advertisements for display (public)
exports.getActiveAds = async (req, res) => {
  try {
    const { type, limit } = req.query;
    const ads = await Advertisement.getActiveAds(type, parseInt(limit));
    res.json(ads);
  } catch (error) {
    console.error("Error fetching active ads:", error);
    res.status(500).json({ message: "Error fetching active ads" });
  }
};

// Get single advertisement
exports.getAdById = async (req, res) => {
  try {
    const ad = await Advertisement.findById(req.params.id)
      .populate("createdBy", "name email")
      .populate("lastModifiedBy", "name email");
    
    if (!ad) {
      return res.status(404).json({ message: "Advertisement not found" });
    }
    
    res.json(ad);
  } catch (error) {
    console.error("Error fetching advertisement:", error);
    res.status(500).json({ message: "Error fetching advertisement" });
  }
};

// Create new advertisement (admin only)
exports.createAd = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      title,
      description,
      type,
      image,
      url,
      cta,
      sponsor,
      price,
      status,
      targetAudience,
      schedule,
      priority
    } = req.body;

    const ad = new Advertisement({
      title,
      description,
      type,
      image,
      url,
      cta,
      sponsor,
      price,
      status: status || "draft",
      targetAudience: targetAudience || { roles: ["buyer"] },
      schedule: {
        startDate: schedule?.startDate || new Date(),
        endDate: schedule?.endDate || null
      },
      priority: priority || 0,
      createdBy: req.user.id,
    });

    await ad.save();
    
    const populatedAd = await Advertisement.findById(ad._id)
      .populate("createdBy", "name email");
    
    res.status(201).json(populatedAd);
  } catch (error) {
    console.error("Error creating advertisement:", error);
    res.status(500).json({ message: "Error creating advertisement" });
  }
};

// Update advertisement (admin only)
exports.updateAd = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const ad = await Advertisement.findById(req.params.id);
    if (!ad) {
      return res.status(404).json({ message: "Advertisement not found" });
    }

    // Update fields
    const allowedUpdates = [
      "title", "description", "type", "image", "url", "cta", 
      "sponsor", "price", "status", "targetAudience", "schedule", "priority"
    ];
    
    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        ad[field] = req.body[field];
      }
    });

    ad.lastModifiedBy = req.user.id;
    await ad.save();

    const populatedAd = await Advertisement.findById(ad._id)
      .populate("createdBy", "name email")
      .populate("lastModifiedBy", "name email");

    res.json(populatedAd);
  } catch (error) {
    console.error("Error updating advertisement:", error);
    res.status(500).json({ message: "Error updating advertisement" });
  }
};

// Update advertisement status (admin only)
exports.updateAdStatus = async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!["draft", "active", "paused", "expired"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const ad = await Advertisement.findById(req.params.id);
    if (!ad) {
      return res.status(404).json({ message: "Advertisement not found" });
    }

    ad.status = status;
    ad.lastModifiedBy = req.user.id;
    await ad.save();

    res.json({ message: "Advertisement status updated", status: ad.status });
  } catch (error) {
    console.error("Error updating ad status:", error);
    res.status(500).json({ message: "Error updating ad status" });
  }
};

// Delete advertisement (admin only)
exports.deleteAd = async (req, res) => {
  try {
    const ad = await Advertisement.findById(req.params.id);
    if (!ad) {
      return res.status(404).json({ message: "Advertisement not found" });
    }

    await Advertisement.findByIdAndDelete(req.params.id);
    res.json({ message: "Advertisement deleted successfully" });
  } catch (error) {
    console.error("Error deleting advertisement:", error);
    res.status(500).json({ message: "Error deleting advertisement" });
  }
};

// Track ad impression
exports.trackImpression = async (req, res) => {
  try {
    const { page } = req.body;
    const userId = req.user?.id || null;
    
    const ad = await Advertisement.trackImpression(req.params.id, userId, page);
    if (!ad) {
      return res.status(404).json({ message: "Advertisement not found" });
    }

    res.json({ message: "Impression tracked", impressions: ad.impressions });
  } catch (error) {
    console.error("Error tracking impression:", error);
    res.status(500).json({ message: "Error tracking impression" });
  }
};

// Track ad click
exports.trackClick = async (req, res) => {
  try {
    const userId = req.user?.id || null;
    const userAgent = req.headers['user-agent'];
    const ipAddress = req.ip || req.connection.remoteAddress;
    
    const ad = await Advertisement.trackClick(req.params.id, userId, userAgent, ipAddress);
    if (!ad) {
      return res.status(404).json({ message: "Advertisement not found" });
    }

    res.json({ 
      message: "Click tracked", 
      clicks: ad.clicks,
      url: ad.url 
    });
  } catch (error) {
    console.error("Error tracking click:", error);
    res.status(500).json({ message: "Error tracking click" });
  }
};

// Get advertisement statistics (admin only)
exports.getAdStats = async (req, res) => {
  try {
    const ad = await Advertisement.findById(req.params.id);
    if (!ad) {
      return res.status(404).json({ message: "Advertisement not found" });
    }

    // Calculate additional stats
    const now = new Date();
    const daysRunning = Math.max(1, Math.ceil((now - ad.schedule.startDate) / (1000 * 60 * 60 * 24)));
    const dailyClicks = ad.clicks / daysRunning;
    const dailyImpressions = ad.impressions / daysRunning;

    // Get recent performance (last 7 days)
    const sevenDaysAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
    const recentClicks = ad.clickDetails.filter(click => click.timestamp >= sevenDaysAgo).length;
    const recentImpressions = ad.impressionDetails.filter(imp => imp.timestamp >= sevenDaysAgo).length;

    const stats = {
      basic: {
        impressions: ad.impressions,
        clicks: ad.clicks,
        ctr: ad.ctr,
        isActive: ad.isCurrentlyActive,
      },
      performance: {
        daysRunning,
        dailyClicks: parseFloat(dailyClicks.toFixed(2)),
        dailyImpressions: parseFloat(dailyImpressions.toFixed(2)),
        recentClicks,
        recentImpressions,
        recentCtr: recentImpressions > 0 ? ((recentClicks / recentImpressions) * 100).toFixed(2) : 0,
      },
      timeline: {
        startDate: ad.schedule.startDate,
        endDate: ad.schedule.endDate,
        status: ad.status,
        priority: ad.priority,
      }
    };

    res.json(stats);
  } catch (error) {
    console.error("Error fetching ad stats:", error);
    res.status(500).json({ message: "Error fetching ad stats" });
  }
};

// Get overall ad performance summary (admin only)
exports.getAdsSummary = async (req, res) => {
  try {
    const totalAds = await Advertisement.countDocuments();
    const activeAds = await Advertisement.countDocuments({ status: "active" });
    const pausedAds = await Advertisement.countDocuments({ status: "paused" });
    const draftAds = await Advertisement.countDocuments({ status: "draft" });

    // Get aggregated performance
    const performanceAgg = await Advertisement.aggregate([
      {
        $group: {
          _id: null,
          totalImpressions: { $sum: "$impressions" },
          totalClicks: { $sum: "$clicks" },
          averageCTR: { $avg: { $cond: [{ $gt: ["$impressions", 0] }, { $multiply: [{ $divide: ["$clicks", "$impressions"] }, 100] }, 0] } }
        }
      }
    ]);

    const performance = performanceAgg[0] || {
      totalImpressions: 0,
      totalClicks: 0,
      averageCTR: 0
    };

    // Get top performing ads
    const topAds = await Advertisement.find({ status: "active" })
      .sort({ clicks: -1 })
      .limit(5)
      .select("title clicks impressions");

    const summary = {
      overview: {
        totalAds,
        activeAds,
        pausedAds,
        draftAds,
      },
      performance: {
        totalImpressions: performance.totalImpressions,
        totalClicks: performance.totalClicks,
        averageCTR: parseFloat(performance.averageCTR.toFixed(2)),
      },
      topPerformers: topAds.map(ad => ({
        title: ad.title,
        clicks: ad.clicks,
        impressions: ad.impressions,
        ctr: ad.impressions > 0 ? ((ad.clicks / ad.impressions) * 100).toFixed(2) : 0
      }))
    };

    res.json(summary);
  } catch (error) {
    console.error("Error fetching ads summary:", error);
    res.status(500).json({ message: "Error fetching ads summary" });
  }
};
