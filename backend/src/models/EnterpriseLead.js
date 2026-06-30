const mongoose = require('mongoose');

const enterpriseLeadSchema = new mongoose.Schema(
  {
    company: { type: String, required: true, trim: true },
    contact: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    phone: { type: String, trim: true },
    message: { type: String, trim: true },
    planCode: { type: String, default: 'ENTERPRISE' },
    source: { type: String, default: 'pricing' },
    status: {
      type: String,
      enum: ['new', 'contacted', 'closed'],
      default: 'new'
    }
  },
  { timestamps: true }
);

enterpriseLeadSchema.index({ email: 1, createdAt: -1 });
enterpriseLeadSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('EnterpriseLead', enterpriseLeadSchema);
