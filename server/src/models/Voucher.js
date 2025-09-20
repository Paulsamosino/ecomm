const mongoose = require('mongoose');

const voucherSchema = new mongoose.Schema({
  code: { type: String, required: true, uppercase: true, unique: true },
  // Make type optional to support "simple" vouchers (no discount) and allow a legacy 'amount' value if present
  type: { type: String, enum: ['fixed', 'percent', 'amount'], required: false },
  // amount is optional; for simple vouchers it will be 0
  amount: { type: Number, default: 0 }, // pesos or percent value
  minSpend: { type: Number, default: 0 },
  uses: { type: Number, default: 1 },
  usesLeft: { type: Number, default: 1 },
  // track which users have redeemed this voucher so a buyer can't reuse the same voucher
  usedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  active: { type: Boolean, default: true },
  expiresAt: { type: Date, default: null },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now },
  metadata: mongoose.Schema.Types.Mixed,
});

voucherSchema.methods.isValid = function(totalAmount, userId) {
  if (!this.active) return { valid: false, reason: 'inactive' };
  if (this.expiresAt && new Date() > this.expiresAt) return { valid: false, reason: 'expired' };
  if (this.usesLeft <= 0) return { valid: false, reason: 'exhausted' };
  if (totalAmount < (this.minSpend || 0)) return { valid: false, reason: 'min_spend' };
  if (userId) {
    // compare as strings in case userId is an ObjectId
    const used = (this.usedBy || []).some(u => String(u) === String(userId));
    if (used) return { valid: false, reason: 'already_used' };
  }
  return { valid: true };
};

voucherSchema.methods.applyTo = function(totalAmount) {
  // If no discount type/amount configured, treat voucher as a claim-only code with zero discount
  if (!this.type || !this.amount) {
    return { discount: 0, newTotal: totalAmount };
  }

  if (this.type === 'fixed' || this.type === 'amount') {
    const discount = Math.min(this.amount, totalAmount);
    return { discount, newTotal: Math.max(0, totalAmount - discount) };
  }
  // percent
  const discount = Math.round((this.amount / 100) * totalAmount * 100) / 100;
  return { discount, newTotal: Math.max(0, totalAmount - discount) };
};

voucherSchema.methods.redeem = async function(userId) {
  // If a userId is provided ensure the user hasn't already redeemed this voucher
  if (userId) {
    const used = (this.usedBy || []).some(u => String(u) === String(userId));
    if (used) throw new Error('User already redeemed this voucher');
  }
  if (this.usesLeft <= 0) throw new Error('Voucher exhausted');
  // decrement available uses
  this.usesLeft = this.usesLeft - 1;
  if (this.usesLeft < 0) this.usesLeft = 0;
  if (userId) {
    // record that this user has used the voucher
    this.usedBy = this.usedBy || [];
    this.usedBy.push(userId);
  }
  await this.save();
  return this;
};

module.exports = mongoose.model('Voucher', voucherSchema);
