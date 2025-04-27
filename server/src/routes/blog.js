const express = require("express");
const router = express.Router();
const { auth, isAdmin } = require("../middleware/auth");
const blogController = require("../controllers/blogController");

// Public routes
router.get("/", blogController.getAllPosts);
router.get("/categories", blogController.getCategories);
router.get("/tags", blogController.getTags);
router.get("/:slug", blogController.getPostBySlug);

// Admin only routes
router.post("/", auth, isAdmin, blogController.createPost);
router.put("/:id", auth, isAdmin, blogController.updatePost);
router.delete("/:id", auth, isAdmin, blogController.deletePost);

module.exports = router;
