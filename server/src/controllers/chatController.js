const Chat = require("../models/Chat");
const User = require("../models/User");
const mongoose = require("mongoose");

// Helper function to normalize user ID
const normalizeUserId = (user) => {
  if (!user) return null;
  if (typeof user === "string") return user;
  if (user instanceof mongoose.Types.ObjectId) return user.toString();
  return (user._id || user.id)?.toString();
};

const chatController = {
  // Get all chats for a user with unread counts
  getChats: async (req, res) => {
    try {
      const userId = normalizeUserId(req.user);
      console.log("Getting chats for user:", userId);

      // Use the static method we defined in the model
      const chats = await Chat.getChatsWithUnreadCounts(userId);

      console.log("Found chats:", chats.length);
      res.json(chats);
    } catch (error) {
      console.error("Error getting chats:", error);
      res.status(500).json({ message: "Error getting chats" });
    }
  },

  // Get a single chat
  getChat: async (req, res) => {
    try {
      const chat = await Chat.findById(req.params.chatId)
        .populate("buyer", "name email id _id isOnline lastActive")
        .populate("seller", "name email id _id isOnline lastActive");

      if (!chat) {
        return res.status(404).json({ message: "Chat not found" });
      }

      // Add the unread count
      const userId = normalizeUserId(req.user);
      const unreadCount = chat.getUnreadCount(userId);

      const chatObj = chat.toObject();
      chatObj.unreadCount = unreadCount;

      res.json(chatObj);
    } catch (error) {
      console.error("Error getting chat:", error);
      res.status(500).json({ message: "Error getting chat" });
    }
  },

  // Get messages for a chat
  getMessages: async (req, res) => {
    try {
      // Chat object is attached by the middleware
      const chat = req.chat;

      // Mark messages as read when fetched
      const userId = normalizeUserId(req.user);
      await chat.markMessagesAsRead(userId);

      console.log("Returning messages:", {
        chatId: chat._id,
        messageCount: chat.messages?.length,
        unreadCount: chat.getUnreadCount(userId),
      });

      res.json(chat.messages || []);
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
        await chat.populate("buyer", "name email id _id isOnline lastActive");
        await chat.populate("seller", "name email id _id isOnline lastActive");

        return res.json(chat);
      }

      // Create new chat
      chat = new Chat({
        buyer: buyerId,
        seller: sellerId,
        product: productId,
        messages: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await chat.save();
      await chat.populate("buyer", "name email id _id isOnline lastActive");
      await chat.populate("seller", "name email id _id isOnline lastActive");

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
          "name email id _id isOnline lastActive"
        );
        await req.existingChat.populate(
          "seller",
          "name email id _id isOnline lastActive"
        );
        return res.json(req.existingChat);
      }

      const { sellerId } = req.body;
      const buyerId = normalizeUserId(req.user);

      // Create new direct chat
      const chat = new Chat({
        buyer: buyerId,
        seller: sellerId,
        messages: [],
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

  // Send a message
  sendMessage: async (req, res) => {
    try {
      const { content } = req.body;
      const senderId = normalizeUserId(req.user);

      // Chat object is attached by the middleware
      const chat = req.chat;

      if (!content || !content.trim()) {
        return res.status(400).json({ message: "Message content is required" });
      }

      // Create the new message
      const newMessage = {
        _id: new mongoose.Types.ObjectId(),
        content,
        senderId,
        status: "SENT",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Add message to chat
      chat.messages.push(newMessage);
      chat.lastMessage = newMessage;
      chat.updatedAt = new Date();
      await chat.save();

      console.log("Message sent:", {
        chatId: chat._id,
        messageId: newMessage._id,
      });

      res.status(201).json(newMessage);
    } catch (error) {
      console.error("Error sending message:", error);
      res.status(500).json({ message: "Error sending message" });
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
      await chat.save();

      res.json({ message: "Message status updated", status });
    } catch (error) {
      console.error("Error updating message status:", error);
      res.status(500).json({ message: "Error updating message status" });
    }
  },
};

module.exports = chatController;
