/**
 * src/models/index.js
 * All Mongoose models — single import point.
 */
const mongoose = require('mongoose');
const { Schema } = mongoose;

// ─── Enums (for validation) ───────────────────────────────────────────────────
const ROLES = ['GOV', 'HOSPITAL', 'CITIZEN', 'SUPER_ADMIN'];
const SYNDROME_TYPES = ['DIARRHEA', 'FEVER', 'VOMITING', 'COUGH', 'RESPIRATORY_DISTRESS', 'SKIN_RASH', 'JAUNDICE', 'HEADACHE', 'UNKNOWN'];
const CATEGORIES = ['WATERBORNE', 'FOODBORNE', 'AIRBORNE', 'VECTOR_BORNE', 'HOSPITAL_ACQUIRED', 'UNKNOWN'];
const SEVERITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
const ALERT_STATUS = ['PENDING', 'SENT', 'FAILED'];
const RECIPIENT_TYPES = ['GOV', 'HOSPITAL', 'CITIZEN', 'ALL'];
const WATER_SOURCES = ['TAP', 'BOREWELL', 'RIVER', 'LAKE', 'OTHER'];

// ─── User ────────────────────────────────────────────────────────────────────
const userSchema = new Schema({
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ROLES, default: 'CITIZEN' },
    name: { type: String, trim: true },
    wardId: { type: Schema.Types.ObjectId, ref: 'Ward' },
    hospitalId: { type: Schema.Types.ObjectId, ref: 'Hospital' },
    district: { type: String },
    fcmToken: { type: String },
    isActive: { type: Boolean, default: true },
}, { timestamps: true });

userSchema.index({ role: 1 });
userSchema.index({ isActive: 1 });

// ─── RefreshToken ────────────────────────────────────────────────────────────
const refreshTokenSchema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    tokenHash: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    isRevoked: { type: Boolean, default: false },
}, { timestamps: true });

refreshTokenSchema.index({ userId: 1 });
refreshTokenSchema.index({ isRevoked: 1, expiresAt: 1 });

// ─── AuditLog ────────────────────────────────────────────────────────────────
const auditLogSchema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    action: { type: String, required: true },
    resource: { type: String },
    metadata: { type: String },
    ipAddress: { type: String },
    timestamp: { type: Date, default: Date.now },
});

auditLogSchema.index({ userId: 1 });
auditLogSchema.index({ action: 1 });
auditLogSchema.index({ timestamp: -1 });

// ─── Ward ────────────────────────────────────────────────────────────────────
const wardSchema = new Schema({
    name: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    district: { type: String, default: 'Delhi' },
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    population: { type: Number },
}, { timestamps: true });

// ─── Hospital ────────────────────────────────────────────────────────────────
const hospitalSchema = new Schema({
    name: { type: String, required: true },
    wardId: { type: Schema.Types.ObjectId, ref: 'Ward', required: true },
    city: { type: String, required: true },
    capacity: { type: Number, default: 0 },
    icuBeds: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
}, { timestamps: true });

// ─── SyndromeMapping ─────────────────────────────────────────────────────────
const syndromeMappingSchema = new Schema({
    syndromeType: { type: String, enum: SYNDROME_TYPES, required: true },
    outbreakCategory: { type: String, enum: CATEGORIES, required: true },
    weight: { type: Number, default: 1.0 },
    description: { type: String },
});

// ─── HospitalAdmission ───────────────────────────────────────────────────────
const hospitalAdmissionSchema = new Schema({
    wardId: { type: Schema.Types.ObjectId, ref: 'Ward', required: true },
    hospitalName: { type: String, required: true },
    reportDate: { type: Date, required: true },
    syndromeType: { type: String, enum: SYNDROME_TYPES, required: true },
    outbreakCategory: { type: String, enum: CATEGORIES, default: 'UNKNOWN' },
    admissionCount: { type: Number, required: true },
    severeCount: { type: Number, default: 0 },
    deathCount: { type: Number, default: 0 },
    ageGroup: { type: String },
}, { timestamps: true });

hospitalAdmissionSchema.index({ wardId: 1, reportDate: -1 });

// ─── WaterQualityReport ──────────────────────────────────────────────────────
const waterQualitySchema = new Schema({
    wardId: { type: Schema.Types.ObjectId, ref: 'Ward', required: true },
    reportDate: { type: Date, required: true },
    chlorineLevel: { type: Number, required: true },
    phLevel: { type: Number, required: true },
    turbidity: { type: Number, required: true },
    ecoli: { type: Number },
    totalColiforms: { type: Number },
    source: { type: String, enum: WATER_SOURCES },
}, { timestamps: true });

waterQualitySchema.index({ wardId: 1, reportDate: -1 });

// ─── WeatherData ─────────────────────────────────────────────────────────────
const weatherDataSchema = new Schema({
    wardId: { type: Schema.Types.ObjectId, ref: 'Ward', required: true },
    recordedAt: { type: Date, required: true },
    rainfall: { type: Number, required: true },
    temperature: { type: Number, required: true },
    humidity: { type: Number, required: true },
    windSpeed: { type: Number },
    uvIndex: { type: Number },
}, { timestamps: true });

weatherDataSchema.index({ wardId: 1, recordedAt: -1 });

// ─── CitizenReport ───────────────────────────────────────────────────────────
const citizenReportSchema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    wardId: { type: Schema.Types.ObjectId, ref: 'Ward', required: true },
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    syndromeType: { type: String, enum: SYNDROME_TYPES, required: true },
    description: { type: String },
    severity: { type: Number, default: 1, min: 1, max: 5 },
    isVerified: { type: Boolean, default: false },
}, { timestamps: true });

citizenReportSchema.index({ wardId: 1 });

// ─── RiskPrediction ──────────────────────────────────────────────────────────
const riskPredictionSchema = new Schema({
    wardId: { type: Schema.Types.ObjectId, ref: 'Ward', required: true },
    forecastHorizon: { type: Number, default: 48 },
    riskScore: { type: Number, required: true },
    outbreakCategory: { type: String, enum: CATEGORIES, required: true },
    confidence: { type: Number, required: true },
    isAnomaly: { type: Boolean, default: false },
    shapReasons: { type: String, default: '[]' },
    outbreakReasons: { type: String, default: '[]' },
    rawFeatures: { type: String },
}, { timestamps: true });

riskPredictionSchema.index({ wardId: 1, createdAt: -1 });

// ─── Alert ───────────────────────────────────────────────────────────────────
const alertSchema = new Schema({
    wardId: { type: Schema.Types.ObjectId, ref: 'Ward', required: true },
    predictionId: { type: Schema.Types.ObjectId, ref: 'RiskPrediction' },
    severity: { type: String, enum: SEVERITIES, required: true },
    outbreakCategory: { type: String, enum: CATEGORIES, required: true },
    message: { type: String, required: true },
    recommendedAction: { type: String },
    recipientType: { type: String, enum: RECIPIENT_TYPES, default: 'ALL' },
    status: { type: String, enum: ALERT_STATUS, default: 'PENDING' },
    sentAt: { type: Date },
}, { timestamps: true });

alertSchema.index({ wardId: 1, createdAt: -1 });
alertSchema.index({ severity: 1, status: 1 });

// ─── Export models ───────────────────────────────────────────────────────────
module.exports = {
    User: require('./User'),
    RefreshToken: require('./RefreshToken'),
    AuditLog: require('./AuditLog'),
    Ward: mongoose.model('Ward', wardSchema),
    Hospital: mongoose.model('Hospital', hospitalSchema),
    SyndromeMapping: mongoose.model('SyndromeMapping', syndromeMappingSchema),
    HospitalAdmission: mongoose.model('HospitalAdmission', hospitalAdmissionSchema),
    WaterQualityReport: mongoose.model('WaterQualityReport', waterQualitySchema),
    WeatherData: mongoose.model('WeatherData', weatherDataSchema),
    CitizenReport: mongoose.model('CitizenReport', citizenReportSchema),
    RiskPrediction: mongoose.model('RiskPrediction', riskPredictionSchema),
    Alert: mongoose.model('Alert', alertSchema),
};
