const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// Enhanced message schema with more features
const messageSchema = new Schema({
  content: {
    type: String,
    trim: true,
  },
  senderId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  messageType: {
    type: String,
    enum: [
      "text",
      "image",
      "file",
      "audio",
      "video",
      "system",
      "product",
      "order",
    ],
    default: "text",
  },
  status: {
    type: String,
    enum: ["SENT", "DELIVERED", "READ"],
    default: "SENT",
  },
  edited: {
    type: Boolean,
    default: false,
  },
  editedAt: {
    type: Date,
  },
  originalContent: String,
  replyTo: {
    type: Schema.Types.ObjectId,
    ref: "Message",
  },
  attachments: [
    {
      type: {
        type: String,
        enum: ["image", "file", "audio", "video"],
      },
      url: String,
      filename: String,
      size: Number,
      mimeType: String,
    },
  ],
  reactions: [
    {
      emoji: String,
      user: {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
      createdAt: {
        type: Date,
        default: Date.now,
      },
    },
  ],
  readBy: [
    {
      user: {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
      readAt: {
        type: Date,
        default: Date.now,
      },
    },
  ],
  deletedAt: Date,
  deletedBy: {
    type: Schema.Types.ObjectId,
    ref: "User",
  },
  metadata: {
    location: {
      latitude: Number,
      longitude: Number,
      address: String,
    },
    productReference: {
      type: Schema.Types.ObjectId,
      ref: "Product",
    },
    orderReference: {
      type: Schema.Types.ObjectId,
      ref: "Order",
    },
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Enhanced chat schema
const chatSchema = new Schema({
  buyer: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  seller: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  messages: [messageSchema],
  lastMessage: messageSchema,
  product: {
    type: Schema.Types.ObjectId,
    ref: "Product",
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  isArchived: {
    type: Boolean,
    default: false,
  },
  archivedBy: [
    {
      user: {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
      archivedAt: {
        type: Date,
        default: Date.now,
      },
    },
  ],
  blockedBy: [
    {
      user: {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
      blockedAt: {
        type: Date,
        default: Date.now,
      },
      reason: String,
    },
  ],
  pinnedMessages: [
    {
      messageId: {
        type: Schema.Types.ObjectId,
        ref: "Message",
      },
      pinnedBy: {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
      pinnedAt: {
        type: Date,
        default: Date.now,
      },
    },
  ],
  chatSettings: {
    notifications: {
      buyer: {
        type: Boolean,
        default: true,
      },
      seller: {
        type: Boolean,
        default: true,
      },
    },
    autoDeleteDays: {
      type: Number,
      default: 0, // 0 means never auto-delete
    },
  },
  tags: [String], // For organizing chats
  priority: {
    type: String,
    enum: ["low", "normal", "high", "urgent"],
    default: "normal",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Method to mark messages as read
chatSchema.methods.markMessagesAsRead = async function (userId) {
  if (!userId) return [];

  // Find messages that are sent to this user and are not yet read
  const unreadMessages = this.messages.filter((msg) => {
    // Message is considered "to this user" if it was sent by someone else
    const isToThisUser = msg.senderId.toString() !== userId.toString();
    // Message is unread if status is not read
    const isUnread = msg.status !== "READ";

    return isToThisUser && isUnread && !msg.deletedAt;
  });

  // Update status of unread messages to read
  if (unreadMessages.length > 0) {
    for (const message of unreadMessages) {
      message.status = "READ";
      message.updatedAt = new Date();

      // Add to readBy array if not already present
      const existingRead = message.readBy.find(
        (r) => r.user.toString() === userId.toString()
      );
      if (!existingRead) {
        message.readBy.push({ user: userId, readAt: new Date() });
      }
    }

    // Save the updated chat
    await this.save();
  }

  return unreadMessages;
};

// Method to get unread message count for a user
chatSchema.methods.getUnreadCount = function (userId) {
  if (!userId) {
    console.warn("getUnreadCount called with empty userId");
    return 0;
  }

  try {
    const userIdStr = userId.toString();

    if (!this.messages || !Array.isArray(this.messages)) {
      console.warn("No messages array found in chat");
      return 0;
    }

    return this.messages.filter((msg) => {
      if (!msg || !msg.senderId) {
        return false;
      }

      return (
        msg.senderId.toString() !== userIdStr &&
        msg.status !== "READ" &&
        !msg.deletedAt
      );
    }).length;
  } catch (error) {
    console.error("Error in getUnreadCount:", error);
    return 0;
  }
};

// Method to get the last message with sender info
chatSchema.methods.getLastMessageWithSender = async function () {
  if (!this.lastMessage) return null;

  await this.populate("lastMessage.senderId", "name email isSeller");
  return this.lastMessage;
};

// Method to add a new message
chatSchema.methods.addMessage = async function (messageData) {
  const newMessage = {
    _id: messageData._id || new mongoose.Types.ObjectId(),
    content: messageData.content,
    senderId: messageData.senderId,
    messageType: messageData.messageType || "text",
    status: messageData.status || "SENT",
    attachments: messageData.attachments || [],
    metadata: messageData.metadata || {},
    createdAt: messageData.createdAt || new Date(),
    updatedAt: messageData.updatedAt || new Date(),
  };

  this.messages.push(newMessage);
  this.lastMessage = newMessage;
  this.updatedAt = new Date();

  await this.save();
  return newMessage;
};

// Method to update message status
chatSchema.methods.updateMessageStatus = async function (messageId, status) {
  const message = this.messages.id(messageId);
  if (!message) return false;

  message.status = status;
  message.updatedAt = new Date();

  await this.save();
  return true;
};

// Method to edit a message
chatSchema.methods.editMessage = async function (
  messageId,
  newContent,
  userId
) {
  const message = this.messages.id(messageId);
  if (!message) return false;

  if (message.senderId.toString() !== userId.toString()) {
    throw new Error("Only sender can edit the message");
  }

  if (!message.edited) {
    message.originalContent = message.content;
  }

  message.content = newContent;
  message.edited = true;
  message.editedAt = new Date();
  message.updatedAt = new Date();

  await this.save();
  return message;
};

// Method to add reaction to a message
chatSchema.methods.addMessageReaction = async function (
  messageId,
  emoji,
  userId
) {
  const message = this.messages.id(messageId);
  if (!message) return false;

  const existingReaction = message.reactions.find(
    (r) => r.emoji === emoji && r.user.toString() === userId.toString()
  );

  if (existingReaction) {
    // Remove reaction if it already exists
    message.reactions = message.reactions.filter(
      (r) => !(r.emoji === emoji && r.user.toString() === userId.toString())
    );
  } else {
    // Add new reaction
    message.reactions.push({ emoji, user: userId });
  }

  await this.save();
  return message;
};

// Method to soft delete a message
chatSchema.methods.deleteMessage = async function (messageId, userId) {
  const message = this.messages.id(messageId);
  if (!message) return false;

  if (message.senderId.toString() !== userId.toString()) {
    throw new Error("Only sender can delete the message");
  }

  message.deletedAt = new Date();
  message.deletedBy = userId;

  await this.save();
  return message;
};

// Method to archive chat for a user
chatSchema.methods.archiveForUser = async function (userId) {
  const existingArchive = this.archivedBy.find(
    (a) => a.user.toString() === userId.toString()
  );

  if (!existingArchive) {
    this.archivedBy.push({ user: userId });
    await this.save();
  }

  return this;
};

// Method to block chat for a user
chatSchema.methods.blockForUser = async function (userId, reason = "") {
  const existingBlock = this.blockedBy.find(
    (b) => b.user.toString() === userId.toString()
  );

  if (!existingBlock) {
    this.blockedBy.push({ user: userId, reason });
    await this.save();
  }

  return this;
};

// Method to check if chat is blocked by user
chatSchema.methods.isBlockedByUser = function (userId) {
  // Check if blockedBy exists before checking if user is in it
  if (!this.blockedBy || !Array.isArray(this.blockedBy)) {
    return false;
  }

  if (!userId) {
    return false;
  }

  try {
    const userIdStr = userId.toString();
    return this.blockedBy.some(
      (b) => b && b.user && b.user.toString() === userIdStr
    );
  } catch (error) {
    console.error("Error in isBlockedByUser:", error);
    return false;
  }
};

// Method to check if chat is archived by user
chatSchema.methods.isArchivedByUser = function (userId) {
  // Check if archivedBy exists before checking if user is in it
  if (!this.archivedBy || !Array.isArray(this.archivedBy)) {
    return false;
  }

  if (!userId) {
    return false;
  }

  try {
    const userIdStr = userId.toString();
    return this.archivedBy.some(
      (a) => a && a.user && a.user.toString() === userIdStr
    );
  } catch (error) {
    console.error("Error in isArchivedByUser:", error);
    return false;
  }
};

// Static method to get all chats for a user with enhanced filtering
chatSchema.statics.getChatsWithUnreadCounts = async function (
  userId,
  options = {}
) {
  const {
    includeArchived = false,
    includeBlocked = false,
    tags = null,
    priority = null,
    limit = 50,
    page = 1,
  } = options;

  let matchQuery = {
    $or: [{ buyer: userId }, { seller: userId }],
    isActive: true,
  };

  // Filter out archived chats unless specifically requested
  if (!includeArchived) {
    matchQuery["archivedBy.user"] = { $ne: userId };
  }

  // Filter out blocked chats unless specifically requested
  if (!includeBlocked) {
    matchQuery["blockedBy.user"] = { $ne: userId };
  }

  // Filter by tags if specified
  if (tags && tags.length > 0) {
    matchQuery.tags = { $in: tags };
  }

  // Filter by priority if specified
  if (priority) {
    matchQuery.priority = priority;
  }

  const chats = await this.find(matchQuery)
    .populate("buyer", "name email id _id isOnline lastActive")
    .populate("seller", "name email id _id isOnline lastActive")
    .populate("product", "name price images")
    .populate("lastMessage.senderId", "name email")
    .sort({ updatedAt: -1 })
    .limit(limit)
    .skip((page - 1) * limit);

  // Add unread count and other computed fields for each chat
  return chats.map((chat) => {
    const unreadCount = chat.getUnreadCount(userId);
    const isArchived = chat.isArchivedByUser(userId);
    const isBlocked = chat.isBlockedByUser(userId);

    return {
      ...chat.toObject(),
      unreadCount,
      isArchived,
      isBlocked,
    };
  });
};

// Add indexes for better performance
chatSchema.index({ buyer: 1, seller: 1 });
chatSchema.index({ buyer: 1, updatedAt: -1 });
chatSchema.index({ seller: 1, updatedAt: -1 });
chatSchema.index({ isActive: 1 });
chatSchema.index({ "messages.status": 1 });
chatSchema.index({ tags: 1 });
chatSchema.index({ priority: 1 });
chatSchema.index({ "archivedBy.user": 1 });
chatSchema.index({ "blockedBy.user": 1 });

const Chat = mongoose.model("Chat", chatSchema);

module.exports = Chat;
