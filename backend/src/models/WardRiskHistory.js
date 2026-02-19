const mongoose = require('mongoose');

/**
 * WardRiskHistory — daily risk score snapshots per ward.
 * Used for sparklines, volatility metrics, and outbreak frequency.
 */
const wardRiskHistorySchema = new mongoose.Schema({
    wardId: { type: String, required: true },
    date: { type: Date, required: true },
    riskScore: { type: Number, required: true, min: 0, max: 100 },
    category: { type: String, default: 'UNKNOWN' },
    isAnomaly: { type: Boolean, default: false },
}, { timestamps: false });

// Compound unique: one snapshot per ward per day
wardRiskHistorySchema.index({ wardId: 1, date: -1 }, { unique: true });

module.exports = mongoose.model('WardRiskHistory', wardRiskHistorySchema);
