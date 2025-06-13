const mongoose = require("mongoose");

const attachmentSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ["image", "file", "audio", "video"],
    required: true,
  },
  url: {
    type: String,
    required: true,
  },
  filename: {
    type: String,
    required: true,
  },
  size: {
    type: Number,
    required: true,
  },
  mimeType: {
    type: String,
    required: true,
  },
});

const reactionSchema = new mongoose.Schema({
  emoji: {
    type: String,
    required: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const messageSchema = new mongoose.Schema(
  {
    chat: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Chat",
      required: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    content: {
      type: String,
      trim: true,
    },
    messageType: {
      type: String,
      enum: ["text", "image", "file", "audio", "video", "system"],
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
    originalContent: {
      type: String, // Store original content when edited
    },
    replyTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
    },
    attachments: [attachmentSchema],
    reactions: [reactionSchema],
    readBy: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        readAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    deletedAt: {
      type: Date,
    },
    deletedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    metadata: {
      location: {
        latitude: Number,
        longitude: Number,
        address: String,
      },
      productReference: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
      },
      orderReference: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Order",
      },
    },
  },
  {
    timestamps: true,
  }
);

// Virtual for checking if message is deleted
messageSchema.virtual("isDeleted").get(function () {
  return !!this.deletedAt;
});

// Method to add reaction
messageSchema.methods.addReaction = function (emoji, userId) {
  const existingReaction = this.reactions.find(
    (r) => r.emoji === emoji && r.user.toString() === userId.toString()
  );

  if (existingReaction) {
    // Remove reaction if it already exists
    this.reactions = this.reactions.filter(
      (r) => !(r.emoji === emoji && r.user.toString() === userId.toString())
    );
  } else {
    // Add new reaction
    this.reactions.push({ emoji, user: userId });
  }

  return this.save();
};

// Method to edit message
messageSchema.methods.editContent = function (newContent, userId) {
  if (this.sender.toString() !== userId.toString()) {
    throw new Error("Only sender can edit the message");
  }

  if (!this.edited) {
    this.originalContent = this.content;
  }

  this.content = newContent;
  this.edited = true;
  this.editedAt = new Date();

  return this.save();
};

// Method to soft delete message
messageSchema.methods.softDelete = function (userId) {
  if (this.sender.toString() !== userId.toString()) {
    throw new Error("Only sender can delete the message");
  }

  this.deletedAt = new Date();
  this.deletedBy = userId;

  return this.save();
};

// Method to mark as read by user
messageSchema.methods.markAsRead = function (userId) {
  const existingRead = this.readBy.find(
    (r) => r.user.toString() === userId.toString()
  );

  if (!existingRead) {
    this.readBy.push({ user: userId, readAt: new Date() });
    return this.save();
  }

  return Promise.resolve(this);
};

// Create indexes for better query performance
messageSchema.index({ chat: 1, createdAt: -1 });
messageSchema.index({ sender: 1 });
messageSchema.index({ status: 1 });
messageSchema.index({ messageType: 1 });
messageSchema.index({ deletedAt: 1 });
messageSchema.index({ "reactions.user": 1 });

const Message = mongoose.model("Message", messageSchema);

module.exports = Message;
