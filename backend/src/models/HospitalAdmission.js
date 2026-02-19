const mongoose = require('mongoose');

const hospitalAdmissionSchema = new mongoose.Schema({
    ward: { type: Number, required: true },
    hospitalId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    count: { type: Number, required: true, min: 0 },
    bedCapacity: { type: Number, default: 0 },
    bedsAvailable: { type: Number, default: 0 },
    diseaseCategory: { type: String, default: 'general' },
    date: { type: Date, default: Date.now },
}, { timestamps: true });

hospitalAdmissionSchema.index({ ward: 1, date: -1 });

module.exports = mongoose.model('HospitalAdmission', hospitalAdmissionSchema);
