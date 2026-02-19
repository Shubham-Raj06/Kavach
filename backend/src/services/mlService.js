const axios = require('axios');
const logger = require('../utils/logger');

const ML_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';

/**
 * Calls the Python FastAPI /predict endpoint.
 * Returns: { riskScore, outbreakCategory, confidence, isAnomaly, shapReasons, outbreakReasons }
 */
exports.predict = async ({ wardId, features, forecastHorizon = 48 }) => {
    try {
        const response = await axios.post(
            `${ML_URL}/predict`,
            { wardId, features, forecastHorizon },
            { timeout: 15000 }
        );
        return response.data;
    } catch (err) {
        logger.error(`ML service /predict failed: ${err.message}`);

        // Graceful fallback: rule-based scoring so the app still works without ML
        return fallbackPredict(features);
    }
};

/**
 * Calls the Python FastAPI /anomaly endpoint.
 */
exports.detectAnomaly = async ({ wardId, features }) => {
    try {
        const response = await axios.post(
            `${ML_URL}/anomaly`,
            { wardId, features },
            { timeout: 10000 }
        );
        return response.data;
    } catch (err) {
        logger.error(`ML service /anomaly failed: ${err.message}`);
        return { isAnomaly: false, anomalyScore: 0 };
    }
};

/**
 * Rule-based fallback when ML service is unavailable.
 * Ensures the system degrades gracefully during demos.
 */
function fallbackPredict(features) {
    const {
        chlorineDropRatio = 0,
        syndromeSpike48h = 0,
        lagRainfall1d = 0,
        citizenClusterCount = 0,
        currentTurbidity = 0,
    } = features;

    // Weighted rule-based score
    const score = Math.min(1,
        chlorineDropRatio * 0.35 +
        Math.min(syndromeSpike48h / 5, 1) * 0.30 +
        Math.min(lagRainfall1d / 50, 1) * 0.15 +
        Math.min(citizenClusterCount / 20, 1) * 0.10 +
        Math.min(currentTurbidity / 10, 1) * 0.10
    );

    // Determine dominant category from syndrome breakdown
    const syndromeBreakdown = features.syndromeBreakdown || {};
    const dominantSyndrome = Object.entries(syndromeBreakdown)
        .sort((a, b) => b[1] - a[1])[0]?.[0] || 'UNKNOWN';

    const SYNDROME_CATEGORY = {
        DIARRHEA: 'WATERBORNE', VOMITING: 'FOODBORNE', FEVER: 'VECTOR_BORNE',
        COUGH: 'AIRBORNE', RESPIRATORY_DISTRESS: 'AIRBORNE',
        SKIN_RASH: 'VECTOR_BORNE', JAUNDICE: 'WATERBORNE', UNKNOWN: 'UNKNOWN',
    };

    const outbreakReasons = [];
    if (chlorineDropRatio > 0.3) outbreakReasons.push(`🔵 Chlorine dropped ${Math.round(chlorineDropRatio * 100)}% vs 7-day avg`);
    if (syndromeSpike48h > 2) outbreakReasons.push(`🔴 ${dominantSyndrome} cases ↑ ${syndromeSpike48h.toFixed(1)}× in last 48h`);
    if (lagRainfall1d > 20) outbreakReasons.push(`🌧️ Rainfall spike of ${lagRainfall1d.toFixed(0)}mm yesterday`);
    if (citizenClusterCount > 5) outbreakReasons.push(`📍 ${citizenClusterCount} citizen complaints in last 24h`);
    if (currentTurbidity > 5) outbreakReasons.push(`⚠️ Turbidity above safe threshold (${currentTurbidity.toFixed(1)} NTU)`);

    return {
        riskScore: parseFloat(score.toFixed(3)),
        outbreakCategory: SYNDROME_CATEGORY[dominantSyndrome] || 'UNKNOWN',
        confidence: 0.6,
        isAnomaly: score > 0.7,
        shapReasons: [],
        outbreakReasons,
        source: 'fallback',
    };
}
