const { Ward } = require('../models');

exports.create = async (req, res, next) => {
    try {
        const ward = await Ward.create(req.body);
        res.status(201).json(ward);
    } catch (err) {
        next(err);
    }
};

exports.list = async (req, res, next) => {
    try {
        const wards = await Ward.find().sort({ name: 1 });
        res.json(wards);
    } catch (err) {
        next(err);
    }
};

exports.getById = async (req, res, next) => {
    try {
        const ward = await Ward.findById(req.params.id);
        if (!ward) return res.status(404).json({ error: 'Ward not found' });
        res.json(ward);
    } catch (err) {
        next(err);
    }
};
