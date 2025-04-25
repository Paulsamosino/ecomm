const express = require("express");
const router = express.Router();
const Report = require("../models/Report");
const User = require("../models/User");
const { protect } = require("../middleware/authMiddleware");
const checkRole = require("../middleware/checkRole");

// Submit a report
router.post("/", protect, async (req, res) => {
  try {
    const {
      reportedUserId,
      reason,
      description,
      reporterRole,
      category,
      evidence,
    } = req.body;

    // Validate inputs
    if (
      !reportedUserId ||
      !reason ||
      !description ||
      !reporterRole ||
      !category
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide all required fields",
      });
    }

    // Check if reported user exists
    const reportedUser = await User.findById(reportedUserId);
    if (!reportedUser) {
      return res.status(404).json({
        success: false,
        message: "Reported user not found",
      });
    }

    // Prevent self-reporting
    if (reportedUserId === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: "You cannot report yourself",
      });
    }

    // Check for existing active reports
    const existingReport = await Report.findOne({
      reportedUser: reportedUserId,
      reporter: req.user._id,
      status: { $in: ["pending", "investigating"] },
    });

    if (existingReport) {
      return res.status(400).json({
        success: false,
        message: "You already have an active report against this user",
      });
    }

    const report = await Report.create({
      reportedUser: reportedUserId,
      reporter: req.user._id,
      reporterRole,
      reason,
      description,
      category,
      evidence: evidence || [],
      status: "pending",
    });

    await report.populate([
      { path: "reportedUser", select: "name email" },
      { path: "reporter", select: "name email" },
    ]);

    res.status(201).json({
      success: true,
      message: "Report submitted successfully",
      report,
    });
  } catch (error) {
    console.error("Error submitting report:", error);
    res.status(500).json({
      success: false,
      message:
        error.name === "ValidationError"
          ? "Invalid report data. Please check required fields and formats."
          : "Error submitting report",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// Get reports for a user (only their own reports)
router.get("/my-reports", protect, async (req, res) => {
  try {
    const reports = await Report.find({ reporter: req.user._id })
      .populate("reportedUser", "name email")
      .populate("resolvedBy", "name")
      .sort("-createdAt");

    res.json({
      success: true,
      reports,
    });
  } catch (error) {
    console.error("Error fetching reports:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching reports",
    });
  }
});

// Admin: Get all reports
router.get("/", protect, checkRole(["admin"]), async (req, res) => {
  try {
    const reports = await Report.find()
      .populate("reporter", "name email")
      .populate("reportedUser", "name email")
      .populate("resolvedBy", "name email")
      .sort("-createdAt");

    const formattedReports = reports.map((report) => ({
      _id: report._id,
      status: report.status,
      reason: report.reason,
      description: report.description,
      category: report.category,
      createdAt: report.createdAt,
      resolution: report.resolution,
      resolvedAt: report.resolvedAt,
      reporterRole: report.reporterRole,
      reporterName: report.reporter ? report.reporter.name : "Unknown",
      reportedUserName: report.reportedUser
        ? report.reportedUser.name
        : "Unknown User",
      evidence: report.evidence || [],
      reporterDetails: report.reporter
        ? {
            id: report.reporter._id,
            name: report.reporter.name,
            email: report.reporter.email,
          }
        : null,
      reportedUserDetails: report.reportedUser
        ? {
            id: report.reportedUser._id,
            name: report.reportedUser.name,
            email: report.reportedUser.email,
          }
        : null,
      resolverDetails: report.resolvedBy
        ? {
            id: report.resolvedBy._id,
            name: report.resolvedBy.name,
            email: report.resolvedBy.email,
          }
        : null,
    }));

    res.json(formattedReports);
  } catch (error) {
    console.error("Error fetching reports:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching reports",
    });
  }
});

// Admin: Update report status
router.put("/:id/status", protect, checkRole(["admin"]), async (req, res) => {
  try {
    const { status, resolution } = req.body;

    if (
      !["pending", "investigating", "resolved", "dismissed"].includes(status)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid status",
      });
    }

    const report = await Report.findByIdAndUpdate(
      req.params.id,
      {
        status,
        resolution,
        resolvedBy: status === "resolved" ? req.user._id : undefined,
        resolvedAt: status === "resolved" ? new Date() : undefined,
      },
      { new: true }
    )
      .populate("reporter", "name email")
      .populate("reportedUser", "name email")
      .populate("resolvedBy", "name email");

    if (!report) {
      return res.status(404).json({
        success: false,
        message: "Report not found",
      });
    }

    res.json({
      success: true,
      message: "Report status updated successfully",
      report,
    });
  } catch (error) {
    console.error("Error updating report status:", error);
    res.status(500).json({
      success: false,
      message: "Error updating report status",
    });
  }
});

// Get status of a specific report
router.get("/:id", protect, async (req, res) => {
  try {
    const report = await Report.findOne({
      _id: req.params.id,
      reporter: req.user._id,
    })
      .populate("reportedUser", "name email")
      .populate("resolvedBy", "name");

    if (!report) {
      return res.status(404).json({
        success: false,
        message: "Report not found",
      });
    }

    res.json({
      success: true,
      report,
    });
  } catch (error) {
    console.error("Error fetching report:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching report",
    });
  }
});

module.exports = router;
