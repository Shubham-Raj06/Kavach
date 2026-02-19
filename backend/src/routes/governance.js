/**
 * routes/governance.js — Phase 8: Model Validation & Governance
 *
 * GET  /api/governance/models              — list model registry
 * POST /api/governance/models              — register new model version
 * GET  /api/governance/models/active       — current active model
 * PUT  /api/governance/models/:version/activate — promote model to active
 * GET  /api/governance/predictions         — recent prediction log
 * GET  /api/governance/predictions/:wardId — ward-level prediction history
 * GET  /api/governance/drift               — current drift status all features
 * POST /api/governance/retrain/trigger     — request model retrain
 */

const express = require('express');
const router = express.Router();
const { authenticate, requireRole } = require('../middleware/auth');
const { ModelRegistry, PredictionLog, FeatureDrift } = require('../models/Governance');
const logger = require('../utils/logger');

const GOV_ROLES = ['GOV', 'SUPER_ADMIN'];

// ── List all model versions ───────────────────────────────────────────────────
router.get('/models', authenticate, requireRole(GOV_ROLES), async (req, res, next) => {
    try {
        const models = await ModelRegistry.find({}).sort({ deployedAt: -1 }).limit(20).lean();
        res.json(models);
    } catch (err) { next(err); }
});

// ── Register a new model version ──────────────────────────────────────────────
router.post('/models', authenticate, requireRole(['SUPER_ADMIN']), async (req, res, next) => {
    try {
        const { modelVersion, algorithm, trainingDataStart, trainingDataEnd, metrics, featureNames, notes } = req.body;
        if (!modelVersion) return res.status(400).json({ error: 'modelVersion required' });

        const model = await ModelRegistry.create({
            modelVersion, algorithm, trainingDataStart, trainingDataEnd,
            metrics, featureNames: featureNames || [], notes,
            deployedBy: req.user.id,
        });
        res.status(201).json(model);
    } catch (err) {
        if (err.code === 11000) return res.status(409).json({ error: 'Model version already exists' });
        next(err);
    }
});

// ── Get active model ──────────────────────────────────────────────────────────
router.get('/models/active', authenticate, async (req, res, next) => {
    try {
        const model = await ModelRegistry.findOne({ isActive: true }).lean();
        if (!model) return res.status(404).json({ error: 'No active model registered' });
        res.json(model);
    } catch (err) { next(err); }
});

// ── Promote a model version to active ────────────────────────────────────────
router.put('/models/:version/activate', authenticate, requireRole(['SUPER_ADMIN']), async (req, res, next) => {
    try {
        const { version } = req.params;
        // Deactivate all, then activate specific version
        await ModelRegistry.updateMany({}, { $set: { isActive: false } });
        const model = await ModelRegistry.findOneAndUpdate(
            { modelVersion: version },
            { $set: { isActive: true } },
            { new: true }
        );
        if (!model) return res.status(404).json({ error: 'Model version not found' });
        logger.info(`[Governance] Model ${version} activated by ${req.user.id}`);
        res.json({ message: `Model ${version} is now active`, model });
    } catch (err) { next(err); }
});

// ── Recent prediction log ─────────────────────────────────────────────────────
router.get('/predictions', authenticate, requireRole(GOV_ROLES), async (req, res, next) => {
    try {
        const { limit = 100, wardId } = req.query;
        const filter = {};
        if (wardId) filter.wardId = wardId;
        const logs = await PredictionLog.find(filter)
            .sort({ predictedAt: -1 })
            .limit(parseInt(limit))
            .select('-featureSnapshot')
            .lean();
        res.json(logs);
    } catch (err) { next(err); }
});

// ── Validate a prediction (set actual outcome) ────────────────────────────────
router.put('/predictions/:id/validate', authenticate, requireRole(GOV_ROLES), async (req, res, next) => {
    try {
        const { actualOutbreak, actualCategory } = req.body;
        const log = await PredictionLog.findByIdAndUpdate(
            req.params.id,
            { $set: { actualOutbreak: !!actualOutbreak, actualCategory, validatedAt: new Date() } },
            { new: true }
        );
        if (!log) return res.status(404).json({ error: 'Prediction log not found' });
        res.json(log);
    } catch (err) { next(err); }
});

// ── Current feature drift status ──────────────────────────────────────────────
router.get('/drift', authenticate, requireRole(GOV_ROLES), async (req, res, next) => {
    try {
        const { wardId } = req.query;
        const filter = { isDrifting: true };
        if (wardId) filter.wardId = wardId;
        const drifting = await FeatureDrift.find(filter)
            .sort({ driftScore: -1 })
            .limit(100)
            .lean();
        const totalChecked = await FeatureDrift.countDocuments();
        res.json({
            driftingCount: drifting.length,
            totalChecked,
            lastChecked: drifting[0]?.checkedAt,
            drifting,
        });
    } catch (err) { next(err); }
});

// ── Trigger retraining (logs request — actual retrain is out-of-band) ─────────
router.post('/retrain/trigger', authenticate, requireRole(['SUPER_ADMIN']), async (req, res, next) => {
    try {
        const { reason = 'manual' } = req.body;
        const { AuditLog } = require('../models');
        await AuditLog.create({
            userId: req.user.id,
            action: 'RETRAIN_TRIGGERED',
            resource: 'ModelRegistry',
            metadata: { reason, triggeredAt: new Date() },
        });
        logger.warn(`[Governance] Retraining requested by ${req.user.id}: ${reason}`);
        // In production: push message to BullMQ or ML retrain webhook
        res.json({
            message: 'Retraining request logged. ML pipeline will retrain within 24h.',
            reason,
            requestedAt: new Date(),
        });
    } catch (err) { next(err); }
});

// ── Performance stats: precision/recall from validated predictions ─────────────
router.get('/performance', authenticate, requireRole(GOV_ROLES), async (req, res, next) => {
    try {
        const validated = await PredictionLog.find({ actualOutbreak: { $exists: true } }).lean();
        if (validated.length < 5) {
            return res.json({ message: 'Not enough validated predictions for metrics', validated: validated.length });
        }

        const TP = validated.filter(v => v.predictedRisk >= 60 && v.actualOutbreak).length;
        const FP = validated.filter(v => v.predictedRisk >= 60 && !v.actualOutbreak).length;
        const TN = validated.filter(v => v.predictedRisk < 60 && !v.actualOutbreak).length;
        const FN = validated.filter(v => v.predictedRisk < 60 && v.actualOutbreak).length;

        const precision = TP / (TP + FP || 1);
        const recall = TP / (TP + FN || 1);
        const f1 = 2 * precision * recall / (precision + recall || 1);

        res.json({
            total: validated.length, TP, FP, TN, FN,
            precision: (precision * 100).toFixed(1) + '%',
            recall: (recall * 100).toFixed(1) + '%',
            f1Score: (f1 * 100).toFixed(1) + '%',
        });
    } catch (err) { next(err); }
});

module.exports = router;
