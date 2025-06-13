const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const { protect } = require("../middleware/authMiddleware");
const Product = require("../models/Product");
const Order = require("../models/Order");
const User = require("../models/User");
const sellerController = require("../controllers/sellerController");

// Public routes for accessing seller information without authentication

// Get public seller profile by ID
router.get("/:sellerId/profile", async (req, res) => {
  try {
    const { sellerId } = req.params;

    // Validate sellerId
    if (!mongoose.Types.ObjectId.isValid(sellerId)) {
      return res.status(400).json({ message: "Invalid seller ID" });
    }

    const seller = await User.findOne({
      _id: sellerId,
      isSeller: true,
    })
      .select("name email sellerProfile isOnline lastActive")
      .populate(
        "sellerProfile",
        "businessName description storeType rating contactInfo"
      );

    if (!seller) {
      return res.status(404).json({ message: "Seller not found" });
    }

    res.json(seller);
  } catch (error) {
    console.error("Error fetching seller profile:", error);
    res.status(500).json({ message: "Error fetching seller profile" });
  }
});

// Get public seller products by seller ID
router.get("/:sellerId/products", async (req, res) => {
  try {
    const { sellerId } = req.params;

    // Validate sellerId
    if (!mongoose.Types.ObjectId.isValid(sellerId)) {
      return res.status(400).json({ message: "Invalid seller ID" });
    }

    // Check if seller exists
    const seller = await User.findOne({
      _id: sellerId,
      isSeller: true,
    });

    if (!seller) {
      return res.status(404).json({ message: "Seller not found" });
    }

    const products = await Product.find({
      seller: sellerId,
      isActive: { $ne: false }, // Only show active products
    }).sort({
      createdAt: -1,
    });

    res.json(products);
  } catch (error) {
    console.error("Error fetching seller products:", error);
    res.status(500).json({ message: "Error fetching seller products" });
  }
});

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
router.put("/orders/:id/status", protect, async (req, res) => {
  try {
    const { status, trackingNumber } = req.body;

    // Validate status
    const validStatuses = [
      "pending",
      "processing",
      "shipped",
      "delivered",
      "completed",
      "cancelled",
    ];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid order status" });
    }

    // Find the order
    const order = await Order.findOne({
      _id: req.params.id,
      seller: req.user.id,
    });

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Update order
    order.status = status;
    if (trackingNumber) {
      order.trackingNumber = trackingNumber;
    }

    // Save and populate
    await order.save();
    const updatedOrder = await Order.findById(order._id)
      .populate("buyer", "name email")
      .populate("items.product");

    // Emit socket event for real-time updates
    const io = req.app.get("io");
    if (io) {
      io.to(`user:${order.buyer.toString()}`).emit("orderUpdate", {
        orderId: order._id,
        status,
        trackingNumber: order.trackingNumber,
      });
    }

    res.json(updatedOrder);
  } catch (error) {
    console.error("Error updating order status:", error);
    res.status(500).json({ message: "Error updating order status" });
  }
});

// Get order metrics
router.get("/orders/metrics", protect, async (req, res) => {
  try {
    const timeframe = parseInt(req.query.timeframe) || 30;
    const metrics = await Order.getSellerMetrics(req.user._id, timeframe);

    // Get seller profile for additional statistics
    const seller = await User.findById(req.user._id);

    if (seller?.sellerProfile?.statistics) {
      metrics.conversionRate =
        seller.sellerProfile.statistics.conversionRate || 0;
    }

    res.json(metrics);
  } catch (error) {
    console.error("Error fetching order metrics:", error);
    res.status(500).json({ message: "Error fetching order metrics" });
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
          averageRating: 4.5,
        };
      }
      acc[buyer._id].totalOrders++;
      acc[buyer._id].totalSpent += order.totalAmount; // Fix: changed from order.total to order.totalAmount
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
    console.error("Error fetching customers:", error);
    res.status(500).json({ message: "Error fetching customers" });
  }
});

// Get seller analytics
router.get("/analytics", protect, async (req, res) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const sellerId = new mongoose.Types.ObjectId(req.user.id);

    const dailyRevenue = await Order.aggregate([
      {
        $match: {
          seller: sellerId,
          status: "completed",
          createdAt: { $gte: thirtyDaysAgo },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          revenue: { $sum: "$totalAmount" },
          orders: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const categoryBreakdown = await Order.aggregate([
      { $match: { seller: sellerId, status: "completed" } },
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
          total: { $sum: { $multiply: ["$items.quantity", "$totalAmount"] } },
        },
      },
    ]);

    res.json({
      dailyRevenue,
      categoryBreakdown,
    });
  } catch (error) {
    console.error("Error fetching analytics:", error);
    res.status(500).json({ message: "Error fetching analytics data" });
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

// Get seller payment statistics
router.get("/payments/stats", protect, async (req, res) => {
  try {
    const { start, end } = req.query;
    const startDate = start
      ? new Date(start)
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const endDate = end ? new Date(end) : new Date();

    const orders = await Order.find({
      seller: req.user.id,
      createdAt: { $gte: startDate, $lte: endDate },
    });

    const stats = orders.reduce(
      (acc, order) => {
        const amount = order.totalAmount;
        const platformFee = order.paymentInfo.platformFee;

        switch (order.paymentInfo.status) {
          case "completed":
            acc.totalRevenue += amount;
            acc.successfulPayments++;
            break;
          case "pending":
            acc.pendingPayments += amount;
            break;
          case "refunded":
            acc.refundedAmount += amount;
            break;
        }

        acc.platformFees += platformFee;
        return acc;
      },
      {
        totalRevenue: 0,
        pendingPayments: 0,
        successfulPayments: 0,
        refundedAmount: 0,
        platformFees: 0,
      }
    );

    res.json(stats);
  } catch (error) {
    console.error("Error fetching payment stats:", error);
    res.status(500).json({ message: "Error fetching payment statistics" });
  }
});

// Get seller transactions
router.get("/payments/transactions", protect, async (req, res) => {
  try {
    const transactions = await Order.find({ seller: req.user.id })
      .populate("buyer", "name email")
      .sort("-createdAt")
      .limit(100);

    res.json(transactions);
  } catch (error) {
    console.error("Error fetching transactions:", error);
    res.status(500).json({ message: "Error fetching transactions" });
  }
});

// Generate payment report
router.get("/payments/report", protect, async (req, res) => {
  try {
    const { start, end } = req.query;
    const startDate = start
      ? new Date(start)
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const endDate = end ? new Date(end) : new Date();

    const orders = await Order.find({
      seller: req.user.id,
      createdAt: { $gte: startDate, $lte: endDate },
    }).populate("buyer", "name email");

    // Generate CSV content
    const csvRows = [
      // CSV Header
      [
        "Transaction ID",
        "Date",
        "Customer",
        "Email",
        "Amount",
        "Platform Fee",
        "Status",
      ].join(","),
      // CSV Data
      ...orders.map((order) =>
        [
          order.paymentInfo.transactionId,
          new Date(order.createdAt).toISOString().split("T")[0],
          order.buyer.name,
          order.buyer.email,
          order.totalAmount.toFixed(2),
          order.paymentInfo.platformFee.toFixed(2),
          order.paymentInfo.status,
        ].join(",")
      ),
    ].join("\n");

    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=payment-report-${
        new Date().toISOString().split("T")[0]
      }.csv`
    );
    res.send(csvRows);
  } catch (error) {
    console.error("Error generating report:", error);
    res.status(500).json({ message: "Error generating payment report" });
  }
});

// Process refund
router.post("/payments/:orderId/refund", protect, async (req, res) => {
  try {
    const { orderId } = req.params;
    const { reason } = req.body;

    const order = await Order.findOne({
      _id: orderId,
      seller: req.user.id,
      "paymentInfo.status": "completed",
    });

    if (!order) {
      return res
        .status(404)
        .json({ message: "Order not found or cannot be refunded" });
    }

    await order.refund(`ref_${Date.now()}`);
    order.notes = `Refunded: ${reason}`;
    await order.save();

    res.json({ message: "Refund processed successfully", order });
  } catch (error) {
    console.error("Error processing refund:", error);
    res.status(500).json({ message: "Error processing refund" });
  }
});

module.exports = router;
