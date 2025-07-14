const express = require("express");
const router = express.Router();
const path = require("path");
const auth = require("../middleware/auth");
const Product = require("../models/Product");
const Order = require("../models/Order");
const { upload } = require("../config/cloudinary");
const mongoose = require("mongoose");

// Get seller's products
router.get("/seller", auth, async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res
        .status(401)
        .json({ message: "Unauthorized - No user ID found" });
    }

    console.log("Fetching products for seller:", req.user.id);

    // Convert seller ID to ObjectId
    const sellerId = new mongoose.Types.ObjectId(req.user.id);

    const products = await Product.find({ seller: sellerId })
      .populate("seller", "name email")
      .sort({ createdAt: -1 });

    console.log("Found products:", products.length);
    res.json(products);
  } catch (error) {
    console.error("Error fetching seller products:", error);
    console.error("Error stack:", error.stack);
    res.status(500).json({
      message: "Error fetching seller products",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// Create a new product
router.post("/", auth, upload.array("images", 5), async (req, res) => {
  try {
    console.log("Request body:", req.body);
    console.log("Request files:", req.files);
    console.log("User ID:", req.user.id);

    const {
      name,
      description,
      price,
      quantity,
      category,
      breed,
      age,
      location = "Not specified",
      shippingInfo = "Standard shipping available",
    } = req.body;

    // Validate required fields
    if (
      !name ||
      !description ||
      !price ||
      !quantity ||
      !category ||
      !breed ||
      !age
    ) {
      return res.status(400).json({
        message: "Missing required fields",
        missing: {
          name: !name,
          description: !description,
          price: !price,
          quantity: !quantity,
          category: !category,
          breed: !breed,
          age: !age,
        },
      });
    }

    // Get image URLs from Cloudinary
    const images =
      req.files && req.files.length > 0
        ? req.files.map((file) => file.path)
        : [
            "https://res.cloudinary.com/demo/image/upload/v1681234567/poultrymart/default-product.jpg",
          ];

    console.log("Image URLs:", images);

    const product = new Product({
      name,
      description,
      price: parseFloat(price),
      quantity: parseInt(quantity),
      category,
      breed,
      age: parseInt(age),
      images,
      location,
      shippingInfo,
      seller: req.user.id,
    });

    console.log("Product to save:", product);

    await product.save();
    console.log("Product saved successfully");
    res.status(201).json(product);
  } catch (error) {
    console.error("Error creating product:", error);
    console.error("Error stack:", error.stack);
    res.status(500).json({
      message: error.message || "Error creating product",
      error: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  }
});

// Get all products
router.get("/", async (req, res) => {
  try {
    console.log("Received request with query:", req.query);

    const {
      category,
      search,
      minPrice,
      maxPrice,
      seller,
      location,
      inStock,
      sort,
      page = 1,
      limit = 9,
    } = req.query;

    const query = {};

    // Validate page and limit
    const pageInt = Math.max(parseInt(page) || 1, 1);
    const limitInt = Math.min(parseInt(limit) || 9, 50);
    const skip = (pageInt - 1) * limitInt;

    // Build query based on filters
    if (category && category !== "all") query.category = category;
    if (seller) {
      // Ensure seller is a valid ObjectId
      if (mongoose.Types.ObjectId.isValid(seller)) {
        query.seller = new mongoose.Types.ObjectId(seller);
      }
    }
    if (location && location !== "All Locations") query.location = location;
    if (inStock === "true") query.quantity = { $gt: 0 };

    // Price filter
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = parseFloat(minPrice) || 0;
      if (maxPrice) query.price.$lte = parseFloat(maxPrice) || 1000;
    }

    // Search filter
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { breed: { $regex: search, $options: "i" } },
      ];
    }

    // Get sort option
    let sortOption = { createdAt: -1 }; // Default sort by newest
    if (sort) {
      switch (sort) {
        case "price":
          sortOption = { price: 1 };
          break;
        case "-price":
          sortOption = { price: -1 };
          break;
        case "-rating":
          // Ensure products without ratings appear last
          sortOption = {
            averageRating: -1,
            createdAt: -1, // Secondary sort by newest
          };
          // Only include products with valid ratings
          query.averageRating = { $gte: 0 };
          break;
        case "-createdAt":
          sortOption = { createdAt: -1 };
          break;
        default:
          sortOption = { createdAt: -1 };
      }
    }

    console.log("Built query:", JSON.stringify(query, null, 2));
    console.log("Sort option:", sortOption);

    // Count total products matching the query
    const totalProducts = await Product.countDocuments(query);
    const totalPages = Math.ceil(totalProducts / limitInt);

    console.log(`Found ${totalProducts} products matching query`);
    console.log(`Pagination: page=${pageInt}, limit=${limitInt}, skip=${skip}`);

    // Execute query with pagination and sorting
    const products = await Product.find(query)
      .populate(
        "seller",
        "name email sellerProfile.businessName sellerProfile.rating"
      )
      .sort(sortOption)
      .skip(skip)
      .limit(limitInt)
      .lean() // Use lean() for better performance
      .catch((err) => {
        console.error("Error in Product.find():", err);
        throw new Error(`Database query failed: ${err.message}`);
      });

    console.log(`Returning ${products.length} products`);

    // Return structured response
    res.json({
      success: true,
      products,
      totalProducts,
      totalPages,
      currentPage: pageInt,
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    console.error("Error stack:", error.stack);

    // More detailed error response
    res.status(500).json({
      success: false,
      message: "Error fetching products",
      error: {
        message: error.message,
        ...(process.env.NODE_ENV === "development" && {
          stack: error.stack,
          code: error.code,
          name: error.name,
        }),
      },
      timestamp: new Date().toISOString(),
      request: {
        url: req.originalUrl,
        method: req.method,
        query: req.query,
        params: req.params,
      },
    });
  }
});

// Get a single product
router.get("/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate(
      "seller",
      "name email"
    );

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.json(product);
  } catch (error) {
    console.error("Error fetching product:", error);
    res.status(500).json({ message: "Error fetching product" });
  }
});

// Update a product
router.put("/:id", auth, upload.array("images", 5), async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Check if user is the seller
    if (product.seller.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const updateData = { ...req.body };

    // Handle new images if uploaded
    if (req.files && req.files.length > 0) {
      // Add new images
      updateData.images = req.files.map((file) => file.path);
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
});

// Delete a product
router.delete("/:id", auth, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Check if user is the seller
    if (product.seller.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized" });
    }

    await product.deleteOne();
    res.json({ message: "Product removed" });
  } catch (error) {
    console.error("Error deleting product:", error);
    res.status(500).json({ message: "Error deleting product" });
  }
});

// Add a review to a product
router.post("/:productId/reviews", auth, async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const productId = req.params.productId;
    const userId = req.user._id;

    // Validate input
    if (!rating || !comment) {
      return res.status(400).json({
        message: "Rating and comment are required",
      });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        message: "Rating must be between 1 and 5",
      });
    }

    // Check if product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Check if user has purchased this product
    const hasPurchased = await Order.findOne({
      buyer: userId,
      "items.product": productId,
      "paymentInfo.status": "completed",
    });

    if (!hasPurchased) {
      return res.status(403).json({
        message: "You can only review products you have purchased",
      });
    }

    // Check if user has already reviewed this product
    const existingReview = product.reviews.find(
      (review) => review.user.toString() === userId.toString()
    );

    if (existingReview) {
      return res.status(400).json({
        message: "You have already reviewed this product",
      });
    }

    // Add the review
    const newReview = {
      user: userId,
      rating: Number(rating),
      comment: comment.trim(),
      createdAt: new Date(),
    };

    product.reviews.push(newReview);
    await product.save(); // This will trigger the pre-save hook to update averageRating

    // Populate the user data for the response
    await product.populate({
      path: "reviews.user",
      select: "name",
    });

    // Get the added review with user data
    const addedReview = product.reviews[product.reviews.length - 1];

    res.status(201).json({
      message: "Review added successfully",
      review: {
        _id: addedReview._id,
        rating: addedReview.rating,
        comment: addedReview.comment,
        createdAt: addedReview.createdAt,
        userName: addedReview.user.name,
      },
      product: {
        averageRating: product.averageRating,
        numReviews: product.numReviews,
      },
    });
  } catch (error) {
    console.error("Error adding review:", error);
    res.status(500).json({
      message: "Failed to add review",
      error: error.message,
    });
  }
});

// Get reviews for a product
router.get("/:productId/reviews", async (req, res) => {
  try {
    const productId = req.params.productId;

    const product = await Product.findById(productId).populate({
      path: "reviews.user",
      select: "name",
    });

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    const reviews = product.reviews.map((review) => ({
      _id: review._id,
      rating: review.rating,
      comment: review.comment,
      createdAt: review.createdAt,
      userName: review.user.name,
    }));

    res.json({
      reviews,
      averageRating: product.averageRating,
      numReviews: product.numReviews,
    });
  } catch (error) {
    console.error("Error fetching reviews:", error);
    res.status(500).json({
      message: "Failed to fetch reviews",
      error: error.message,
    });
  }
});

// Check if user can review a product (has purchased it)
router.get("/:productId/can-review", auth, async (req, res) => {
  try {
    const productId = req.params.productId;
    const userId = req.user._id;

    // Check if product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Check if user has purchased this product
    const hasPurchased = await Order.findOne({
      buyer: userId,
      "items.product": productId,
      "paymentInfo.status": "completed",
    });

    // Check if user has already reviewed this product
    const hasReviewed = product.reviews.some(
      (review) => review.user.toString() === userId.toString()
    );

    res.json({
      canReview: hasPurchased && !hasReviewed,
      hasPurchased: !!hasPurchased,
      hasReviewed,
    });
  } catch (error) {
    console.error("Error checking review eligibility:", error);
    res.status(500).json({
      message: "Failed to check review eligibility",
      error: error.message,
    });
  }
});

module.exports = router;
