const { Schema, model } = require('mongoose');

const subscriptionPlanSchema = new Schema(
  {
    code: { type: String, required: true, trim: true, uppercase: true, unique: true },
    name: { type: String, required: true, trim: true },
    priceUsdMonthly: { type: Number, default: null, min: 0 },
    priceAmount: { type: Number, default: null, min: 0 },
    currency: { type: String, default: 'UYU', trim: true, uppercase: true },
    billingPeriod: { type: String, enum: ['days', 'months'], default: 'months' },
    productLimit: { type: Number, default: null, min: 1 },
    description: { type: String, default: '', trim: true },
    ctaLabel: { type: String, default: 'Contratar', trim: true },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true, versionKey: false }
);

module.exports = model('SubscriptionPlan', subscriptionPlanSchema);
