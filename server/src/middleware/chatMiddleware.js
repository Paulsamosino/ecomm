const mongoose = require("mongoose");
const Chat = require("../models/Chat");
const User = require("../models/User");

// Helper function to extract user ID safely from various formats
const extractUserId = (user) => {
  if (!user) return null;
  if (typeof user === "string") return user;
  return (user._id || user.id)?.toString();
};

// Helper function to safely compare two user IDs that might be in different formats
const compareIds = (id1, id2) => {
  if (!id1 || !id2) return false;
  return String(id1) === String(id2);
};

// Middleware to validate chat access
exports.validateChatAccess = async (req, res, next) => {
  try {
    const chatId = req.params.chatId;
    const userId = extractUserId(req.user);

    console.log("Chat Access Validation:", {
      userId,
      chatId,
      userIsSeller: req.user.isSeller,
    });

    if (!mongoose.Types.ObjectId.isValid(chatId)) {
      return res.status(400).json({ message: "Invalid chat ID format" });
    }

    const chat = await Chat.findById(chatId)
      .populate("buyer", "name email id _id isSeller")
      .populate("seller", "name email id _id isSeller");

    if (!chat) {
      return res.status(404).json({ message: "Chat not found" });
    }

    const buyerId = extractUserId(chat.buyer);
    const sellerId = extractUserId(chat.seller);
    const currentUserId = extractUserId(req.user);

    console.log("Chat Participants:", {
      buyerId,
      sellerId,
      currentUserId,
      userIsSeller: req.user.isSeller,
    });

    // Check if user is the buyer
    const isBuyer = compareIds(currentUserId, buyerId);

    // Check if user is the seller (must also have seller role)
    const isSeller = req.user.isSeller && compareIds(currentUserId, sellerId);

    console.log("Access Check:", {
      isBuyer,
      isSeller,
      hasAccess: isBuyer || isSeller,
    });

    if (!isBuyer && !isSeller) {
      return res.status(403).json({
        message: "Access denied: You don't have permission to access this chat",
        debug: {
          userId: currentUserId,
          role: req.user.isSeller ? "seller" : "buyer",
          isBuyer,
          isSeller,
        },
      });
    }

    // Attach chat and role to request
    req.chat = chat;
    req.chatRole = isBuyer ? "buyer" : "seller";

    console.log("Access granted:", {
      userId: currentUserId,
      role: req.chatRole,
    });

    next();
  } catch (error) {
    console.error("Chat validation error:", error);
    res.status(500).json({ message: "Error validating chat access" });
  }
};

// Middleware to validate new chat creation
exports.validateNewChat = async (req, res, next) => {
  try {
    const { sellerId } = req.body;
    const buyerId = extractUserId(req.user);

    console.log("New Chat Validation:", {
      buyerId,
      sellerId,
    });

    if (!sellerId) {
      return res.status(400).json({ message: "Seller ID is required" });
    }

    if (!mongoose.Types.ObjectId.isValid(sellerId)) {
      return res.status(400).json({ message: "Invalid seller ID format" });
    }

    // Check if seller exists and is a seller
    const seller = await User.findOne({ _id: sellerId, isSeller: true });
    if (!seller) {
      return res
        .status(404)
        .json({ message: "Seller not found or user is not a seller" });
    }

    // Check if user is trying to message themselves
    if (compareIds(sellerId, buyerId)) {
      return res
        .status(400)
        .json({ message: "Cannot create chat with yourself" });
    }

    // Check if chat already exists
    const existingChat = await Chat.findOne({
      buyer: buyerId,
      seller: sellerId,
    });

    if (existingChat) {
      console.log("Found existing chat:", existingChat._id);
      req.existingChat = existingChat;
    }

    next();
  } catch (error) {
    console.error("New chat validation error:", error);
    res.status(500).json({ message: "Error validating new chat" });
  }
};
