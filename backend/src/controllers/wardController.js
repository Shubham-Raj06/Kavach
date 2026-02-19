const WardMaster = require('../models/WardMaster');
const WardHospitalDistance = require('../models/WardHospitalDistance');
const WardRiskHistory = require('../models/WardRiskHistory');
const logger = require('../utils/logger');

// ── GET /api/wards — list all wards ─────────────────────────────────────────
exports.list = async (req, res, next) => {
    try {
        const wards = await WardMaster.find({})
            .select('wardNumber name district population centroid neighboringWards')
            .lean();
        res.json(wards);
    } catch (err) { next(err); }
};

// ── GET /api/wards/:wardId — single ward ────────────────────────────────────
exports.getOne = async (req, res, next) => {
    try {
        const ward = await WardMaster.findOne({ wardNumber: req.params.wardId }).lean();
        if (!ward) return res.status(404).json({ error: 'Ward not found.' });
        res.json(ward);
    } catch (err) { next(err); }
};

// ── POST /api/wards/locate — spatial join: lat/lng → wardNumber ──────────────
exports.locate = async (req, res, next) => {
    try {
        const { latitude, longitude } = req.body;
        if (!latitude || !longitude) {
            return res.status(400).json({ error: 'latitude and longitude are required.' });
        }

        // Point-in-polygon query using 2dsphere index
        const ward = await WardMaster.findOne({
            geoPolygon: {
                $geoIntersects: {
                    $geometry: {
                        type: 'Point',
                        coordinates: [parseFloat(longitude), parseFloat(latitude)],
                    },
                },
            },
        }).select('wardNumber name district centroid').lean();

        if (!ward) {
            // Fallback: find nearest ward by centroid distance
            const nearest = await WardMaster.findOne({
                centroid: {
                    $near: {
                        $geometry: { type: 'Point', coordinates: [longitude, latitude] },
                        $maxDistance: 50000, // 50km
                    },
                },
            }).select('wardNumber name district centroid').lean();
            if (!nearest) return res.status(404).json({ error: 'No ward found near this location.' });
            return res.json({ ...nearest, resolvedBy: 'nearest_centroid' });
        }

        res.json({ ...ward, resolvedBy: 'polygon' });
    } catch (err) { next(err); }
};

// ── GET /api/wards/:wardId/hospitals — nearest hospitals ────────────────────
exports.getHospitals = async (req, res, next) => {
    try {
        const hospitals = await WardHospitalDistance.find({ wardId: req.params.wardId })
            .sort({ distanceKm: 1 })
            .limit(3)
            .lean();
        res.json(hospitals);
    } catch (err) { next(err); }
};

// ── GET /api/wards/:wardId/history — 30-day risk history ───────────────────
exports.getRiskHistory = async (req, res, next) => {
    try {
        const { wardId } = req.params;
        const days = Math.min(parseInt(req.query.days) || 30, 90);
        const since = new Date(Date.now() - days * 86400000);

        const history = await WardRiskHistory.find({
            wardId,
            date: { $gte: since },
        })
            .sort({ date: 1 })
            .lean();

        // Compute volatility and frequency
        const scores = history.map(h => h.riskScore);
        const mean = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
        const variance = scores.length
            ? scores.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / scores.length
            : 0;
        const volatility = Math.round(Math.sqrt(variance) * 10) / 10;
        const outbreakCount = history.filter(h => h.riskScore >= 70).length;

        res.json({ wardId, history, volatility, outbreakCount, days });
    } catch (err) { next(err); }
};

// ── POST /api/wards/seed — seed demo ward data ───────────────────────────────
exports.seed = async (req, res, next) => {
    try {
        if (req.user.role !== 'SUPER_ADMIN') {
            return res.status(403).json({ error: 'Forbidden.' });
        }

        // Seed 20 representative Delhi wards with centroids and neighboring wards
        const DEMO_WARDS = [
            { wardNumber: '1', name: 'Patel Nagar', centroid: [77.1695, 28.6477], neighboringWards: ['2', '12'] },
            { wardNumber: '2', name: 'Karol Bagh', centroid: [77.1905, 28.6519], neighboringWards: ['1', '3', '11'] },
            { wardNumber: '3', name: 'Rajendra Nagar', centroid: [77.1745, 28.6457], neighboringWards: ['2', '4'] },
            { wardNumber: '4', name: 'Moti Nagar', centroid: [77.1535, 28.6647], neighboringWards: ['3', '5'] },
            { wardNumber: '5', name: 'Kirti Nagar', centroid: [77.1499, 28.6588], neighboringWards: ['4', '6'] },
            { wardNumber: '6', name: 'Mayapuri', centroid: [77.1093, 28.6316], neighboringWards: ['5', '7'] },
            { wardNumber: '7', name: 'Subhash Nagar', centroid: [77.1163, 28.6400], neighboringWards: ['6', '8'] },
            { wardNumber: '8', name: 'Tilak Nagar', centroid: [77.0965, 28.6390], neighboringWards: ['7', '9'] },
            { wardNumber: '9', name: 'Janakpuri', centroid: [77.0780, 28.6219], neighboringWards: ['8', '10'] },
            { wardNumber: '10', name: 'Uttam Nagar', centroid: [77.0514, 28.6213], neighboringWards: ['9', '11'] },
            { wardNumber: '11', name: 'Lajpat Nagar', centroid: [77.2434, 28.5698], neighboringWards: ['12', '2'] },
            { wardNumber: '12', name: 'South Extension', centroid: [77.2157, 28.5741], neighboringWards: ['11', '13', '1'] },
            { wardNumber: '13', name: 'Saket', centroid: [77.2073, 28.5275], neighboringWards: ['12', '14'] },
            { wardNumber: '14', name: 'Malviya Nagar', centroid: [77.2022, 28.5301], neighboringWards: ['13', '15'] },
            { wardNumber: '15', name: 'Hauz Khas', centroid: [77.2090, 28.5522], neighboringWards: ['14', '16'] },
            { wardNumber: '16', name: 'Greater Kailash', centroid: [77.2384, 28.5474], neighboringWards: ['15', '17'] },
            { wardNumber: '17', name: 'Okhla', centroid: [77.2745, 28.5399], neighboringWards: ['16', '18'] },
            { wardNumber: '18', name: 'Badarpur', centroid: [77.3110, 28.4968], neighboringWards: ['17', '19'] },
            { wardNumber: '19', name: 'Paharganj', centroid: [77.2090, 28.6452], neighboringWards: ['20', '2'] },
            { wardNumber: '20', name: 'Chandni Chowk', centroid: [77.2310, 28.6556], neighboringWards: ['19', '1'] },
        ];

        let upserted = 0;
        for (const w of DEMO_WARDS) {
            const [lng, lat] = w.centroid;
            // Generate a simple bounding-box polygon (~1km square)
            const delta = 0.005;
            const polygon = [[[lng - delta, lat - delta], [lng + delta, lat - delta],
            [lng + delta, lat + delta], [lng - delta, lat + delta],
            [lng - delta, lat - delta]]];

            await WardMaster.updateOne(
                { wardNumber: w.wardNumber },
                {
                    $set: {
                        name: w.name,
                        population: 50000 + parseInt(w.wardNumber) * 1000,
                        centroid: { type: 'Point', coordinates: [lng, lat] },
                        geoPolygon: { type: 'Polygon', coordinates: polygon },
                        neighboringWards: w.neighboringWards,
                    },
                },
                { upsert: true }
            );
            upserted++;
        }

        res.json({ message: `Seeded ${upserted} Delhi wards.` });
    } catch (err) { next(err); }
};
