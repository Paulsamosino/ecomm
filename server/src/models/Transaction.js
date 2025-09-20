const mongoose = require('mongoose');

const TransactionSchema = new mongoose.Schema(
  {
    type: { type: String, required: true }, // fee | payout | refund | order
    amount: { type: Number, required: true },
    currency: { type: String, default: 'PHP' },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    relatedObject: { type: mongoose.Schema.Types.ObjectId, refPath: 'relatedModel' },
    relatedModel: { type: String },
    status: { type: String, default: 'completed' },
    meta: { type: Object, default: {} },
  },
  { timestamps: true }
);

TransactionSchema.index({ createdAt: -1 });
TransactionSchema.index({ type: 1 });
TransactionSchema.index({ user: 1 });

module.exports = mongoose.model('Transaction', TransactionSchema);
