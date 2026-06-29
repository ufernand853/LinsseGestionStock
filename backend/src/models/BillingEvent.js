const { Schema, model, Types } = require('mongoose');

const billingEventSchema = new Schema(
  {
    tenant: { type: Types.ObjectId, ref: 'Tenant', default: null, index: true },
    subscription: { type: Types.ObjectId, ref: 'Subscription', default: null, index: true },
    provider: { type: String, enum: ['mercadopago'], default: 'mercadopago', index: true },
    eventType: { type: String, required: true, trim: true },
    externalId: { type: String, default: null, trim: true, index: true },
    status: { type: String, enum: ['received', 'processed', 'ignored', 'failed'], default: 'received' },
    payload: { type: Schema.Types.Mixed, default: null },
    processedAt: { type: Date, default: null },
    errorMessage: { type: String, default: null, trim: true }
  },
  { timestamps: true, versionKey: false }
);

billingEventSchema.index({ provider: 1, eventType: 1, externalId: 1 });

module.exports = model('BillingEvent', billingEventSchema);
