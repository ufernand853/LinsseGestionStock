const { Schema, model, Types } = require('mongoose');

const subscriptionSchema = new Schema(
  {
    tenant: { type: Types.ObjectId, ref: 'Tenant', required: true, index: true },
    plan: { type: Types.ObjectId, ref: 'SubscriptionPlan', required: true },
    provider: { type: String, enum: ['mercadopago'], default: 'mercadopago', index: true },
    providerSubscriptionId: { type: String, default: null, trim: true, index: true },
    initPoint: { type: String, default: null, trim: true },
    status: {
      type: String,
      enum: ['pending', 'authorized', 'active', 'paused', 'past_due', 'canceled', 'rejected'],
      default: 'pending',
      index: true
    },
    payerEmail: { type: String, required: true, trim: true, lowercase: true },
    amount: { type: Number, default: null, min: 0 },
    currency: { type: String, default: 'UYU', trim: true, uppercase: true },
    startedAt: { type: Date, default: null },
    currentPeriodEndsAt: { type: Date, default: null },
    canceledAt: { type: Date, default: null },
    rawProviderData: { type: Schema.Types.Mixed, default: null }
  },
  { timestamps: true, versionKey: false }
);

subscriptionSchema.index({ tenant: 1, provider: 1, status: 1 });

module.exports = model('Subscription', subscriptionSchema);
