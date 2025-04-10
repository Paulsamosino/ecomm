const BlogPost = require("../models/BlogPost");

// Get all blog posts
exports.getAllPosts = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      category,
      tag,
      search,
      featured,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    const query = { isPublished: true };

    // Filter by category
    if (category) {
      query.category = category;
    }

    // Filter by tag
    if (tag) {
      query.tags = { $in: [tag] };
    }

    // Filter by featured
    if (featured === "true") {
      query.featuredPost = true;
    }

    // Search in title or content
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { content: { $regex: search, $options: "i" } },
        { excerpt: { $regex: search, $options: "i" } },
      ];
    }

    // Sort options
    const sort = {};
    sort[sortBy] = sortOrder === "asc" ? 1 : -1;

    const posts = await BlogPost.find(query)
      .populate("author", "name email")
      .sort(sort)
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const totalPosts = await BlogPost.countDocuments(query);

    res.json({
      posts,
      totalPages: Math.ceil(totalPosts / limit),
      currentPage: parseInt(page),
      totalPosts,
    });
  } catch (error) {
    console.error("Error fetching blog posts:", error);
    res.status(500).json({
      message: "Server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Get single blog post by slug
exports.getPostBySlug = async (req, res) => {
  try {
    const { slug } = req.params;

    const post = await BlogPost.findOne({ slug, isPublished: true }).populate(
      "author",
      "name email"
    );

    if (!post) {
      return res.status(404).json({ message: "Blog post not found" });
    }

    // Increment view count
    post.views += 1;
    await post.save();

    res.json(post);
  } catch (error) {
    console.error("Error fetching blog post:", error);
    res.status(500).json({
      message: "Server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Create a new blog post (admin only)
exports.createPost = async (req, res) => {
  try {
    const {
      title,
      content,
      excerpt,
      category,
      tags,
      coverImage,
      featuredPost,
    } = req.body;

    // Use the authenticated user's ID as the author
    const author = req.user.id;

    // Calculate read time (rough estimate: 200 words per minute)
    const wordCount = content.split(/\s+/).length;
    const readTime = Math.ceil(wordCount / 200);

    const post = await BlogPost.create({
      title,
      content,
      excerpt,
      author,
      category,
      tags: tags ? tags.split(",").map((tag) => tag.trim()) : [],
      coverImage: coverImage || "/public/chicken.svg",
      featuredPost: featuredPost === "true",
      readTime,
      slug: title
        .toLowerCase()
        .replace(/[^\w ]+/g, "")
        .replace(/ +/g, "-"),
    });

    res.status(201).json(post);
  } catch (error) {
    console.error("Error creating blog post:", error);

    if (error.code === 11000) {
      return res.status(400).json({
        message:
          "A post with this title already exists. Please choose a different title.",
      });
    }

    res.status(500).json({
      message: "Server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Update a blog post (admin only)
exports.updatePost = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      content,
      excerpt,
      category,
      tags,
      coverImage,
      featuredPost,
      isPublished,
    } = req.body;

    const post = await BlogPost.findById(id);

    if (!post) {
      return res.status(404).json({ message: "Blog post not found" });
    }

    // Calculate read time if content changed
    let readTime = post.readTime;
    if (content && content !== post.content) {
      const wordCount = content.split(/\s+/).length;
      readTime = Math.ceil(wordCount / 200);
    }

    // Update the post
    const updatedPost = await BlogPost.findByIdAndUpdate(
      id,
      {
        title: title || post.title,
        content: content || post.content,
        excerpt: excerpt || post.excerpt,
        category: category || post.category,
        tags: tags ? tags.split(",").map((tag) => tag.trim()) : post.tags,
        coverImage: coverImage || post.coverImage,
        featuredPost:
          featuredPost !== undefined
            ? featuredPost === "true"
            : post.featuredPost,
        isPublished:
          isPublished !== undefined ? isPublished === "true" : post.isPublished,
        readTime,
        updatedAt: Date.now(),
      },
      { new: true }
    );

    res.json(updatedPost);
  } catch (error) {
    console.error("Error updating blog post:", error);

    if (error.code === 11000) {
      return res.status(400).json({
        message:
          "A post with this title already exists. Please choose a different title.",
      });
    }

    res.status(500).json({
      message: "Server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Delete a blog post (admin only)
exports.deletePost = async (req, res) => {
  try {
    const { id } = req.params;

    const post = await BlogPost.findById(id);

    if (!post) {
      return res.status(404).json({ message: "Blog post not found" });
    }

    await BlogPost.findByIdAndDelete(id);

    res.json({ message: "Blog post deleted successfully" });
  } catch (error) {
    console.error("Error deleting blog post:", error);
    res.status(500).json({
      message: "Server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Get blog categories and post counts
exports.getCategories = async (req, res) => {
  try {
    const categories = await BlogPost.aggregate([
      { $match: { isPublished: true } },
      { $group: { _id: "$category", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    res.json(
      categories.map((cat) => ({
        name: cat._id,
        count: cat.count,
      }))
    );
  } catch (error) {
    console.error("Error fetching blog categories:", error);
    res.status(500).json({
      message: "Server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Get popular tags
exports.getTags = async (req, res) => {
  try {
    const tags = await BlogPost.aggregate([
      { $match: { isPublished: true } },
      { $unwind: "$tags" },
      { $group: { _id: "$tags", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 15 },
    ]);

    res.json(
      tags.map((tag) => ({
        name: tag._id,
        count: tag.count,
      }))
    );
  } catch (error) {
    console.error("Error fetching blog tags:", error);
    res.status(500).json({
      message: "Server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};
