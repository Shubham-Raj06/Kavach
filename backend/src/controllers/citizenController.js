const { CitizenReport } = require('../models');
const WardMaster = require('../models/WardMaster');
const { rateLimitByUser } = require('../middleware/rateLimitByUser');
const logger = require('../utils/logger');

/**
 * Resolve wardId from lat/lng via spatial join.
 * Falls back to submitted wardId string if spatial lookup fails.
 */
async function resolveWardId(latitude, longitude, submittedWardId) {
    try {
        if (latitude && longitude) {
            const ward = await WardMaster.findOne({
                geoPolygon: {
                    $geoIntersects: {
                        $geometry: {
                            type: 'Point',
                            coordinates: [parseFloat(longitude), parseFloat(latitude)],
                        },
                    },
                },
            }).select('wardNumber').lean();

            if (ward) return ward.wardNumber;

            // Fallback: nearest centroid
            const nearest = await WardMaster.findOne({
                centroid: {
                    $near: {
                        $geometry: { type: 'Point', coordinates: [parseFloat(longitude), parseFloat(latitude)] },
                        $maxDistance: 50000,
                    },
                },
            }).select('wardNumber').lean();

            if (nearest) return nearest.wardNumber;
        }
    } catch (e) {
        logger.warn(`[citizenController] Spatial lookup failed: ${e.message}`);
    }
    // Final fallback: use submitted string
    return submittedWardId ?? 'UNKNOWN';
}

// ─── Create Citizen Report (with spatial join) ───────────────────────────────
exports.create = async (req, res, next) => {
    try {
        const { wardId: submittedWardId, latitude, longitude, syndromeType, description, severity } = req.body;

        // Auto-resolve wardId from coordinates (spatial join)
        const resolvedWardId = await resolveWardId(latitude, longitude, submittedWardId);

        const report = await CitizenReport.create({
            userId: req.user.id,
            wardId: resolvedWardId,
            latitude, longitude,
            syndromeType, description, severity,
        });

        logger.info(`Citizen report: Ward ${resolvedWardId} | ${syndromeType} | severity ${severity}`);
        res.status(201).json({ ...report.toObject(), resolvedWardId });
    } catch (err) {
        next(err);
    }
};

// ─── List Reports ────────────────────────────────────────────────────────────
exports.list = async (req, res, next) => {
    try {
        const { wardId, syndromeType, from, limit = 200 } = req.query;
        const filter = {};
        if (wardId) filter.wardId = wardId;
        if (syndromeType) filter.syndromeType = syndromeType;
        if (from) filter.createdAt = { $gte: new Date(from) };

        const reports = await CitizenReport.find(filter)
            .sort({ createdAt: -1 })
            .limit(parseInt(limit))
            .select('wardId latitude longitude syndromeType severity createdAt isVerified');
        res.json(reports);
    } catch (err) {
        next(err);
    }
};

// ─── Cluster By Ward ─────────────────────────────────────────────────────────
exports.clusterByWard = async (req, res, next) => {
    try {
        const { wardId } = req.params;
        const since = new Date(Date.now() - 24 * 60 * 60 * 1000);

        const reports = await CitizenReport.find({ wardId, createdAt: { $gte: since } })
            .select('latitude longitude syndromeType severity');

        const byType = reports.reduce((acc, r) => {
            acc[r.syndromeType] = (acc[r.syndromeType] || 0) + 1;
            return acc;
        }, {});

        res.json({
            wardId,
            totalReports: reports.length,
            since: since.toISOString(),
            byType,
            points: reports,
        });
    } catch (err) {
        next(err);
    }
};
