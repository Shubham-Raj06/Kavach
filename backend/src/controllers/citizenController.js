const { CitizenReport } = require('../models');
const logger = require('../utils/logger');

exports.create = async (req, res, next) => {
    try {
        const { wardId, latitude, longitude, syndromeType, description, severity } = req.body;
        const report = await CitizenReport.create({
            userId: req.user.id,
            wardId, latitude, longitude,
            syndromeType, description, severity,
        });
        logger.info(`Citizen report: Ward ${wardId} | ${syndromeType} | severity ${severity}`);
        res.status(201).json(report);
    } catch (err) {
        next(err);
    }
};

exports.list = async (req, res, next) => {
    try {
        const { wardId, syndromeType, from, limit = 200 } = req.query;
        const filter = {};
        if (wardId) filter.wardId = wardId;
        if (syndromeType) filter.syndromeType = syndromeType;
        if (from) filter.createdAt = { $gte: new Date(from) };

        const reports = await CitizenReport.find(filter)
            .sort({ createdAt: -1 })
            .limit(parseInt(limit))
            .select('wardId latitude longitude syndromeType severity createdAt isVerified');
        res.json(reports);
    } catch (err) {
        next(err);
    }
};

exports.clusterByWard = async (req, res, next) => {
    try {
        const { wardId } = req.params;
        const since = new Date(Date.now() - 24 * 60 * 60 * 1000);

        const reports = await CitizenReport.find({ wardId, createdAt: { $gte: since } })
            .select('latitude longitude syndromeType severity');

        const byType = reports.reduce((acc, r) => {
            acc[r.syndromeType] = (acc[r.syndromeType] || 0) + 1;
            return acc;
        }, {});

        res.json({
            wardId,
            totalReports: reports.length,
            since: since.toISOString(),
            byType,
            points: reports,
        });
    } catch (err) {
        next(err);
    }
};
