const RiskScore = require('../models/RiskScore');
const Alert = require('../models/Alert');
const SymptomReport = require('../models/SymptomReport');
const User = require('../models/User');
const { getIO } = require('../websocket/socket');
const pushService = require('../services/pushService');

// GET /api/govt/dashboard — all ward risk summary
const getDashboard = async (req, res, next) => {
    try {
        const [wardRisks, activeAlerts, totalUsers, recentReports] = await Promise.all([
            RiskScore.find({}).sort({ score: -1 }),
            Alert.countDocuments({ isActive: true }),
            User.countDocuments({ role: 'citizen' }),
            SymptomReport.countDocuments({ createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } }),
        ]);

        const summary = {
            totalWards: wardRisks.length,
            criticalWards: wardRisks.filter(w => w.level === 'CRITICAL').length,
            highWards: wardRisks.filter(w => w.level === 'HIGH').length,
            activeAlerts,
            totalCitizens: totalUsers,
            reportsLast24h: recentReports,
        };

        res.json({ summary, wardRisks });
    } catch (err) { next(err); }
};

// POST /api/govt/broadcast — broadcast alert to all wards
const broadcastAlert = async (req, res, next) => {
    try {
        const { message, severity } = req.body;
        const alert = await Alert.create({
            ward: null,
            message,
            severity: severity || 'WARNING',
            source: 'govt',
            createdBy: req.user._id,
        });

        const io = getIO();
        if (io) io.emit('alert:new', alert);

        await pushService.sendBroadcastPush(`📢 Govt Alert`, message, {});
        res.status(201).json({ alert });
    } catch (err) { next(err); }
};

module.exports = { getDashboard, broadcastAlert };
