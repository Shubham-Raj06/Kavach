const mongoose = require('mongoose');

/**
 * WardFeatureVector — hourly aggregated ML feature store per ward.
 * This is the single source of truth for ML inference.
 * Computed by featureEngineService.js and consumed by mlInferenceService.js.
 */
const wardFeatureVectorSchema = new mongoose.Schema({
    wardId: { type: String, required: true },
    computedAt: { type: Date, required: true }, // Round to nearest hour

    // ── Symptom signals (24h rolling) ────────────────────────────────────────
    symptomCount_24h: { type: Number, default: 0 },
    symptomCount_72h: { type: Number, default: 0 },
    severityAvg_24h: { type: Number, default: 1 },
    feverCount_24h: { type: Number, default: 0 },
    diarrheaCount_24h: { type: Number, default: 0 },
    vomitingCount_24h: { type: Number, default: 0 },
    respiratoryCount_24h: { type: Number, default: 0 },
    skinRashCount_24h: { type: Number, default: 0 },

    // ── Hospital signals ─────────────────────────────────────────────────────
    admissionsDelta_24h: { type: Number, default: 0 },   // vs previous 24h
    admissionsTotal_7d: { type: Number, default: 0 },
    severeCount_24h: { type: Number, default: 0 },
    deathCount_24h: { type: Number, default: 0 },

    // ── Water quality ────────────────────────────────────────────────────────
    chlorineLevel: { type: Number, default: 0.5 },
    chlorineDev_7d: { type: Number, default: 0 },   // deviation from 7d baseline
    phLevel: { type: Number, default: 7.2 },
    turbidity: { type: Number, default: 1.0 },

    // ── Weather signals ──────────────────────────────────────────────────────
    rainfall_24h: { type: Number, default: 0 },
    rainfall_72h: { type: Number, default: 0 },
    temperature_c: { type: Number, default: 28 },
    humidity_pct: { type: Number, default: 65 },

    // ── Static features ──────────────────────────────────────────────────────
    population: { type: Number, default: 50000 },
    distanceToHospital: { type: Number, default: 2.0 }, // km

    // ── Computed/normalized ─────────────────────────────────────────────────
    normalizedVector: { type: [Number], default: [] }, // ready for ML
    dataCompleteness: { type: Number, default: 1.0 },  // 0-1, how complete the data is
    sources: { type: [String], default: [] },  // which sources contributed

}, { timestamps: false });

// Compound unique: one vector per ward per hour
wardFeatureVectorSchema.index({ wardId: 1, computedAt: -1 }, { unique: true });

module.exports = mongoose.model('WardFeatureVector', wardFeatureVectorSchema);
