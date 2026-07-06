const { Schema, model, Types } = require('mongoose');

const auditLogSchema = new Schema(
  {
    tenant: { type: Types.ObjectId, ref: 'Tenant', required: true },
    action: { type: String, required: true, trim: true },
    request: { type: String, required: true, trim: true },
    user: { type: String, required: true, trim: true },
    details: { type: Schema.Types.Mixed, default: {} },
    timestamp: { type: Date, default: Date.now }
  },
  {
    versionKey: false
  }
);

auditLogSchema.index({ tenant: 1, timestamp: -1 });

module.exports = model('AuditLog', auditLogSchema);
