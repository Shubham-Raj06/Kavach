const mongoose = require('mongoose');
const { Schema } = mongoose;

const auditLogSchema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    action: { type: String, required: true },
    resource: { type: String },
    metadata: { type: String },
    ipAddress: { type: String },
    timestamp: { type: Date, default: Date.now },
});

auditLogSchema.index({ userId: 1 });
auditLogSchema.index({ action: 1 });
auditLogSchema.index({ timestamp: -1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
