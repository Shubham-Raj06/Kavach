/**
 * mlInferenceService.js — Phase 3: Real-Time ML Inference Pipeline
 *
 * Architecture:
 *  Data Update → computeAndStoreFeatureVector →
 *  runInferenceForWard (circuit breaker + retry) →
 *  ML /predict endpoint →
 *  Store RiskPrediction →
 *  Log to PredictionLog →
 *  If threshold → AlertEngine
 *  If anomaly → additonal ML /anomaly call
 *
 * Design Principles:
 *  - Circuit breaker: stop hammering ML service on repeated failures
 *  - Timeout: 5s hard timeout per inference call
 *  - Retry: 3 attempts with exponential backoff
 *  - Fallback: rule-based risk estimate if ML unavailable
 *  - Target: < 2s end-to-end, < 500ms ML inference
 */

const axios = require('axios');
const { RiskPrediction } = require('../models');
const { PredictionLog } = require('../models/Governance');
const WardFeatureVector = require('../models/WardFeatureVector');
const logger = require('../utils/logger');

const ML_BASE = process.env.ML_SERVICE_URL || 'http://localhost:8001';
const ML_TIMEOUT_MS = 5000;
const RISK_THRESHOLD = 60;  // trigger alert above this
const CONF_THRESHOLD = 0.70; // confidence gate for alerts

// ── Circuit Breaker State ────────────────────────────────────────────────────
const circuitBreaker = {
    failures: 0,
    lastFailure: null,
    state: 'CLOSED', // CLOSED | OPEN | HALF_OPEN
    threshold: 5,     // open after 5 consecutive failures
    cooldownMs: 60000,// 1 min cooldown

    canRequest() {
        if (this.state === 'CLOSED') return true;
        if (this.state === 'OPEN') {
            if (Date.now() - this.lastFailure > this.cooldownMs) {
                this.state = 'HALF_OPEN';
                return true;
            }
            return false;
        }
        return true; // HALF_OPEN: allow one trial
    },

    recordSuccess() {
        this.failures = 0;
        this.state = 'CLOSED';
    },

    recordFailure() {
        this.failures++;
        this.lastFailure = Date.now();
        if (this.failures >= this.threshold) {
            this.state = 'OPEN';
            logger.error(`[MLInference] Circuit OPEN — ML service failing (${this.failures} consecutive errors)`);
        }
    },
};

// ── Retry with exponential backoff ───────────────────────────────────────────
async function callWithRetry(fn, maxAttempts = 3, baseDelayMs = 200) {
    let lastError;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            return await fn();
        } catch (err) {
            lastError = err;
            if (attempt < maxAttempts) {
                await new Promise(r => setTimeout(r, baseDelayMs * Math.pow(2, attempt - 1)));
            }
        }
    }
    throw lastError;
}

// ── Rule-based fallback risk estimate ────────────────────────────────────────
function fallbackRisk(vector) {
    const {
        symptomCount_24h = 0, rainfall_72h = 0, chlorineLevel = 0.5,
        admissionsDelta_24h = 0, severeCount_24h = 0, turbidity = 1,
    } = vector;

    let score = 0;
    score += Math.min(40, symptomCount_24h * 0.4);
    score += Math.min(15, rainfall_72h * 0.2);
    score += Math.min(15, Math.max(0, (0.5 - chlorineLevel) * 30));
    score += Math.min(15, Math.max(0, admissionsDelta_24h * 0.5));
    score += Math.min(10, severeCount_24h * 2);
    score += Math.min(5, (turbidity - 1) * 1.5);

    return Math.min(100, Math.round(score));
}

// ── Main inference function for a single ward ─────────────────────────────────
async function runInferenceForWard(wardId) {
    const startTime = Date.now();

    // 1. Load latest feature vector
    const fv = await WardFeatureVector.findOne({ wardId }).sort({ computedAt: -1 }).lean();
    if (!fv) {
        logger.warn(`[MLInference] No feature vector for ward ${wardId} — skipping`);
        return null;
    }

    let riskScore, outbreakCategory, confidence, isAnomaly, shapReasons, source;

    if (!circuitBreaker.canRequest()) {
        // Circuit is OPEN — use fallback
        logger.warn(`[MLInference] Circuit OPEN for ward ${wardId}, using fallback`);
        riskScore = fallbackRisk(fv);
        outbreakCategory = 'UNKNOWN';
        confidence = 0.5;
        isAnomaly = false;
        shapReasons = [];
        source = 'FALLBACK_CIRCUIT_OPEN';
    } else {
        try {
            // 2. Build ABDM-compatible prediction request
            const payload = {
                wardId,
                features: {
                    rainfall: fv.rainfall_72h,
                    chlorineLevel: fv.chlorineLevel,
                    phLevel: fv.phLevel,
                    turbidity: fv.turbidity,
                    temperature: fv.temperature_c,
                    humidity: fv.humidity_pct,
                    fever_count: fv.feverCount_24h,
                    diarrhea_count: fv.diarrheaCount_24h,
                    vomiting_count: fv.vomitingCount_24h,
                    syndromeBreakdown: {
                        FEVER: fv.feverCount_24h,
                        DIARRHEA: fv.diarrheaCount_24h,
                        VOMITING: fv.vomitingCount_24h,
                        RESPIRATORY: fv.respiratoryCount_24h,
                    },
                },
                forecastHorizon: 48,
            };

            const result = await callWithRetry(async () => {
                const res = await axios.post(`${ML_BASE}/predict`, payload, {
                    timeout: ML_TIMEOUT_MS,
                });
                return res.data;
            });

            riskScore = Math.round((result.riskScore ?? 0) * 100);
            outbreakCategory = result.outbreakCategory ?? 'UNKNOWN';
            confidence = result.confidence ?? 0.8;
            isAnomaly = result.isAnomaly ?? false;
            shapReasons = result.shapReasons ?? [];
            source = result.source ?? 'ml';
            circuitBreaker.recordSuccess();

        } catch (err) {
            circuitBreaker.recordFailure();
            logger.error(`[MLInference] ML call failed for ward ${wardId}: ${err.message}`);
            riskScore = fallbackRisk(fv);
            outbreakCategory = 'UNKNOWN';
            confidence = 0.5;
            isAnomaly = false;
            shapReasons = [];
            source = 'FALLBACK_ML_ERROR';
        }
    }

    const inferenceDurationMs = Date.now() - startTime;

    // 3. Store or update risk prediction
    await RiskPrediction.findOneAndUpdate(
        { wardId },
        {
            $set: {
                wardId, riskScore, outbreakCategory, confidence, isAnomaly,
                shapReasons: JSON.stringify(shapReasons),
                forecastHorizon: 48,
                updatedAt: new Date(),
            },
        },
        { upsert: true, new: true },
    );

    // 4. PredictionLog (governance audit trail)
    try {
        await PredictionLog.create({
            wardId,
            modelVersion: process.env.MODEL_VERSION || 'v1.0.0',
            predictedRisk: riskScore,
            predictedCategory: outbreakCategory,
            confidence,
            isAnomaly,
            shapReasons: JSON.stringify(shapReasons),
            featureSnapshot: JSON.stringify({ symptomCount_24h: fv.symptomCount_24h, rainfall_72h: fv.rainfall_72h, chlorineLevel: fv.chlorineLevel }),
            inferenceDurationMs,
        });
    } catch (e) { /* don't fail inference for log errors */ }

    if (inferenceDurationMs > 2000) {
        logger.warn(`[MLInference] SLOW inference ward ${wardId}: ${inferenceDurationMs}ms`);
    } else {
        logger.debug(`[MLInference] Ward ${wardId}: risk=${riskScore} conf=${confidence} ${inferenceDurationMs}ms`);
    }

    return { wardId, riskScore, outbreakCategory, confidence, isAnomaly, source, inferenceDurationMs };
}

// ── Run inference across all wards (hourly job) ───────────────────────────────
async function runInferenceAllWards() {
    const WardMaster = require('../models/WardMaster');
    const wards = await WardMaster.find({}, 'wardNumber').lean();
    logger.info(`[MLInference] Running inference for ${wards.length} wards`);

    const results = [];
    const CONCURRENCY = 5;
    for (let i = 0; i < wards.length; i += CONCURRENCY) {
        const batch = wards.slice(i, i + CONCURRENCY);
        const batchResults = await Promise.allSettled(
            batch.map(({ wardNumber }) => runInferenceForWard(wardNumber))
        );
        results.push(...batchResults.map(r => r.status === 'fulfilled' ? r.value : null).filter(Boolean));
    }

    return results;
}

// ── Get circuit breaker status (for health endpoint) ─────────────────────────
function getCircuitBreakerStatus() {
    return {
        state: circuitBreaker.state,
        failures: circuitBreaker.failures,
        lastFailure: circuitBreaker.lastFailure,
    };
}

module.exports = { runInferenceForWard, runInferenceAllWards, getCircuitBreakerStatus, fallbackRisk };
