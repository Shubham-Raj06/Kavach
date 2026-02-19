const nodemailer = require('nodemailer');
const { Alert, User } = require('../models');
const logger = require('../utils/logger');

// ── Email Transport (Gmail SMTP) ─────────────────────────────────────────────
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '465'),
    secure: true,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

// ── Firebase Admin ───────────────────────────────────────────────────────────
let firebaseAdmin = null;
try {
    const admin = require('firebase-admin');
    if (!admin.apps.length) {
        admin.initializeApp({
            credential: admin.credential.cert({
                projectId: process.env.FIREBASE_PROJECT_ID,
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
            }),
        });
    }
    firebaseAdmin = admin;
} catch (err) {
    logger.warn('Firebase Admin not configured — push notifications disabled');
}

const SEVERITY_EMOJI = { LOW: '🟡', MEDIUM: '🟠', HIGH: '🔴', CRITICAL: '🚨' };

/**
 * Auto-triggered when riskScore >= threshold after a prediction.
 */
exports.triggerAutoAlert = async (prediction, ward) => {
    const score = prediction.riskScore;
    const severity = score >= 0.9 ? 'CRITICAL' : score >= 0.8 ? 'HIGH' : score >= 0.7 ? 'MEDIUM' : 'LOW';

    const reasons = Array.isArray(prediction.outbreakReasons)
        ? prediction.outbreakReasons.join('\n• ')
        : '';

    const message = `${SEVERITY_EMOJI[severity]} ${severity} outbreak risk detected in ${ward.name}, ${ward.city}.\n\nCategory: ${prediction.outbreakCategory}\nRisk Score: ${(score * 100).toFixed(0)}%\nConfidence: ${(prediction.confidence * 100).toFixed(0)}%\n\nKey Signals:\n• ${reasons}`;

    const alert = await Alert.create({
        wardId: ward._id,
        predictionId: prediction._id,
        severity,
        outbreakCategory: prediction.outbreakCategory,
        message,
        recommendedAction: getRecommendedAction(prediction.outbreakCategory, severity),
        recipientType: 'ALL',
    });

    await exports.dispatch(alert);
    return alert;
};

/**
 * Dispatches an alert via email + push notifications.
 */
exports.dispatch = async (alert) => {
    try {
        await Promise.allSettled([
            sendEmail(alert),
            sendPushNotification(alert),
        ]);

        await Alert.findByIdAndUpdate(alert._id, { status: 'SENT', sentAt: new Date() });
        logger.info(`Alert dispatched: ${alert._id} | ${alert.severity}`);
    } catch (err) {
        logger.error(`Alert dispatch failed: ${err.message}`);
        await Alert.findByIdAndUpdate(alert._id, { status: 'FAILED' }).catch(() => { });
    }
};

// ── Email ────────────────────────────────────────────────────────────────────
async function sendEmail(alert) {
    if (!process.env.SMTP_USER) {
        logger.warn('SMTP not configured — skipping email');
        return;
    }

    const users = await User.find({ role: { $in: ['GOV', 'HOSPITAL'] } }).select('email');
    if (!users.length) return;

    const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #dc2626; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
        <h1 style="margin:0">⚠️ Kavach Disease Outbreak Alert</h1>
      </div>
      <div style="padding: 20px; background: #f9fafb; border: 1px solid #e5e7eb;">
        <p style="font-size: 16px; white-space: pre-line;">${alert.message}</p>
        ${alert.recommendedAction ? `
        <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 12px; margin-top: 16px;">
          <strong>Recommended Action:</strong><br>${alert.recommendedAction}
        </div>` : ''}
        <p style="color: #6b7280; font-size: 12px; margin-top: 20px;">
          Sent by Kavach AI Outbreak Monitoring System • ${new Date().toISOString()}
        </p>
      </div>
    </div>
  `;

    await transporter.sendMail({
        from: process.env.SMTP_USER,
        to: users.map(u => u.email).join(','),
        subject: `[Kavach] ${alert.severity} Alert — ${alert.outbreakCategory} Risk`,
        html,
    });
}

// ── Push Notifications ───────────────────────────────────────────────────────
async function sendPushNotification(alert) {
    if (!firebaseAdmin) return;

    const users = await User.find({ wardId: alert.wardId, fcmToken: { $ne: null } }).select('fcmToken');
    if (!users.length) return;

    const tokens = users.map(u => u.fcmToken).filter(Boolean);
    const message = {
        notification: {
            title: `⚠️ ${alert.severity} Health Alert`,
            body: `${alert.outbreakCategory} risk detected in your area. Stay alert.`,
        },
        data: {
            alertId: String(alert._id),
            wardId: String(alert.wardId),
            severity: alert.severity,
            category: alert.outbreakCategory,
        },
        tokens,
    };

    const response = await firebaseAdmin.messaging().sendEachForMulticast(message);
    logger.info(`Push sent: ${response.successCount}/${tokens.length} delivered`);
}

// ── Helpers ──────────────────────────────────────────────────────────────────
function getRecommendedAction(category, severity) {
    const actions = {
        WATERBORNE: 'Boil water before use. Avoid tap water for drinking. Report to local water authority.',
        FOODBORNE: 'Avoid street food. Wash hands thoroughly. Seek medical attention if symptomatic.',
        AIRBORNE: 'Wear N95 masks in crowded areas. Ensure good ventilation. Avoid crowded spaces.',
        VECTOR_BORNE: 'Use mosquito repellent. Eliminate standing water. Wear full-sleeve clothing.',
        HOSPITAL_ACQUIRED: 'Enforce strict hand hygiene protocols. Isolate affected wards. Alert infection control team.',
        UNKNOWN: 'Monitor symptoms. Seek medical attention if condition worsens.',
    };
    return actions[category] || actions.UNKNOWN;
}
