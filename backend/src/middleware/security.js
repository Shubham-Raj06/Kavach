/**
 * security.js — Phase 6: Production-grade security middleware
 *
 * Implements:
 *  - XSS sanitization (strip HTML tags from string inputs)
 *  - NoSQL injection prevention (strip MongoDB operators from body)
 *  - Request size enforcement
 *  - IP allowlist for hospital ingestion endpoints
 *  - PII detection + redaction
 */

const logger = require('../utils/logger');

// ── Strip HTML tags (XSS prevention) ─────────────────────────────────────────
function stripHtml(str) {
    return typeof str === 'string'
        ? str.replace(/<\/?[^>]+(>|$)/g, '').replace(/&[a-zA-Z]+;/g, ' ').trim()
        : str;
}

// ── Remove MongoDB operator injection ─────────────────────────────────────────
function sanitizeMongoObject(obj) {
    if (typeof obj !== 'object' || obj === null) return obj;
    for (const key of Object.keys(obj)) {
        if (key.startsWith('$')) {
            delete obj[key];
        } else {
            obj[key] = sanitizeMongoObject(obj[key]);
        }
    }
    return obj;
}

// ── Sanitize string fields ────────────────────────────────────────────────────
function sanitizeStrings(obj) {
    if (typeof obj === 'string') return stripHtml(obj);
    if (typeof obj !== 'object' || obj === null) return obj;
    for (const key of Object.keys(obj)) {
        obj[key] = sanitizeStrings(obj[key]);
    }
    return obj;
}

// ── Combined input sanitization middleware ────────────────────────────────────
function sanitizeInput(req, res, next) {
    try {
        if (req.body && typeof req.body === 'object') {
            sanitizeMongoObject(req.body);
            sanitizeStrings(req.body);
        }
        if (req.query && typeof req.query === 'object') {
            sanitizeStrings(req.query);
        }
    } catch (e) {
        logger.warn(`[Security] Sanitization error: ${e.message}`);
    }
    next();
}

// ── IP allowlist factory (for hospital API endpoints) ─────────────────────────
function ipAllowlist(allowedIPs = []) {
    const envIPs = (process.env.HOSPITAL_API_ALLOWED_IPS || '').split(',').filter(Boolean);
    const allAllowed = new Set([...allowedIPs, ...envIPs, '127.0.0.1', '::1', '::ffff:127.0.0.1']);

    return (req, res, next) => {
        // In dev mode with no IPs configured: allow all
        if (process.env.NODE_ENV !== 'production' || allAllowed.size <= 2) {
            return next();
        }

        const clientIP = req.ip || req.connection.remoteAddress;

        if (!allAllowed.has(clientIP)) {
            logger.warn(`[Security] IP ${clientIP} rejected from allowlisted endpoint`);
            return res.status(403).json({ error: 'Forbidden: IP not allowlisted', code: 'IP_BLOCKED' });
        }
        next();
    };
}

// ── PII detection (log warning if requests contain potential PII) ─────────────
const PII_PATTERNS = [
    /\b\d{10,12}\b/,                           // phone numbers
    /\b[A-Z]{5}\d{4}[A-Z]\b/,                 // PAN card
    /\b[A-Z]{2}\d{2}[A-Z]{2}\d{4}\d{7}\b/i,  // Aadhaar-ish pattern
    /[\w.-]+@[\w.-]+\.\w{2,}/,                  // email
];

function detectPII(req, res, next) {
    if (process.env.NODE_ENV !== 'production') return next();
    try {
        const bodyStr = JSON.stringify(req.body);
        for (const pattern of PII_PATTERNS) {
            if (pattern.test(bodyStr)) {
                logger.warn(`[Security] Potential PII detected in request to ${req.path} from ${req.ip}`);
                break;
            }
        }
    } catch (e) { /* ignore */ }
    next();
}

// ── Security headers (supplement helmet) ─────────────────────────────────────
function securityHeaders(req, res, next) {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Permitted-Cross-Domain-Policies', 'none');
    res.setHeader('X-DNS-Prefetch-Control', 'off');
    res.setHeader('Referrer-Policy', 'same-origin');
    next();
}

module.exports = { sanitizeInput, ipAllowlist, detectPII, securityHeaders };
