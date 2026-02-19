/**
 * src/utils/prisma.js — Mongoose compatibility shim
 *
 * Provides a Prisma-like API surface so existing controllers don't need to be rewritten.
 * Maps prisma.modelName.findMany/findUnique/create/update/delete etc. → Mongoose queries.
 */

const {
    User, RefreshToken, AuditLog, Ward, Hospital,
    SyndromeMapping, HospitalAdmission, WaterQualityReport,
    WeatherData, CitizenReport, RiskPrediction, Alert,
} = require('../models');

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Convert Prisma `where` to Mongoose filter (handles gte/lte/gt/lt/in) */
function toFilter(where = {}) {
    if (!where || typeof where !== 'object') return {};
    const filter = {};
    for (const [key, val] of Object.entries(where)) {
        if (val === null || val === undefined) {
            filter[key] = val;
        } else if (typeof val === 'object' && !Array.isArray(val) && !(val instanceof Date)) {
            // Prisma range operators → Mongo operators
            const ops = {};
            if (val.gte !== undefined) ops.$gte = val.gte;
            if (val.lte !== undefined) ops.$lte = val.lte;
            if (val.gt !== undefined) ops.$gt = val.gt;
            if (val.lt !== undefined) ops.$lt = val.lt;
            if (val.in !== undefined) ops.$in = val.in;
            if (val.not !== undefined) ops.$ne = val.not;
            if (val.contains !== undefined) ops.$regex = val.contains;
            filter[key] = Object.keys(ops).length ? ops : val;
        } else {
            filter[key] = val;
        }
    }
    return filter;
}

/** Convert Prisma `orderBy` to Mongoose sort */
function toSort(orderBy) {
    if (!orderBy) return {};
    const entries = Array.isArray(orderBy) ? orderBy : [orderBy];
    const sort = {};
    for (const item of entries) {
        for (const [field, dir] of Object.entries(item)) {
            sort[field] = dir === 'desc' ? -1 : 1;
        }
    }
    return sort;
}

/** Normalise a Mongoose doc to look like a Prisma result (id instead of _id) */
function normalise(doc) {
    if (!doc) return null;
    const obj = doc.toObject ? doc.toObject() : { ...doc };
    obj.id = obj._id?.toString();
    return obj;
}

function normaliseMany(docs) {
    return docs.map(normalise);
}

/** Apply `select` — keep only specified fields */
function applySelect(obj, select) {
    if (!select || !obj) return obj;
    const out = { id: obj.id, _id: obj._id };
    for (const [key, val] of Object.entries(select)) {
        if (val) out[key] = obj[key];
    }
    return out;
}

// ─── Model wrapper factory ────────────────────────────────────────────────────

function wrap(Model) {
    return {
        // ── findUnique ────────────────────────────────────────────────────────
        async findUnique({ where, select, include } = {}) {
            const filter = toFilter(where);
            // id → _id
            if (filter.id) { filter._id = filter.id; delete filter.id; }
            let q = Model.findOne(filter);
            if (include) for (const [rel] of Object.entries(include)) q = q.populate(rel);
            const doc = await q;
            if (!doc) return null;
            const result = normalise(doc);
            return select ? applySelect(result, select) : result;
        },

        // ── findFirst ─────────────────────────────────────────────────────────
        async findFirst({ where, orderBy, select, include } = {}) {
            const filter = toFilter(where);
            if (filter.id) { filter._id = filter.id; delete filter.id; }
            let q = Model.findOne(filter).sort(toSort(orderBy));
            if (include) for (const [rel] of Object.entries(include)) q = q.populate(rel);
            const doc = await q;
            if (!doc) return null;
            const result = normalise(doc);
            return select ? applySelect(result, select) : result;
        },

        // ── findMany ──────────────────────────────────────────────────────────
        async findMany({ where, orderBy, take, skip, select, include } = {}) {
            const filter = toFilter(where);
            if (filter.id) { filter._id = filter.id; delete filter.id; }
            let q = Model.find(filter).sort(toSort(orderBy));
            if (skip) q = q.skip(skip);
            if (take) q = q.limit(take);
            if (include) for (const [rel] of Object.entries(include)) q = q.populate(rel);
            const docs = await q;
            const results = normaliseMany(docs);
            return select ? results.map(r => applySelect(r, select)) : results;
        },

        // ── count ─────────────────────────────────────────────────────────────
        async count({ where } = {}) {
            const filter = toFilter(where);
            if (filter.id) { filter._id = filter.id; delete filter.id; }
            return Model.countDocuments(filter);
        },

        // ── create ────────────────────────────────────────────────────────────
        async create({ data } = {}) {
            const doc = await Model.create(data);
            return normalise(doc);
        },

        // ── update ────────────────────────────────────────────────────────────
        async update({ where, data } = {}) {
            const filter = toFilter(where);
            if (filter.id) { filter._id = filter.id; delete filter.id; }
            const doc = await Model.findOneAndUpdate(filter, data, { new: true });
            return normalise(doc);
        },

        // ── updateMany ────────────────────────────────────────────────────────
        async updateMany({ where, data } = {}) {
            const filter = toFilter(where);
            if (filter.id) { filter._id = filter.id; delete filter.id; }
            return Model.updateMany(filter, data);
        },

        // ── delete ────────────────────────────────────────────────────────────
        async delete({ where } = {}) {
            const filter = toFilter(where);
            if (filter.id) { filter._id = filter.id; delete filter.id; }
            const doc = await Model.findOneAndDelete(filter);
            return normalise(doc);
        },

        // ── deleteMany ────────────────────────────────────────────────────────
        async deleteMany({ where } = {}) {
            const filter = toFilter(where);
            if (filter.id) { filter._id = filter.id; delete filter.id; }
            return Model.deleteMany(filter);
        },

        // ── upsert ────────────────────────────────────────────────────────────
        async upsert({ where, create: createData, update: updateData } = {}) {
            const filter = toFilter(where);
            if (filter.id) { filter._id = filter.id; delete filter.id; }
            const doc = await Model.findOneAndUpdate(filter, updateData, { upsert: true, new: true, setDefaultsOnInsert: true });
            return normalise(doc);
        },

        // ── groupBy (approximate — uses aggregation) ──────────────────────────
        async groupBy({ by = [], where = {}, _sum = {}, _count = {}, _avg = {}, orderBy, take } = {}) {
            const filter = toFilter(where);
            if (filter.id) { filter._id = filter.id; delete filter.id; }

            const groupId = {};
            for (const field of by) groupId[field] = `$${field}`;

            const accumulator = {};
            for (const field of Object.keys(_sum)) accumulator[`_sum_${field}`] = { $sum: `$${field}` };
            for (const field of Object.keys(_count)) accumulator[`_count_${field}`] = { $sum: 1 };
            for (const field of Object.keys(_avg)) accumulator[`_avg_${field}`] = { $avg: `$${field}` };

            const pipeline = [
                { $match: filter },
                { $group: { _id: groupId, ...accumulator } },
            ];

            if (orderBy) {
                const sort = {};
                for (const item of (Array.isArray(orderBy) ? orderBy : [orderBy])) {
                    for (const [k, dir] of Object.entries(item)) {
                        // e.g. {_sum: {admissionCount: 'desc'}} → sort on aggregated field
                        const inner = typeof item[k] === 'object' ? Object.entries(item[k]) : [[k, dir]];
                        for (const [field, d] of inner) {
                            sort[`_sum_${field}`] = d === 'desc' ? -1 : 1;
                        }
                    }
                }
                pipeline.push({ $sort: sort });
            }
            if (take) pipeline.push({ $limit: take });

            const results = await Model.aggregate(pipeline);

            // Reshape to Prisma groupBy response shape
            return results.map(r => {
                const out = { ...r._id };
                if (Object.keys(_sum).length) {
                    out._sum = {};
                    for (const field of Object.keys(_sum)) out._sum[field] = r[`_sum_${field}`] ?? null;
                }
                if (Object.keys(_count).length) {
                    out._count = {};
                    for (const field of Object.keys(_count)) out._count[field] = r[`_count_${field}`] ?? null;
                }
                if (Object.keys(_avg).length) {
                    out._avg = {};
                    for (const field of Object.keys(_avg)) out._avg[field] = r[`_avg_${field}`] ?? null;
                }
                return out;
            });
        },

        // ── aggregate ─────────────────────────────────────────────────────────
        async aggregate({ where = {}, _sum = {}, _avg = {}, _count = {} } = {}) {
            const filter = toFilter(where);
            const accumulator = { _id: null };
            for (const f of Object.keys(_sum)) accumulator[`s_${f}`] = { $sum: `$${f}` };
            for (const f of Object.keys(_avg)) accumulator[`a_${f}`] = { $avg: `$${f}` };
            if (Object.keys(_count).length) accumulator[`_count`] = { $sum: 1 };

            const [result] = await Model.aggregate([{ $match: filter }, { $group: accumulator }]);
            const out = {};
            if (Object.keys(_sum).length) {
                out._sum = {};
                for (const f of Object.keys(_sum)) out._sum[f] = result?.[`s_${f}`] ?? null;
            }
            if (Object.keys(_avg).length) {
                out._avg = {};
                for (const f of Object.keys(_avg)) out._avg[f] = result?.[`a_${f}`] ?? null;
            }
            if (Object.keys(_count).length) out._count = result?._count ?? 0;
            return out;
        },
    };
}

// ─── Export shim object ───────────────────────────────────────────────────────

const prisma = {
    user: wrap(User),
    refreshToken: wrap(RefreshToken),
    auditLog: wrap(AuditLog),
    ward: wrap(Ward),
    hospital: wrap(Hospital),
    syndromeMapping: wrap(SyndromeMapping),
    hospitalAdmission: wrap(HospitalAdmission),
    waterQualityReport: wrap(WaterQualityReport),
    weatherData: wrap(WeatherData),
    citizenReport: wrap(CitizenReport),
    riskPrediction: wrap(RiskPrediction),
    alert: wrap(Alert),
};

module.exports = prisma;
