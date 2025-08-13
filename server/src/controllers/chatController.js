const mongoose = require("mongoose");
const { Chat, Message } = require("../models/Chat");

// Ensure user is in chat
const ensureParticipant = (chat, userId) => {
  const isParticipant = chat.participants.some((p) => p.toString() === userId.toString());
  if (!isParticipant) {
    const err = new Error("Not authorized to access this chat");
    err.status = 403;
    throw err;
  }
};

exports.listChats = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const chats = await Chat.find({ participants: userId })
      .sort({ lastMessageAt: -1 })
      .populate("participants", "name email role isSeller")
      .lean();
    res.json(chats);
  } catch (e) {
    next(e);
  }
};

exports.getChat = async (req, res, next) => {
  try {
    const chat = await Chat.findById(req.params.chatId).populate("participants", "name email role isSeller");
    if (!chat) return res.status(404).json({ message: "Chat not found" });
    ensureParticipant(chat, req.user._id);
    res.json(chat);
  } catch (e) {
    next(e);
  }
};

exports.getMessages = async (req, res, next) => {
  try {
    const { chatId } = req.params;
    const chat = await Chat.findById(chatId);
    if (!chat) return res.status(404).json({ message: "Chat not found" });
    ensureParticipant(chat, req.user._id);

    const { cursor, limit = 30 } = req.query;
    const query = { chat: chatId };
    if (cursor) query._id = { $lt: new mongoose.Types.ObjectId(cursor) };

    const messages = await Message.find(query)
      .sort({ _id: -1 })
      .limit(Number(limit))
      .lean();
    res.json({ messages: messages.reverse(), nextCursor: messages[0]?._id });
  } catch (e) {
    next(e);
  }
};

exports.createDirect = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { sellerId, productId } = req.body;
    if (!sellerId) return res.status(400).json({ message: "sellerId required" });

    let chat = await Chat.findOne({ participants: { $all: [userId, sellerId] }, isSupport: false });
    if (!chat) {
      chat = await Chat.create({ participants: [userId, sellerId], product: productId || null, lastMessageAt: new Date() });
    }
    res.json(chat);
  } catch (e) {
    next(e);
  }
};

exports.createSupport = async (req, res, next) => {
  try {
    const userId = req.user._id;
    // simple: chat with first admin user
    const User = require("../models/User");
    const admin = await User.findOne({ role: "admin" });
    if (!admin) return res.status(500).json({ message: "No admin user available" });

    let chat = await Chat.findOne({ participants: { $all: [userId, admin._id] }, isSupport: true });
    if (!chat) chat = await Chat.create({ participants: [userId, admin._id], isSupport: true, lastMessageAt: new Date() });
    res.json(chat);
  } catch (e) {
    next(e);
  }
};

// Generic: create or get a direct chat with any participant
exports.createOrGet = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { participantId, productId, isSupport = false } = req.body || {};
    if (!participantId && !isSupport) {
      return res.status(400).json({ message: "participantId required unless isSupport=true" });
    }

    if (isSupport) {
      // Delegate to support logic
      const User = require("../models/User");
      const admin = await User.findOne({ role: "admin" });
      if (!admin) return res.status(500).json({ message: "No admin user available" });
      let chat = await Chat.findOne({ participants: { $all: [userId, admin._id] }, isSupport: true });
      if (!chat) chat = await Chat.create({ participants: [userId, admin._id], isSupport: true, lastMessageAt: new Date() });
      return res.json(chat);
    }

    if (participantId.toString() === userId.toString()) {
      return res.status(400).json({ message: "Cannot start a chat with yourself" });
    }

    let chat = await Chat.findOne({ participants: { $all: [userId, participantId] }, isSupport: false });
    if (!chat) {
      chat = await Chat.create({ participants: [userId, participantId], product: productId || null, lastMessageAt: new Date() });
    }
    res.json(chat);
  } catch (e) {
    next(e);
  }
};

// Generic create-or-get direct chat between current user and provided partnerId
exports.createWithUser = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { partnerId, productId } = req.body;
    if (!partnerId) return res.status(400).json({ message: "partnerId required" });
    if (partnerId === String(userId)) return res.status(400).json({ message: "Cannot create chat with self" });

    let chat = await Chat.findOne({ participants: { $all: [userId, partnerId] }, isSupport: false });
    if (!chat) {
      chat = await Chat.create({ participants: [userId, partnerId], product: productId || null, lastMessageAt: new Date() });
    }
    res.json(chat);
  } catch (e) {
    next(e);
  }
};

exports.sendMessage = async (req, res, next) => {
  try {
    const { chatId } = req.params;
    const chat = await Chat.findById(chatId);
    if (!chat) return res.status(404).json({ message: "Chat not found" });
    ensureParticipant(chat, req.user._id);

    const { content = "", attachments = [] } = req.body;
    const msg = await Message.create({ chat: chatId, sender: req.user._id, content, attachments, status: "SENT" });

    chat.lastMessageAt = new Date();
    chat.lastMessage = content || (attachments[0]?.name ?? "Attachment");
    await chat.save();

    const io = req.app.get("io");
    io.to(`chat:${chatId}`).emit("new_message", { chatId, message: msg });

    res.status(201).json(msg);
  } catch (e) {
    next(e);
  }
};

exports.markRead = async (req, res, next) => {
  try {
    const { chatId } = req.params;
    const chat = await Chat.findById(chatId);
    if (!chat) return res.status(404).json({ message: "Chat not found" });
    ensureParticipant(chat, req.user._id);

    await Message.updateMany({ chat: chatId, readBy: { $ne: req.user._id } }, { $push: { readBy: req.user._id }, status: "READ" });

    const io = req.app.get("io");
    io.to(`chat:${chatId}`).emit("read_receipt", { chatId, userId: req.user._id });
    res.json({ success: true });
  } catch (e) {
    next(e);
  }
};
