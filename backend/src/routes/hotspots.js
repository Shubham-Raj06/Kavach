/**
 * Backend hotspot route — proxies to ML service DBSCAN clustering
 * GET /api/hotspots
 */
const express = require('express');
const router = express.Router();
const axios = require('axios');
const { Ward, RiskPrediction } = require('../models');
const logger = require('../utils/logger');

const ML_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';

router.get('/', async (req, res, next) => {
    try {
        const wards = await Ward.find({
            latitude: { $exists: true },
            longitude: { $exists: true },
        });

        // Attach latest risk prediction to each ward
        const wardData = await Promise.all(wards.map(async (w) => {
            const latest = await RiskPrediction.findOne({ wardId: w._id }).sort({ createdAt: -1 });
            return {
                wardId: String(w._id),
                name: w.name,
                latitude: w.latitude,
                longitude: w.longitude,
                riskScore: latest?.riskScore ?? 0,
                outbreakCategory: latest?.outbreakCategory ?? null,
            };
        }));

        // Call ML service for DBSCAN clustering
        try {
            const response = await axios.post(`${ML_URL}/hotspots`, wardData, { timeout: 10000 });
            return res.json(response.data);
        } catch (mlErr) {
            logger.warn('ML hotspot service unavailable, using fallback');
            // Fallback: return high-risk wards as individual hotspots
            const highRisk = wardData.filter(w => w.riskScore >= 0.6);
            const geoJson = {
                type: 'FeatureCollection',
                features: highRisk.map((w, i) => ({
                    type: 'Feature',
                    geometry: { type: 'Point', coordinates: [w.longitude, w.latitude] },
                    properties: {
                        clusterId: i,
                        wardCount: 1,
                        maxRiskScore: w.riskScore,
                        wardNames: [w.name],
                        radius: 600,
                        severity: w.riskScore >= 0.8 ? 'CRITICAL' : 'HIGH',
                    },
                })),
                clusterCount: highRisk.length,
            };
            return res.json(geoJson);
        }
    } catch (err) {
        next(err);
    }
});

module.exports = router;
