const { Schema, model, Types } = require('mongoose');

const tenantSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    billingEmail: { type: String, required: true, trim: true, lowercase: true },
    plan: { type: Types.ObjectId, ref: 'SubscriptionPlan', required: true },
    subscriptionStatus: {
      type: String,
      enum: ['trialing', 'active', 'past_due', 'canceled'],
      default: 'trialing'
    },
    trialEndsAt: { type: Date, default: null },
    currentPeriodEndsAt: { type: Date, default: null }
  },
  { timestamps: true, versionKey: false }
);

tenantSchema.index({ billingEmail: 1 });

module.exports = model('Tenant', tenantSchema);
