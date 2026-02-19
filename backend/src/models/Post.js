const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    ward: { type: Number, required: true, min: 1 },
    content: { type: String, required: true, trim: true, maxlength: 500 },
    imageUrl: { type: String, default: null },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    isModerated: { type: Boolean, default: false },
    isFlagged: { type: Boolean, default: false },
    // ── Moderation upgrades ──────────────────────────────────────────────────
    reportCount: { type: Number, default: 0 },
    isHidden: { type: Boolean, default: false },  // auto-hide at 5 reports
    contentHash: { type: String, default: '' },      // SHA-256 for spam detection
}, { timestamps: true });

postSchema.index({ ward: 1, createdAt: -1 });
postSchema.index({ contentHash: 1, createdAt: -1 }); // spam detection
postSchema.index({ isHidden: 1 });

module.exports = mongoose.model('Post', postSchema);
