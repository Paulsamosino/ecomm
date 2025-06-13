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
router.get("/search", chatController.searchMessages);

// Routes that require chat access validation
router.get("/:chatId", validateChatAccess, chatController.getChat);
router.get("/:chatId/messages", validateChatAccess, chatController.getMessages);
router.post(
  "/:chatId/messages",
  validateChatAccess,
  chatController.sendMessage
);
router.post(
  "/:chatId/messages/file",
  validateChatAccess,
  chatController.sendFileMessage
);
router.patch(
  "/:chatId/messages/:messageId",
  validateChatAccess,
  chatController.editMessage
);
router.delete(
  "/:chatId/messages/:messageId",
  validateChatAccess,
  chatController.deleteMessage
);
router.post(
  "/:chatId/messages/:messageId/react",
  validateChatAccess,
  chatController.addReaction
);
router.delete(
  "/:chatId/messages/:messageId/react",
  validateChatAccess,
  chatController.removeReaction
);
router.patch(
  "/:chatId/messages/:messageId/status",
  validateChatAccess,
  chatController.updateMessageStatus
);
router.patch(
  "/:chatId/archive",
  validateChatAccess,
  chatController.archiveChat
);
router.patch("/:chatId/block", validateChatAccess, chatController.blockChat);
router.get(
  "/:chatId/search",
  validateChatAccess,
  chatController.searchChatMessages
);

module.exports = router;
