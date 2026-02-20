const mongoose = require("mongoose");

const InventoryLogSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    sellerName: { type: String, required: true },
    sellerAvatar: { type: String, default: null },
    itemName: { type: String, required: true },
    category: { type: String, default: "Uncategorized" },
    qty: { type: Number, default: 0 },
    action: { type: String, default: "posted" }, // posted, restocked, updated
    note: { type: String, default: "" },
  },
  { timestamps: true }
);

InventoryLogSchema.index({ createdAt: -1 });

module.exports = mongoose.model("InventoryLog", InventoryLogSchema);
