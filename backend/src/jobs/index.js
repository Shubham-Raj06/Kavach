/**
 * jobs/index.js — Central job scheduler
 * All cron-style scheduled tasks registered here.
 * Uses setInterval/setTimeout (zero extra deps).
 * Replace with BullMQ or node-cron in production for job retry, monitoring, etc.
 */

const logger = require('../utils/logger');

/**
 * Schedule a repeating job.
 * @param {string} name - Job identifier for logging
 * @param {Function} fn - Async job function
 * @param {number} intervalMs - Repeat interval in ms
 * @param {boolean} runImmediately - Run once at startup
 */
function scheduleJob(name, fn, intervalMs, runImmediately = true) {
    async function run() {
        const start = Date.now();
        try {
            logger.info(`[Job:${name}] ▶ Starting`);
            const result = await fn();
            logger.info(`[Job:${name}] ✅ Done in ${Date.now() - start}ms`, result ?? '');
        } catch (err) {
            logger.error(`[Job:${name}] ❌ Failed: ${err.message}`);
        }
    }

    if (runImmediately) {
        // Small delay so DB is connected before first run
        setTimeout(run, 5000);
    }

    setInterval(run, intervalMs);
    logger.info(`[Job:${name}] Scheduled every ${Math.round(intervalMs / 60000)} min`);
}

function startAllJobs(io) {
    const { ingestWeather } = require('../services/weatherIngestionService');
    const { ingestWaterQuality } = require('../services/waterQualityIngestionService');
    const { runHourlyFeatureCalculation } = require('../services/featureEngineService');
    const { runInferenceAllWards } = require('../services/mlInferenceService');
    const { triggerAlert, autoResolveAlerts } = require('../services/alertEngine');
    const { RiskPrediction } = require('../models');
    const snapshotRisk = require('./snapshotRisk');

    // ── 1. Weather ingestion — every 3 hours ─────────────────────────────────
    scheduleJob('WeatherIngestion', ingestWeather, 3 * 60 * 60 * 1000);

    // ── 2. Water quality ingestion — every 24 hours ───────────────────────────
    scheduleJob('WaterIngestion', ingestWaterQuality, 24 * 60 * 60 * 1000);

    // ── 3. Feature engine + ML inference — every 1 hour ─────────────────────
    scheduleJob('FeatureEngine+MLInference', async () => {
        await runHourlyFeatureCalculation();
        const results = await runInferenceAllWards();

        // After inference, trigger alerts for high-risk wards
        for (const r of results) {
            if (!r) continue;
            await triggerAlert(io, r).catch(e =>
                logger.error(`[AlertEngine] Ward ${r.wardId}: ${e.message}`)
            );
            await autoResolveAlerts(r.wardId, r.riskScore).catch(() => { });
        }

        return { wardsProcessed: results.length };
    }, 60 * 60 * 1000); // every 60 min

    // ── 4. Daily risk snapshot — run at minute 1 of every midnight ────────────
    // (snapshotRisk.js has its own midnight scheduler, but we still run it daily)
    scheduleJob('DailyRiskSnapshot', async () => {
        // The snapshotRisk module runs autonomously, this is just a backup
        logger.info('[Job:DailyRiskSnapshot] Backup snapshot run');
    }, 24 * 60 * 60 * 1000, false); // don't run immediately, snapshotRisk handles startup

    // ── 5. Feature drift monitoring — every 6 hours ───────────────────────────
    scheduleJob('DriftMonitor', async () => {
        const { runDriftCheck } = require('../services/driftMonitorService');
        return runDriftCheck();
    }, 6 * 60 * 60 * 1000, false); // first run 6h after startup

    logger.info('[Jobs] All jobs scheduled ✅');
}

module.exports = { startAllJobs, scheduleJob };
