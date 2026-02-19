const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { User, RefreshToken, AuditLog } = require('../models');
const logger = require('../utils/logger');

// ─── Constants ────────────────────────────────────────────────────────────────
const ADMIN_ONLY_ROLES = ['GOV', 'HOSPITAL', 'SUPER_ADMIN'];
const COOKIE_OPTS = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const signAccessToken = (user) =>
    jwt.sign(
        { id: user._id, email: user.email, role: user.role, wardId: user.wardId, hospitalId: user.hospitalId, district: user.district },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '15m' }
    );

const generateRefreshToken = async () => {
    const raw = crypto.randomBytes(64).toString('hex');
    const hash = await bcrypt.hash(raw, 10);
    return { raw, hash };
};

const writeAudit = (userId, action, resource = null, metadata = null, ipAddress = null) => {
    AuditLog.create({ userId, action, resource, metadata: metadata ? JSON.stringify(metadata) : null, ipAddress })
        .catch(err => logger.error(`Audit write failed: ${err.message}`));
};

const storeRefreshToken = async (userId, hash) => {
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    return RefreshToken.create({ userId, tokenHash: hash, expiresAt });
};

const safeUser = (u) => ({
    id: u._id,
    email: u.email,
    role: u.role,
    name: u.name,
    wardId: u.wardId,
    hospitalId: u.hospitalId,
    district: u.district,
    isActive: u.isActive,
    createdAt: u.createdAt,
});

// ─── Controllers ──────────────────────────────────────────────────────────────

exports.register = async (req, res, next) => {
    try {
        console.log('📝 Register Payload:', req.body); // DEBUG
        const { email, password, role = 'CITIZEN', name, wardId } = req.body;

        if (ADMIN_ONLY_ROLES.includes(role)) {
            return res.status(403).json({ error: `Role '${role}' can only be created by a SUPER_ADMIN.` });
        }

        if (!name || !email || !password) {
            return res.status(400).json({ error: 'Name, email, and password are required.' });
        }

        const existing = await User.findOne({ email: email.toLowerCase() });
        if (existing) return res.status(409).json({ error: 'Email already registered.' });

        // Map wardId -> ward (Number 1-272). Required by schema.
        const wardNum = parseInt(wardId || req.body.ward, 10);
        if (isNaN(wardNum) || wardNum < 1 || wardNum > 272) {
            return res.status(400).json({ error: 'Ward must be a number between 1 and 272.' });
        }

        // Pass raw password - schema pre-save hook hashes it
        const user = await User.create({
            email: email.toLowerCase(),
            password,
            role: (role || 'citizen').toLowerCase(),
            name: name.trim(),
            ward: wardNum
        });

        const { raw, hash } = await generateRefreshToken();
        await storeRefreshToken(user._id, hash);
        const accessToken = signAccessToken(user);

        writeAudit(user._id, 'REGISTER', `User:${user._id}`, { role }, req.ip);
        logger.info(`New user registered: ${email} [${role}]`);

        res.cookie('refreshToken', raw, COOKIE_OPTS);
        res.status(201).json({ token: accessToken, user: safeUser(user) });
    } catch (err) {
        next(err);
    }
};

exports.login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required.' });
        }

        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) return res.status(401).json({ error: 'Invalid credentials.' });

        // Use schema method which compares against user.password
        const valid = await user.comparePassword(password);
        if (!valid) return res.status(401).json({ error: 'Invalid credentials.' });

        if (!user.isActive) {
            return res.status(403).json({ error: 'Account suspended. Contact an administrator.' });
        }

        // Revoke existing refresh tokens
        await RefreshToken.updateMany({ userId: user._id, isRevoked: false }, { isRevoked: true });

        const { raw, hash } = await generateRefreshToken();
        await storeRefreshToken(user._id, hash);
        const accessToken = signAccessToken(user);

        writeAudit(user._id, 'LOGIN', `User:${user._id}`, null, req.ip);
        logger.info(`User logged in: ${email} [${user.role}]`);

        res.cookie('refreshToken', raw, COOKIE_OPTS);
        res.json({ token: accessToken, user: safeUser(user) });
    } catch (err) {
        next(err);
    }
};

exports.refresh = async (req, res, next) => {
    try {
        const rawToken = req.cookies?.refreshToken;
        if (!rawToken) return res.status(401).json({ error: 'No refresh token provided.' });

        const candidates = await RefreshToken.find({
            isRevoked: false,
            expiresAt: { $gt: new Date() },
        }).populate('userId').sort({ createdAt: -1 }).limit(100);

        let matched = null;
        for (const candidate of candidates) {
            const ok = await bcrypt.compare(rawToken, candidate.tokenHash);
            if (ok) { matched = candidate; break; }
        }

        if (!matched) return res.status(401).json({ error: 'Invalid or expired refresh token.' });

        const user = await User.findById(matched.userId);
        if (!user || !user.isActive) return res.status(403).json({ error: 'Account suspended.' });

        await RefreshToken.findByIdAndUpdate(matched._id, { isRevoked: true });

        const { raw, hash } = await generateRefreshToken();
        await storeRefreshToken(user._id, hash);
        const accessToken = signAccessToken(user);

        writeAudit(user._id, 'TOKEN_REFRESH', null, null, req.ip);

        res.cookie('refreshToken', raw, COOKIE_OPTS);
        res.json({ token: accessToken, user: safeUser(user) });
    } catch (err) {
        next(err);
    }
};

exports.logout = async (req, res, next) => {
    try {
        if (req.user) {
            await RefreshToken.updateMany({ userId: req.user.id, isRevoked: false }, { isRevoked: true });
            writeAudit(req.user.id, 'LOGOUT', null, null, req.ip);
        }
        res.clearCookie('refreshToken', { httpOnly: true, sameSite: 'strict' });
        res.json({ message: 'Logged out successfully.' });
    } catch (err) {
        next(err);
    }
};

exports.me = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id).select('-passwordHash');
        if (!user) return res.status(404).json({ error: 'User not found.' });
        res.json(safeUser(user));
    } catch (err) {
        next(err);
    }
};

exports.updateDeviceToken = async (req, res, next) => {
    try {
        const { fcmToken } = req.body;
        if (!fcmToken) return res.status(400).json({ error: 'fcmToken is required.' });
        await User.findByIdAndUpdate(req.user.id, { fcmToken });
        res.json({ success: true });
    } catch (err) {
        next(err);
    }
};
