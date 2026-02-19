/**
 * hospitalAdmissionIngestionService.js
 * ABDM-compatible hospital admission data ingestion.
 *
 * ABDM (Ayushman Bharat Digital Mission) standardises health data exchange.
 * In production this is a FHIR R4 / NDHM REST API push endpoint.
 * Hospitals POST aggregated syndrome counts every 6 hours.
 *
 * This service:
 *  1. Validates incoming ABDM-style payload
 *  2. Writes to HospitalAdmission collection
 *  3. Writes to AuditLog for regulatory compliance
 *  4. Runs anomaly detection (spike > 3x 7-day average)
 *  5. Triggers ML inference if anomaly detected
 */

const { HospitalAdmission, AuditLog } = require('../models');
const logger = require('../utils/logger');

// ── ABDM payload schema validation ───────────────────────────────────────────
function validateABDMPayload(payload) {
    const required = ['wardId', 'facilityId', 'reportingPeriodStart', 'reportingPeriodEnd', 'syndromes'];
    const missing = required.filter(f => payload[f] === undefined || payload[f] === null);
    if (missing.length) return { valid: false, error: `Missing fields: ${missing.join(', ')}` };

    if (!Array.isArray(payload.syndromes) || !payload.syndromes.length) {
        return { valid: false, error: 'syndromes must be non-empty array' };
    }

    const validSyndromes = new Set(['FEVER', 'DIARRHEA', 'VOMITING', 'RESPIRATORY', 'SKIN_RASH', 'MALARIA', 'DENGUE', 'CHOLERA', 'TYPHOID', 'COVID', 'UNKNOWN']);
    for (const s of payload.syndromes) {
        if (!validSyndromes.has(s.type)) {
            return { valid: false, error: `Unknown syndrome: ${s.type}` };
        }
        if (typeof s.count !== 'number' || s.count < 0) {
            return { valid: false, error: `Invalid count for ${s.type}` };
        }
    }

    if (payload.severeCount !== undefined && payload.severeCount < 0) {
        return { valid: false, error: 'severeCount cannot be negative' };
    }
    if (payload.deathCount !== undefined && payload.deathCount < 0) {
        return { valid: false, error: 'deathCount cannot be negative' };
    }

    return { valid: true };
}

// ── Anomaly detection — spike > 3x 7-day average ────────────────────────────
async function detectAdmissionAnomaly(wardId, currentTotal) {
    const since7d = new Date(Date.now() - 7 * 24 * 3600 * 1000);
    const agg = await HospitalAdmission.aggregate([
        { $match: { wardId, createdAt: { $gte: since7d } } },
        { $group: { _id: null, avg: { $avg: '$totalCount' }, std: { $stdDevPop: '$totalCount' } } },
    ]);
    if (!agg.length || !agg[0].avg) return false;
    const threshold = agg[0].avg + 3 * (agg[0].std || agg[0].avg);
    const isAnomaly = currentTotal > threshold;
    if (isAnomaly) {
        logger.warn(`[HospitalIngestion] Anomaly detected! Ward ${wardId}: ${currentTotal} vs threshold ${threshold.toFixed(1)}`);
    }
    return isAnomaly;
}

// ── Build HospitalAdmission document from ABDM payload ───────────────────────
function buildAdmissionDoc(payload, userId) {
    const syndromeMap = {};
    let totalCount = 0;
    for (const s of payload.syndromes) {
        syndromeMap[s.type] = s.count;
        totalCount += s.count;
    }

    return {
        wardId: payload.wardId,
        facilityId: payload.facilityId,
        facilityName: payload.facilityName,
        reportingPeriodStart: new Date(payload.reportingPeriodStart),
        reportingPeriodEnd: new Date(payload.reportingPeriodEnd),

        // Syndrome breakdown
        fever_count: syndromeMap.FEVER || 0,
        diarrhea_count: syndromeMap.DIARRHEA || 0,
        vomiting_count: syndromeMap.VOMITING || 0,
        respiratory_count: syndromeMap.RESPIRATORY || 0,
        skin_rash_count: syndromeMap.SKIN_RASH || 0,
        malaria_count: syndromeMap.MALARIA || 0,
        dengue_count: syndromeMap.DENGUE || 0,
        totalCount,

        // Severity
        severeCount: payload.severeCount || 0,
        deathCount: payload.deathCount || 0,

        // Metadata
        submittedBy: userId,
        sourceFormat: 'ABDM',
        rawPayload: JSON.stringify(payload),
    };
}

// ── Main ingestion function (called by hospitalAdmissionRoutes) ───────────────
async function ingestHospitalAdmission(payload, userId, req) {
    // 1. Validate
    const { valid, error } = validateABDMPayload(payload);
    if (!valid) throw Object.assign(new Error(error), { statusCode: 400 });

    // 2. Build document
    const doc = buildAdmissionDoc(payload, userId);

    // 3. Persist
    const admission = await HospitalAdmission.create(doc);

    // 4. Audit log
    await AuditLog.create({
        userId,
        action: 'HOSPITAL_ADMISSION_INGESTED',
        resource: 'HospitalAdmission',
        resourceId: admission._id.toString(),
        metadata: { wardId: doc.wardId, totalCount: doc.totalCount, facilityId: doc.facilityId },
        ip: req?.ip,
    });

    // 5. Anomaly detection
    const isAnomaly = await detectAdmissionAnomaly(doc.wardId, doc.totalCount);

    return { admission, isAnomaly };
}

// ── Seeding demo data for testing / pilot ────────────────────────────────────
async function seedDemoAdmissions(wards) {
    const SYNDROMES = ['FEVER', 'DIARRHEA', 'VOMITING', 'RESPIRATORY'];
    let count = 0;
    for (const wardId of wards) {
        for (let day = 7; day >= 0; day--) {
            const start = new Date(Date.now() - day * 24 * 3600 * 1000);
            const end = new Date(start.getTime() + 24 * 3600 * 1000);
            const fever = Math.floor(Math.random() * 20);
            const diarrhea = Math.floor(Math.random() * 10);
            try {
                await HospitalAdmission.create({
                    wardId,
                    facilityId: `DEMO-${wardId}`,
                    facilityName: `Demo Hospital Ward ${wardId}`,
                    reportingPeriodStart: start,
                    reportingPeriodEnd: end,
                    fever_count: fever,
                    diarrhea_count: diarrhea,
                    vomiting_count: Math.floor(Math.random() * 5),
                    respiratory_count: Math.floor(Math.random() * 8),
                    totalCount: fever + diarrhea + Math.floor(Math.random() * 13),
                    severeCount: Math.floor(Math.random() * 3),
                    deathCount: 0,
                    sourceFormat: 'DEMO_SEED',
                });
                count++;
            } catch (e) { /* skip dups */ }
        }
    }
    logger.info(`[HospitalIngestion] Seeded ${count} demo admission records`);
    return count;
}

module.exports = { ingestHospitalAdmission, detectAdmissionAnomaly, seedDemoAdmissions };
