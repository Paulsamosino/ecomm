const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const Product = require('../models/Product');
const Order = require('../models/Order');
const User = require('../models/User');

// Get all reviews for a buyer
router.get('/my-reviews', protect, async (req, res) => {
  try {
    const userId = req.user._id;
    
    const products = await Product.find({
      'reviews.user': userId
    }).select('_id name images reviews').populate({
      path: 'reviews.user',
      select: 'name'
    });

    const myReviews = [];
    products.forEach(product => {
      const userReviews = product.reviews.filter(
        review => review.user._id.toString() === userId.toString()
      );
      
      userReviews.forEach(review => {
        myReviews.push({
          _id: review._id,
          rating: review.rating,
          comment: review.comment,
          createdAt: review.createdAt,
          product: {
            _id: product._id,
            name: product.name,
            image: product.images[0]
          }
        });
      });
    });

    myReviews.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json(myReviews);
  } catch (error) {
    console.error('Error fetching user reviews:', error);
    res.status(500).json({ message: error.message });
  }
});

// Check if user can review a product
router.get('/can-review/:productId', protect, async (req, res) => {
  try {
    const userId = req.user._id;
    const productId = req.params.productId;

    // Check if user has purchased and received the product
    const purchasedOrder = await Order.findOne({
      buyer: userId,
      'items.product': productId,
      status: 'delivered'
    });

    if (!purchasedOrder) {
      return res.json({ canReview: false, reason: 'Must purchase and receive product first' });
    }

    // Check if already reviewed
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const existingReview = product.reviews.find(
      review => review.user.toString() === userId.toString()
    );

    if (existingReview) {
      return res.json({ 
        canReview: false, 
        reason: 'Already reviewed', 
        reviewId: existingReview._id 
      });
    }

    res.json({ canReview: true });
  } catch (error) {
    console.error('Error checking review eligibility:', error);
    res.status(500).json({ message: error.message });
  }
});

// Update existing review
router.put('/review/:reviewId', protect, async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const { reviewId } = req.params;
    const userId = req.user._id;

    // Validation
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }
    if (!comment || comment.trim().length === 0) {
      return res.status(400).json({ message: 'Comment is required' });
    }

    const product = await Product.findOne({
      'reviews._id': reviewId,
      'reviews.user': userId
    });

    if (!product) {
      return res.status(404).json({ message: 'Review not found or unauthorized' });
    }

    const review = product.reviews.id(reviewId);
    review.rating = rating;
    review.comment = comment.trim();

    await product.save();
    res.json({ message: 'Review updated successfully', review });
  } catch (error) {
    console.error('Error updating review:', error);
    res.status(500).json({ message: error.message });
  }
});

// Delete review
router.delete('/review/:reviewId', protect, async (req, res) => {
  try {
    const { reviewId } = req.params;
    const userId = req.user._id;

    const product = await Product.findOne({
      'reviews._id': reviewId,
      'reviews.user': userId
    });

    if (!product) {
      return res.status(404).json({ message: 'Review not found or unauthorized' });
    }

    product.reviews.pull({ _id: reviewId });
    await product.save();
    res.json({ message: 'Review deleted successfully' });
  } catch (error) {
    console.error('Error deleting review:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get products eligible for review
router.get('/eligible-products', protect, async (req, res) => {
  try {
    const userId = req.user._id;
    
    // Get delivered orders
    const orders = await Order.find({
      buyer: userId,
      status: 'delivered'
    }).populate('items.product', '_id name images');

    const eligibleProducts = [];
    
    for (const order of orders) {
      for (const item of order.items) {
        if (!item.product) continue;
        
        // Check if already reviewed
        const product = await Product.findById(item.product._id);
        const hasReviewed = product.reviews.some(
          review => review.user.toString() === userId.toString()
        );
        
        if (!hasReviewed) {
          eligibleProducts.push({
            _id: item.product._id,
            name: item.product.name,
            image: item.product.images[0],
            orderId: order._id,
            deliveredAt: order.updatedAt
          });
        }
      }
    }

    // Remove duplicates based on product ID
    const uniqueProducts = eligibleProducts.filter((product, index, self) => 
      index === self.findIndex(p => p._id.toString() === product._id.toString())
    );

    res.json(uniqueProducts);
  } catch (error) {
    console.error('Error fetching eligible products:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get review statistics for a product
router.get('/stats/:productId', async (req, res) => {
  try {
    const product = await Product.findById(req.params.productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const reviews = product.reviews;
    const totalReviews = reviews.length;

    if (totalReviews === 0) {
      return res.json({
        totalReviews: 0,
        averageRating: 0,
        ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
      });
    }

    const ratingDistribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    let totalRating = 0;

    reviews.forEach(review => {
      ratingDistribution[review.rating]++;
      totalRating += review.rating;
    });

    const averageRating = (totalRating / totalReviews).toFixed(1);

    res.json({
      totalReviews,
      averageRating: parseFloat(averageRating),
      ratingDistribution
    });
  } catch (error) {
    console.error('Error fetching review stats:', error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
