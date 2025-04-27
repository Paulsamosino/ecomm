const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const { auth, isBuyer } = require("../middleware/auth");
const BreedingProject = require("../models/BreedingProject");
const BreedingPair = require("../models/BreedingPair");
const Product = require("../models/Product");

// Get all breeding projects
router.get("/projects", auth, isBuyer, async (req, res) => {
  try {
    const projects = await BreedingProject.find({ owner: req.user.id })
      .populate("pairs")
      .sort("-createdAt");

    res.json(projects);
  } catch (error) {
    console.error("Error fetching breeding projects:", error);
    res.status(500).json({ message: "Error fetching breeding projects" });
  }
});

// Create new breeding project
router.post("/projects", auth, isBuyer, async (req, res) => {
  try {
    const { name, description, category, goal, expectedTimeline } = req.body;

    const project = new BreedingProject({
      name,
      description,
      category,
      goal,
      expectedTimeline,
      owner: req.user.id,
      status: "active",
    });

    await project.save();
    res.status(201).json(project);
  } catch (error) {
    console.error("Error creating breeding project:", error);
    res.status(500).json({ message: "Error creating breeding project" });
  }
});

// Get specific breeding project
router.get("/projects/:id", auth, isBuyer, async (req, res) => {
  try {
    const project = await BreedingProject.findOne({
      _id: req.params.id,
      owner: req.user.id,
    }).populate("pairs");

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    res.json(project);
  } catch (error) {
    console.error("Error fetching breeding project:", error);
    res.status(500).json({ message: "Error fetching breeding project" });
  }
});

// Update breeding project
router.put("/projects/:id", auth, isBuyer, async (req, res) => {
  try {
    const project = await BreedingProject.findOneAndUpdate(
      { _id: req.params.id, owner: req.user.id },
      req.body,
      { new: true }
    );

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    res.json(project);
  } catch (error) {
    console.error("Error updating breeding project:", error);
    res.status(500).json({ message: "Error updating breeding project" });
  }
});

// Get all breeding pairs
router.get("/pairs", auth, isBuyer, async (req, res) => {
  try {
    const pairs = await BreedingPair.find({ owner: req.user.id })
      .populate("sire dam project")
      .sort("-createdAt");

    res.json(pairs);
  } catch (error) {
    console.error("Error fetching breeding pairs:", error);
    res.status(500).json({ message: "Error fetching breeding pairs" });
  }
});

// Get active breeding pairs
router.get("/pairs/active", auth, isBuyer, async (req, res) => {
  try {
    const pairs = await BreedingPair.find({
      owner: req.user.id,
      status: "active",
    })
      .populate("sire dam project")
      .sort("-createdAt");

    res.json(pairs);
  } catch (error) {
    console.error("Error fetching active breeding pairs:", error);
    res.status(500).json({ message: "Error fetching active breeding pairs" });
  }
});

// Create new breeding pair
router.post("/pairs", auth, isBuyer, async (req, res) => {
  try {
    const { sireId, damId, projectId, name, notes } = req.body;

    const pair = new BreedingPair({
      name,
      sire: sireId,
      dam: damId,
      project: projectId,
      owner: req.user.id,
      status: "active",
      notes,
    });

    await pair.save();

    // Add pair to the project
    if (projectId) {
      await BreedingProject.findByIdAndUpdate(projectId, {
        $push: { pairs: pair._id },
      });
    }

    res.status(201).json(pair);
  } catch (error) {
    console.error("Error creating breeding pair:", error);
    res.status(500).json({ message: "Error creating breeding pair" });
  }
});

// Record breeding event
router.post("/pairs/:id/events", auth, isBuyer, async (req, res) => {
  try {
    const { type, date, notes } = req.body;

    const pair = await BreedingPair.findOne({
      _id: req.params.id,
      owner: req.user.id,
    });

    if (!pair) {
      return res.status(404).json({ message: "Breeding pair not found" });
    }

    const event = {
      type,
      date: date || new Date(),
      notes,
    };

    pair.events.push(event);
    await pair.save();

    res.status(201).json(event);
  } catch (error) {
    console.error("Error recording breeding event:", error);
    res.status(500).json({ message: "Error recording breeding event" });
  }
});

// Get breeding events for a pair
router.get("/pairs/:id/events", auth, isBuyer, async (req, res) => {
  try {
    const pair = await BreedingPair.findOne({
      _id: req.params.id,
      owner: req.user.id,
    });

    if (!pair) {
      return res.status(404).json({ message: "Breeding pair not found" });
    }

    res.json(pair.events);
  } catch (error) {
    console.error("Error fetching breeding events:", error);
    res.status(500).json({ message: "Error fetching breeding events" });
  }
});

// Get breeding statistics
router.get("/stats", auth, isBuyer, async (req, res) => {
  try {
    const totalProjects = await BreedingProject.countDocuments({
      owner: req.user.id,
    });
    const activePairs = await BreedingPair.countDocuments({
      owner: req.user.id,
      status: "active",
    });

    // Calculate more complex stats here...
    // For now, using placeholder values
    const successRate = 75;
    const upcomingHatches = 3;

    res.json({
      totalProjects,
      activePairs,
      successRate,
      upcomingHatches,
    });
  } catch (error) {
    console.error("Error fetching breeding stats:", error);
    res.status(500).json({ message: "Error fetching breeding statistics" });
  }
});

// Get recent breeding calculations
router.get("/calculations/recent", auth, isBuyer, async (req, res) => {
  try {
    // In a real implementation, you'd fetch from a Calculation model
    // For now, return mock data
    const mockCalculations = [
      {
        id: "calc-" + Math.random().toString(36).substring(2, 9),
        breed1: "Rhode Island Red",
        breed2: "Plymouth Rock",
        score: 85,
        date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      },
      {
        id: "calc-" + Math.random().toString(36).substring(2, 9),
        breed1: "Leghorn",
        breed2: "Sussex",
        score: 72,
        date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      },
      {
        id: "calc-" + Math.random().toString(36).substring(2, 9),
        breed1: "Orpington",
        breed2: "Wyandotte",
        score: 93,
        date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      },
    ];

    res.json(mockCalculations);
  } catch (error) {
    console.error("Error fetching recent calculations:", error);
    res.status(500).json({ message: "Error fetching recent calculations" });
  }
});

// Get breeds by category
router.get("/breeds/:category", async (req, res) => {
  try {
    const { category } = req.params;

    // Fetch breeds from products in that category
    const products = await Product.find({
      category: category.toLowerCase(),
      breed: { $exists: true, $ne: "" },
    }).distinct("breed");

    // Transform into breed objects
    const breeds = products.map((breed) => ({
      name: breed,
      category: category.toLowerCase(),
    }));

    res.json(breeds);
  } catch (error) {
    console.error(
      `Error fetching breeds for category ${req.params.category}:`,
      error
    );
    res.status(500).json({ message: "Error fetching breeds" });
  }
});

// Get breeding analytics data
router.get("/analytics", auth, isBuyer, async (req, res) => {
  try {
    const { timeRange = "month" } = req.query;

    // In a real implementation, calculate actual analytics
    // For now, return mock data based on the requested time range

    let mockAnalytics;
    if (timeRange === "year") {
      mockAnalytics = {
        successRate: {
          overall: 78,
          byMonth: [75, 76, 77, 78, 79, 80, 77, 76, 75, 77, 78, 79],
        },
        hatchRate: {
          overall: 82,
          byMonth: [80, 81, 82, 83, 84, 81, 82, 83, 84, 81, 82, 83],
        },
        breedPerformance: [
          { breed: "Rhode Island Red", successRate: 85, hatchRate: 88 },
          { breed: "Leghorn", successRate: 81, hatchRate: 85 },
          { breed: "Plymouth Rock", successRate: 79, hatchRate: 82 },
        ],
      };
    } else {
      mockAnalytics = {
        successRate: {
          overall: 78,
          byWeek: [76, 77, 78, 80],
        },
        hatchRate: {
          overall: 82,
          byWeek: [80, 81, 82, 84],
        },
        breedPerformance: [
          { breed: "Rhode Island Red", successRate: 85, hatchRate: 88 },
          { breed: "Leghorn", successRate: 81, hatchRate: 85 },
          { breed: "Plymouth Rock", successRate: 79, hatchRate: 82 },
        ],
      };
    }

    res.json(mockAnalytics);
  } catch (error) {
    console.error("Error fetching breeding analytics:", error);
    res.status(500).json({ message: "Error fetching breeding analytics" });
  }
});

module.exports = router;
