const { WaterQualityReport } = require('../models');
const logger = require('../utils/logger');

exports.create = async (req, res, next) => {
    try {
        const { wardId, reportDate, chlorineLevel, phLevel, turbidity, ecoli, totalColiforms, source } = req.body;
        const record = await WaterQualityReport.create({
            wardId, reportDate: new Date(reportDate),
            chlorineLevel, phLevel, turbidity, ecoli, totalColiforms, source,
        });
        logger.info(`Water report recorded: Ward ${wardId} | Cl=${chlorineLevel} pH=${phLevel} NTU=${turbidity}`);
        res.status(201).json(record);
    } catch (err) {
        next(err);
    }
};

exports.list = async (req, res, next) => {
    try {
        const { wardId, from, to, limit = 100 } = req.query;
        const filter = {};
        if (wardId) filter.wardId = wardId;
        if (from || to) {
            filter.reportDate = {};
            if (from) filter.reportDate.$gte = new Date(from);
            if (to) filter.reportDate.$lte = new Date(to);
        }
        const records = await WaterQualityReport.find(filter)
            .sort({ reportDate: -1 })
            .limit(parseInt(limit));
        res.json(records);
    } catch (err) {
        next(err);
    }
};

exports.latestByWard = async (req, res, next) => {
    try {
        const { wardId } = req.params;
        const record = await WaterQualityReport.findOne({ wardId }).sort({ reportDate: -1 });
        if (!record) return res.status(404).json({ error: 'No water report found for this ward' });
        res.json(record);
    } catch (err) {
        next(err);
    }
};
