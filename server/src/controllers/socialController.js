const Follow = require("../models/Follow");
const User = require("../models/User");

exports.followUser = async (req, res) => {
  try {
    const targetUserId = req.params.userId;
    if (!targetUserId) return res.status(400).json({ message: "UserId required" });
    if (String(targetUserId) === String(req.user.id)) {
      return res.status(400).json({ message: "Cannot follow yourself" });
    }
    const exists = await User.findById(targetUserId).select("_id");
    if (!exists) return res.status(404).json({ message: "User not found" });

    await Follow.updateOne(
      { follower: req.user.id, targetType: "user", targetUser: targetUserId },
      { $setOnInsert: { follower: req.user.id, targetType: "user", targetUser: targetUserId } },
      { upsert: true }
    );
    res.json({ success: true });
  } catch (e) {
    console.error("followUser error", e);
    res.status(500).json({ message: "Error following user" });
  }
};

exports.unfollowUser = async (req, res) => {
  try {
    await Follow.deleteOne({ follower: req.user.id, targetType: "user", targetUser: req.params.userId });
    res.json({ success: true });
  } catch (e) {
    console.error("unfollowUser error", e);
    res.status(500).json({ message: "Error unfollowing user" });
  }
};

exports.followTag = async (req, res) => {
  try {
    const tag = String(req.params.tag || "").toLowerCase();
    if (!tag) return res.status(400).json({ message: "Tag required" });
    await Follow.updateOne(
      { follower: req.user.id, targetType: "tag", targetTag: tag },
      { $setOnInsert: { follower: req.user.id, targetType: "tag", targetTag: tag } },
      { upsert: true }
    );
    res.json({ success: true });
  } catch (e) {
    console.error("followTag error", e);
    res.status(500).json({ message: "Error following tag" });
  }
};

exports.unfollowTag = async (req, res) => {
  try {
    const tag = String(req.params.tag || "").toLowerCase();
    await Follow.deleteOne({ follower: req.user.id, targetType: "tag", targetTag: tag });
    res.json({ success: true });
  } catch (e) {
    console.error("unfollowTag error", e);
    res.status(500).json({ message: "Error unfollowing tag" });
  }
};

exports.checkFollowStatus = async (req, res) => {
  try {
    const targetUserId = req.params.userId;
    if (!targetUserId) return res.status(400).json({ message: "UserId required" });
    
    const follow = await Follow.findOne({ 
      follower: req.user.id, 
      targetType: "user", 
      targetUser: targetUserId 
    });
    
    res.json({ isFollowing: !!follow });
  } catch (e) {
    console.error("checkFollowStatus error", e);
    res.status(500).json({ message: "Error checking follow status" });
  }
};

exports.listFollowing = async (req, res) => {
  try {
    const follows = await Follow.find({ follower: req.user.id }).populate("targetUser", "name");
    const users = follows
      .filter((f) => f.targetType === "user")
      .map((f) => ({ _id: f.targetUser?._id, name: f.targetUser?.name }));
    const tags = follows.filter((f) => f.targetType === "tag").map((f) => f.targetTag);
    res.json({ users, tags });
  } catch (e) {
    console.error("listFollowing error", e);
    res.status(500).json({ message: "Error fetching following" });
  }
};

exports.listFollowers = async (req, res) => {
  try {
    const followers = await Follow.find({ targetType: "user", targetUser: req.user.id }).populate(
      "follower",
      "name"
    );
    res.json(followers.map((f) => ({ _id: f.follower._id, name: f.follower.name })));
  } catch (e) {
    console.error("listFollowers error", e);
    res.status(500).json({ message: "Error fetching followers" });
  }
};
