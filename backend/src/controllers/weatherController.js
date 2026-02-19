const { WeatherData } = require('../models');

exports.create = async (req, res, next) => {
    try {
        const { wardId, recordedAt, rainfall, temperature, humidity, windSpeed, uvIndex } = req.body;
        const record = await WeatherData.create({
            wardId, recordedAt: new Date(recordedAt),
            rainfall, temperature, humidity, windSpeed, uvIndex,
        });
        res.status(201).json(record);
    } catch (err) {
        next(err);
    }
};

exports.list = async (req, res, next) => {
    try {
        const { wardId, from, to, limit = 100 } = req.query;
        const filter = {};
        if (wardId) filter.wardId = wardId;
        if (from || to) {
            filter.recordedAt = {};
            if (from) filter.recordedAt.$gte = new Date(from);
            if (to) filter.recordedAt.$lte = new Date(to);
        }
        const records = await WeatherData.find(filter)
            .sort({ recordedAt: -1 })
            .limit(parseInt(limit));
        res.json(records);
    } catch (err) {
        next(err);
    }
};

exports.latestByWard = async (req, res, next) => {
    try {
        const { wardId } = req.params;
        const record = await WeatherData.findOne({ wardId }).sort({ recordedAt: -1 });
        if (!record) return res.status(404).json({ error: 'No weather data found for this ward' });
        res.json(record);
    } catch (err) {
        next(err);
    }
};
