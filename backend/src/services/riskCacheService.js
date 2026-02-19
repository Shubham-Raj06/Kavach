/**
 * riskCacheService.js — Redis TTL cache for ward risk scores.
 * Prevents repeated DB reads for frequently requested risk data.
 *
 * TTL: 15 minutes (900 seconds)
 * Key pattern: risk:ward:{wardId}
 *
 * Falls open gracefully if Redis unavailable.
 */

const { Redis } = require('@upstash/redis');
const logger = require('../utils/logger');

const RISK_TTL = 900; // 15 minutes
const KEY_PREFIX = 'risk:ward:';

let redis;
try {
    redis = new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
} catch (e) {
    logger.warn('[RiskCache] Redis init failed — cache disabled');
}

/**
 * Get cached risk for a ward.
 * @returns {object|null} Cached risk prediction or null if miss/unavailable
 */
async function getCachedRisk(wardId) {
    if (!redis) return null;
    try {
        const data = await redis.get(`${KEY_PREFIX}${wardId}`);
        return data ? (typeof data === 'string' ? JSON.parse(data) : data) : null;
    } catch (e) {
        logger.debug(`[RiskCache] Read fail ward ${wardId}: ${e.message}`);
        return null;
    }
}

/**
 * Cache risk prediction for a ward.
 */
async function setCachedRisk(wardId, riskData, ttl = RISK_TTL) {
    if (!redis) return;
    try {
        await redis.set(`${KEY_PREFIX}${wardId}`, JSON.stringify(riskData), { ex: ttl });
    } catch (e) {
        logger.debug(`[RiskCache] Write fail ward ${wardId}: ${e.message}`);
    }
}

/**
 * Invalidate cache for a ward (call after data ingestion updates).
 */
async function invalidateRisk(wardId) {
    if (!redis) return;
    try {
        await redis.del(`${KEY_PREFIX}${wardId}`);
    } catch (e) { /* ignore */ }
}

/**
 * Get or compute (cache-aside pattern).
 * @param {string} wardId
 * @param {Function} computeFn — async function that returns the risk data
 */
async function getOrComputeRisk(wardId, computeFn) {
    const cached = await getCachedRisk(wardId);
    if (cached) {
        logger.debug(`[RiskCache] HIT ward:${wardId}`);
        return { ...cached, cached: true };
    }
    const fresh = await computeFn();
    await setCachedRisk(wardId, fresh);
    return { ...fresh, cached: false };
}

/**
 * Cache all wards' risk scores (batch warm-up after ML inference run).
 */
async function warmupRiskCache(results) {
    if (!redis || !results?.length) return;
    await Promise.allSettled(
        results.map(r => r && setCachedRisk(r.wardId, r))
    );
    logger.info(`[RiskCache] Warmed up ${results.length} ward risk scores`);
}

module.exports = { getCachedRisk, setCachedRisk, invalidateRisk, getOrComputeRisk, warmupRiskCache };
