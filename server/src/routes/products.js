const express = require("express");
const router = express.Router();
const path = require("path");
const auth = require("../middleware/auth");
const Product = require("../models/Product");
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

    // Build query based on filters
    if (category && category !== "all") query.category = category;
    if (seller) query.seller = seller;
    if (location && location !== "All Locations") query.location = location;
    if (inStock === "true") query.quantity = { $gt: 0 };

    // Price filter
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = parseFloat(minPrice);
      if (maxPrice) query.price.$lte = parseFloat(maxPrice);
    }

    // Search filter
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { breed: { $regex: search, $options: "i" } },
      ];
    }

    // Count total products matching the query
    const totalProducts = await Product.countDocuments(query);

    // Calculate pagination values
    const pageInt = parseInt(page);
    const limitInt = parseInt(limit);
    const totalPages = Math.ceil(totalProducts / limitInt);
    const skip = (pageInt - 1) * limitInt;

    // Get sortBy option
    let sortOption = { createdAt: -1 }; // Default sort by newest
    if (sort) {
      switch (sort) {
        case "price":
          sortOption = { price: 1 }; // Low to high
          break;
        case "-price":
          sortOption = { price: -1 }; // High to low
          break;
        case "-rating":
          sortOption = { rating: -1 }; // By rating
          break;
        default:
          sortOption = { createdAt: -1 }; // Default newest first
      }
    }

    // Execute query with pagination and sorting
    const products = await Product.find(query)
      .populate(
        "seller",
        "name email sellerProfile.businessName sellerProfile.rating"
      )
      .sort(sortOption)
      .skip(skip)
      .limit(limitInt);

    // Return structured response
    res.json({
      products,
      totalProducts,
      totalPages,
      currentPage: pageInt,
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ message: "Error fetching products" });
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

module.exports = router;
