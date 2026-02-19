/**
 * Redis-backed sliding window rate limiter middleware factory.
 * Usage: rateLimitByUser({ max: 5, windowSec: 3600, key: 'post' })
 *
 * Falls back gracefully if Redis is unavailable (allows request through).
 */

let redis;
try {
    const { Redis } = require('@upstash/redis');
    redis = new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
} catch {
    redis = null;
}

/**
 * @param {{ max: number, windowSec: number, key: string }} opts
 */
exports.rateLimitByUser = ({ max, windowSec, key }) =>
    async (req, res, next) => {
        if (!redis) return next(); // Redis not configured — skip

        try {
            const userId = req.user?.id ?? req.ip;
            const redisKey = `rl:${key}:${userId}`;

            const now = Date.now();
            const windowStart = now - windowSec * 1000;

            // Remove expired entries, add current timestamp, count window
            await redis.zremrangebyscore(redisKey, '-inf', windowStart);
            await redis.zadd(redisKey, { score: now, member: `${now}` });
            await redis.expire(redisKey, windowSec);

            const count = await redis.zcard(redisKey);

            if (count > max) {
                const retryAfter = Math.ceil(windowSec / 60);
                res.set('Retry-After', String(retryAfter * 60));
                return res.status(429).json({
                    error: `Rate limit exceeded. Max ${max} ${key}s per ${retryAfter} minute(s).`,
                    code: 'RATE_LIMIT_EXCEEDED',
                });
            }
        } catch (err) {
            // Never block a request due to rate limiter failure
            console.warn('[rateLimiter] Redis error — bypassing:', err.message);
        }

        next();
    };
