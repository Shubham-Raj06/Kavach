'use strict';
const axios = require('axios');
const logger = require('../utils/logger');

const ML_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';

const mlClient = axios.create({
    baseURL: ML_URL,
    timeout: 15000,
});

/** GET /api/ml/health → ML /health */
exports.getHealth = async (req, res) => {
    try {
        const r = await mlClient.get('/health');
        res.json(r.data);
    } catch (err) {
        logger.warn(`[ml-proxy] health check failed: ${err.message}`);
        res.status(503).json({
            status: 'unavailable',
            service: 'kavach-ml',
            error: err.message,
            modelsLoaded: false,
            activeModels: [],
        });
    }
};

/** POST /api/ml/predict  → ML /predict */
exports.postPredict = async (req, res) => {
    try {
        const r = await mlClient.post('/predict', req.body);
        res.json(r.data);
    } catch (err) {
        logger.error(`[ml-proxy] predict failed: ${err.message}`);
        res.status(502).json({ error: 'ML predict endpoint unavailable', details: err.message });
    }
};

/** POST /api/ml/anomaly  → ML /anomaly */
exports.postAnomaly = async (req, res) => {
    try {
        const r = await mlClient.post('/anomaly', req.body);
        res.json(r.data);
    } catch (err) {
        logger.error(`[ml-proxy] anomaly failed: ${err.message}`);
        res.status(502).json({ error: 'ML anomaly endpoint unavailable', details: err.message });
    }
};

/** GET /api/ml/forecast/:wardId  → ML /forecast/:wardId */
exports.getForecast = async (req, res) => {
    try {
        const { wardId } = req.params;
        const { horizon = 48 } = req.query;
        const r = await mlClient.get(`/forecast/${wardId}?horizon=${horizon}`);
        res.json(r.data);
    } catch (err) {
        logger.error(`[ml-proxy] forecast failed: ${err.message}`);
        res.status(502).json({ error: 'ML forecast endpoint unavailable', details: err.message });
    }
};

/** POST /api/ml/hotspots  → ML /hotspots */
exports.postHotspots = async (req, res) => {
    try {
        const r = await mlClient.post('/hotspots', req.body);
        res.json(r.data);
    } catch (err) {
        logger.error(`[ml-proxy] hotspots failed: ${err.message}`);
        res.status(502).json({ error: 'ML hotspots endpoint unavailable', details: err.message });
    }
};
