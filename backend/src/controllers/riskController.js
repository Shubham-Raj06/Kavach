const { RiskPrediction, Ward } = require('../models');
const mlService = require('../services/mlService');
const alertService = require('../services/alertService');
const featureService = require('../services/featureService');
const logger = require('../utils/logger');

/**
 * POST /api/risk/predict
 */
exports.predict = async (req, res, next) => {
    try {
        const { wardId, forecastHorizon = 48 } = req.body;

        const ward = await Ward.findById(wardId);
        if (!ward) return res.status(404).json({ error: 'Ward not found' });

        const features = await featureService.buildFeatures(wardId);
        const mlResult = await mlService.predict({ wardId, features, forecastHorizon });

        const prediction = await RiskPrediction.create({
            wardId,
            forecastHorizon,
            riskScore: mlResult.riskScore,
            outbreakCategory: mlResult.outbreakCategory,
            confidence: mlResult.confidence,
            isAnomaly: mlResult.isAnomaly,
            shapReasons: JSON.stringify(mlResult.shapReasons || []),
            outbreakReasons: JSON.stringify(mlResult.outbreakReasons || []),
            rawFeatures: JSON.stringify(features),
        });

        const threshold = parseFloat(process.env.RISK_ALERT_THRESHOLD || '0.7');
        if (mlResult.riskScore >= threshold) {
            await alertService.triggerAutoAlert(prediction, ward);
        }

        logger.info(`Risk prediction: Ward ${wardId} | score=${mlResult.riskScore} | ${mlResult.outbreakCategory}`);
        res.json({
            ...prediction.toObject(),
            shapReasons: JSON.parse(prediction.shapReasons || '[]'),
            outbreakReasons: JSON.parse(prediction.outbreakReasons || '[]'),
        });
    } catch (err) {
        next(err);
    }
};

/**
 * GET /api/risk/heatmap
 */
exports.heatmap = async (req, res, next) => {
    try {
        const wards = await Ward.find();

        const heatmapData = await Promise.all(wards.map(async (w) => {
            const latest = await RiskPrediction.findOne({ wardId: w._id }).sort({ createdAt: -1 });
            return {
                wardId: w._id,
                name: w.name,
                city: w.city,
                latitude: w.latitude,
                longitude: w.longitude,
                riskScore: latest?.riskScore ?? null,
                outbreakCategory: latest?.outbreakCategory ?? null,
                confidence: latest?.confidence ?? null,
                lastPredicted: latest?.createdAt ?? null,
            };
        }));

        res.json(heatmapData);
    } catch (err) {
        next(err);
    }
};

/**
 * GET /api/risk
 */
exports.list = async (req, res, next) => {
    try {
        const { wardId, limit = 50, offset = 0 } = req.query;
        const filter = wardId ? { wardId } : {};
        const predictions = await RiskPrediction.find(filter)
            .sort({ createdAt: -1 })
            .limit(parseInt(limit))
            .skip(parseInt(offset))
            .populate('wardId', 'name city');
        res.json(predictions);
    } catch (err) {
        next(err);
    }
};

/**
 * GET /api/risk/:wardId
 */
exports.latestByWard = async (req, res, next) => {
    try {
        const { wardId } = req.params;
        const prediction = await RiskPrediction.findOne({ wardId })
            .sort({ createdAt: -1 })
            .populate('wardId', 'name city latitude longitude');

        if (!prediction) return res.status(404).json({ error: 'No prediction found for this ward' });
        res.json({
            ...prediction.toObject(),
            shapReasons: JSON.parse(prediction.shapReasons || '[]'),
            outbreakReasons: JSON.parse(prediction.outbreakReasons || '[]'),
        });
    } catch (err) {
        next(err);
    }
};

/**
 * GET /api/risk/my-ward
 */
exports.myWard = async (req, res, next) => {
    try {
        const wardId = req.user?.wardId;
        if (!wardId) return res.status(400).json({ error: 'No ward assigned to your account' });

        const prediction = await RiskPrediction.findOne({ wardId })
            .sort({ createdAt: -1 })
            .populate('wardId', 'name city latitude longitude');

        if (!prediction) return res.status(404).json({ error: 'No prediction found for your ward' });
        res.json({
            ...prediction.toObject(),
            shapReasons: JSON.parse(prediction.shapReasons || '[]'),
            outbreakReasons: JSON.parse(prediction.outbreakReasons || '[]'),
        });
    } catch (err) {
        next(err);
    }
};
