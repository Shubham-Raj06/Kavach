/**
 * src/utils/db.js
 * Mongoose connection helper — replaces Prisma for MongoDB.
 */
const mongoose = require('mongoose');
const logger = require('./logger');

let connected = false;

async function connectDB() {
    if (connected) return;
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error('DATABASE_URL not set');

    try {
        await mongoose.connect(url, {
            serverSelectionTimeoutMS: 8000,
            connectTimeoutMS: 8000,
            socketTimeoutMS: 45000,
            // Try direct connection first to skip SRV lookup when SRV is blocked
            directConnection: url.includes('directConnection=true'),
        });
        connected = true;
        logger.info('✅ MongoDB connected via Mongoose');
    } catch (err) {
        logger.error(`MongoDB connection failed: ${err.message}`);
        // Don't crash — let individual requests fail gracefully
    }
}

mongoose.connection.on('disconnected', () => {
    connected = false;
    logger.warn('MongoDB disconnected — will reconnect on next request');
});

mongoose.connection.on('reconnected', () => {
    connected = true;
    logger.info('MongoDB reconnected');
});

module.exports = { connectDB, mongoose };
