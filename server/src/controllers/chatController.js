const Chat = require("../models/Chat");
const Message = require("../models/Message");
const User = require("../models/User");
const Product = require("../models/Product");
const mongoose = require("mongoose");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Helper function to normalize user ID
const normalizeUserId = (user) => {
  if (!user) return null;
  if (typeof user === "string") return user;
  if (user instanceof mongoose.Types.ObjectId) return user.toString();

  // Handle different user object formats
  if (typeof user === "object") {
    const id = user._id || user.id;
    if (id) {
      return typeof id === "string" ? id : id.toString();
    }
  }

  return null;
};

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, "../../uploads/chat");
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|txt|mp3|mp4|wav|ogg/;
    const extname = allowedTypes.test(
      path.extname(file.originalname).toLowerCase()
    );
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb(new Error("Invalid file type"));
    }
  },
});

const chatController = {
  // Get all chats for a user with enhanced filtering
  getChats: async (req, res) => {
    try {
      const userId = normalizeUserId(req.user);
      const {
        includeArchived = false,
        includeBlocked = false,
        tags,
        priority,
        search,
        limit = 50,
        page = 1,
      } = req.query;

      console.log("Getting chats for user:", userId);

      let options = {
        includeArchived: includeArchived === "true",
        includeBlocked: includeBlocked === "true",
        limit: parseInt(limit),
        page: parseInt(page),
      };

      if (tags) {
        options.tags = Array.isArray(tags) ? tags : [tags];
      }

      if (priority) {
        options.priority = priority;
      }

      // Use the enhanced static method
      let chats = await Chat.getChatsWithUnreadCounts(userId, options);

      // Apply search filter if provided
      if (search) {
        const searchLower = search.toLowerCase();
        chats = chats.filter((chat) => {
          const otherUser =
            chat.buyer._id.toString() === userId ? chat.seller : chat.buyer;
          const userName = otherUser.name?.toLowerCase() || "";
          const lastMessageContent =
            chat.lastMessage?.content?.toLowerCase() || "";

          return (
            userName.includes(searchLower) ||
            lastMessageContent.includes(searchLower)
          );
        });
      }

      console.log("Found chats:", chats.length);
      res.json(chats);
    } catch (error) {
      console.error("Error getting chats:", error);
      res.status(500).json({ message: "Error getting chats" });
    }
  },
  // Get a single chat with enhanced details
  getChat: async (req, res) => {
    try {
      const userId = normalizeUserId(req.user);

      console.log("Getting chat:", {
        chatId: req.params.chatId,
        userId,
        userObject: req.user,
      });

      if (!userId) {
        console.error("Failed to normalize user ID:", req.user);
        return res.status(400).json({ message: "Invalid user ID" });
      }

      const chat = await Chat.findById(req.params.chatId)
        .populate("buyer", "name email _id isOnline lastActive")
        .populate("seller", "name email _id isOnline lastActive")
        .populate("product", "name price images category")
        .populate("messages.senderId", "name email")
        .populate("pinnedMessages.messageId")
        .populate("pinnedMessages.pinnedBy", "name");

      if (!chat) {
        return res.status(404).json({ message: "Chat not found" });
      }

      console.log(
        "Chat found, calculating computed fields for userId:",
        userId
      );

      // Add computed fields with proper error handling
      let unreadCount = 0;
      let isArchived = false;
      let isBlocked = false;

      try {
        unreadCount = chat.getUnreadCount(userId);
        console.log("Unread count calculated:", unreadCount);
      } catch (error) {
        console.error("Error calculating unread count:", error);
        unreadCount = 0;
      }

      try {
        isArchived = chat.isArchivedByUser(userId);
        console.log("Archived status calculated:", isArchived);
      } catch (error) {
        console.error("Error checking archived status:", error);
        isArchived = false;
      }

      try {
        isBlocked = chat.isBlockedByUser(userId);
        console.log("Blocked status calculated:", isBlocked);
      } catch (error) {
        console.error("Error checking blocked status:", error);
        isBlocked = false;
      }

      const chatObj = chat.toObject();
      chatObj.unreadCount = unreadCount;
      chatObj.isArchived = isArchived;
      chatObj.isBlocked = isBlocked;

      console.log("Returning chat with computed fields:", {
        chatId: chatObj._id,
        unreadCount,
        isArchived,
        isBlocked,
      });

      res.json(chatObj);
    } catch (error) {
      console.error("Error getting chat:", error);
      console.error("Error stack:", error.stack);
      res.status(500).json({
        message: "Error getting chat",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  },

  // Get messages for a chat with pagination
  getMessages: async (req, res) => {
    try {
      const chat = req.chat;
      const userId = normalizeUserId(req.user);
      const {
        page = 1,
        limit = 50,
        before,
        after,
        search,
        messageType,
      } = req.query;

      let messages = chat.messages || [];

      // Filter out deleted messages (unless user is the one who deleted them)
      messages = messages.filter(
        (msg) => !msg.deletedAt || msg.deletedBy?.toString() === userId
      );

      // Apply search filter
      if (search) {
        const searchLower = search.toLowerCase();
        messages = messages.filter((msg) =>
          msg.content?.toLowerCase().includes(searchLower)
        );
      }

      // Apply message type filter
      if (messageType) {
        messages = messages.filter((msg) => msg.messageType === messageType);
      }

      // Apply date filters
      if (before) {
        messages = messages.filter(
          (msg) => new Date(msg.createdAt) < new Date(before)
        );
      }

      if (after) {
        messages = messages.filter(
          (msg) => new Date(msg.createdAt) > new Date(after)
        );
      }

      // Sort by creation date (newest first for pagination)
      messages.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      // Apply pagination
      const startIndex = (parseInt(page) - 1) * parseInt(limit);
      const endIndex = startIndex + parseInt(limit);
      const paginatedMessages = messages.slice(startIndex, endIndex);

      // Reverse to show oldest first in the response
      paginatedMessages.reverse();

      // Mark messages as read when fetched
      await chat.markMessagesAsRead(userId);

      console.log("Returning messages:", {
        chatId: chat._id,
        totalMessages: messages.length,
        returnedMessages: paginatedMessages.length,
        page: parseInt(page),
        limit: parseInt(limit),
      });

      res.json({
        messages: paginatedMessages,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(messages.length / parseInt(limit)),
          totalMessages: messages.length,
          hasMore: endIndex < messages.length,
        },
      });
    } catch (error) {
      console.error("Error getting messages:", error);
      res.status(500).json({ message: "Error getting messages" });
    }
  },

  // Create a new chat
  createChat: async (req, res) => {
    try {
      const { sellerId, productId } = req.body;
      const buyerId = normalizeUserId(req.user);

      console.log("Creating chat:", { buyerId, sellerId, productId });

      // Validate seller exists and is actually a seller
      const seller = await User.findOne({ _id: sellerId, isSeller: true });
      if (!seller) {
        return res.status(404).json({ message: "Seller not found" });
      }

      // Validate product if provided
      let product = null;
      if (productId) {
        product = await Product.findById(productId);
        if (!product) {
          return res.status(404).json({ message: "Product not found" });
        }
      }

      // Check if chat already exists
      let chat = await Chat.findOne({
        buyer: buyerId,
        seller: sellerId,
      });

      if (chat) {
        console.log("Chat already exists:", chat._id);

        // Update with product reference if needed
        if (productId && !chat.product) {
          chat.product = productId;
          await chat.save();
        }

        // Return existing chat with populated fields
        await chat.populate("buyer", "name email _id isOnline lastActive");
        await chat.populate("seller", "name email _id isOnline lastActive");
        await chat.populate("product", "name price images");

        return res.json(chat);
      }

      // Create new chat
      chat = new Chat({
        buyer: buyerId,
        seller: sellerId,
        product: productId,
        messages: [],
        isActive: true,
        priority: "normal",
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await chat.save();
      await chat.populate("buyer", "name email _id isOnline lastActive");
      await chat.populate("seller", "name email _id isOnline lastActive");
      await chat.populate("product", "name price images");

      console.log("Created new chat:", chat._id);
      res.status(201).json(chat);
    } catch (error) {
      console.error("Error creating chat:", error);
      res.status(500).json({ message: "Error creating chat" });
    }
  },

  // Create or get a direct chat between buyer and seller
  createDirectChat: async (req, res) => {
    try {
      // If existing chat was found by middleware, return it
      if (req.existingChat) {
        await req.existingChat.populate(
          "buyer",
          "name email _id isOnline lastActive"
        );
        await req.existingChat.populate(
          "seller",
          "name email _id isOnline lastActive"
        );
        return res.json(req.existingChat);
      }

      const { sellerId } = req.body;
      const buyerId = normalizeUserId(req.user);

      // Validate seller
      const seller = await User.findOne({ _id: sellerId, isSeller: true });
      if (!seller) {
        return res.status(404).json({ message: "Seller not found" });
      }

      // Create new direct chat
      const chat = new Chat({
        buyer: buyerId,
        seller: sellerId,
        messages: [],
        isActive: true,
        priority: "normal",
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await chat.save();
      await chat.populate("buyer", "name email id _id isOnline lastActive");
      await chat.populate("seller", "name email id _id isOnline lastActive");

      console.log("Created new direct chat:", chat._id);
      res.status(201).json(chat);
    } catch (error) {
      console.error("Error creating direct chat:", error);
      res.status(500).json({ message: "Error creating direct chat" });
    }
  },

  // Send a message with file upload support
  sendMessage: async (req, res) => {
    try {
      const { content, messageType = "text", replyTo, metadata } = req.body;
      const senderId = normalizeUserId(req.user);
      const chat = req.chat;

      // Validate content for text messages
      if (messageType === "text" && (!content || !content.trim())) {
        return res.status(400).json({ message: "Message content is required" });
      }

      // Handle file attachments
      let attachments = [];
      if (req.files && req.files.length > 0) {
        attachments = req.files.map((file) => ({
          type: file.mimetype.startsWith("image/")
            ? "image"
            : file.mimetype.startsWith("audio/")
            ? "audio"
            : file.mimetype.startsWith("video/")
            ? "video"
            : "file",
          url: `/uploads/chat/${file.filename}`,
          filename: file.originalname,
          size: file.size,
          mimeType: file.mimetype,
        }));
      }

      // Create the new message using the chat method
      const messageData = {
        content: content?.trim() || "",
        senderId,
        messageType,
        status: "SENT",
        attachments,
        metadata: metadata ? JSON.parse(metadata) : {},
      };

      if (replyTo) {
        messageData.replyTo = replyTo;
      }

      const newMessage = await chat.addMessage(messageData);

      // Get the socket.io instance to emit real-time updates
      const io = req.app.get("io");
      if (io) {
        // Determine recipient
        const buyerId = normalizeUserId(chat.buyer);
        const sellerId = normalizeUserId(chat.seller);
        const recipientId = senderId === buyerId ? sellerId : buyerId;

        // Populate sender info for the message
        await chat.populate("messages.senderId", "name email isSeller");
        const messageWithSender = chat.messages.id(newMessage._id);

        // Emit to chat room
        io.to(req.params.chatId).emit("new_message", {
          chatId: req.params.chatId,
          message: {
            ...messageWithSender.toObject(),
            sender: {
              _id: req.user._id,
              name: req.user.name,
              email: req.user.email,
              isSeller: req.user.isSeller,
            },
          },
        });

        // Send notification to recipient
        io.to(recipientId).emit("new_message_notification", {
          chatId: req.params.chatId,
          sender: {
            name: req.user.name,
            _id: senderId,
          },
          preview: content
            ? content.substring(0, 50) + (content.length > 50 ? "..." : "")
            : attachments.length > 0
            ? `Sent ${attachments.length} file(s)`
            : "New message",
          timestamp: new Date(),
        });
      }

      console.log("Message sent:", {
        chatId: chat._id,
        messageId: newMessage._id,
        messageType,
        hasAttachments: attachments.length > 0,
      });

      res.status(201).json(newMessage);
    } catch (error) {
      console.error("Error sending message:", error);
      res.status(500).json({ message: "Error sending message" });
    }
  },

  // Send a file message (with file upload middleware)
  sendFileMessage: async (req, res) => {
    try {
      // Use multer middleware to handle file upload
      chatController.uploadMiddleware(req, res, async (err) => {
        if (err) {
          console.error("File upload error:", err);
          return res.status(400).json({ message: err.message });
        }

        // Now handle the file message sending
        req.body.messageType = "file";
        return await chatController.sendMessage(req, res);
      });
    } catch (error) {
      console.error("Error sending file message:", error);
      res.status(500).json({ message: "Error sending file message" });
    }
  },

  // Edit a message
  editMessage: async (req, res) => {
    try {
      const { messageId } = req.params;
      const { content } = req.body;
      const userId = normalizeUserId(req.user);
      const chat = req.chat;

      if (!content || !content.trim()) {
        return res.status(400).json({ message: "Message content is required" });
      }

      const editedMessage = await chat.editMessage(
        messageId,
        content.trim(),
        userId
      );

      if (!editedMessage) {
        return res.status(404).json({ message: "Message not found" });
      }

      // Emit real-time update
      const io = req.app.get("io");
      if (io) {
        io.to(req.params.chatId).emit("message_edited", {
          chatId: req.params.chatId,
          messageId,
          content: content.trim(),
          edited: true,
          editedAt: editedMessage.editedAt,
        });
      }

      res.json(editedMessage);
    } catch (error) {
      console.error("Error editing message:", error);
      if (error.message.includes("Only sender can edit")) {
        return res.status(403).json({ message: error.message });
      }
      res.status(500).json({ message: "Error editing message" });
    }
  },

  // Delete a message
  deleteMessage: async (req, res) => {
    try {
      const { messageId } = req.params;
      const userId = normalizeUserId(req.user);
      const chat = req.chat;

      const deletedMessage = await chat.deleteMessage(messageId, userId);

      if (!deletedMessage) {
        return res.status(404).json({ message: "Message not found" });
      }

      // Emit real-time update
      const io = req.app.get("io");
      if (io) {
        io.to(req.params.chatId).emit("message_deleted", {
          chatId: req.params.chatId,
          messageId,
          deletedAt: deletedMessage.deletedAt,
        });
      }

      res.json({ message: "Message deleted successfully" });
    } catch (error) {
      console.error("Error deleting message:", error);
      if (error.message.includes("Only sender can delete")) {
        return res.status(403).json({ message: error.message });
      }
      res.status(500).json({ message: "Error deleting message" });
    }
  },

  // Add reaction to a message
  addReaction: async (req, res) => {
    try {
      const { messageId } = req.params;
      const { emoji } = req.body;
      const userId = normalizeUserId(req.user);
      const chat = req.chat;

      if (!emoji || !emoji.trim()) {
        return res.status(400).json({ message: "Emoji is required" });
      }

      const message = await chat.addMessageReaction(
        messageId,
        emoji.trim(),
        userId
      );

      if (!message) {
        return res.status(404).json({ message: "Message not found" });
      }

      // Emit real-time update
      const io = req.app.get("io");
      if (io) {
        io.to(req.params.chatId).emit("message_reaction", {
          chatId: req.params.chatId,
          messageId,
          reactions: message.reactions,
          user: {
            _id: userId,
            name: req.user.name,
          },
        });
      }

      res.json(message);
    } catch (error) {
      console.error("Error adding reaction:", error);
      res.status(500).json({ message: "Error adding reaction" });
    }
  },

  // Remove reaction from a message
  removeReaction: async (req, res) => {
    try {
      const { messageId } = req.params;
      const { emoji } = req.body;
      const userId = normalizeUserId(req.user);
      const chat = req.chat;

      if (!emoji || !emoji.trim()) {
        return res.status(400).json({ message: "Emoji is required" });
      }

      const message = await chat.removeMessageReaction(
        messageId,
        emoji.trim(),
        userId
      );

      if (!message) {
        return res.status(404).json({ message: "Message not found" });
      }

      // Emit real-time update
      const io = req.app.get("io");
      if (io) {
        io.to(req.params.chatId).emit("message_reaction", {
          chatId: req.params.chatId,
          messageId,
          reactions: message.reactions,
          user: {
            _id: userId,
            name: req.user.name,
          },
        });
      }

      res.json(message);
    } catch (error) {
      console.error("Error removing reaction:", error);
      res.status(500).json({ message: "Error removing reaction" });
    }
  },

  // Update message status
  updateMessageStatus: async (req, res) => {
    try {
      const { messageId, status } = req.body;
      const userId = normalizeUserId(req.user);
      const chatId = req.params.chatId;

      // Validate status
      if (!["SENT", "DELIVERED", "READ"].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }

      // Find the chat and update message status
      const chat = await Chat.findById(chatId);
      if (!chat) {
        return res.status(404).json({ message: "Chat not found" });
      }

      // Find the message
      const message = chat.messages.id(messageId);
      if (!message) {
        return res.status(404).json({ message: "Message not found" });
      }

      // Verify user has permission to update status
      const isRecipient = message.senderId.toString() !== userId;
      if (!isRecipient) {
        return res.status(403).json({
          message: "Only message recipients can update status",
        });
      }

      // Update message status
      message.status = status;
      message.updatedAt = new Date();

      // Add to readBy array if marking as read
      if (status === "READ") {
        const existingRead = message.readBy.find(
          (r) => r.user.toString() === userId
        );
        if (!existingRead) {
          message.readBy.push({ user: userId, readAt: new Date() });
        }
      }

      await chat.save();

      // Emit real-time update
      const io = req.app.get("io");
      if (io) {
        io.to(chatId).emit("message_status_updated", {
          chatId,
          messageId,
          status,
          updatedBy: userId,
        });
      }

      res.json({ message: "Message status updated", status });
    } catch (error) {
      console.error("Error updating message status:", error);
      res.status(500).json({ message: "Error updating message status" });
    }
  },

  // Archive chat
  archiveChat: async (req, res) => {
    try {
      const userId = normalizeUserId(req.user);
      const chat = req.chat;

      await chat.archiveForUser(userId);

      res.json({ message: "Chat archived successfully" });
    } catch (error) {
      console.error("Error archiving chat:", error);
      res.status(500).json({ message: "Error archiving chat" });
    }
  },

  // Block chat
  blockChat: async (req, res) => {
    try {
      const userId = normalizeUserId(req.user);
      const { reason = "" } = req.body;
      const chat = req.chat;

      await chat.blockForUser(userId, reason);

      res.json({ message: "Chat blocked successfully" });
    } catch (error) {
      console.error("Error blocking chat:", error);
      res.status(500).json({ message: "Error blocking chat" });
    }
  },

  // Search messages across all chats
  searchMessages: async (req, res) => {
    try {
      const userId = normalizeUserId(req.user);
      const { query, limit = 50, page = 1 } = req.query;

      if (!query || !query.trim()) {
        return res.status(400).json({ message: "Search query is required" });
      }

      // Find all chats for the user
      const chats = await Chat.find({
        $or: [{ buyer: userId }, { seller: userId }],
        isActive: true,
      })
        .populate("buyer", "name email")
        .populate("seller", "name email")
        .populate("product", "name");

      let allResults = [];

      // Search through messages in each chat
      chats.forEach((chat) => {
        const matchingMessages = chat.messages.filter((msg) => {
          return (
            !msg.deletedAt &&
            msg.content &&
            msg.content.toLowerCase().includes(query.toLowerCase())
          );
        });

        matchingMessages.forEach((msg) => {
          allResults.push({
            chatId: chat._id,
            chat: {
              buyer: chat.buyer,
              seller: chat.seller,
              product: chat.product,
            },
            message: msg,
          });
        });
      });

      // Sort by relevance and date
      allResults.sort(
        (a, b) => new Date(b.message.createdAt) - new Date(a.message.createdAt)
      );

      // Apply pagination
      const startIndex = (parseInt(page) - 1) * parseInt(limit);
      const endIndex = startIndex + parseInt(limit);
      const paginatedResults = allResults.slice(startIndex, endIndex);

      res.json({
        results: paginatedResults,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(allResults.length / parseInt(limit)),
          totalResults: allResults.length,
          hasMore: endIndex < allResults.length,
        },
      });
    } catch (error) {
      console.error("Error searching messages:", error);
      res.status(500).json({ message: "Error searching messages" });
    }
  },

  // Search messages within a specific chat
  searchChatMessages: async (req, res) => {
    try {
      const chat = req.chat;
      const { query, limit = 50, page = 1 } = req.query;

      if (!query || !query.trim()) {
        return res.status(400).json({ message: "Search query is required" });
      }

      // Filter messages that match the search query
      const matchingMessages = chat.messages.filter((msg) => {
        return (
          !msg.deletedAt &&
          msg.content &&
          msg.content.toLowerCase().includes(query.toLowerCase())
        );
      });

      // Sort by relevance and date (newest first)
      matchingMessages.sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      );

      // Apply pagination
      const startIndex = (parseInt(page) - 1) * parseInt(limit);
      const endIndex = startIndex + parseInt(limit);
      const paginatedResults = matchingMessages.slice(startIndex, endIndex);

      res.json({
        results: paginatedResults,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(matchingMessages.length / parseInt(limit)),
          totalResults: matchingMessages.length,
          hasMore: endIndex < matchingMessages.length,
        },
        chatId: chat._id,
      });
    } catch (error) {
      console.error("Error searching chat messages:", error);
      res.status(500).json({ message: "Error searching chat messages" });
    }
  },

  // Upload middleware
  uploadMiddleware: upload.array("files", 5), // Allow up to 5 files
};

module.exports = chatController;
