/**
 * ingestion.js — ABDM Hospital Admission Ingestion Route
 * POST /api/ingestion/hospital       — submit admission data
 * POST /api/ingestion/hospital/seed  — seed demo admissions
 * GET  /api/ingestion/status         — last ingestion run status
 */

const express = require('express');
const router = express.Router();
const { authenticate, requireRole } = require('../middleware/auth');
const { ipAllowlist } = require('../middleware/security');
const { rateLimitByUser } = require('../middleware/rateLimitByUser');
const { ingestHospitalAdmission, seedDemoAdmissions } = require('../services/hospitalAdmissionIngestionService');
const WardMaster = require('../models/WardMaster');
const logger = require('../utils/logger');

// Track last run status in memory
const status = {
    lastWeatherRun: null,
    lastWaterRun: null,
    lastFeatureRun: null,
    lastMLRun: null,
};

// ── POST /api/ingestion/hospital ──────────────────────────────────────────────
// Called by hospital systems (ABDM-format payload)
// Requires HOSPITAL or GOV role + IP allowlist
router.post(
    '/hospital',
    ipAllowlist(), // only configured IPs in production
    authenticate,
    requireRole(['HOSPITAL', 'GOV', 'SUPER_ADMIN']),
    rateLimitByUser({ key: 'hospital_admission', max: 20, windowSec: 3600 }),
    async (req, res, next) => {
        try {
            const { admission, isAnomaly } = await ingestHospitalAdmission(req.body, req.user.id, req);

            // Trigger ML re-inference for this ward (async, non-blocking)
            const { runInferenceForWard } = require('../services/mlInferenceService');
            const io = req.app.get('io');
            runInferenceForWard(admission.wardId).then(result => {
                if (result && io) {
                    io.to(`ward:${admission.wardId}`).emit('risk:update', result);
                    io.to('dashboard').emit('risk:update', result);
                }
            }).catch(() => { });

            res.status(201).json({
                message: 'Hospital admission data ingested',
                admissionId: admission._id,
                wardId: admission.wardId,
                totalCount: admission.totalCount,
                isAnomaly,
            });
        } catch (err) {
            if (err.statusCode === 400) return res.status(400).json({ error: err.message });
            next(err);
        }
    }
);

// ── POST /api/ingestion/hospital/seed ────────────────────────────────────────
// Seed 8 days of demo admission data for all wards (SUPER_ADMIN only)
router.post('/hospital/seed', authenticate, requireRole(['SUPER_ADMIN']), async (req, res, next) => {
    try {
        const wards = await WardMaster.distinct('wardNumber');
        const count = await seedDemoAdmissions(wards.length ? wards : ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10']);
        res.json({ message: `Seeded ${count} demo admission records` });
    } catch (err) { next(err); }
});

// ── GET /api/ingestion/status ─────────────────────────────────────────────────
// Shows last run times for all ingestion jobs (GOV/ADMIN)
router.get('/status', authenticate, requireRole(['GOV', 'SUPER_ADMIN', 'HOSPITAL']), (req, res) => {
    const { getCircuitBreakerStatus } = require('../services/mlInferenceService');
    res.json({
        ...status,
        circuitBreaker: getCircuitBreakerStatus(),
        uptime: process.uptime(),
        timestamp: new Date(),
    });
});

// ── POST /api/ingestion/water ─────────────────────────────────────────────────
// Manual trigger for water quality ingestion (GOV only)
router.post('/water/trigger', authenticate, requireRole(['SUPER_ADMIN', 'GOV']), async (req, res, next) => {
    try {
        const { ingestWaterQuality } = require('../services/waterQualityIngestionService');
        const result = await ingestWaterQuality();
        status.lastWaterRun = new Date();
        res.json({ message: 'Water quality ingestion triggered', ...result });
    } catch (err) { next(err); }
});

// ── POST /api/ingestion/weather/trigger ───────────────────────────────────────
router.post('/weather/trigger', authenticate, requireRole(['SUPER_ADMIN']), async (req, res, next) => {
    try {
        const { ingestWeather } = require('../services/weatherIngestionService');
        const result = await ingestWeather();
        status.lastWeatherRun = new Date();
        res.json({ message: 'Weather ingestion triggered', ...result });
    } catch (err) { next(err); }
});

// ── POST /api/ingestion/features/backfill ─────────────────────────────────────
router.post('/features/backfill', authenticate, requireRole(['SUPER_ADMIN']), async (req, res, next) => {
    try {
        const { hoursBack = 24 } = req.body;
        const { backfillFeatureVectors } = require('../services/featureEngineService');
        // Run async (don't block request)
        backfillFeatureVectors(Math.min(168, parseInt(hoursBack))).catch(e =>
            logger.error('[Backfill] Error:', e.message)
        );
        res.json({ message: `Backfill started for ${hoursBack}h` });
    } catch (err) { next(err); }
});

module.exports = router;
