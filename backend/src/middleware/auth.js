/**
 * src/middleware/auth.js
 * JWT authentication + role-based authorization using Mongoose.
 */
const jwt = require('jsonwebtoken');
const { User } = require('../models');

/** Extract Bearer token from Authorization header or cookie */
const extractToken = (req) => {
    const auth = req.headers.authorization;
    if (auth?.startsWith('Bearer ')) return auth.slice(7);
    return req.cookies?.accessToken || null;
};

/**
 * requireAuth — verifies JWT and attaches req.user.
 * Also checks isActive on every request for immediate suspension enforcement.
 */
const requireAuth = async (req, res, next) => {
    const token = extractToken(req);
    if (!token) return res.status(401).json({ error: 'Authentication required.' });

    try {
        const payload = jwt.verify(token, process.env.JWT_SECRET);

        // Verify user still exists and is active in DB
        const user = await User.findById(payload.id).select('isActive role');
        if (!user) return res.status(401).json({ error: 'User not found.' });
        if (!user.isActive) return res.status(403).json({ error: 'Account suspended.' });

        req.user = payload;
        next();
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({ error: 'Token expired.', code: 'TOKEN_EXPIRED' });
        }
        return res.status(401).json({ error: 'Invalid token.' });
    }
};

/**
 * requireRole(...roles) — must come after requireAuth.
 */
const requireRole = (...roles) => (req, res, next) => {
    const allowed = roles.flat();
    if (!req.user) return res.status(401).json({ error: 'Authentication required.' });
    if (!allowed.includes(req.user.role)) {
        return res.status(403).json({ error: `Access denied. Required role: ${allowed.join(' or ')}.` });
    }
    next();
};

/**
 * auditLog(action) — middleware factory that writes an audit entry after the handler.
 */
const auditLog = (action) => (req, res, next) => {
    const originalJson = res.json.bind(res);
    res.json = (body) => {
        if (res.statusCode < 400 && req.user) {
            const { AuditLog } = require('../models');
            AuditLog.create({
                userId: req.user.id,
                action,
                resource: req.params?.id || req.body?.email || null,
                ipAddress: req.ip,
            }).catch(() => { });
        }
        return originalJson(body);
    };
    next();
};

// Backward-compatible aliases
const authenticate = requireAuth;
const authorize = requireRole;

module.exports = { requireAuth, requireRole, auditLog, authenticate, authorize };
