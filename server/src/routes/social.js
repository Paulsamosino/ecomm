const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const social = require("../controllers/socialController");

router.use(protect);

router.post("/follow/user/:userId", social.followUser);
router.delete("/follow/user/:userId", social.unfollowUser);
router.get("/follow/user/:userId/status", social.checkFollowStatus);

router.post("/follow/tag/:tag", social.followTag);
router.delete("/follow/tag/:tag", social.unfollowTag);

router.get("/following", social.listFollowing);
router.get("/followers", social.listFollowers);

module.exports = router;
