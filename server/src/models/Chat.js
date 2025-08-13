const mongoose = require("mongoose");

const reactionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    emoji: { type: String, required: true },
  },
  { _id: false, timestamps: true }
);

const messageSchema = new mongoose.Schema(
  {
    chat: { type: mongoose.Schema.Types.ObjectId, ref: "Chat", index: true },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    content: { type: String, default: "" },
    attachments: [
      {
        url: String,
        type: { type: String, enum: ["image", "file", "other"], default: "other" },
        name: String,
        size: Number,
      },
    ],
    reactions: [reactionSchema],
    readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    status: { type: String, enum: ["SENT", "DELIVERED", "READ"], default: "SENT", index: true },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

const chatSchema = new mongoose.Schema(
  {
    participants: [{ type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }],
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
    isSupport: { type: Boolean, default: false },
    lastMessageAt: { type: Date },
    lastMessage: { type: String, default: "" },
  },
  { timestamps: true }
);

chatSchema.index({ participants: 1 });
chatSchema.index({ lastMessageAt: -1 });
messageSchema.index({ chat: 1, createdAt: 1 });

module.exports = {
  Chat: mongoose.models.Chat || mongoose.model("Chat", chatSchema),
  Message: mongoose.models.Message || mongoose.model("Message", messageSchema),
};
