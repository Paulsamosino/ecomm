const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const blog = require("../controllers/blogController");

// Public
router.get("/", blog.getAllPosts);
router.get("/categories", blog.getCategories);
router.get("/tags", blog.getTags);
router.get("/:slug", blog.getPostBySlug);

// Auth required
router.get("/post/:id", protect, blog.getPostById);
router.get("/feed/me", protect, blog.feed);
router.post("/", protect, blog.createPost);
router.put("/:id", protect, blog.updatePost);
router.delete("/:id", protect, blog.deletePost);

router.get("/:id/comments", blog.getComments);
router.post("/:id/comments", protect, blog.addComment);
router.delete("/:id/comments/:commentId", protect, blog.deleteComment);

router.post("/:id/vote", protect, blog.votePost);
router.post("/comments/:commentId/vote", protect, blog.voteComment);

module.exports = router;
