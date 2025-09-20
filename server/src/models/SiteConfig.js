const mongoose = require('mongoose');

const SiteConfigSchema = new mongoose.Schema({
  maintenance: { type: Boolean, default: false },
  // epoch seconds - tokens issued before this will be considered invalid
  tokenInvalidBefore: { type: Number, default: 0 },
  // scheduled maintenance timestamp (Date) if any
  maintenanceScheduledAt: { type: Date, default: null },
  // activatedAt timestamp
  maintenanceActivatedAt: { type: Date, default: null }
});

module.exports = mongoose.models.SiteConfig || mongoose.model('SiteConfig', SiteConfigSchema);
