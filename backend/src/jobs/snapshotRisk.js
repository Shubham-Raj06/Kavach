/**
 * snapshotRisk.js — Daily cron job.
 * Runs at midnight every day and saves the latest risk score for each ward
 * into WardRiskHistory (for sparklines, volatility, outbreak frequency).
 *
 * Uses a simple setInterval-based pseudo-cron (no external dep).
 * In production, replace with BullMQ repeatable job or node-cron.
 */

const WardRiskHistory = require('../models/WardRiskHistory');
const { RiskPrediction } = require('../models');
const logger = require('../utils/logger');

const MS_PER_DAY = 24 * 60 * 60 * 1000;

async function snapshotAllWards() {
    try {
        logger.info('[snapshotRisk] Running daily ward risk snapshot...');
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Get the most recent prediction per ward (within last 48h)
        const since = new Date(Date.now() - 48 * 60 * 60 * 1000);
        const predictions = await RiskPrediction.find({ createdAt: { $gte: since } })
            .sort({ createdAt: -1 })
            .lean();

        // Deduplicate — one per wardId (latest only)
        const byWard = new Map();
        for (const p of predictions) {
            const wid = p.wardId?.toString();
            if (wid && !byWard.has(wid)) byWard.set(wid, p);
        }

        let saved = 0;
        for (const [wardId, pred] of byWard) {
            try {
                await WardRiskHistory.updateOne(
                    { wardId, date: today },
                    {
                        $setOnInsert: {
                            riskScore: pred.riskScore,
                            category: pred.outbreakCategory,
                            isAnomaly: pred.isAnomaly,
                        },
                    },
                    { upsert: true }
                );
                saved++;
            } catch (e) {
                if (e.code !== 11000) logger.warn(`[snapshotRisk] Skip ward ${wardId}: ${e.message}`);
            }
        }

        logger.info(`[snapshotRisk] Saved ${saved} ward snapshots for ${today.toDateString()}`);
    } catch (err) {
        logger.error('[snapshotRisk] Error:', err.message);
    }
}

// Run once at startup (catches up if server was down at midnight)
snapshotAllWards();

// Schedule daily at midnight
const now = new Date();
const msToMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 1, 0) - now;
setTimeout(() => {
    snapshotAllWards();
    setInterval(snapshotAllWards, MS_PER_DAY);
}, msToMidnight);

logger.info(`[snapshotRisk] Next snapshot in ${Math.round(msToMidnight / 3600000)}h`);
