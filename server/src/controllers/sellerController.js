const User = require("../models/User");
const Product = require("../models/Product");
const Order = require("../models/Order");

// Get all seller profiles
exports.getAllSellers = async (req, res) => {
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
};

// Get seller dashboard stats
exports.getSellerStats = async (req, res) => {
  try {
    const sellerId = req.user._id;

    // Get basic stats
    const products = await Product.find({ seller: sellerId }).populate('reviews.user', 'name');
    const orders = await Order.find({ seller: sellerId });
    
    const totalProducts = products.length;
    const totalOrders = orders.length;
    const pendingOrders = orders.filter(order => order.status === 'pending').length;
    const completedOrders = orders.filter(order => order.status === 'delivered').length;
    
    // Calculate total revenue from delivered orders
    const totalRevenue = orders
      .filter(order => order.status === 'delivered')
      .reduce((sum, order) => sum + order.totalAmount, 0);

    // Get total reviews from products (since order reviews are added to products)
    const totalReviews = products.reduce((sum, product) => sum + (product.reviews?.length || 0), 0);
    
    // Calculate average rating from all product reviews
    let totalRating = 0;
    let ratingCount = 0;
    
    products.forEach(product => {
      if (product.reviews && product.reviews.length > 0) {
        product.reviews.forEach(review => {
          totalRating += review.rating;
          ratingCount++;
        });
      }
    });
    
    const averageRating = ratingCount > 0 ? (totalRating / ratingCount).toFixed(1) : 0;

    // Get recent reviews (last 5)
    const recentReviews = [];
    products.forEach(product => {
      if (product.reviews && product.reviews.length > 0) {
        product.reviews.forEach(review => {
          recentReviews.push({
            ...review.toObject(),
            productName: product.name,
            productId: product._id
          });
        });
      }
    });
    
    // Sort by most recent and take last 5
    recentReviews.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    const latestReviews = recentReviews.slice(0, 5);

    res.json({
      totalProducts,
      totalOrders,
      pendingOrders,
      completedOrders,
      totalRevenue,
      totalReviews,
      averageRating: parseFloat(averageRating),
      recentReviews: latestReviews
    });
  } catch (error) {
    console.error("Error fetching seller stats:", error);
    res.status(500).json({ message: "Error fetching stats" });
  }
};

// Get seller analytics
exports.getSellerAnalytics = async (req, res) => {
  try {
    const sellerId = req.user._id;
    const mongoose = require('mongoose');

    // Get last 30 days of data
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Daily revenue aggregation (using "delivered" status)
    const dailyRevenue = await Order.aggregate([
      {
        $match: {
          seller: new mongoose.Types.ObjectId(sellerId),
          status: "delivered",
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

    // Category breakdown (using "delivered" status)
    const categoryBreakdown = await Order.aggregate([
      { 
        $match: { 
          seller: new mongoose.Types.ObjectId(sellerId), 
          status: "delivered" 
        } 
      },
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
          orders: { $sum: 1 }
        },
      },
      { $sort: { total: -1 } }
    ]);

    // Get recent reviews from products
    const products = await Product.find({ seller: sellerId }).populate('reviews.user', 'name');
    
    const recentReviews = [];
    products.forEach(product => {
      if (product.reviews && product.reviews.length > 0) {
        product.reviews.forEach(review => {
          recentReviews.push({
            _id: review._id,
            rating: review.rating,
            comment: review.comment,
            createdAt: review.createdAt,
            user: review.user,
            productName: product.name,
            productId: product._id
          });
        });
      }
    });
    
    // Sort by most recent
    recentReviews.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json({
      dailyRevenue,
      categoryBreakdown,
      recentReviews: recentReviews.slice(0, 10) // Last 10 reviews
    });
  } catch (error) {
    console.error("Error fetching seller analytics:", error);
    res.status(500).json({ message: "Error fetching analytics" });
  }
};

// Get seller reviews from all their products
exports.getSellerReviews = async (req, res) => {
  try {
    const sellerId = req.user._id;

    // Find all products by this seller
    const sellerProducts = await Product.find({ seller: sellerId });
    
    if (!sellerProducts || sellerProducts.length === 0) {
      return res.json([]);
    }

    // Extract all reviews from all products with product info
    const allReviews = [];
    
    for (const product of sellerProducts) {
      if (product.reviews && product.reviews.length > 0) {
        // Populate user data for each review
        await product.populate({
          path: "reviews.user",
          select: "name email"
        });

        // Add each review with product context
        product.reviews.forEach(review => {
          allReviews.push({
            _id: review._id,
            user: review.user,
            rating: review.rating,
            comment: review.comment,
            createdAt: review.createdAt,
            product: {
              _id: product._id,
              name: product.name,
              images: product.images
            }
          });
        });
      }
    }

    // Sort reviews by date (newest first)
    allReviews.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    console.log(`Found ${allReviews.length} reviews for seller ${sellerId}`);
    res.json(allReviews);
  } catch (error) {
    console.error("Error fetching seller reviews:", error);
    res.status(500).json({ 
      message: "Error fetching reviews",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
