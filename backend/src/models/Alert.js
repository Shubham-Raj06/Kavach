const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema({
    ward: { type: Number, default: null }, // null = city-wide
    message: { type: String, required: true, trim: true },
    severity: {
        type: String,
        enum: ['INFO', 'WARNING', 'HIGH', 'CRITICAL'],
        default: 'INFO',
    },
    source: { type: String, enum: ['system', 'govt', 'hospital'], default: 'system' },
    isActive: { type: Boolean, default: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
}, { timestamps: true });

alertSchema.index({ ward: 1, createdAt: -1 });
alertSchema.index({ severity: 1, isActive: 1 });

module.exports = mongoose.model('Alert', alertSchema);
