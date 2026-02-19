const cron = require('node-cron');
const SymptomReport = require('../models/SymptomReport');
const HospitalAdmission = require('../models/HospitalAdmission');
const RiskScore = require('../models/RiskScore');
const Alert = require('../models/Alert');
const { getIO } = require('../websocket/socket');
const pushService = require('./pushService');
const logger = require('../utils/logger');

const SYMPTOM_WEIGHT = parseFloat(process.env.SYMPTOM_WEIGHT) || 0.6;
const HOSPITAL_WEIGHT = parseFloat(process.env.HOSPITAL_WEIGHT) || 0.4;

const classifyLevel = (score) => {
    if (score > 75) return 'CRITICAL';
    if (score > 50) return 'HIGH';
    if (score > 25) return 'MEDIUM';
    return 'LOW';
};

const computeRisk = async () => {
    try {
        const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000);

        // Aggregate symptom reports per ward
        const symptomAgg = await SymptomReport.aggregate([
            { $match: { createdAt: { $gte: since24h } } },
            { $group: { _id: '$ward', count: { $sum: 1 }, avgSeverity: { $avg: '$severity' } } },
        ]);

        // Aggregate hospital admissions per ward
        const admissionAgg = await HospitalAdmission.aggregate([
            { $match: { date: { $gte: since24h } } },
            { $group: { _id: '$ward', totalAdmissions: { $sum: '$count' } } },
        ]);

        const admissionMap = {};
        admissionAgg.forEach(a => { admissionMap[a._id] = a.totalAdmissions; });

        const io = getIO();

        for (const item of symptomAgg) {
            const ward = item._id;
            const symptomCount = item.count;
            const admissions = admissionMap[ward] || 0;
            const severityMultiplier = (item.avgSeverity || 1) / 5;

            const rawScore = (SYMPTOM_WEIGHT * symptomCount * severityMultiplier * 20) +
                (HOSPITAL_WEIGHT * admissions * 5);
            const score = Math.min(Math.round(rawScore), 100);
            const level = classifyLevel(score);

            // Upsert RiskScore
            const previous = await RiskScore.findOne({ ward });
            const previousLevel = previous?.level || 'LOW';

            await RiskScore.findOneAndUpdate(
                { ward },
                {
                    score,
                    level,
                    symptomCount,
                    admissionCount: admissions,
                    updatedAt: new Date(),
                    $push: {
                        trend: {
                            $each: [{ score, timestamp: new Date() }],
                            $slice: -96, // keep last 96 points (48h at 30min intervals)
                        },
                    },
                },
                { upsert: true, new: true }
            );

            // Emit if level changed
            if (level !== previousLevel) {
                const payload = { ward, score, level, previousLevel };
                logger.info(`🔔 Ward ${ward} risk changed: ${previousLevel} → ${level}`);

                if (io) {
                    io.to(`ward_${ward}_citizen`).emit('risk:update', payload);
                    io.to(`ward_${ward}_hospital`).emit('risk:update', payload);
                    io.to('govt_room').emit('risk:update', payload);
                }

                // Create system alert for HIGH/CRITICAL
                if (level === 'HIGH' || level === 'CRITICAL') {
                    const alert = await Alert.create({
                        ward,
                        message: `⚠️ Ward ${ward} risk elevated to ${level}. ${symptomCount} reports in last 24h.`,
                        severity: level === 'CRITICAL' ? 'CRITICAL' : 'HIGH',
                        source: 'system',
                    });

                    if (io) {
                        io.to(`ward_${ward}_citizen`).emit('alert:new', alert);
                        io.to(`ward_${ward}_hospital`).emit('alert:new', alert);
                        io.to('govt_room').emit('alert:new', alert);
                    }

                    await pushService.sendWardPush(
                        ward,
                        `🚨 ${level} Alert — Ward ${ward}`,
                        alert.message
                    );
                }
            }
        }

        logger.info(`✅ Risk engine computed for ${symptomAgg.length} wards`);
    } catch (err) {
        logger.error(`❌ Risk engine error: ${err.message}`);
    }
};

const startRiskEngine = () => {
    // Run every 5 minutes
    cron.schedule('*/5 * * * *', computeRisk);
    logger.info('🧠 Risk engine started (every 5 min)');
    // Also run at startup
    setTimeout(computeRisk, 3000);
};

module.exports = { startRiskEngine, computeRisk };
