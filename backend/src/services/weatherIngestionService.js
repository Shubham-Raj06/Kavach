/**
 * weatherIngestionService.js
 * Fetches real weather data from OpenWeatherMap API every 3 hours.
 * Falls back to IMD-like demo data if API key not configured.
 *
 * ENV vars required:
 *   OPENWEATHER_API_KEY — from openweathermap.org (free tier: 60 calls/min)
 *   OPENWEATHER_BASE_URL — defaults to api.openweathermap.org/data/2.5
 */

const axios = require('axios');
const { WeatherData } = require('../models');
const WardMaster = require('../models/WardMaster');
const logger = require('../utils/logger');

const API_KEY = process.env.OPENWEATHER_API_KEY;
const BASE_URL = process.env.OPENWEATHER_BASE_URL || 'https://api.openweathermap.org/data/2.5';
const TIMEOUT_MS = 10000;

// ── Validate a weather record ────────────────────────────────────────────────
function validateWeather(data) {
    const errors = [];
    if (data.rainfall_mm < 0 || data.rainfall_mm > 500) errors.push('rainfall out of range');
    if (data.humidity_pct < 0 || data.humidity_pct > 100) errors.push('humidity out of range');
    if (data.temperature_c < -10 || data.temperature_c > 55) errors.push('temperature out of range');
    return { valid: errors.length === 0, errors };
}

// ── Fetch from OpenWeatherMap for a lat/lng ──────────────────────────────────
async function fetchWeatherForCoord(lat, lon, wardId) {
    if (!API_KEY) {
        // Demo fallback — realistic Delhi weather
        const hour = new Date().getHours();
        const month = new Date().getMonth(); // 0-indexed
        const isMonsooon = month >= 5 && month <= 8;
        return {
            wardId,
            latitude: lat,
            longitude: lon,
            rainfall_mm: isMonsooon ? (Math.random() * 20) : (Math.random() * 2),
            humidity_pct: isMonsooon ? 75 + Math.random() * 20 : 40 + Math.random() * 30,
            temperature_c: month >= 3 && month <= 8 ? 30 + Math.random() * 10 : 15 + Math.random() * 15,
            windSpeed_ms: 2 + Math.random() * 8,
            timestamp: new Date(),
            source: 'DEMO',
        };
    }

    const url = `${BASE_URL}/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`;
    const response = await axios.get(url, { timeout: TIMEOUT_MS });
    const d = response.data;

    return {
        wardId,
        latitude: lat,
        longitude: lon,
        rainfall_mm: (d.rain?.['1h'] || d.rain?.['3h'] || 0),
        humidity_pct: d.main.humidity,
        temperature_c: d.main.temp,
        windSpeed_ms: d.wind.speed,
        timestamp: new Date(d.dt * 1000),
        source: 'OPENWEATHER',
    };
}

// ── Rolling 24h + 72h aggregates for a ward ──────────────────────────────────
async function getWeatherAggregates(wardId) {
    const now = new Date();
    const h24ago = new Date(now - 24 * 3600 * 1000);
    const h72ago = new Date(now - 72 * 3600 * 1000);

    const [agg24, agg72] = await Promise.all([
        WeatherData.aggregate([
            { $match: { wardId, timestamp: { $gte: h24ago } } },
            { $group: { _id: null, rainfall: { $sum: '$rainfall_mm' }, humidity: { $avg: '$humidity_pct' }, temp: { $avg: '$temperature_c' } } },
        ]),
        WeatherData.aggregate([
            { $match: { wardId, timestamp: { $gte: h72ago } } },
            { $group: { _id: null, rainfall: { $sum: '$rainfall_mm' } } },
        ]),
    ]);

    return {
        rainfall_24h: agg24[0]?.rainfall ?? 0,
        rainfall_72h: agg72[0]?.rainfall ?? 0,
        humidity_pct: agg24[0]?.humidity ?? 65,
        temperature_c: agg24[0]?.temp ?? 28,
    };
}

// ── Main ingestion run ───────────────────────────────────────────────────────
async function ingestWeather() {
    logger.info('[WeatherIngestion] Starting run...');
    let successCount = 0, failCount = 0;

    try {
        // Get all wards with centroid coordinates
        const wards = await WardMaster.find({}, 'wardNumber centroid').lean();
        if (!wards.length) {
            logger.warn('[WeatherIngestion] No wards found — run /api/wards/seed first');
            return;
        }

        // Batch requests with concurrency limit
        const CONCURRENCY = 5;
        for (let i = 0; i < wards.length; i += CONCURRENCY) {
            const batch = wards.slice(i, i + CONCURRENCY);
            await Promise.all(batch.map(async (ward) => {
                try {
                    const [lng, lat] = ward.centroid?.coordinates ?? [77.209, 28.6139];
                    const weather = await fetchWeatherForCoord(lat, lng, ward.wardNumber);

                    const { valid, errors } = validateWeather(weather);
                    if (!valid) {
                        logger.warn(`[WeatherIngestion] Ward ${ward.wardNumber} validation failed: ${errors.join(', ')}`);
                        failCount++;
                        return;
                    }

                    await WeatherData.create(weather);
                    successCount++;
                } catch (e) {
                    logger.error(`[WeatherIngestion] Ward ${ward.wardNumber} failed: ${e.message}`);
                    failCount++;
                }
            }));
        }

        logger.info(`[WeatherIngestion] Done: ${successCount} success, ${failCount} failed`);
    } catch (err) {
        logger.error('[WeatherIngestion] Fatal error:', err.message);
        throw err; // re-throw so cron can alert
    }

    return { successCount, failCount };
}

module.exports = { ingestWeather, getWeatherAggregates };
