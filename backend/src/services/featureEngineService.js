/**
 * featureEngineService.js — Phase 2: Unified Feature Engine
 *
 * Every hour, for each ward, aggregates ALL data sources into a
 * WardFeatureVector ready for ML inference:
 *  - 24h/72h symptom counts (from CitizenReport)
 *  - Hospital admission deltas (from HospitalAdmission)
 *  - Chlorine deviation from 7-day baseline (from WaterQualityReport)
 *  - Rainfall lags (48h, 72h) (from WeatherData)
 *  - Population density, hospital distance (from WardMaster + WardHospitalDistance)
 *
 * Features are then min-max normalised using cached global bounds.
 * The normalized vector is the exact input to XGBoost.
 */

const { CitizenReport, WeatherData, WaterQualityReport, HospitalAdmission } = require('../models');
const WardMaster = require('../models/WardMaster');
const WardFeatureVector = require('../models/WardFeatureVector');
const WardHospitalDistance = require('../models/WardHospitalDistance');
const { getChlorineDeviation } = require('./waterQualityIngestionService');
const logger = require('../utils/logger');

// ── Feature bounds for min-max normalization ─────────────────────────────────
// These approximate realistic Delhi/India ranges for each feature
const FEATURE_BOUNDS = {
    symptomCount_24h: [0, 200],
    rainfall_72h: [0, 150],    // mm
    chlorineLevel: [0, 2.0],
    phLevel: [6.0, 9.0],
    turbidity: [0, 10.0],
    temperature_c: [5, 50],
    humidity_pct: [10, 100],
    admissionsDelta_24h: [-50, 100],
    severeCount_24h: [0, 30],
    population: [10000, 200000],
    distanceToHospital: [0.1, 20],
};

function minMaxNormalize(value, [min, max]) {
    if (max === min) return 0;
    return Math.min(1, Math.max(0, (value - min) / (max - min)));
}

// ── Build the feature vector for a single ward ───────────────────────────────
async function buildFeatureVector(wardId, asOf = new Date()) {
    const now = asOf instanceof Date ? asOf : new Date(asOf);
    const h24 = new Date(now - 24 * 3600 * 1000);
    const h48 = new Date(now - 48 * 3600 * 1000);
    const h72 = new Date(now - 72 * 3600 * 1000);
    const d7 = new Date(now - 7 * 24 * 3600 * 1000);

    const sources = [];

    // ── 1. Symptom signals ──────────────────────────────────────────────────
    const symptomDocs = await CitizenReport.find({
        wardId, createdAt: { $gte: h72 },
    }).select('syndromeType severity createdAt').lean();

    const symptoms24h = symptomDocs.filter(r => r.createdAt >= h24);
    const symptomCount_24h = symptoms24h.length;
    const symptomCount_72h = symptomDocs.length;
    const severityAvg_24h = symptoms24h.length
        ? symptoms24h.reduce((a, r) => a + (r.severity || 1), 0) / symptoms24h.length
        : 1;

    const synCount = (arr, type) => arr.filter(r => r.syndromeType === type).length;
    const feverCount_24h = synCount(symptoms24h, 'FEVER');
    const diarrheaCount_24h = synCount(symptoms24h, 'DIARRHEA');
    const vomitingCount_24h = synCount(symptoms24h, 'VOMITING');
    const respiratoryCount_24h = synCount(symptoms24h, 'RESPIRATORY');
    const skinRashCount_24h = synCount(symptoms24h, 'SKIN_RASH');
    if (symptomCount_24h > 0) sources.push('CITIZEN_REPORTS');

    // ── 2. Hospital admission delta ──────────────────────────────────────────
    const [admissionsNow, admissionsPrev] = await Promise.all([
        HospitalAdmission.aggregate([
            { $match: { wardId, reportingPeriodStart: { $gte: h24 } } },
            { $group: { _id: null, total: { $sum: '$totalCount' }, severe: { $sum: '$severeCount' }, deaths: { $sum: '$deathCount' } } },
        ]),
        HospitalAdmission.aggregate([
            { $match: { wardId, reportingPeriodStart: { $gte: h48, $lt: h24 } } },
            { $group: { _id: null, total: { $sum: '$totalCount' } } },
        ]),
    ]);

    const admissionsTotal_24h = admissionsNow[0]?.total || 0;
    const admissionsPrev_24h = admissionsPrev[0]?.total || 0;
    const admissionsDelta_24h = admissionsTotal_24h - admissionsPrev_24h;
    const severeCount_24h = admissionsNow[0]?.severe || 0;
    const deathCount_24h = admissionsNow[0]?.deaths || 0;
    if (admissionsTotal_24h > 0) sources.push('HOSPITAL_ADMISSIONS');

    const admissionsTotal_7d = (await HospitalAdmission.aggregate([
        { $match: { wardId, reportingPeriodStart: { $gte: d7 } } },
        { $group: { _id: null, total: { $sum: '$totalCount' } } },
    ]))[0]?.total || 0;

    // ── 3. Water quality ────────────────────────────────────────────────────
    const latestWater = await WaterQualityReport.findOne({ wardId, timestamp: { $gte: h24 } })
        .sort({ timestamp: -1 }).select('chlorineLevel phLevel turbidity').lean();

    const chlorineLevel = latestWater?.chlorineLevel ?? 0.5;
    const phLevel = latestWater?.phLevel ?? 7.2;
    const turbidity = latestWater?.turbidity ?? 1.0;
    const chlorineDev_7d = await getChlorineDeviation(wardId, chlorineLevel);
    if (latestWater) sources.push('WATER_QUALITY');

    // ── 4. Weather ──────────────────────────────────────────────────────────
    const [weather24, weather72] = await Promise.all([
        WeatherData.aggregate([
            { $match: { wardId, timestamp: { $gte: h24 } } },
            { $group: { _id: null, rainfall: { $sum: '$rainfall_mm' }, humidity: { $avg: '$humidity_pct' }, temp: { $avg: '$temperature_c' } } },
        ]),
        WeatherData.aggregate([
            { $match: { wardId, timestamp: { $gte: h72 } } },
            { $group: { _id: null, rainfall: { $sum: '$rainfall_mm' } } },
        ]),
    ]);

    const rainfall_24h = weather24[0]?.rainfall ?? 0;
    const rainfall_72h = weather72[0]?.rainfall ?? 0;
    const temperature_c = weather24[0]?.temp ?? 28;
    const humidity_pct = weather24[0]?.humidity ?? 65;
    if (rainfall_24h > 0 || temperature_c !== 28) sources.push('WEATHER');

    // ── 5. Static ward characteristics ─────────────────────────────────────
    const [ward, hospitalDist] = await Promise.all([
        WardMaster.findOne({ wardNumber: wardId }).select('population').lean(),
        WardHospitalDistance.findOne({ wardId }).sort({ distanceKm: 1 }).select('distanceKm').lean(),
    ]);
    const population = ward?.population || 50000;
    const distanceToHospital = hospitalDist?.distanceKm || 2.0;

    // ── 6. Normalize features ────────────────────────────────────────────────
    const raw = {
        symptomCount_24h, rainfall_72h, chlorineLevel, phLevel, turbidity,
        temperature_c, humidity_pct, admissionsDelta_24h, severeCount_24h,
        population, distanceToHospital,
    };

    const normalizedVector = Object.entries(FEATURE_BOUNDS).map(([key, bounds]) =>
        minMaxNormalize(raw[key] ?? 0, bounds)
    );

    const dataCompleteness = sources.length / 4; // 4 possible sources

    return {
        wardId,
        computedAt: new Date(
            Math.floor(now.getTime() / (3600 * 1000)) * (3600 * 1000) // floor to hour
        ),
        // Symptom
        symptomCount_24h, symptomCount_72h, severityAvg_24h,
        feverCount_24h, diarrheaCount_24h, vomitingCount_24h,
        respiratoryCount_24h, skinRashCount_24h,
        // Hospital
        admissionsDelta_24h, admissionsTotal_7d, severeCount_24h, deathCount_24h,
        // Water
        chlorineLevel, chlorineDev_7d, phLevel, turbidity,
        // Weather
        rainfall_24h, rainfall_72h, temperature_c, humidity_pct,
        // Static
        population, distanceToHospital,
        // Meta
        normalizedVector, dataCompleteness, sources,
    };
}

// ── Upsert feature vector for a ward ────────────────────────────────────────
async function computeAndStoreFeatureVector(wardId, asOf) {
    const vector = await buildFeatureVector(wardId, asOf);
    await WardFeatureVector.findOneAndUpdate(
        { wardId, computedAt: vector.computedAt },
        { $set: vector },
        { upsert: true, new: true },
    );
    return vector;
}

// ── Hourly run across all wards ───────────────────────────────────────────────
async function runHourlyFeatureCalculation(asOf = new Date()) {
    logger.info('[FeatureEngine] Starting hourly feature calculation...');
    const wards = await WardMaster.find({}, 'wardNumber').lean();
    if (!wards.length) {
        logger.warn('[FeatureEngine] No wards found');
        return { computed: 0 };
    }

    let computed = 0, failed = 0;
    const CONCURRENCY = 5;
    for (let i = 0; i < wards.length; i += CONCURRENCY) {
        const batch = wards.slice(i, i + CONCURRENCY);
        await Promise.all(batch.map(async ({ wardNumber }) => {
            try {
                await computeAndStoreFeatureVector(wardNumber, asOf);
                computed++;
            } catch (e) {
                logger.error(`[FeatureEngine] Ward ${wardNumber} failed: ${e.message}`);
                failed++;
            }
        }));
    }

    logger.info(`[FeatureEngine] Done: ${computed} computed, ${failed} failed`);
    return { computed, failed };
}

// ── Backfill capability — recompute past N hours ─────────────────────────────
async function backfillFeatureVectors(hoursBack = 24) {
    logger.info(`[FeatureEngine] Backfilling ${hoursBack} hours...`);
    const wards = await WardMaster.find({}, 'wardNumber').lean();
    let total = 0;
    for (let h = hoursBack; h >= 0; h--) {
        const asOf = new Date(Date.now() - h * 3600 * 1000);
        for (const { wardNumber } of wards) {
            try {
                await computeAndStoreFeatureVector(wardNumber, asOf);
                total++;
            } catch (e) { /* skip */ }
        }
    }
    logger.info(`[FeatureEngine] Backfill complete: ${total} vectors computed`);
    return total;
}

module.exports = {
    buildFeatureVector,
    computeAndStoreFeatureVector,
    runHourlyFeatureCalculation,
    backfillFeatureVectors,
};
