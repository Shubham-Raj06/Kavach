const mongoose = require('mongoose');

/**
 * WardMaster — canonical ward data with GeoJSON boundaries.
 * Enables point-in-polygon spatial join for citizen reports.
 */
const wardMasterSchema = new mongoose.Schema({
    wardNumber: { type: String, required: true, unique: true }, // e.g. "12"
    name: { type: String, required: true },               // e.g. "Patel Nagar"
    district: { type: String, default: 'Delhi' },
    population: { type: Number, default: 50000 },
    areaSqKm: { type: Number, default: 2 },

    // GeoJSON centroid (lng, lat) for distance calculations
    centroid: {
        type: { type: String, enum: ['Point'], default: 'Point' },
        coordinates: { type: [Number], default: [77.2090, 28.6139] }, // [lng, lat]
    },

    // GeoJSON polygon for point-in-polygon queries
    geoPolygon: {
        type: { type: String, enum: ['Polygon'], default: 'Polygon' },
        coordinates: { type: [[[Number]]], default: [] },
    },

    neighboringWards: [{ type: String }], // wardNumbers of adjacent wards
}, { timestamps: true });

// Geospatial indexes
wardMasterSchema.index({ centroid: '2dsphere' });
wardMasterSchema.index({ geoPolygon: '2dsphere' });
wardMasterSchema.index({ wardNumber: 1 });

module.exports = mongoose.model('WardMaster', wardMasterSchema);
