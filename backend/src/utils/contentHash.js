const crypto = require('crypto');

/**
 * Generate SHA-256 hash of post content (normalized).
 * Used for detecting duplicate/spam posts.
 */
exports.hashContent = (content = '') =>
    crypto
        .createHash('sha256')
        .update(content.trim().toLowerCase().replace(/\s+/g, ' '))
        .digest('hex');
