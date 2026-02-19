const Post = require('../models/Post');
const ModerationLog = require('../models/ModerationLog');
const ReportedPost = require('../models/ReportedPost');
const toxicity = require('../services/toxicityService');
const { hashContent } = require('../utils/contentHash');
const logger = require('../utils/logger');

const REPORT_THRESHOLD = 5;       // auto-hide threshold
const SPAM_WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const SPAM_HASH_MAX = 3;           // max identical content in window

// ─── Create Post ─────────────────────────────────────────────────────────────
exports.create = async (req, res, next) => {
    try {
        const { ward, content } = req.body;
        const userId = req.user.id;

        if (!content || content.trim().length === 0) {
            return res.status(400).json({ error: 'Content is required.' });
        }

        // 1. Toxicity check
        const { score, flagged: isFlagged, reason } = toxicity.score(content);
        const action = toxicity.getAction(score);

        if (action === 'REJECTED') {
            // Log rejected attempt even without a post document
            logger.warn(`Toxicity REJECTED | user=${userId} score=${score} reason=${reason}`);
            return res.status(400).json({
                error: 'Your post was blocked by our content moderation system.',
                code: 'CONTENT_REJECTED',
            });
        }

        // 2. Spam detection — same hash > 3 times in 10 min
        const contentHash = hashContent(content);
        const spamWindow = new Date(Date.now() - SPAM_WINDOW_MS);
        const hashCount = await Post.countDocuments({
            contentHash,
            createdAt: { $gte: spamWindow },
        });
        if (hashCount >= SPAM_HASH_MAX) {
            logger.warn(`Spam detected | user=${userId} hash=${contentHash.slice(0, 8)}`);
            return res.status(429).json({
                error: 'This content has been flagged as spam. Please post original messages.',
                code: 'SPAM_DETECTED',
            });
        }

        // 3. Create post
        const post = await Post.create({
            userId,
            ward: parseInt(ward, 10),
            content: content.trim(),
            contentHash,
            isModerated: true,
            isFlagged: action === 'FLAGGED',
        });

        // 4. Log moderation decision
        await ModerationLog.create({
            postId: post._id,
            userId,
            toxicityScore: score,
            action,
            reason,
        });

        if (action === 'FLAGGED') {
            logger.warn(`Post FLAGGED | postId=${post._id} score=${score}`);
        }

        res.status(201).json({ ...post.toObject(), moderationAction: action });
    } catch (err) {
        next(err);
    }
};

// ─── Get Posts by Ward ───────────────────────────────────────────────────────
exports.getByWard = async (req, res, next) => {
    try {
        const { ward } = req.params;
        const limit = Math.min(parseInt(req.query.limit) || 50, 100);
        const page = Math.max(parseInt(req.query.page) || 1, 1);

        const posts = await Post.find({
            ward: parseInt(ward, 10),
            isHidden: { $ne: true },          // exclude auto-hidden posts
        })
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .populate('userId', 'name role')
            .lean();

        res.json({ posts, page, limit });
    } catch (err) {
        next(err);
    }
};

// ─── Report Post ─────────────────────────────────────────────────────────────
exports.reportPost = async (req, res, next) => {
    try {
        const { id: postId } = req.params;
        const { reason = 'OTHER' } = req.body;
        const reportedBy = req.user.id;

        const post = await Post.findById(postId);
        if (!post) return res.status(404).json({ error: 'Post not found.' });

        // Upsert — prevent duplicate report from same user
        await ReportedPost.updateOne(
            { postId, reportedBy },
            { $setOnInsert: { postId, reportedBy, reason, timestamp: new Date() } },
            { upsert: true }
        );

        // Increment report count on Post
        post.reportCount = (post.reportCount || 0) + 1;

        // Auto-hide if threshold met
        if (post.reportCount >= REPORT_THRESHOLD && !post.isHidden) {
            post.isHidden = true;
            logger.warn(`Post auto-hidden | postId=${postId} reports=${post.reportCount}`);

            // Emit WebSocket event to admins
            const io = req.app.get('io');
            if (io) {
                io.to('admin-room').emit('admin:post-flagged', {
                    postId,
                    wardId: post.ward,
                    reportCount: post.reportCount,
                    timestamp: new Date(),
                });
            }
        }

        await post.save();

        res.json({ message: 'Report submitted.', reportCount: post.reportCount });
    } catch (err) {
        if (err.code === 11000) {
            return res.status(409).json({ error: 'You have already reported this post.' });
        }
        next(err);
    }
};

// ─── Get Moderation Logs (Admin) ─────────────────────────────────────────────
exports.getModerationLogs = async (req, res, next) => {
    try {
        const { action, limit = 50 } = req.query;
        const filter = {};
        if (action) filter.action = action;

        const logs = await ModerationLog.find(filter)
            .sort({ timestamp: -1 })
            .limit(parseInt(limit))
            .populate('userId', 'name email')
            .populate('postId', 'content ward')
            .lean();

        res.json(logs);
    } catch (err) {
        next(err);
    }
};
