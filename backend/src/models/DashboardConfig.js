const { Schema, model, Types } = require('mongoose');

const dashboardConfigSchema = new Schema(
  {
    tenant: { type: Types.ObjectId, ref: 'Tenant', required: true },
    manualAttentionIds: [{ type: Schema.Types.ObjectId, ref: 'Item' }],
    recountThresholdDays: { type: Number, default: 0 },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null }
  },
  {
    timestamps: true
  }
);

dashboardConfigSchema.index({ tenant: 1 }, { unique: true });

dashboardConfigSchema.statics.getSingleton = async function getSingleton(tenantId) {
  const existing = await this.findOne({ tenant: tenantId });
  if (existing) {
    return existing;
  }
  return this.create({ tenant: tenantId, manualAttentionIds: [], recountThresholdDays: 0 });
};

module.exports = model('DashboardConfig', dashboardConfigSchema);
