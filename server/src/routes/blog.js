const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middleware/authMiddleware");
const blogController = require("../controllers/blogController");

// Public routes
router.get("/", blogController.getAllPosts);
router.get("/categories", blogController.getCategories);
router.get("/tags", blogController.getTags);
router.get("/:slug", blogController.getPostBySlug);

// Admin only routes
router.post("/", protect, authorize("admin"), blogController.createPost);
router.put("/:id", protect, authorize("admin"), blogController.updatePost);
router.delete("/:id", protect, authorize("admin"), blogController.deletePost);

module.exports = router;
