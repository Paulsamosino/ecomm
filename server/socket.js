const socketIo = require("socket.io");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const User = require("./src/models/User");
const Chat = require("./src/models/Chat");

// Store active user sockets with role information
const userSockets = new Map();

// Helper function to extract user ID consistently
const extractUserId = (user) => {
  if (!user) return null;
  if (typeof user === "string") return user;
  if (user instanceof mongoose.Types.ObjectId) return user.toString();
  return (user._id || user.id)?.toString();
};

// List of allowed domains
const allowedDomains = [
  "http://localhost:5173",
  "http://localhost:3000",
  "https://poultrymart-client.onrender.com",
  "https://poultrymart-api.onrender.com",
  "https://chickenpoultry.shop",
  "https://www.chickenpoultry.shop",
];

const setupSocketServer = (server) => {
  const io = socketIo(server, {
    cors: {
      origin: function (origin, callback) {
        if (
          !origin ||
          allowedDomains.includes(origin) ||
          origin.includes("chickenpoultry.shop") ||
          origin.includes(".vercel.app") ||
          origin.includes(".render.com")
        ) {
          callback(null, true);
        } else {
          callback(new Error("Not allowed by CORS"));
        }
      },
      methods: ["GET", "POST", "OPTIONS"],
      credentials: true,
      allowedHeaders: [
        "Content-Type",
        "Authorization",
        "Origin",
        "X-Requested-With",
        "Accept",
      ],
    },
    transports: ["websocket", "polling"],
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  // Socket authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      const isSeller = socket.handshake.query.isSeller === "true";
      const userId = socket.handshake.query.userId;

      if (!token) {
        return next(new Error("Authentication token required"));
      }

      // Verify JWT token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Validate user ID from token matches query param
      if (decoded.id !== userId) {
        return next(new Error("Invalid user credentials"));
      }

      // Find and validate user
      const user = await User.findById(decoded.id).select(
        "_id name email isSeller isAdmin"
      );
      if (!user) {
        return next(new Error("User not found"));
      }

      // Validate seller access
      if (isSeller && !user.isSeller) {
        return next(new Error("Unauthorized seller access"));
      }

      // Attach validated user data to socket
      socket.user = {
        _id: user._id,
        name: user.name,
        email: user.email,
        isSeller: user.isSeller,
        isAdmin: user.isAdmin,
      };

      // Store socket with role information
      if (!userSockets.has(user._id.toString())) {
        userSockets.set(user._id.toString(), new Set());
      }
      userSockets.get(user._id.toString()).add(socket.id);

      next();
    } catch (error) {
      console.error("Socket authentication error:", error);
      next(new Error("Authentication failed"));
    }
  });

  // Handle socket connections
  io.on("connection", async (socket) => {
    try {
      const userId = socket.user._id.toString();

      // Update user's online status
      await User.findByIdAndUpdate(userId, {
        isOnline: true,
        lastActive: new Date(),
      });

      // Broadcast user's online status
      io.emit("user_status", {
        userId: socket.user._id,
        status: "online",
        lastSeen: new Date(),
      });

      // Handle chat room access
      socket.on("join_chat", async ({ chatId }) => {
        if (!mongoose.Types.ObjectId.isValid(chatId)) {
          socket.emit("error", { message: "Invalid chat ID format" });
          return;
        }

        try {
          const chat = await Chat.findById(chatId)
            .populate("buyer", "id _id name email isOnline")
            .populate("seller", "id _id name email isOnline");

          if (!chat) {
            socket.emit("error", { message: "Chat not found" });
            return;
          }

          const userId = socket.user._id.toString();
          const buyerId = extractUserId(chat.buyer);
          const sellerId = extractUserId(chat.seller);

          // Verify user has access to this chat
          const hasAccess =
            userId === buyerId || (socket.user.isSeller && userId === sellerId);
          if (!hasAccess) {
            socket.emit("unauthorized", {
              message: "Access denied. This area is restricted.",
              details: { chatId, userId },
            });
            return;
          }

          socket.join(chatId);
          console.log(`User ${userId} joined chat ${chatId}`);

          // Mark messages as read
          const unreadMessages = await chat.markMessagesAsRead(userId);
          if (unreadMessages.length > 0) {
            socket.to(chatId).emit("messages_read", {
              chatId,
              messageIds: unreadMessages.map((msg) => msg._id),
              readBy: userId,
            });

            // Update message status to READ
            unreadMessages.forEach((msg) => {
              io.to(chatId).emit("message_status", {
                chatId,
                messageId: msg._id,
                status: "READ",
              });
            });
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

          // Validate inputs
          if (!chatId || !mongoose.Types.ObjectId.isValid(chatId)) {
            socket.emit("message_error", { message: "Invalid chat ID" });
            return;
          }

          if (
            !message ||
            !message.content ||
            typeof message.content !== "string" ||
            message.content.trim() === ""
          ) {
            socket.emit("message_error", {
              message: "Message content is required",
            });
            return;
          }

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
              details: {
                senderId,
                buyerId: extractUserId(chat.buyer),
                sellerId: extractUserId(chat.seller),
                isSeller: socket.user.isSeller,
              },
            });
            return;
          }

          // Check if message with the same content was recently sent to prevent duplicates
          const recentDuplicateMessage = chat.messages
            .slice(-5) // Check last 5 messages
            .find(
              (msg) =>
                msg.senderId.toString() === senderId &&
                msg.content === message.content &&
                new Date() - new Date(msg.createdAt) < 10000 // Within last 10 seconds
            );

          if (recentDuplicateMessage) {
            console.log(
              "Duplicate message detected, skipping:",
              message.content
            );
            // Just acknowledge the message but don't create a duplicate
            socket.emit("message_status", {
              chatId,
              messageId: recentDuplicateMessage._id,
              status: recentDuplicateMessage.status,
            });
            return;
          }

          // Create and save the message
          const newMessage = {
            _id:
              message._id && mongoose.Types.ObjectId.isValid(message._id)
                ? message._id
                : new mongoose.Types.ObjectId(),
            content: message.content.trim(),
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
            // Update message status to DELIVERED in database
            await Chat.updateOne(
              { "messages._id": newMessage._id },
              { $set: { "messages.$.status": "DELIVERED" } }
            );

            // Emit status update to the chat room
            io.to(chatId).emit("message_status", {
              chatId,
              messageId: newMessage._id,
              status: "DELIVERED",
            });
          }

          console.log("Message sent successfully:", {
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

      socket.on("message_status", async ({ chatId, messageId, status }) => {
        try {
          if (!["SENT", "DELIVERED", "READ"].includes(status)) {
            console.warn(`Invalid message status: ${status}`);
            return;
          }

          const result = await Chat.updateOne(
            { "messages._id": messageId },
            { $set: { "messages.$.status": status } }
          );

          if (result.modifiedCount > 0) {
            // Broadcast status update to all users in the chat
            io.to(chatId).emit("message_status", {
              chatId,
              messageId,
              status,
            });

            console.log(`Message ${messageId} status updated to ${status}`);
          } else {
            console.warn(
              `Message ${messageId} not found or status already set to ${status}`
            );
          }
        } catch (error) {
          console.error("Error updating message status:", error);
        }
      });

      // Handle typing status
      socket.on("typing", ({ chatId, isTyping }) => {
        socket.to(chatId).emit("typing", {
          chatId,
          userId: socket.user._id,
          isTyping,
        });
      });

      // Handle user status updates
      socket.on("user_status", async ({ status }) => {
        try {
          const userId = socket.user._id.toString();

          // Update user's online status in database
          await User.findByIdAndUpdate(userId, {
            isOnline: status === "online",
            lastActive: new Date(),
          });

          // Broadcast user's status to all connected users
          io.emit("user_status", {
            userId,
            status,
            lastSeen: new Date(),
          });
        } catch (error) {
          console.error("Error updating user status:", error);
        }
      });

      // Handle disconnection
      socket.on("disconnect", async () => {
        try {
          const userId = socket.user._id.toString();
          const userSocketSet = userSockets.get(userId);

          if (userSocketSet) {
            userSocketSet.delete(socket.id);

            if (userSocketSet.size === 0) {
              userSockets.delete(userId);
              await User.findByIdAndUpdate(userId, {
                isOnline: false,
                lastActive: new Date(),
              });

              io.emit("user_status", {
                userId,
                status: "offline",
                lastSeen: new Date(),
              });
            }
          }
        } catch (error) {
          console.error("Error handling disconnect:", error);
        }
      });
    } catch (error) {
      console.error("Error in socket connection:", error);
    }
  });

  return io;
};

module.exports = setupSocketServer;
