const mongoose = require('mongoose');

/**
 * WardHospitalDistance — precomputed distances from ward centroids to hospitals.
 * Used as an ML feature and for mobile hospital lookup.
 */
const wardHospitalDistanceSchema = new mongoose.Schema({
    wardId: { type: String, required: true },
    hospitalId: { type: mongoose.Schema.Types.ObjectId, ref: 'Hospital', required: true },
    hospitalName: { type: String, required: true },
    distanceKm: { type: Number, required: true },
    phone: { type: String, default: '' },
    icuBeds: { type: Number, default: 0 },
    capacity: { type: Number, default: 0 },
    latitude: { type: Number },
    longitude: { type: Number },
});

wardHospitalDistanceSchema.index({ wardId: 1, distanceKm: 1 }); // sorted nearest first

module.exports = mongoose.model('WardHospitalDistance', wardHospitalDistanceSchema);
