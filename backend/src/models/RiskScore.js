const mongoose = require('mongoose');

const riskScoreSchema = new mongoose.Schema({
    ward: { type: Number, required: true, unique: true, min: 1 },
    score: { type: Number, required: true, min: 0, max: 100, default: 0 },
    level: {
        type: String,
        enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
        default: 'LOW',
    },
    symptomCount: { type: Number, default: 0 },
    admissionCount: { type: Number, default: 0 },
    trend: [{ score: Number, timestamp: Date }], // last 48h snapshots
    updatedAt: { type: Date, default: Date.now },
});

riskScoreSchema.pre('save', function (next) {
    this.updatedAt = new Date();
    next();
});

module.exports = mongoose.model('RiskScore', riskScoreSchema);
