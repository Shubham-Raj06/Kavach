const mongoose = require('mongoose');

/**
 * ModelRegistry — tracks every deployed ML model version with metrics.
 * Required for governance, auditability, and rollback.
 */
const modelRegistrySchema = new mongoose.Schema({
    modelVersion: { type: String, required: true, unique: true }, // e.g. "v1.2.0"
    algorithm: { type: String, default: 'XGBoost' },
    trainingDataStart: { type: Date },
    trainingDataEnd: { type: Date },
    trainingSamples: { type: Number },
    deployedAt: { type: Date, default: Date.now },
    isActive: { type: Boolean, default: false },

    // Evaluation metrics
    metrics: {
        precision: { type: Number },
        recall: { type: Number },
        f1Score: { type: Number },
        rocAuc: { type: Number },
        mse: { type: Number },
    },

    featureNames: { type: [String], default: [] },
    notes: { type: String },
    deployedBy: { type: String },
}, { timestamps: true });

/**
 * PredictionLog — audit trail of every ML prediction made.
 * Links to actual outcomes for retrospective validation.
 */
const predictionLogSchema = new mongoose.Schema({
    wardId: { type: String, required: true },
    modelVersion: { type: String, required: true },
    predictedAt: { type: Date, default: Date.now },

    // Prediction outputs
    predictedRisk: { type: Number, required: true }, // 0-100
    predictedCategory: { type: String },
    confidence: { type: Number },
    isAnomaly: { type: Boolean, default: false },
    shapReasons: { type: String, default: '[]' },

    // Feature snapshot at prediction time
    featureSnapshot: { type: String }, // JSON string

    // Actual outcome (filled in retrospectively)
    actualOutbreak: { type: Boolean }, // null = unknown
    actualCategory: { type: String },
    validatedAt: { type: Date },

    // Performance
    inferenceDurationMs: { type: Number },
}, { timestamps: false });

predictionLogSchema.index({ wardId: 1, predictedAt: -1 });
predictionLogSchema.index({ modelVersion: 1 });
predictionLogSchema.index({ actualOutbreak: 1, predictedAt: -1 }); // for validation queries

/**
 * FeatureDrift — monitors statistical drift in input features.
 */
const featureDriftSchema = new mongoose.Schema({
    wardId: { type: String, required: true },
    feature: { type: String, required: true },
    checkedAt: { type: Date, default: Date.now },
    baselineMean: { type: Number },
    baselineStd: { type: Number },
    currentMean: { type: Number },
    currentStd: { type: Number },
    driftScore: { type: Number }, // PSI or KL divergence
    isDrifting: { type: Boolean, default: false },
    threshold: { type: Number, default: 0.2 },
});

featureDriftSchema.index({ wardId: 1, feature: 1, checkedAt: -1 });

module.exports = {
    ModelRegistry: mongoose.model('ModelRegistry', modelRegistrySchema),
    PredictionLog: mongoose.model('PredictionLog', predictionLogSchema),
    FeatureDrift: mongoose.model('FeatureDrift', featureDriftSchema),
};
