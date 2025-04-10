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
      if (!token) {
        return next(new Error("Authentication token missing"));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id);

      if (!user) {
        return next(new Error("User not found"));
      }

      // Attach user data to socket
      socket.user = {
        _id: user._id.toString(),
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        isSeller: user.isSeller,
      };

      // Track user's socket
      if (!userSockets.has(socket.user._id)) {
        userSockets.set(socket.user._id, new Set());
      }
      userSockets.get(socket.user._id).add(socket.id);

      // Join user's personal room for direct messages
      socket.join(socket.user._id);

      // Broadcast user's online status
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

        // Verify user has access to this chat
        if (
          userId === buyerId ||
          (socket.user.isSeller && userId === sellerId)
        ) {
          socket.join(chatId);
          console.log(`User ${userId} joined chat ${chatId}`);

          // Mark messages as read when joining chat
          const unreadMessages = await chat.markMessagesAsRead(userId);
          if (unreadMessages.length > 0) {
            // Notify about read messages
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
        const senderId = socket.user._id;

        const chat = await Chat.findById(chatId)
          .populate("buyer", "id _id name email")
          .populate("seller", "id _id name email");

        if (!chat) {
          socket.emit("message_error", { message: "Chat not found" });
          return;
        }

        // Verify sender has access to this chat
        const isBuyer = senderId === extractUserId(chat.buyer);
        const isSeller =
          socket.user.isSeller && senderId === extractUserId(chat.seller);

        if (!isBuyer && !isSeller) {
          socket.emit("message_error", {
            message: "Unauthorized to send messages in this chat",
          });
          return;
        }

        // Create and save the message
        const newMessage = {
          _id: new mongoose.Types.ObjectId(),
          content: message.content,
          senderId,
          status: "SENT",
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        chat.messages.push(newMessage);
        chat.lastMessage = newMessage;
        chat.updatedAt = new Date();
        await chat.save();

        // Get recipient ID and details
        const recipient = isBuyer ? chat.seller : chat.buyer;
        const recipientId = extractUserId(recipient);

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

        // Emit to the chat room and recipient's personal room
        io.to(chatId).to(recipientId).emit("new_message", {
          chatId,
          message: messageData,
        });

        // Update message status to delivered if recipient is online
        if (
          userSockets.has(recipientId) &&
          userSockets.get(recipientId).size > 0
        ) {
          chat.updateMessageStatus(newMessage._id, "DELIVERED");
          socket.emit("message_status", {
            chatId,
            messageId: newMessage._id,
            status: "DELIVERED",
          });
        }

        console.log("Message sent:", {
          chatId,
          senderId,
          recipientId,
          messageId: newMessage._id,
        });
      } catch (error) {
        console.error("Error sending message:", error);
        socket.emit("message_error", {
          message: "Failed to send message",
          error: error.message,
        });
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

      // Remove this socket from user's sockets
      const userSocketSet = userSockets.get(socket.user._id);
      if (userSocketSet) {
        userSocketSet.delete(socket.id);

        // If user has no more active sockets, broadcast offline status
        if (userSocketSet.size === 0) {
          userSockets.delete(socket.user._id);
          broadcastUserStatus(socket.user._id, false);
        }
      }
    });
  });

  // Function to broadcast user status
  const broadcastUserStatus = (userId, isOnline) => {
    io.emit("user_status", {
      userId,
      status: isOnline ? "online" : "offline",
      timestamp: new Date().toISOString(),
    });
  };

  return io;
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
