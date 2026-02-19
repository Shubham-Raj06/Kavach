/**
 * src/controllers/adminController.js
 * SUPER_ADMIN control panel — users, hospitals, wards, audit logs, stats.
 * Uses Mongoose instead of Prisma.
 */
const bcrypt = require('bcryptjs');
const { User, Hospital, Ward, AuditLog } = require('../models');
const logger = require('../utils/logger');
const axios = require('axios');

// ─── Stats ────────────────────────────────────────────────────────────────────
exports.getStats = async (req, res, next) => {
    try {
        const [total, active, suspended, hospitals, wards, eventsToday] = await Promise.all([
            User.countDocuments(),
            User.countDocuments({ isActive: true }),
            User.countDocuments({ isActive: false }),
            Hospital.countDocuments(),
            Ward.countDocuments(),
            AuditLog.countDocuments({ timestamp: { $gte: new Date(Date.now() - 86400000) } }),
        ]);

        const byRoleAgg = await User.aggregate([{ $group: { _id: '$role', count: { $sum: 1 } } }]);
        const byRole = Object.fromEntries(byRoleAgg.map(r => [r._id, r.count]));

        let mlStatus = 'UNKNOWN';
        try {
            await axios.get(`${process.env.ML_SERVICE_URL || 'http://localhost:8000'}/health`, { timeout: 3000 });
            mlStatus = 'HEALTHY';
        } catch { mlStatus = 'OFFLINE'; }

        res.json({
            users: { total, active, suspended, byRole },
            hospitals: { total: hospitals },
            wards: { total: wards },
            audit: { eventsToday },
            services: { database: 'HEALTHY', mlService: mlStatus, alertEngine: 'HEALTHY' },
        });
    } catch (err) { next(err); }
};

// ─── Users ────────────────────────────────────────────────────────────────────
exports.listUsers = async (req, res, next) => {
    try {
        const { page = 1, limit = 15, role, search } = req.query;
        const filter = {};
        if (role) filter.role = role;
        if (search) filter.$or = [{ email: { $regex: search, $options: 'i' } }, { name: { $regex: search, $options: 'i' } }];

        const [users, total] = await Promise.all([
            User.find(filter).select('-passwordHash').skip((page - 1) * limit).limit(+limit).sort({ createdAt: -1 }),
            User.countDocuments(filter),
        ]);

        res.json({ users, total, page: +page, pages: Math.ceil(total / limit) });
    } catch (err) { next(err); }
};

exports.createUser = async (req, res, next) => {
    try {
        const { email, password, role, name, wardId, hospitalId, district } = req.body;
        const existing = await User.findOne({ email: email.toLowerCase() });
        if (existing) return res.status(409).json({ error: 'Email already registered.' });

        const passwordHash = await bcrypt.hash(password, 12);
        const user = await User.create({ email: email.toLowerCase(), passwordHash, role, name, wardId, hospitalId, district });
        logger.info(`Admin ${req.user.email} created user ${email} [${role}]`);
        res.status(201).json({ user: { id: user._id, email: user.email, role: user.role, name: user.name, isActive: user.isActive } });
    } catch (err) { next(err); }
};

exports.suspendUser = async (req, res, next) => {
    try {
        await User.findByIdAndUpdate(req.params.id, { isActive: false });
        res.json({ success: true });
    } catch (err) { next(err); }
};

exports.activateUser = async (req, res, next) => {
    try {
        await User.findByIdAndUpdate(req.params.id, { isActive: true });
        res.json({ success: true });
    } catch (err) { next(err); }
};

exports.resetPassword = async (req, res, next) => {
    try {
        const { password } = req.body;
        if (!password || password.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters.' });
        const passwordHash = await bcrypt.hash(password, 12);
        await User.findByIdAndUpdate(req.params.id, { passwordHash });
        res.json({ success: true });
    } catch (err) { next(err); }
};

exports.changeRole = async (req, res, next) => {
    try {
        const { role } = req.body;
        if (!['GOV', 'HOSPITAL', 'CITIZEN', 'SUPER_ADMIN'].includes(role)) return res.status(400).json({ error: 'Invalid role.' });
        await User.findByIdAndUpdate(req.params.id, { role });
        res.json({ success: true });
    } catch (err) { next(err); }
};

exports.getUser = async (req, res, next) => {
    try {
        const user = await User.findById(req.params.id).select('-passwordHash');
        if (!user) return res.status(404).json({ error: 'User not found.' });
        res.json(user);
    } catch (err) { next(err); }
};

// ─── Hospitals ────────────────────────────────────────────────────────────────
exports.listHospitals = async (req, res, next) => {
    try {
        const { page = 1, limit = 15 } = req.query;
        const [hospitals, total] = await Promise.all([
            Hospital.find().populate('wardId', 'name').skip((page - 1) * limit).limit(+limit),
            Hospital.countDocuments(),
        ]);
        // Normalize wardId → ward for frontend
        const mapped = hospitals.map(h => ({ ...h.toObject(), id: h._id, ward: h.wardId }));
        res.json({ hospitals: mapped, total, page: +page, pages: Math.ceil(total / limit) });
    } catch (err) { next(err); }
};

exports.createHospital = async (req, res, next) => {
    try {
        const hospital = await Hospital.create(req.body);
        res.status(201).json({ hospital });
    } catch (err) { next(err); }
};

exports.updateHospital = async (req, res, next) => {
    try {
        const hospital = await Hospital.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!hospital) return res.status(404).json({ error: 'Hospital not found.' });
        res.json({ hospital });
    } catch (err) { next(err); }
};

// ─── Wards ────────────────────────────────────────────────────────────────────
exports.listWards = async (req, res, next) => {
    try {
        const { page = 1, limit = 15 } = req.query;
        const [wards, total] = await Promise.all([
            Ward.find().skip((page - 1) * limit).limit(+limit),
            Ward.countDocuments(),
        ]);
        res.json({ wards, total, page: +page, pages: Math.ceil(total / limit) });
    } catch (err) { next(err); }
};

exports.createWard = async (req, res, next) => {
    try {
        const ward = await Ward.create(req.body);
        res.status(201).json({ ward });
    } catch (err) { next(err); }
};

exports.updateWard = async (req, res, next) => {
    try {
        const ward = await Ward.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!ward) return res.status(404).json({ error: 'Ward not found.' });
        res.json({ ward });
    } catch (err) { next(err); }
};

// ─── Audit Logs ───────────────────────────────────────────────────────────────
exports.getAuditLogs = async (req, res, next) => {
    try {
        const { page = 1, limit = 20, action, role } = req.query;
        const filter = {};
        if (action) filter.action = { $regex: action, $options: 'i' };

        let userIds;
        if (role) {
            const users = await User.find({ role }).select('_id');
            userIds = users.map(u => u._id);
            filter.userId = { $in: userIds };
        }

        const [logs, total] = await Promise.all([
            AuditLog.find(filter).populate('userId', 'email role').sort({ timestamp: -1 }).skip((page - 1) * limit).limit(+limit),
            AuditLog.countDocuments(filter),
        ]);

        const mapped = logs.map(l => ({ ...l.toObject(), id: l._id, user: l.userId }));
        res.json({ logs: mapped, total, page: +page, pages: Math.ceil(total / limit) });
    } catch (err) { next(err); }
};
