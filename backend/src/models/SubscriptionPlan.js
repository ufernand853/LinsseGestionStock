const { Schema, model } = require('mongoose');

const subscriptionPlanSchema = new Schema(
  {
    code: { type: String, required: true, trim: true, uppercase: true, unique: true },
    name: { type: String, required: true, trim: true },
    priceUsdMonthly: { type: Number, default: null, min: 0 },
    productLimit: { type: Number, default: null, min: 1 },
    description: { type: String, default: '', trim: true },
    ctaLabel: { type: String, default: 'Contratar', trim: true },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true, versionKey: false }
);

module.exports = model('SubscriptionPlan', subscriptionPlanSchema);
