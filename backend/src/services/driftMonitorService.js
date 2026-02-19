/**
 * driftMonitorService.js — Phase 8: Feature Drift Detection
 *
 * Uses Population Stability Index (PSI) approximation:
 *   PSI < 0.1  → No significant change
 *   PSI 0.1–0.2 → Some change (monitor)
 *   PSI > 0.2  → Significant shift (alert + retrain flag)
 *
 * Runs every 6 hours. Compares last-24h feature distribution
 * vs. 7-day baseline distribution per ward per feature.
 */

const WardFeatureVector = require('../models/WardFeatureVector');
const { FeatureDrift } = require('../models/Governance');
const logger = require('../utils/logger');

const MONITORED_FEATURES = [
    'symptomCount_24h', 'rainfall_72h', 'chlorineLevel',
    'turbidity', 'temperature_c', 'humidity_pct', 'admissionsDelta_24h',
];

const PSI_WARNING = 0.1;
const PSI_CRITICAL = 0.2;

// ── Compute PSI for two arrays of values ─────────────────────────────────────
function computePSI(baseline, current, bins = 10) {
    if (!baseline.length || !current.length) return 0;

    const allValues = [...baseline, ...current];
    const min = Math.min(...allValues);
    const max = Math.max(...allValues);
    if (max === min) return 0;

    const binWidth = (max - min) / bins;

    // Build histograms
    const baseCounts = new Array(bins).fill(0);
    const currCounts = new Array(bins).fill(0);

    for (const v of baseline) {
        const idx = Math.min(bins - 1, Math.floor((v - min) / binWidth));
        baseCounts[idx]++;
    }
    for (const v of current) {
        const idx = Math.min(bins - 1, Math.floor((v - min) / binWidth));
        currCounts[idx]++;
    }

    const baseTotal = baseline.length;
    const currTotal = current.length;

    let psi = 0;
    for (let i = 0; i < bins; i++) {
        const basePct = Math.max(0.001, baseCounts[i] / baseTotal);
        const currPct = Math.max(0.001, currCounts[i] / currTotal);
        psi += (currPct - basePct) * Math.log(currPct / basePct);
    }

    return Math.abs(psi);
}

// ── Run drift check for all wards + features ─────────────────────────────────────
async function runDriftCheck() {
    logger.info('[DriftMonitor] Starting drift check...');

    const now = new Date();
    const h24 = new Date(now - 24 * 3600 * 1000);
    const d7 = new Date(now - 7 * 24 * 3600 * 1000);

    // Get all distinct wardIds from recent vectors
    const wardIds = await WardFeatureVector.distinct('wardId', { computedAt: { $gte: d7 } });

    let drifting = 0, total = 0;

    for (const wardId of wardIds) {
        const [baseline7d, current24h] = await Promise.all([
            WardFeatureVector.find({ wardId, computedAt: { $gte: d7, $lt: h24 } })
                .select(MONITORED_FEATURES.join(' ')).lean(),
            WardFeatureVector.find({ wardId, computedAt: { $gte: h24 } })
                .select(MONITORED_FEATURES.join(' ')).lean(),
        ]);

        if (!baseline7d.length || !current24h.length) continue;

        for (const feature of MONITORED_FEATURES) {
            const baselineValues = baseline7d.map(v => v[feature] ?? 0);
            const currentValues = current24h.map(v => v[feature] ?? 0);

            const psi = computePSI(baselineValues, currentValues);
            const isDrifting = psi > PSI_WARNING;

            // Compute simple stats
            const mean = arr => arr.reduce((a, b) => a + b, 0) / arr.length;
            const std = (arr, m) => Math.sqrt(arr.reduce((a, b) => a + (b - m) ** 2, 0) / arr.length);
            const baseM = mean(baselineValues), baseS = std(baselineValues, baseM);
            const currM = mean(currentValues), currS = std(currentValues, currM);

            try {
                await FeatureDrift.findOneAndUpdate(
                    { wardId, feature },
                    {
                        $set: {
                            checkedAt: now,
                            baselineMean: Math.round(baseM * 100) / 100,
                            baselineStd: Math.round(baseS * 100) / 100,
                            currentMean: Math.round(currM * 100) / 100,
                            currentStd: Math.round(currS * 100) / 100,
                            driftScore: Math.round(psi * 1000) / 1000,
                            isDrifting,
                            threshold: PSI_WARNING,
                        },
                    },
                    { upsert: true },
                );

                if (psi > PSI_CRITICAL) {
                    drifting++;
                    logger.warn(`[DriftMonitor] CRITICAL drift: Ward ${wardId} feature=${feature} PSI=${psi.toFixed(3)}`);
                } else if (isDrifting) {
                    drifting++;
                    logger.info(`[DriftMonitor] Drift: Ward ${wardId} feature=${feature} PSI=${psi.toFixed(3)}`);
                }
                total++;
            } catch (e) { /* skip */ }
        }
    }

    logger.info(`[DriftMonitor] Done: ${total} checks, ${drifting} drifting (PSI > ${PSI_WARNING})`);
    return { total, drifting };
}

module.exports = { runDriftCheck, computePSI };
