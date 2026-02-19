const mongoose = require('mongoose');

/**
 * ModerationLog — records every toxicity check on community posts.
 */
const moderationLogSchema = new mongoose.Schema({
    postId: { type: mongoose.Schema.Types.ObjectId, ref: 'Post', required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    toxicityScore: { type: Number, min: 0, max: 1, required: true },
    action: { type: String, enum: ['APPROVED', 'FLAGGED', 'REJECTED'], required: true },
    reason: { type: String, default: '' },
    timestamp: { type: Date, default: Date.now },
});

moderationLogSchema.index({ postId: 1 });
moderationLogSchema.index({ userId: 1, timestamp: -1 });
moderationLogSchema.index({ action: 1, timestamp: -1 });

module.exports = mongoose.model('ModerationLog', moderationLogSchema);
