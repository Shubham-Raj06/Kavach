const Redis = require('ioredis');
const logger = require('../utils/logger');

let redisClient = null;

const createRedisClient = () => {
    if (!process.env.REDIS_URL) {
        logger.warn('⚠️  REDIS_URL not set — running without Redis (no Socket.io clustering)');
        return null;
    }
    try {
        const client = new Redis(process.env.REDIS_URL, {
            lazyConnect: true,
            maxRetriesPerRequest: 1,
        });
        client.on('connect', () => logger.info('✅ Redis connected'));
        client.on('error', (err) => logger.warn(`⚠️  Redis error: ${err.message}`));
        return client;
    } catch {
        logger.warn('⚠️  Redis unavailable — continuing without it');
        return null;
    }
};

const getRedisClient = () => {
    if (!redisClient) redisClient = createRedisClient();
    return redisClient;
};

module.exports = { getRedisClient };
