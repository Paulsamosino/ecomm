const socketIo = require("socket.io");
const jwt = require("jsonwebtoken");
const Chat = require("./src/models/Chat");
const Message = require("./src/models/Message");
const User = require("./src/models/User");
const mongoose = require("mongoose");

// Map to track which users are online and their socket connections
const userSockets = new Map();

// Helper function to extract user ID
const extractUserId = (user) => {
  if (!user) return null;
  if (typeof user === "string") return user;
  return (user._id || user.id)?.toString();
};

// Helper function to compare IDs safely
const compareIds = (id1, id2) => {
  if (!id1 || !id2) return false;
  return String(id1) === String(id2);
};

// List of specific allowed domains
const allowedDomains = [
  "http://localhost:5173",
  "https://chickenpoultry.shop",
  "https://www.chickenpoultry.shop",
  "https://api.chickenpoultry.shop",
  "https://ecomm-git-main-ecomms-projects-807aa19d.vercel.app",
];

// Function to setup socket server
const setupSocketServer = (server) => {
  const io = socketIo(server, {
    cors: {
      origin: function (origin, callback) {
        // Allow all origins in development
        if (process.env.NODE_ENV !== "production") {
          return callback(null, true);
        }

        // In production, check against allowed domains
        if (!origin) return callback(null, true);

        if (
          allowedDomains.includes(origin) ||
          origin.includes("chickenpoultry.shop") ||
          origin.includes(".vercel.app") ||
          origin.includes(".render.com")
        ) {
          return callback(null, true);
        }
        return callback(new Error("Not allowed by CORS"));
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
    path: "/socket.io/",
    secure: process.env.NODE_ENV === "production",
    cookie: {
      name: "io",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "none",
    },
  });

  // Socket authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error("Authentication token required"));
      }

      // Verify JWT token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Find user in database to ensure they exist and get latest data
      const user = await User.findById(decoded.id || decoded.userId);
      if (!user) {
        return next(new Error("User not found"));
      }

      // Attach user data to socket object
      socket.user = user;
      next();
    } catch (error) {
      console.error("Socket authentication error:", error);
      next(new Error("Authentication error"));
    }
  });

  // Handle socket connections
  io.on("connection", async (socket) => {
    try {
      const userId = extractUserId(socket.user);
      console.log(`User connected: ${socket.user.name} (${userId})`);

      // Add socket to user's socket collection
      if (!userSockets.has(userId)) {
        userSockets.set(userId, new Set());
      }
      userSockets.get(userId).add(socket.id);

      // Join user's personal room for direct messaging
      socket.join(userId);

      // Update user's online status in database
      await User.findByIdAndUpdate(userId, {
        isOnline: true,
        lastActive: new Date(),
      });

      // Broadcast user's online status to all connected users
      socket.broadcast.emit("user_status", {
        userId: userId,
        status: "online",
        isOnline: true,
        lastActive: new Date(),
      });

      // Handle joining a chat room
      socket.on("join_chat", async ({ chatId }) => {
        if (!mongoose.Types.ObjectId.isValid(chatId)) {
          socket.emit("error", { message: "Invalid chat ID format" });
          return;
        }

        try {
          const chat = await Chat.findById(chatId)
            .populate("buyer", "id _id name email isOnline lastActive")
            .populate("seller", "id _id name email isOnline lastActive");

          if (!chat) {
            socket.emit("error", { message: "Chat not found" });
            return;
          }

          const buyerId = extractUserId(chat.buyer);
          const sellerId = extractUserId(chat.seller);

          // Verify user has access to this chat
          if (userId === buyerId || userId === sellerId) {
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

              // Update message status to READ for each message
              unreadMessages.forEach((msg) => {
                io.to(chatId).emit("message_status", {
                  chatId,
                  messageId: msg._id,
                  status: "READ",
                  timestamp: new Date(),
                });
              });
            }

            // Send confirmation of successful join
            socket.emit("chat_joined", {
              chatId,
              participants: {
                buyer: chat.buyer,
                seller: chat.seller,
              },
            });
          } else {
            socket.emit("error", {
              message: "You don't have permission to access this chat",
            });
          }
        } catch (error) {
          console.error("Error joining chat:", error);
          socket.emit("error", { message: "Failed to join chat" });
        }
      });

      // Handle leaving a chat room
      socket.on("leave_chat", ({ chatId }) => {
        socket.leave(chatId);
        console.log(`User ${userId} left chat ${chatId}`);
        socket.emit("chat_left", { chatId });
      });

      // Handle new message
      socket.on("new_message", async (data) => {
        try {
          const { chatId, content, tempId } = data;

          // Validate inputs
          if (!chatId || !mongoose.Types.ObjectId.isValid(chatId)) {
            socket.emit("message_error", {
              message: "Invalid chat ID",
              tempId,
            });
            return;
          }

          if (
            !content ||
            typeof content !== "string" ||
            content.trim() === ""
          ) {
            socket.emit("message_error", {
              message: "Message content is required",
              tempId,
            });
            return;
          }

          const chat = await Chat.findById(chatId)
            .populate("buyer", "id _id name email isOnline")
            .populate("seller", "id _id name email isOnline");

          if (!chat) {
            socket.emit("message_error", {
              message: "Chat not found",
              tempId,
            });
            return;
          }

          // Verify sender has access to this chat
          const buyerId = extractUserId(chat.buyer);
          const sellerId = extractUserId(chat.seller);
          const isBuyer = userId === buyerId;
          const isSeller = userId === sellerId;

          if (!isBuyer && !isSeller) {
            socket.emit("message_error", {
              message: "Unauthorized to send messages in this chat",
              tempId,
            });
            return;
          }

          // Check for recent duplicate messages (prevent double-send)
          const recentMessages = chat.messages.slice(-5);
          const isDuplicate = recentMessages.some(
            (msg) =>
              msg.senderId.toString() === userId &&
              msg.content === content.trim() &&
              new Date() - new Date(msg.createdAt) < 5000 // Within 5 seconds
          );

          if (isDuplicate) {
            console.log("Duplicate message detected, ignoring");
            return;
          }

          // Create and save the message
          const newMessage = {
            _id: new mongoose.Types.ObjectId(),
            content: content.trim(),
            senderId: userId,
            status: "SENT",
            createdAt: new Date(),
            updatedAt: new Date(),
          };

          chat.messages.push(newMessage);
          chat.lastMessage = newMessage;
          chat.updatedAt = new Date();
          await chat.save();

          // Get recipient info
          const recipient = isBuyer ? chat.seller : chat.buyer;
          const recipientId = extractUserId(recipient);

          // Prepare message data with sender info
          const messageData = {
            ...newMessage,
            _id: newMessage._id.toString(),
            senderId: userId,
            sender: {
              _id: socket.user._id,
              name: socket.user.name,
              email: socket.user.email,
              isSeller: socket.user.isSeller,
            },
            chat: {
              _id: chatId,
              buyer: chat.buyer,
              seller: chat.seller,
            },
          };

          // Emit to all users in the chat room
          io.to(chatId).emit("new_message", {
            chatId,
            message: messageData,
          });

          // Check if recipient is online and update status to DELIVERED
          if (
            userSockets.has(recipientId) &&
            userSockets.get(recipientId).size > 0
          ) {
            // Update message status to DELIVERED in database
            await Chat.updateOne(
              { "messages._id": newMessage._id },
              {
                $set: {
                  "messages.$.status": "DELIVERED",
                  "messages.$.updatedAt": new Date(),
                },
              }
            );

            // Emit status update
            io.to(chatId).emit("message_status", {
              chatId,
              messageId: newMessage._id.toString(),
              status: "DELIVERED",
              timestamp: new Date(),
            });

            // Send push notification to recipient if they have other tabs open
            io.to(recipientId).emit("new_message_notification", {
              chatId,
              sender: {
                name: socket.user.name,
                _id: userId,
              },
              preview:
                content.substring(0, 50) + (content.length > 50 ? "..." : ""),
              timestamp: new Date(),
            });
          }

          // Send success confirmation to sender
          socket.emit("message_sent", {
            tempId,
            message: messageData,
          });

          console.log(`Message sent: ${newMessage._id} in chat ${chatId}`);
        } catch (error) {
          console.error("Error sending message:", error);
          socket.emit("message_error", {
            message: "Failed to send message",
            tempId: data.tempId,
            error: error.message,
          });
        }
      });

      // Handle message status updates
      socket.on("message_status", async ({ chatId, messageId, status }) => {
        try {
          if (!["SENT", "DELIVERED", "READ"].includes(status)) {
            console.warn(`Invalid message status: ${status}`);
            return;
          }

          const result = await Chat.updateOne(
            { "messages._id": messageId },
            {
              $set: {
                "messages.$.status": status,
                "messages.$.updatedAt": new Date(),
              },
            }
          );

          if (result.modifiedCount > 0) {
            // Broadcast status update to all users in the chat
            io.to(chatId).emit("message_status", {
              chatId,
              messageId,
              status,
              timestamp: new Date(),
            });

            console.log(`Message ${messageId} status updated to ${status}`);
          }
        } catch (error) {
          console.error("Error updating message status:", error);
        }
      });

      // Handle typing indicators
      socket.on("typing_start", ({ chatId }) => {
        socket.to(chatId).emit("user_typing", {
          chatId,
          userId: userId,
          userName: socket.user.name,
          isTyping: true,
        });
      });

      socket.on("typing_stop", ({ chatId }) => {
        socket.to(chatId).emit("user_typing", {
          chatId,
          userId: userId,
          userName: socket.user.name,
          isTyping: false,
        });
      });

      // Handle explicit user status updates
      socket.on("update_status", async ({ status }) => {
        try {
          const validStatuses = ["online", "away", "busy"];
          if (!validStatuses.includes(status)) {
            return;
          }

          await User.findByIdAndUpdate(userId, {
            isOnline: status === "online",
            lastActive: new Date(),
          });

          // Broadcast status to all users
          socket.broadcast.emit("user_status", {
            userId: userId,
            status,
            isOnline: status === "online",
            lastActive: new Date(),
          });
        } catch (error) {
          console.error("Error updating user status:", error);
        }
      });

      // Handle disconnection
      socket.on("disconnect", async () => {
        try {
          console.log(`User disconnected: ${socket.user.name} (${userId})`);

          // Remove socket from user's socket collection
          if (userSockets.has(userId)) {
            userSockets.get(userId).delete(socket.id);

            // If all user's sockets are disconnected, update online status
            if (userSockets.get(userId).size === 0) {
              await User.findByIdAndUpdate(userId, {
                isOnline: false,
                lastActive: new Date(),
              });

              // Broadcast user's offline status
              socket.broadcast.emit("user_status", {
                userId: userId,
                status: "offline",
                isOnline: false,
                lastActive: new Date(),
              });

              // Clean up empty sets
              userSockets.delete(userId);
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

  // Socket authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error("Authentication token required"));
      }

      // Verify JWT token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Find user in database to ensure they exist and get latest data
      const user = await User.findById(decoded.id || decoded.userId);
      if (!user) {
        return next(new Error("User not found"));
      }

      // Attach user data to socket object
      socket.user = user;
      next();
    } catch (error) {
      console.error("Socket authentication error:", error);
      next(new Error("Authentication error"));
    }
  });

  // Handle socket connections
  io.on("connection", async (socket) => {
    try {
      const userId = socket.user._id.toString();

      // Add socket to user's socket collection
      if (!userSockets.has(userId)) {
        userSockets.set(userId, new Set());
      }
      userSockets.get(userId).add(socket.id);

      // Update user's online status in database
      await User.findByIdAndUpdate(userId, {
        isOnline: true,
        lastActive: new Date(),
      });

      // Broadcast user's online status to all connected users
      io.emit("user_status", {
        userId: socket.user._id,
        status: "online",
        lastSeen: new Date(),
      });
    } catch (error) {
      console.error("Error updating user status:", error);
    }

    // Handle joining a chat room
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
        if (userId === buyerId || userId === sellerId) {
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

            // Update message status to READ
            unreadMessages.forEach((msg) => {
              io.to(chatId).emit("message_status", {
                chatId,
                messageId: msg._id,
                status: "READ",
              });
            });
          }
        } else {
          socket.emit("error", {
            message: "You don't have permission to access this chat",
            details: {
              userId,
              buyerId,
              sellerId,
              isSeller: socket.user.isSeller,
            },
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
          console.log("Duplicate message detected, skipping:", message.content);
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

        // Remove socket from user's socket collection
        if (userSockets.has(userId)) {
          userSockets.get(userId).delete(socket.id);

          // If all user's sockets are disconnected, update online status
          if (userSockets.get(userId).size === 0) {
            await User.findByIdAndUpdate(userId, {
              isOnline: false,
              lastActive: new Date(),
            });

            // Broadcast user's offline status
            io.emit("user_status", {
              userId,
              status: "offline",
              lastSeen: new Date(),
            });

            // Clean up empty sets
            userSockets.delete(userId);
          }
        }
      } catch (error) {
        console.error("Error handling disconnect:", error);
      }
    });
  });

  return io;
};

module.exports = setupSocketServer;
