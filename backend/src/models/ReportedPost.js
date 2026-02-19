const mongoose = require('mongoose');

/**
 * ReportedPost — user-submitted report against a community post.
 * When a post accumulates 5+ reports it is auto-hidden.
 */
const reportedPostSchema = new mongoose.Schema({
    postId: { type: mongoose.Schema.Types.ObjectId, ref: 'Post', required: true },
    reportedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    reason: { type: String, enum: ['SPAM', 'MISINFORMATION', 'HATE', 'OTHER'], default: 'OTHER' },
    timestamp: { type: Date, default: Date.now },
});

// One user can report a given post only once
reportedPostSchema.index({ postId: 1, reportedBy: 1 }, { unique: true });
reportedPostSchema.index({ postId: 1 });

module.exports = mongoose.model('ReportedPost', reportedPostSchema);
