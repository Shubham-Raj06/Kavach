const express = require('express');
const router = express.Router();

const { requireAuth: auth } = require('../middleware/auth');
const community = require('../controllers/communityController');
const { rateLimitByUser } = require('../middleware/rateLimitByUser');
const { validate, citizenPostSchema } = require('../validation/schemas');

// ── POST /api/community ── Create post (citizen, rate limited, toxicity checked)
router.post(
    '/',
    auth,
    rateLimitByUser({ max: 5, windowSec: 3600, key: 'post' }),  // 5 posts/hr
    community.create
);

// ── GET /api/community/ward/:ward ── Get posts for a ward
router.get('/ward/:ward', auth, community.getByWard);

// ── POST /api/community/:id/report ── Report a post
router.post(
    '/:id/report',
    auth,
    rateLimitByUser({ max: 10, windowSec: 3600, key: 'report' }), // 10 reports/hr
    community.reportPost
);

// ── GET /api/community/moderation/logs ── Admin moderation log
router.get(
    '/moderation/logs',
    auth,
    (req, res, next) => {
        if (!['GOV', 'SUPER_ADMIN'].includes(req.user.role)) {
            return res.status(403).json({ error: 'Forbidden.' });
        }
        next();
    },
    community.getModerationLogs
);

module.exports = router;
