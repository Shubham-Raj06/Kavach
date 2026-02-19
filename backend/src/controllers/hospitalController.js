const { HospitalAdmission } = require('../models');
const logger = require('../utils/logger');

const SYNDROME_CATEGORY_MAP = {
    DIARRHEA: 'WATERBORNE',
    VOMITING: 'FOODBORNE',
    FEVER: 'VECTOR_BORNE',
    COUGH: 'AIRBORNE',
    RESPIRATORY_DISTRESS: 'AIRBORNE',
    SKIN_RASH: 'VECTOR_BORNE',
    JAUNDICE: 'WATERBORNE',
    HEADACHE: 'VECTOR_BORNE',
    UNKNOWN: 'UNKNOWN',
};

exports.create = async (req, res, next) => {
    try {
        const { wardId, hospitalName, reportDate, syndromeType, admissionCount, severeCount, deathCount, ageGroup } = req.body;
        const outbreakCategory = SYNDROME_CATEGORY_MAP[syndromeType] || 'UNKNOWN';
        const record = await HospitalAdmission.create({
            wardId, hospitalName,
            reportDate: new Date(reportDate),
            syndromeType, outbreakCategory,
            admissionCount, severeCount, deathCount, ageGroup,
        });
        logger.info(`Hospital admission recorded: Ward ${wardId} | ${syndromeType} | ${admissionCount} cases`);
        res.status(201).json(record);
    } catch (err) {
        next(err);
    }
};

exports.list = async (req, res, next) => {
    try {
        const { wardId, syndromeType, from, to, limit = 100 } = req.query;
        const filter = {};
        if (wardId) filter.wardId = wardId;
        if (syndromeType) filter.syndromeType = syndromeType;
        if (from || to) {
            filter.reportDate = {};
            if (from) filter.reportDate.$gte = new Date(from);
            if (to) filter.reportDate.$lte = new Date(to);
        }
        const records = await HospitalAdmission.find(filter)
            .sort({ reportDate: -1 })
            .limit(parseInt(limit))
            .populate('wardId', 'name city');
        res.json(records);
    } catch (err) {
        next(err);
    }
};

exports.wardSummary = async (req, res, next) => {
    try {
        const { wardId } = req.params;
        const { days = 7 } = req.query;
        const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

        const records = await HospitalAdmission.find({ wardId, reportDate: { $gte: since } });

        // Aggregate by syndromeType using JS (Mongoose aggregation for groupBy)
        const byType = {};
        let total = 0;
        for (const r of records) {
            const t = r.syndromeType;
            if (!byType[t]) byType[t] = { syndromeType: t, outbreakCategory: r.outbreakCategory, admissionCount: 0, severeCount: 0, deathCount: 0 };
            byType[t].admissionCount += r.admissionCount || 0;
            byType[t].severeCount += r.severeCount || 0;
            byType[t].deathCount += r.deathCount || 0;
            total += r.admissionCount || 0;
        }
        const breakdown = Object.values(byType).sort((a, b) => b.admissionCount - a.admissionCount);

        res.json({ wardId, periodDays: parseInt(days), totalAdmissions: total, breakdown });
    } catch (err) {
        next(err);
    }
};
