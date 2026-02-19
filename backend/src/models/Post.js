const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    ward: { type: Number, required: true, min: 1 },
    content: { type: String, required: true, trim: true, maxlength: 280 },
    imageUrl: { type: String, default: null },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    isModerated: { type: Boolean, default: false },
    isFlagged: { type: Boolean, default: false },
}, { timestamps: true });

postSchema.index({ ward: 1, createdAt: -1 });

module.exports = mongoose.model('Post', postSchema);
