const BlogPost = require("../models/BlogPost");
const BlogComment = require("../models/BlogComment");
const Vote = require("../models/Vote");
const Follow = require("../models/Follow");

const toSlug = (s = "") =>
	s
		.toLowerCase()
		.trim()
		.replace(/[^a-z0-9\s-]/g, "")
		.replace(/\s+/g, "-")
		.replace(/-+/g, "-");

const isAdmin = (u) => u?.role === "admin" || u?.isAdmin === true;
const isSeller = (u) => u?.role === "seller" || u?.isSeller === true;

exports.getAllPosts = async (req, res) => {
	try {
		const { q, tag, author, status = "published", sort = "newest", page = 1, limit = 10 } = req.query;
		const filter = {};
		if (status) filter.status = status;
		if (tag) filter.tags = String(tag).toLowerCase();
		if (author && author !== "me") filter.author = author;
		if (author === "me" && req.user) filter.author = req.user.id;
		if (q) filter.$text = { $search: q };

		const sortMap = {
			newest: { createdAt: -1 },
			top: { score: -1, upvotes: -1 },
			trending: { views: -1, score: -1 },
		};

		const posts = await BlogPost.find(filter)
			.populate("author", "name sellerProfile")
			.sort(sortMap[sort] || sortMap.newest)
			.skip((page - 1) * limit)
			.limit(parseInt(limit));

		const total = await BlogPost.countDocuments(filter);
		res.json({ data: posts, page: Number(page), limit: Number(limit), total });
	} catch (e) {
		console.error("Error listing posts:", e);
		res.status(500).json({ message: "Error listing posts" });
	}
};

exports.getPostBySlug = async (req, res) => {
	try {
		const post = await BlogPost.findOne({ slug: req.params.slug }).populate("author", "name sellerProfile");
		if (!post || (post.status !== "published" && !isAdmin(req.user) && String(post.author) !== String(req.user?.id))) {
			return res.status(404).json({ message: "Post not found" });
		}
		BlogPost.updateOne({ _id: post._id }, { $inc: { views: 1 } }).catch(() => {});
		res.json(post);
	} catch (e) {
		console.error("Error fetching post:", e);
		res.status(500).json({ message: "Error fetching post" });
	}
};

exports.getPostById = async (req, res) => {
	try {
		const post = await BlogPost.findById(req.params.id).populate("author", "name sellerProfile");
		if (!post) {
			return res.status(404).json({ message: "Post not found" });
		}
		
		// Only allow access if user owns the post or is admin
		if (!req.user || (String(post.author._id) !== String(req.user.id) && !isAdmin(req.user))) {
			return res.status(403).json({ message: "Access denied" });
		}
		
		res.json(post);
	} catch (e) {
		console.error("Error fetching post by ID:", e);
		res.status(500).json({ message: "Error fetching post" });
	}
};

exports.createPost = async (req, res) => {
	try {
		if (!req.user) return res.status(401).json({ message: "Auth required" });
		const { title, content, coverImage, tags = [], status = "draft" } = req.body;
		const baseSlug = toSlug(title || "");
		if (!baseSlug) return res.status(400).json({ message: "Title required" });
		let slug = baseSlug,
			n = 1;
		while (await BlogPost.findOne({ slug })) slug = `${baseSlug}-${n++}`;

		const authorType = isAdmin(req.user) ? "admin" : isSeller(req.user) ? "seller" : "buyer";

		const post = await BlogPost.create({
			title,
			slug,
			content,
			coverImage,
			tags: tags.map((t) => String(t).toLowerCase().trim()).filter(Boolean),
			status,
			author: req.user.id,
			authorType,
		});
		res.status(201).json(post);
	} catch (e) {
		console.error("Error creating post:", e);
		res.status(500).json({ message: "Error creating post" });
	}
};

exports.updatePost = async (req, res) => {
	try {
		const post = await BlogPost.findById(req.params.id);
		if (!post) return res.status(404).json({ message: "Post not found" });
		const owns = req.user && String(post.author) === String(req.user.id);
		if (!isAdmin(req.user) && !owns) return res.status(403).json({ message: "Not allowed" });

		const { title, content, coverImage, tags, status } = req.body;
		if (title && title !== post.title) {
			const baseSlug = toSlug(title);
			let slug = baseSlug,
				n = 1;
			while (await BlogPost.findOne({ slug, _id: { $ne: post._id } })) slug = `${baseSlug}-${n++}`;
			post.slug = slug;
			post.title = title;
		}
		if (content !== undefined) post.content = content;
		if (coverImage !== undefined) post.coverImage = coverImage;
		if (Array.isArray(tags)) post.tags = tags.map((t) => String(t).toLowerCase().trim()).filter(Boolean);
		if (status) post.status = status;

		await post.save();
		res.json(post);
	} catch (e) {
		console.error("Error updating post:", e);
		res.status(500).json({ message: "Error updating post" });
	}
};

exports.deletePost = async (req, res) => {
	try {
		const post = await BlogPost.findById(req.params.id);
		if (!post) return res.status(404).json({ message: "Post not found" });
		const owns = req.user && String(post.author) === String(req.user.id);
		if (!isAdmin(req.user) && !owns) return res.status(403).json({ message: "Not allowed" });

		await BlogComment.deleteMany({ post: post._id });
		await Vote.deleteMany({ targetType: "post", targetId: post._id });
		await post.deleteOne();
		res.json({ success: true });
	} catch (e) {
		console.error("Error deleting post:", e);
		res.status(500).json({ message: "Error deleting post" });
	}
};

exports.getCategories = async (_req, res) => {
	// Placeholder: categories could be derived from tags hierarchy in future
	res.json([]);
};

exports.getTags = async (_req, res) => {
	try {
		const tags = await BlogPost.aggregate([
			{ $unwind: "$tags" },
			{ $group: { _id: "$tags", count: { $sum: 1 } } },
			{ $sort: { count: -1 } },
		]);
		res.json(tags.map((t) => ({ tag: t._id, count: t.count })));
	} catch (e) {
		console.error("getTags error", e);
		res.status(500).json({ message: "Error fetching tags" });
	}
};

exports.addComment = async (req, res) => {
	try {
		const { content } = req.body;
		if (!content?.trim()) return res.status(400).json({ message: "Content required" });
		const post = await BlogPost.findById(req.params.id);
		if (!post || post.status !== "published") return res.status(404).json({ message: "Post not found" });

		const comment = await BlogComment.create({ post: post._id, user: req.user.id, content: content.trim() });
		await BlogPost.updateOne({ _id: post._id }, { $inc: { commentsCount: 1 } });
		const full = await comment.populate("user", "name");
		res.status(201).json(full);
	} catch (e) {
		console.error("Error adding comment:", e);
		res.status(500).json({ message: "Error adding comment" });
	}
};

exports.getComments = async (req, res) => {
	try {
		const comments = await BlogComment.find({ post: req.params.id, status: "visible" })
			.populate("user", "name")
			.sort({ score: -1, createdAt: -1 });
		res.json(comments);
	} catch (e) {
		console.error("Error listing comments:", e);
		res.status(500).json({ message: "Error listing comments" });
	}
};

exports.deleteComment = async (req, res) => {
	try {
		const comment = await BlogComment.findById(req.params.commentId);
		if (!comment) return res.status(404).json({ message: "Comment not found" });
		const post = await BlogPost.findById(comment.post);
		const ownsPost = String(post?.author) === String(req.user.id);
		const ownsComment = String(comment.user) === String(req.user.id);
		if (!isAdmin(req.user) && !ownsPost && !ownsComment) return res.status(403).json({ message: "Not allowed" });
		await Vote.deleteMany({ targetType: "comment", targetId: comment._id });
		await comment.deleteOne();
		await BlogPost.updateOne({ _id: post._id }, { $inc: { commentsCount: -1 } });
		res.json({ success: true });
	} catch (e) {
		console.error("Error deleting comment:", e);
		res.status(500).json({ message: "Error deleting comment" });
	}
};

async function applyVote({ modelDoc, targetType, targetId, userId, value }) {
	const existing = await Vote.findOne({ user: userId, targetType, targetId });
	if (!existing) {
		await Vote.create({ user: userId, targetType, targetId, value });
		await modelDoc.updateOne(value === 1 ? { $inc: { upvotes: 1, score: 1 } } : { $inc: { downvotes: 1, score: -1 } });
		return { action: "created", value };
	}
	if (existing.value === value) {
		await existing.deleteOne();
		await modelDoc.updateOne(value === 1 ? { $inc: { upvotes: -1, score: -1 } } : { $inc: { downvotes: -1, score: 1 } });
		return { action: "removed", value };
	}
	existing.value = value;
	await existing.save();
	if (value === 1) {
		await modelDoc.updateOne({ $inc: { upvotes: 1, downvotes: -1, score: 2 } });
	} else {
		await modelDoc.updateOne({ $inc: { upvotes: -1, downvotes: 1, score: -2 } });
	}
	return { action: "flipped", value };
}

exports.votePost = async (req, res) => {
	try {
		const { value } = req.body;
		if (![1, -1].includes(value)) return res.status(400).json({ message: "Invalid vote" });
		const post = await BlogPost.findById(req.params.id);
		if (!post || post.status !== "published") return res.status(404).json({ message: "Post not found" });
		const result = await applyVote({
			modelDoc: BlogPost.findById(post._id),
			targetType: "post",
			targetId: post._id,
			userId: req.user.id,
			value,
		});
		const updated = await BlogPost.findById(post._id).select("upvotes downvotes score");
		res.json({ ...result, ...updated.toObject() });
	} catch (e) {
		console.error("Error voting post:", e);
		res.status(500).json({ message: "Error voting post" });
	}
};

exports.voteComment = async (req, res) => {
	try {
		const { value } = req.body;
		if (![1, -1].includes(value)) return res.status(400).json({ message: "Invalid vote" });
		const comment = await BlogComment.findById(req.params.commentId);
		if (!comment) return res.status(404).json({ message: "Comment not found" });
		const result = await applyVote({
			modelDoc: BlogComment.findById(comment._id),
			targetType: "comment",
			targetId: comment._id,
			userId: req.user.id,
			value,
		});
		const updated = await BlogComment.findById(comment._id).select("upvotes downvotes score");
		res.json({ ...result, ...updated.toObject() });
	} catch (e) {
		console.error("Error voting comment:", e);
		res.status(500).json({ message: "Error voting comment" });
	}
};

exports.feed = async (req, res) => {
	try {
		const { sort = "newest", page = 1, limit = 10 } = req.query;
		const follows = await Follow.find({ follower: req.user.id });
		const userIds = follows.filter((f) => f.targetType === "user").map((f) => f.targetUser);
		const tags = follows.filter((f) => f.targetType === "tag").map((f) => f.targetTag);
		const filter = { status: "published", $or: [] };
		if (userIds.length) filter.$or.push({ author: { $in: userIds } });
		if (tags.length) filter.$or.push({ tags: { $in: tags } });
		if (filter.$or.length === 0) filter.$or.push({ _id: null });
		const sortMap = { newest: { createdAt: -1 }, top: { score: -1, upvotes: -1 }, trending: { views: -1, score: -1 } };
		const posts = await BlogPost.find(filter)
			.populate("author", "name sellerProfile")
			.sort(sortMap[sort] || sortMap.newest)
			.skip((page - 1) * limit)
			.limit(parseInt(limit));
		const total = await BlogPost.countDocuments(filter);
		res.json({ data: posts, page: Number(page), limit: Number(limit), total });
	} catch (e) {
		console.error("Error building feed:", e);
		res.status(500).json({ message: "Error building feed" });
	}
};

