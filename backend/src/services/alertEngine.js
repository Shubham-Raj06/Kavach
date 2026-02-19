/**
 * alertEngine.js — Phase 3: Alert generation + WebSocket + FCM dispatch
 *
 * Triggered after ML inference when:
 *   riskScore > threshold AND confidence > confidenceGate
 *
 * Steps:
 *  1. Check if duplicate alert within cooldown window
 *  2. Create Alert document
 *  3. WebSocket broadcast to ward channel + broadcast to all dashboard sockets
 *  4. FCM push to ward subscribers
 *  5. Log to AuditLog
 */

const { Alert, AuditLog } = require('../models');
const fcm = require('./fcmService');
const logger = require('../utils/logger');

// Thresholds
const RISK_THRESHOLD = 60;
const CONF_THRESHOLD = 0.65;
const ALERT_COOLDOWN_MS = 15 * 60 * 1000; // 15 min — don't spam same ward

// ── Severity level from risk score ───────────────────────────────────────────
function getSeverity(riskScore) {
    if (riskScore >= 80) return 'CRITICAL';
    if (riskScore >= 65) return 'HIGH';
    if (riskScore >= 50) return 'MEDIUM';
    return 'LOW';
}

// ── Localised alert message ───────────────────────────────────────────────────
function buildAlertMessage(severity, wardId, category) {
    const catLabel = {
        WATERBORNE: 'water-borne disease',
        VECTOR_BORNE: 'mosquito-borne disease',
        AIRBORNE: 'airborne infection',
        FOODBORNE: 'food-borne illness',
        HOSPITAL_ACQUIRED: 'hospital-acquired infection',
        UNKNOWN: 'health risk',
    }[category] ?? 'health risk';

    const prefix = {
        CRITICAL: '🚨 CRITICAL ALERT',
        HIGH: '⚠️  HIGH ALERT',
        MEDIUM: '🟡 ADVISORY',
        LOW: 'ℹ️  NOTICE',
    }[severity];

    return `${prefix}: Elevated ${catLabel} risk detected in Ward ${wardId}. Please follow safety guidelines.`;
}

// ── Check deduplication ───────────────────────────────────────────────────────
async function isDuplicateAlert(wardId, severity) {
    const since = new Date(Date.now() - ALERT_COOLDOWN_MS);
    const existing = await Alert.findOne({
        wardId, severity, createdAt: { $gte: since }, resolved: false,
    });
    return !!existing;
}

// ── Main alert dispatch ───────────────────────────────────────────────────────
async function triggerAlert(io, { wardId, riskScore, outbreakCategory, confidence, shapReasons }) {
    if (riskScore < RISK_THRESHOLD || confidence < CONF_THRESHOLD) return null;

    const severity = getSeverity(riskScore);
    const message = buildAlertMessage(severity, wardId, outbreakCategory);

    // Deduplication
    if (await isDuplicateAlert(wardId, severity)) {
        logger.debug(`[AlertEngine] Skipping duplicate ${severity} alert for Ward ${wardId}`);
        return null;
    }

    // 1. Persist alert
    const alert = await Alert.create({
        wardId,
        severity,
        syndrome: outbreakCategory,
        message,
        riskScore,
        confidence: Math.round(confidence * 100),
        shapReasons: JSON.stringify(shapReasons ?? []),
        autoTriggered: true,
    });

    logger.warn(`[AlertEngine] ${severity} alert for Ward ${wardId} (risk=${riskScore}, conf=${Math.round(confidence * 100)}%)`);

    const payload = {
        alertId: alert._id,
        wardId,
        severity,
        syndrome: outbreakCategory,
        message,
        riskScore,
        confidence: Math.round(confidence * 100),
        timestamp: alert.createdAt,
    };

    // 2. WebSocket — broadcast to ward channel + global dashboard room
    if (io) {
        io.to(`ward:${wardId}`).emit('risk:update', payload);
        io.to('dashboard').emit('alert:new', payload);
        io.to('admin-room').emit('admin:alert', payload);
    }

    // 3. FCM push notification (fails gracefully)
    try {
        await fcm.sendToWard(wardId, {
            title: `Kavach ${severity} Alert — Ward ${wardId}`,
            body: message,
            data: { alertId: alert._id.toString(), wardId, riskScore: String(riskScore) },
        });
    } catch (e) {
        logger.error(`[AlertEngine] FCM push failed: ${e.message}`);
    }

    // 4. Audit log
    await AuditLog.create({
        action: 'ALERT_TRIGGERED',
        resource: 'Alert',
        resourceId: alert._id.toString(),
        metadata: { wardId, severity, riskScore },
    }).catch(() => { });

    return alert;
}

// ── Auto-resolve alerts when risk drops ──────────────────────────────────────
async function autoResolveAlerts(wardId, currentRisk) {
    if (currentRisk >= 50) return;
    const resolved = await Alert.updateMany(
        { wardId, resolved: false, severity: { $in: ['MEDIUM', 'LOW'] }, riskScore: { $gt: currentRisk + 10 } },
        { $set: { resolved: true, resolvedAt: new Date(), resolvedReason: 'AUTO_RISK_DROP' } },
    );
    if (resolved.modifiedCount > 0) {
        logger.info(`[AlertEngine] Auto-resolved ${resolved.modifiedCount} alerts for Ward ${wardId}`);
    }
}

module.exports = { triggerAlert, autoResolveAlerts, getSeverity };
