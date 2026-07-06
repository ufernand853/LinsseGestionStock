const { Schema, model, Types } = require('mongoose');

const roleSchema = new Schema(
  {
    tenant: { type: Types.ObjectId, ref: 'Tenant', required: true },
    name: { type: String, required: true, trim: true },
    permissions: { type: [String], default: [] }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

roleSchema.index({ tenant: 1, name: 1 }, { unique: true });

module.exports = model('Role', roleSchema);
