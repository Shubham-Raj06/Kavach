const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();
const { validate, registerSchema, loginSchema } = require('../validation/schemas');
const authController = require('../controllers/authController');
const { requireAuth, auditLog } = require('../middleware/auth');

// ─── Auth-specific rate limiter (tighter than global) ─────────────────────────
// 10 attempts per 15 minutes per IP
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: { error: 'Too many authentication attempts. Please try again in 15 minutes.' },
    standardHeaders: true,
    legacyHeaders: false,
});

// ─── Routes ───────────────────────────────────────────────────────────────────

// Public routes — rate limited
router.post('/register', authLimiter, validate(registerSchema), authController.register);
router.post('/login', authLimiter, validate(loginSchema), authController.login);
router.post('/refresh', authLimiter, authController.refresh);

// Protected routes
router.post('/logout', requireAuth, authController.logout);
router.get('/me', requireAuth, authController.me);
router.put('/device-token', requireAuth, authController.updateDeviceToken);

module.exports = router;
