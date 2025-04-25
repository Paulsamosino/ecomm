const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const { validateChatAccess } = require("../middleware/chatMiddleware");
const chatController = require("../controllers/chatController");

// Apply authentication middleware to all routes
router.use(protect);

// Debug middleware to log request details
router.use((req, res, next) => {
  console.log("Chat Route Request:", {
    method: req.method,
    path: req.path,
    user: {
      id: req.user?._id || req.user?.id,
      isSeller: req.user?.isSeller,
    },
    params: req.params,
    query: req.query,
    body: req.body,
  });
  next();
});

// Routes that don't require chat access validation
router.get("/", chatController.getChats);
router.post("/", chatController.createChat);
router.post("/direct", chatController.createDirectChat);

// Routes that require chat access validation
router.get("/:chatId", validateChatAccess, chatController.getChat);
router.get("/:chatId/messages", validateChatAccess, chatController.getMessages);
router.post(
  "/:chatId/messages",
  validateChatAccess,
  chatController.sendMessage
);
router.patch(
  "/:chatId/messages/:messageId/status",
  validateChatAccess,
  chatController.updateMessageStatus
);

module.exports = router;
