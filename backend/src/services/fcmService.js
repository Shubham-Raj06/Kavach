/**
 * fcmService.js — Firebase Cloud Messaging push notifications
 *
 * Uses firebase-admin SDK (server-side).
 * ENV vars:
 *   FIREBASE_SERVICE_ACCOUNT_JSON — stringified service account JSON (from Firebase console)
 *   OR FIREBASE_SERVICE_ACCOUNT_PATH — path to service account file
 *
 * Falls back gracefully if Firebase not configured (dev/demo mode).
 */

const logger = require('../utils/logger');

let messaging = null;

function initFirebase() {
    try {
        if (messaging) return messaging;

        if (process.env.FIREBASE_MOCK === 'true') {
            logger.info('[FCM] Mock mode enabled — push notifications will be logged only');
            return null;
        }

        const admin = require('firebase-admin');

        let credential;
        if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
            const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
            credential = admin.credential.cert(serviceAccount);
        } else if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
            const serviceAccount = require(process.env.FIREBASE_SERVICE_ACCOUNT_PATH);
            credential = admin.credential.cert(serviceAccount);
        } else {
            logger.warn('[FCM] No Firebase credentials — push notifications disabled');
            return null;
        }

        if (!admin.apps.length) {
            admin.initializeApp({ credential });
        }
        messaging = admin.messaging();
        logger.info('[FCM] Firebase initialized');
        return messaging;
    } catch (e) {
        logger.error(`[FCM] Init failed: ${e.message}`);
        return null;
    }
}

// ── Send to specific FCM device token ────────────────────────────────────────
async function sendToToken(token, { title, body, data = {} }) {
    const msg = initFirebase();
    if (!msg) {
        logger.info(`[FCM MOCK] To token ${token.slice(0, 8)}...: ${title} | ${body}`);
        return;
    }
    return msg.send({
        token,
        notification: { title, body },
        data: Object.fromEntries(Object.entries(data).map(([k, v]) => [k, String(v)])),
        android: {
            priority: 'high',
            notification: { channelId: 'kavach_alerts', sound: 'default' },
        },
        apns: {
            payload: { aps: { sound: 'default', badge: 1 } },
        },
    });
}

// ── Send to topic (ward-based) ────────────────────────────────────────────────
async function sendToWard(wardId, { title, body, data = {} }) {
    const msg = initFirebase();
    const topic = `ward_${wardId}`;

    if (!msg) {
        logger.info(`[FCM MOCK] Topic /${topic}: ${title} | ${body}`);
        return;
    }

    return msg.send({
        topic,
        notification: { title, body },
        data: Object.fromEntries(Object.entries(data).map(([k, v]) => [k, String(v)])),
        android: {
            priority: 'high',
            notification: { channelId: 'kavach_alerts', clickAction: 'FLUTTER_NOTIFICATION_CLICK' },
        },
        apns: {
            payload: { aps: { sound: 'default', badge: 1, 'content-available': 1 } },
        },
    });
}

// ── Subscribe a device to ward topic ─────────────────────────────────────────
async function subscribeToWard(token, wardId) {
    const msg = initFirebase();
    if (!msg) return;
    return msg.subscribeToTopic([token], `ward_${wardId}`);
}

// ── Unsubscribe ───────────────────────────────────────────────────────────────
async function unsubscribeFromWard(token, wardId) {
    const msg = initFirebase();
    if (!msg) return;
    return msg.unsubscribeFromTopic([token], `ward_${wardId}`);
}

module.exports = { sendToToken, sendToWard, subscribeToWard, unsubscribeFromWard };
