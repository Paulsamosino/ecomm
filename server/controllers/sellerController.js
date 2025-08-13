const User = require("../src/models/User");
const Product = require("../src/models/Product");
const Order = require("../src/models/Order");

// Get all seller profiles
exports.getAllSellers = async (req, res) => {
  try {
    const sellers = await User.find({ role: "seller" })
      .select("name email sellerProfile isOnline lastActive")
      .populate("sellerProfile", "businessName description storeType rating")
      .sort({ "sellerProfile.rating": -1 });

    res.json(sellers);
  } catch (error) {
    console.error("Error fetching sellers:", error);
    res.status(500).json({ message: "Error fetching sellers" });
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

// Get seller dashboard stats
exports.getSellerStats = async (req, res) => {
  try {
    const sellerId = req.user._id;

    // Get basic stats
    const products = await Product.find({ seller: sellerId });
    const orders = await Order.find({ seller: sellerId });
    
    const totalProducts = products.length;
    const totalOrders = orders.length;
    const pendingOrders = orders.filter(order => order.status === 'pending').length;
    const completedOrders = orders.filter(order => order.status === 'delivered').length;
    
    // Calculate total revenue
    const totalRevenue = orders
      .filter(order => order.status === 'delivered')
      .reduce((sum, order) => sum + order.totalAmount, 0);

    // Get total reviews
    const totalReviews = products.reduce((sum, product) => sum + (product.reviews?.length || 0), 0);
    
    // Calculate average rating
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

    res.json({
      totalProducts,
      totalOrders,
      pendingOrders,
      completedOrders,
      totalRevenue,
      totalReviews,
      averageRating: parseFloat(averageRating)
    });
  } catch (error) {
    console.error("Error fetching seller stats:", error);
    res.status(500).json({ message: "Error fetching stats" });
  }
};

// Get seller products
exports.getSellerProducts = async (req, res) => {
  try {
    const sellerId = req.user._id;
    const products = await Product.find({ seller: sellerId })
      .populate("seller", "name email")
      .sort({ createdAt: -1 });

    res.json(products);
  } catch (error) {
    console.error("Error fetching seller products:", error);
    res.status(500).json({ message: "Error fetching products" });
  }
};

// Create new product
exports.createProduct = async (req, res) => {
  try {
    const productData = {
      ...req.body,
      seller: req.user._id,
      images: req.files ? req.files.map(file => file.path) : []
    };

    const product = new Product(productData);
    await product.save();

    res.status(201).json(product);
  } catch (error) {
    console.error("Error creating product:", error);
    res.status(500).json({ message: "Error creating product" });
  }
};

// Update product
exports.updateProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    if (product.seller.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const updateData = { ...req.body };
    if (req.files && req.files.length > 0) {
      updateData.images = req.files.map(file => file.path);
    }

    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );

    res.json(updatedProduct);
  } catch (error) {
    console.error("Error updating product:", error);
    res.status(500).json({ message: "Error updating product" });
  }
};

// Delete product
exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    if (product.seller.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    await product.deleteOne();
    res.json({ message: "Product removed" });
  } catch (error) {
    console.error("Error deleting product:", error);
    res.status(500).json({ message: "Error deleting product" });
  }
};

// Get seller orders
exports.getSellerOrders = async (req, res) => {
  try {
    const sellerId = req.user._id;
    const orders = await Order.find({ seller: sellerId })
      .populate("buyer", "name email")
      .populate("items.product", "name images price")
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (error) {
    console.error("Error fetching seller orders:", error);
    res.status(500).json({ message: "Error fetching orders" });
  }
};

// Update order status
exports.updateOrderStatus = async (req, res) => {
  try {
    const { status, notes } = req.body;
    const order = await Order.findById(req.params.id)
      .populate("buyer", "name email")
      .populate("seller", "name email");

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (order.seller._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    order.status = status;
    if (notes) order.notes = notes;
    await order.save();

    res.json(order);
  } catch (error) {
    console.error("Error updating order status:", error);
    res.status(500).json({ message: "Error updating order status" });
  }
};

// Get seller customers
exports.getSellerCustomers = async (req, res) => {
  try {
    const sellerId = req.user._id;
    const orders = await Order.find({ seller: sellerId })
      .populate("buyer", "name email")
      .sort({ createdAt: -1 });

    // Extract unique customers
    const customersMap = new Map();
    orders.forEach(order => {
      if (order.buyer && !customersMap.has(order.buyer._id.toString())) {
        customersMap.set(order.buyer._id.toString(), {
          _id: order.buyer._id,
          name: order.buyer.name,
          email: order.buyer.email,
          totalOrders: 0,
          totalSpent: 0,
          lastPurchase: null
        });
      }
    });

    // Calculate stats for each customer
    const customers = Array.from(customersMap.values());
    customers.forEach(customer => {
      const customerOrders = orders.filter(
        order => order.buyer && order.buyer._id.toString() === customer._id.toString()
      );
      
      customer.totalOrders = customerOrders.length;
      customer.totalSpent = customerOrders.reduce((sum, order) => sum + order.totalAmount, 0);
      customer.lastPurchase = customerOrders[0]?.createdAt || null;
    });

    res.json(customers);
  } catch (error) {
    console.error("Error fetching seller customers:", error);
    res.status(500).json({ message: "Error fetching customers" });
  }
};

// Get seller analytics
exports.getSellerAnalytics = async (req, res) => {
  try {
    const sellerId = req.user._id;

    // Get basic counts
    const products = await Product.find({ seller: sellerId });
    const orders = await Order.find({ seller: sellerId });

    // Very simple analytics
    const analytics = {
      products: products.length,
      orders: orders.length,
      revenue: orders
        .filter(order => order.status === 'delivered')
        .reduce((sum, order) => sum + (order.totalAmount || 0), 0)
    };

    res.json(analytics);
    
  } catch (error) {
    console.error("Error fetching seller analytics:", error);
    res.status(500).json({ message: "Error fetching analytics" });
  }
};
