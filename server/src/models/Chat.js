const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// Message schema
const messageSchema = new Schema({
  content: {
    type: String,
    required: true,
  },
  senderId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  status: {
    type: String,
    enum: ["SENT", "DELIVERED", "READ"],
    default: "SENT",
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

// Chat schema
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
    // Message is unread if status is not READ
    const isUnread = msg.status !== "READ";

    return isToThisUser && isUnread;
  });

  // Update status of unread messages to READ
  if (unreadMessages.length > 0) {
    const messageIds = unreadMessages.map((msg) => msg._id);

    for (const msgId of messageIds) {
      const message = this.messages.id(msgId);
      if (message) {
        message.status = "READ";
        message.updatedAt = new Date();
      }
    }

    // Save the updated chat
    await this.save();
  }

  return unreadMessages;
};

// Method to get unread message count for a user
chatSchema.methods.getUnreadCount = function (userId) {
  if (!userId) return 0;

  return this.messages.filter((msg) => {
    return (
      msg.senderId.toString() !== userId.toString() && msg.status !== "READ"
    );
  }).length;
};

// Static method to get all chats for a user with unread counts
chatSchema.statics.getChatsWithUnreadCounts = async function (userId) {
  const chats = await this.find({
    $or: [{ buyer: userId }, { seller: userId }],
  })
    .populate("buyer", "name email id _id")
    .populate("seller", "name email id _id")
    .populate("lastMessage")
    .sort({ updatedAt: -1 });

  // Add unread count for each chat
  return chats.map((chat) => {
    const unreadCount = chat.getUnreadCount(userId);
    return {
      ...chat.toObject(),
      unreadCount,
    };
  });
};

const Chat = mongoose.model("Chat", chatSchema);

module.exports = Chat;
