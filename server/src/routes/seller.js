const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const Product = require("../models/Product");
const Order = require("../models/Order");
const User = require("../models/User");
const sellerController = require("../controllers/sellerController");

// Get all sellers
router.get("/all", protect, async (req, res) => {
  try {
    const sellers = await User.find({ isSeller: true })
      .select("name email sellerProfile isOnline lastActive")
      .populate("sellerProfile", "businessName description storeType rating")
      .sort({ "sellerProfile.rating": -1 });

    res.json(sellers);
  } catch (error) {
    console.error("Error fetching sellers:", error);
    res.status(500).json({ message: "Error fetching sellers" });
  }
});

// Get seller dashboard stats
router.get("/stats", protect, async (req, res) => {
  try {
    const totalProducts = await Product.countDocuments({ seller: req.user.id });
    const totalOrders = await Order.countDocuments({ seller: req.user.id });
    const totalRevenue = await Order.aggregate([
      { $match: { seller: req.user.id, status: "completed" } },
      { $group: { _id: null, total: { $sum: "$total" } } },
    ]);
    const revenue = totalRevenue.length > 0 ? totalRevenue[0].total : 0;

    const recentOrders = await Order.find({ seller: req.user.id })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate("buyer", "name email");

    const topProducts = await Order.aggregate([
      { $match: { seller: req.user.id } },
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.product",
          totalSold: { $sum: "$items.quantity" },
        },
      },
      { $sort: { totalSold: -1 } },
      { $limit: 5 },
    ]);

    res.json({
      stats: {
        totalProducts,
        totalOrders,
        revenue,
        recentOrders,
        topProducts,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// Get seller products
router.get("/products", protect, async (req, res) => {
  try {
    const products = await Product.find({ seller: req.user.id }).sort({
      createdAt: -1,
    });
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// Add new product
router.post("/products", protect, async (req, res) => {
  try {
    const { name, description, price, category, stock, images } = req.body;
    const product = new Product({
      seller: req.user.id,
      name,
      description,
      price,
      category,
      stock,
      images,
    });
    await product.save();
    res.status(201).json(product);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// Update product
router.put("/products/:id", protect, async (req, res) => {
  try {
    const product = await Product.findOneAndUpdate(
      { _id: req.params.id, seller: req.user.id },
      req.body,
      { new: true }
    );
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// Delete product
router.delete("/products/:id", protect, async (req, res) => {
  try {
    const product = await Product.findOneAndDelete({
      _id: req.params.id,
      seller: req.user.id,
    });
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    res.json({ message: "Product deleted" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// Get seller orders
router.get("/orders", protect, async (req, res) => {
  try {
    const orders = await Order.find({ seller: req.user.id })
      .sort({ createdAt: -1 })
      .populate("buyer", "name email")
      .populate("items.product");
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// Update order status
router.put("/orders/:id", protect, async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findOneAndUpdate(
      { _id: req.params.id, seller: req.user.id },
      { status },
      { new: true }
    );
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }
    res.json(order);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// Get seller customers
router.get("/customers", protect, async (req, res) => {
  try {
    const orders = await Order.find({ seller: req.user.id }).populate(
      "buyer",
      "name email phone city state"
    );

    const customers = orders.reduce((acc, order) => {
      const buyer = order.buyer;
      if (!acc[buyer._id]) {
        acc[buyer._id] = {
          _id: buyer._id,
          name: buyer.name,
          email: buyer.email,
          phone: buyer.phone,
          city: buyer.city,
          state: buyer.state,
          totalOrders: 0,
          totalSpent: 0,
          lastPurchase: null,
          status: "active",
          averageRating: 4.5, // Placeholder - implement actual rating system
        };
      }
      acc[buyer._id].totalOrders++;
      acc[buyer._id].totalSpent += order.total;
      if (
        !acc[buyer._id].lastPurchase ||
        new Date(order.createdAt) > new Date(acc[buyer._id].lastPurchase)
      ) {
        acc[buyer._id].lastPurchase = order.createdAt;
      }
      return acc;
    }, {});

    res.json(Object.values(customers));
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// Get seller analytics
router.get("/analytics", protect, async (req, res) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const dailyRevenue = await Order.aggregate([
      {
        $match: {
          seller: req.user.id,
          status: "completed",
          createdAt: { $gte: thirtyDaysAgo },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          revenue: { $sum: "$total" },
          orders: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const categoryBreakdown = await Order.aggregate([
      { $match: { seller: req.user.id, status: "completed" } },
      { $unwind: "$items" },
      {
        $lookup: {
          from: "products",
          localField: "items.product",
          foreignField: "_id",
          as: "product",
        },
      },
      { $unwind: "$product" },
      {
        $group: {
          _id: "$product.category",
          total: { $sum: { $multiply: ["$items.quantity", "$items.price"] } },
        },
      },
    ]);

    res.json({
      dailyRevenue,
      categoryBreakdown,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// Get seller reviews
router.get("/reviews", protect, async (req, res) => {
  try {
    const reviews = await Product.aggregate([
      { $match: { seller: req.user.id } },
      { $unwind: "$reviews" },
      {
        $lookup: {
          from: "users",
          localField: "reviews.user",
          foreignField: "_id",
          as: "reviewer",
        },
      },
      { $unwind: "$reviewer" },
      {
        $project: {
          productId: "$_id",
          productName: "$name",
          rating: "$reviews.rating",
          comment: "$reviews.comment",
          createdAt: "$reviews.createdAt",
          reviewer: {
            _id: "$reviewer._id",
            name: "$reviewer.name",
          },
        },
      },
      { $sort: { createdAt: -1 } },
    ]);

    res.json(reviews);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
