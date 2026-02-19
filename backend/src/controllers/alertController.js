const { Alert, Ward } = require('../models');
const alertService = require('../services/alertService');
const logger = require('../utils/logger');

exports.create = async (req, res, next) => {
    try {
        const { wardId, severity, outbreakCategory, message, recommendedAction, recipientType } = req.body;
        const alert = await Alert.create({ wardId, severity, outbreakCategory, message, recommendedAction, recipientType });

        // Dispatch immediately
        await alertService.dispatch(alert);
        logger.info(`Alert created: Ward ${wardId} | ${severity} | ${outbreakCategory}`);
        res.status(201).json(alert);
    } catch (err) {
        next(err);
    }
};

exports.list = async (req, res, next) => {
    try {
        const { wardId, severity, status, limit = 50 } = req.query;
        const filter = {};
        if (wardId) filter.wardId = wardId;
        if (severity) filter.severity = severity;
        if (status) filter.status = status;

        const alerts = await Alert.find(filter)
            .sort({ createdAt: -1 })
            .limit(parseInt(limit))
            .populate('wardId', 'name city');
        res.json(alerts);
    } catch (err) {
        next(err);
    }
};

exports.byWard = async (req, res, next) => {
    try {
        const { wardId } = req.params;
        const alerts = await Alert.find({ wardId })
            .sort({ createdAt: -1 })
            .limit(20);
        res.json(alerts);
    } catch (err) {
        next(err);
    }
};

exports.updateStatus = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const update = { status };
        if (status === 'SENT') update.sentAt = new Date();
        const alert = await Alert.findByIdAndUpdate(id, update, { new: true });
        if (!alert) return res.status(404).json({ error: 'Alert not found' });
        res.json(alert);
    } catch (err) {
        next(err);
    }
};

exports.myWard = async (req, res, next) => {
    try {
        const wardId = req.user?.wardId;
        if (!wardId) return res.status(400).json({ error: 'No ward assigned to your account' });

        const alerts = await Alert.find({ wardId })
            .sort({ createdAt: -1 })
            .limit(30);
        res.json(alerts);
    } catch (err) {
        next(err);
    }
};
