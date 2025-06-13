const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const User = require("./models/User");
const Chat = require("./models/Chat");
const mongoose = require("mongoose");

// Helper function to extract user ID consistently
const extractUserId = (user) => {
  if (!user) return null;
  if (typeof user === "string") return user;
  if (user instanceof mongoose.Types.ObjectId) return user.toString();
  return (user._id || user.id)?.toString();
};

let io;
const userSockets = new Map(); // Track user sockets

const initializeSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || "http://localhost:5173",
      methods: ["GET", "POST"],
      credentials: true,
    },
    pingTimeout: 60000,
  });

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      const isSeller = socket.handshake.query.isSeller === "true";

      if (!token) {
        throw new Error("Authentication token required");
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId);

      if (!user) {
        throw new Error("User not found");
      }

      if (isSeller && !user.isSeller) {
        throw new Error("Unauthorized seller access");
      }

      socket.user = {
        _id: user._id,
        name: user.name,
        email: user.email,
        isSeller: user.isSeller,
      };

      console.log(
        "User connected:",
        socket.user.name,
        socket.user._id,
        isSeller ? "(Seller)" : "(Buyer)"
      );

      socket.on("verify_auth", (data, callback) => {
        try {
          const decoded = jwt.verify(data.token, process.env.JWT_SECRET);
          callback({ success: true });
        } catch (error) {
          callback({ error: "Invalid authentication" });
        }
      });

      if (!userSockets.has(socket.user._id)) {
        userSockets.set(socket.user._id, new Set());
      }
      userSockets.get(socket.user._id).add(socket.id);

      socket.join(socket.user._id);

      broadcastUserStatus(socket.user._id, true);

      next();
    } catch (error) {
      console.error("Socket authentication error:", error);
      next(new Error("Authentication error"));
    }
  });

  io.on("connection", (socket) => {
    console.log("User connected:", socket.user.name, socket.user._id);

    socket.on("join_chat", async ({ chatId }) => {
      if (!mongoose.Types.ObjectId.isValid(chatId)) {
        return;
      }

      try {
        const chat = await Chat.findById(chatId)
          .populate("buyer", "id _id")
          .populate("seller", "id _id");

        if (!chat) return;

        const userId = socket.user._id;
        const buyerId = extractUserId(chat.buyer);
        const sellerId = extractUserId(chat.seller);

        if (
          userId === buyerId ||
          (socket.user.isSeller && userId === sellerId)
        ) {
          socket.join(chatId);
          console.log(`User ${userId} joined chat ${chatId}`);

          const unreadMessages = await chat.markMessagesAsRead(userId);
          if (unreadMessages.length > 0) {
            socket.to(chatId).emit("messages_read", {
              chatId,
              messageIds: unreadMessages.map((msg) => msg._id),
              readBy: userId,
            });
          }
        }
      } catch (error) {
        console.error("Error joining chat:", error);
        socket.emit("error", { message: "Failed to join chat" });
      }
    });

    socket.on("leave_chat", ({ chatId }) => {
      socket.leave(chatId);
      console.log(`User ${socket.user._id} left chat ${chatId}`);
    });

    socket.on("new_message", async (data) => {
      try {
        const { chatId, message } = data;
        const senderId = socket.user._id.toString();

        // Quick validation
        if (
          !chatId ||
          !mongoose.Types.ObjectId.isValid(chatId) ||
          !message?.content?.trim()
        ) {
          socket.emit("message_error", { message: "Invalid message data" });
          return;
        }

        // Use lean() for faster query and only get necessary fields
        const chat = await Chat.findById(chatId)
          .select("buyer seller")
          .lean()
          .exec();

        if (!chat) {
          socket.emit("message_error", { message: "Chat not found" });
          return;
        }

        // Quick access check
        const isBuyer = senderId === chat.buyer.toString();
        const isSeller =
          socket.user.isSeller && senderId === chat.seller.toString();

        if (!isBuyer && !isSeller) {
          socket.emit("message_error", { message: "Unauthorized" });
          return;
        }

        // Create new message
        const newMessage = {
          _id: message._id || new mongoose.Types.ObjectId(),
          content: message.content.trim(),
          senderId,
          type: message.type || "text",
          attachments: message.attachments || [],
          replyTo: message.replyTo || null,
          status: "SENT",
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        // Update chat in background without waiting
        Chat.updateOne(
          { _id: chatId },
          {
            $push: { messages: newMessage },
            $set: {
              lastMessage: newMessage,
              updatedAt: new Date(),
            },
          }
        )
          .exec()
          .catch((err) => console.error("Error updating chat:", err));

        // Prepare message data with sender info
        const messageData = {
          ...newMessage,
          sender: {
            _id: socket.user._id,
            name: socket.user.name,
            email: socket.user.email,
            isSeller: socket.user.isSeller,
          },
        };

        // Emit to chat room immediately
        io.to(chatId).emit("new_message", {
          chatId,
          message: messageData,
        });

        // Acknowledge successful processing
        socket.emit("message_status", {
          chatId,
          messageId: newMessage._id,
          status: "SENT",
        });
      } catch (error) {
        console.error("Error processing message:", error);
        socket.emit("message_error", {
          message: "Failed to process message",
          error: error.message,
        });
      }
    });

    // Message editing
    socket.on("edit_message", async (data) => {
      try {
        const { chatId, messageId, newContent } = data;
        const userId = socket.user._id.toString();

        const chat = await Chat.findById(chatId);
        if (!chat) {
          socket.emit("error", { message: "Chat not found" });
          return;
        }

        const message = chat.messages.id(messageId);
        if (!message || message.senderId.toString() !== userId) {
          socket.emit("error", {
            message: "Message not found or unauthorized",
          });
          return;
        }

        // Update message
        message.content = newContent;
        message.isEdited = true;
        message.editedAt = new Date();
        message.updatedAt = new Date();

        await chat.save();

        // Emit to all users in chat
        io.to(chatId).emit("message_edited", {
          chatId,
          messageId,
          newContent,
          editedAt: message.editedAt,
        });
      } catch (error) {
        console.error("Error editing message:", error);
        socket.emit("error", { message: "Failed to edit message" });
      }
    });

    // Message deletion
    socket.on("delete_message", async (data) => {
      try {
        const { chatId, messageId } = data;
        const userId = socket.user._id.toString();

        const chat = await Chat.findById(chatId);
        if (!chat) {
          socket.emit("error", { message: "Chat not found" });
          return;
        }

        const message = chat.messages.id(messageId);
        if (!message || message.senderId.toString() !== userId) {
          socket.emit("error", {
            message: "Message not found or unauthorized",
          });
          return;
        }

        // Soft delete
        message.isDeleted = true;
        message.deletedAt = new Date();
        message.updatedAt = new Date();

        await chat.save();

        // Emit to all users in chat
        io.to(chatId).emit("message_deleted", {
          chatId,
          messageId,
          deletedAt: message.deletedAt,
        });
      } catch (error) {
        console.error("Error deleting message:", error);
        socket.emit("error", { message: "Failed to delete message" });
      }
    });

    // Message reactions
    socket.on("add_reaction", async (data) => {
      try {
        const { chatId, messageId, emoji } = data;
        const userId = socket.user._id.toString();

        const chat = await Chat.findById(chatId);
        if (!chat) {
          socket.emit("error", { message: "Chat not found" });
          return;
        }

        const message = chat.messages.id(messageId);
        if (!message) {
          socket.emit("error", { message: "Message not found" });
          return;
        }

        // Remove existing reaction from this user if exists
        message.reactions = message.reactions.filter(
          (reaction) => reaction.userId.toString() !== userId
        );

        // Add new reaction
        message.reactions.push({
          userId,
          emoji,
          createdAt: new Date(),
        });

        message.updatedAt = new Date();
        await chat.save();

        // Emit to all users in chat
        io.to(chatId).emit("reaction_added", {
          chatId,
          messageId,
          reaction: {
            userId,
            emoji,
            user: {
              _id: socket.user._id,
              name: socket.user.name,
            },
          },
        });
      } catch (error) {
        console.error("Error adding reaction:", error);
        socket.emit("error", { message: "Failed to add reaction" });
      }
    });

    // Remove reaction
    socket.on("remove_reaction", async (data) => {
      try {
        const { chatId, messageId } = data;
        const userId = socket.user._id.toString();

        const chat = await Chat.findById(chatId);
        if (!chat) {
          socket.emit("error", { message: "Chat not found" });
          return;
        }

        const message = chat.messages.id(messageId);
        if (!message) {
          socket.emit("error", { message: "Message not found" });
          return;
        }

        // Remove reaction from this user
        message.reactions = message.reactions.filter(
          (reaction) => reaction.userId.toString() !== userId
        );

        message.updatedAt = new Date();
        await chat.save();

        // Emit to all users in chat
        io.to(chatId).emit("reaction_removed", {
          chatId,
          messageId,
          userId,
        });
      } catch (error) {
        console.error("Error removing reaction:", error);
        socket.emit("error", { message: "Failed to remove reaction" });
      }
    });

    // File upload progress (for real-time updates)
    socket.on("file_upload_progress", (data) => {
      const { chatId, fileName, progress } = data;
      socket.to(chatId).emit("file_upload_progress", {
        userId: socket.user._id,
        fileName,
        progress,
      });
    });

    // Chat archive/unarchive
    socket.on("archive_chat", async (data) => {
      try {
        const { chatId } = data;
        const userId = socket.user._id.toString();

        const chat = await Chat.findById(chatId);
        if (!chat) {
          socket.emit("error", { message: "Chat not found" });
          return;
        }

        // Check if user is participant
        const buyerId = chat.buyer.toString();
        const sellerId = chat.seller.toString();

        if (userId !== buyerId && userId !== sellerId) {
          socket.emit("error", { message: "Unauthorized" });
          return;
        }

        // Archive for this user
        if (!chat.archivedBy) chat.archivedBy = [];
        if (!chat.archivedBy.includes(userId)) {
          chat.archivedBy.push(userId);
        }

        await chat.save();

        socket.emit("chat_archived", { chatId });
      } catch (error) {
        console.error("Error archiving chat:", error);
        socket.emit("error", { message: "Failed to archive chat" });
      }
    });

    // Chat block/unblock
    socket.on("block_chat", async (data) => {
      try {
        const { chatId } = data;
        const userId = socket.user._id.toString();

        const chat = await Chat.findById(chatId);
        if (!chat) {
          socket.emit("error", { message: "Chat not found" });
          return;
        }

        // Check if user is participant
        const buyerId = chat.buyer.toString();
        const sellerId = chat.seller.toString();

        if (userId !== buyerId && userId !== sellerId) {
          socket.emit("error", { message: "Unauthorized" });
          return;
        }

        // Block for this user
        if (!chat.blockedBy) chat.blockedBy = [];
        if (!chat.blockedBy.includes(userId)) {
          chat.blockedBy.push(userId);
        }

        await chat.save();

        socket.emit("chat_blocked", { chatId });

        // Notify other participant
        const otherUserId = userId === buyerId ? sellerId : buyerId;
        socket.to(otherUserId).emit("chat_blocked_by_other", { chatId });
      } catch (error) {
        console.error("Error blocking chat:", error);
        socket.emit("error", { message: "Failed to block chat" });
      }
    });

    socket.on("typing", ({ chatId, isTyping }) => {
      socket.to(chatId).emit("typing", {
        chatId,
        userId: socket.user._id,
        isTyping,
      });
    });

    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.user.name, socket.user._id);

      const userSocketSet = userSockets.get(socket.user._id);
      if (userSocketSet) {
        userSocketSet.delete(socket.id);

        if (userSocketSet.size === 0) {
          userSockets.delete(socket.user._id);
          broadcastUserStatus(socket.user._id, false);
        }
      }
    });

    if (socket.user._id) {
      handleOrderEvents(io, socket, socket.user._id);
    }
  });

  const broadcastUserStatus = (userId, isOnline) => {
    io.emit("user_status", {
      userId,
      status: isOnline ? "online" : "offline",
      timestamp: new Date().toISOString(),
    });
  };

  return io;
};

const handleOrderEvents = (io, socket, userId) => {
  socket.join(`user:${userId}`);

  socket.on("orderStatusUpdate", async (data) => {
    const { orderId, status, buyerId } = data;

    io.to(`user:${buyerId}`).emit("orderUpdate", {
      type: "statusChange",
      orderId,
      status,
      timestamp: new Date(),
    });
  });

  socket.on("orderReviewed", async (data) => {
    const { orderId, sellerId } = data;

    io.to(`user:${sellerId}`).emit("orderUpdate", {
      type: "reviewed",
      orderId,
      timestamp: new Date(),
    });
  });
};

module.exports = {
  initializeSocket,
  getIO: () => {
    if (!io) {
      throw new Error("Socket.io not initialized");
    }
    return io;
  },
};
