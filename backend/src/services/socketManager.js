/**
 * socketManager.js — Phase 4: Real-Time Linking
 *
 * Manages all Socket.io room subscriptions and event namespacing.
 *
 * Room structure:
 *  - ward:{wardId}       → citizens/mobile on that ward
 *  - dashboard           → all web dashboard clients
 *  - admin-room          → government officers (require GOV/ADMIN role)
 *  - hospital:{id}       → hospital staff
 *
 * Events emitted by SERVER:
 *  - risk:update         → { wardId, riskScore, severity, updatedAt }
 *  - alert:new           → { alertId, wardId, severity, message, riskScore }
 *  - alert:resolved      → { alertId, wardId }
 *  - water:update        → { wardId, chlorineLevel, turbidity, timestamp }
 *  - hospital:surge      → { wardId, facilityId, icuPct, timestamp }
 *  - admin:post-flagged  → { postId, wardId, reportCount, timestamp }
 *  - admin:alert         → full alert payload (GOV only)
 *
 * Events RECEIVED from CLIENT:
 *  - join:ward           → { wardId, token }
 *  - join:dashboard      → { token }
 *  - fcm:register        → { token, wardId }
 *  - fcm:unregister      → { token, wardId }
 */

const jwt = require('jsonwebtoken');
const fcm = require('./fcmService');
const logger = require('../utils/logger');

const JWT_SECRET = process.env.JWT_SECRET || 'kavach_secret';

// ── Verify JWT from socket handshake ─────────────────────────────────────────
function verifyToken(token) {
    try {
        return jwt.verify(token, JWT_SECRET);
    } catch {
        return null;
    }
}

// ── Initialize Socket.io event handlers ──────────────────────────────────────
function initSocketManager(io) {
    io.on('connection', (socket) => {
        const authHeader = socket.handshake.auth?.token || socket.handshake.headers?.authorization;
        const token = authHeader?.replace('Bearer ', '');
        const user = verifyToken(token);

        logger.debug(`[Socket] Client connected: ${socket.id} user=${user?.id ?? 'guest'}`);

        // ── Join ward channel ─────────────────────────────────────────────────
        socket.on('join:ward', async ({ wardId }) => {
            if (!wardId) return;
            socket.join(`ward:${wardId}`);
            logger.debug(`[Socket] ${socket.id} joined ward:${wardId}`);

            // Send current risk immediately on join
            const { RiskPrediction } = require('../models');
            const risk = await RiskPrediction.findOne({ wardId }).select('riskScore outbreakCategory updatedAt').lean();
            if (risk) {
                socket.emit('risk:update', {
                    wardId,
                    riskScore: risk.riskScore,
                    outbreakCategory: risk.outbreakCategory,
                    updatedAt: risk.updatedAt,
                });
            }
        });

        // ── Join dashboard room (any authenticated user) ──────────────────────
        socket.on('join:dashboard', () => {
            socket.join('dashboard');
            logger.debug(`[Socket] ${socket.id} joined dashboard`);
        });

        // ── Join admin room (GOV/SUPER_ADMIN/HOSPITAL only) ───────────────────
        socket.on('join:admin', () => {
            if (!user || !['GOV', 'SUPER_ADMIN', 'HOSPITAL'].includes(user.role)) {
                socket.emit('error', { code: 'UNAUTHORIZED', message: 'Admin room requires elevated role' });
                return;
            }
            socket.join('admin-room');
            logger.debug(`[Socket] ${socket.id} joined admin-room (${user.role})`);
        });

        // ── FCM token registration ────────────────────────────────────────────
        socket.on('fcm:register', async ({ fcmToken, wardId }) => {
            if (!fcmToken || !wardId) return;
            try {
                await fcm.subscribeToWard(fcmToken, wardId);
                logger.debug(`[Socket] FCM subscribed for ward ${wardId}`);
            } catch (e) {
                logger.error(`[Socket] FCM register failed: ${e.message}`);
            }
        });

        socket.on('fcm:unregister', async ({ fcmToken, wardId }) => {
            if (!fcmToken || !wardId) return;
            try {
                await fcm.unsubscribeFromWard(fcmToken, wardId);
            } catch (e) { /* ignore */ }
        });

        socket.on('disconnect', () => {
            logger.debug(`[Socket] Client disconnected: ${socket.id}`);
        });
    });

    logger.info('[Socket] Socket.io manager initialized');
}

// ── Helper: Broadcast risk update to ward + dashboard ────────────────────────
function broadcastRiskUpdate(io, wardId, riskData) {
    if (!io) return;
    io.to(`ward:${wardId}`).emit('risk:update', { wardId, ...riskData });
    io.to('dashboard').emit('risk:update', { wardId, ...riskData });
}

// ── Helper: Broadcast water quality update ───────────────────────────────────
function broadcastWaterUpdate(io, wardId, waterData) {
    if (!io) return;
    io.to(`ward:${wardId}`).emit('water:update', { wardId, ...waterData });
    io.to('dashboard').emit('water:update', { wardId, ...waterData });
}

module.exports = { initSocketManager, broadcastRiskUpdate, broadcastWaterUpdate };
