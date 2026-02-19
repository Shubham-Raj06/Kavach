const mongoose = require('mongoose');

const symptomReportSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    ward: { type: Number, required: true, min: 1 },
    symptoms: [{
        type: String,
        enum: [
            'fever', 'cough', 'cold', 'diarrhea', 'vomiting', 'headache',
            'rash', 'breathlessness', 'fatigue', 'chest_pain', 'sore_throat',
            'body_ache', 'loss_of_smell', 'loss_of_taste', 'other'
        ]
    }],
    severity: { type: Number, min: 1, max: 5, required: true },
    notes: { type: String, maxlength: 500 },
    location: {
        lat: Number,
        lng: Number,
    },
}, { timestamps: true });

symptomReportSchema.index({ ward: 1, createdAt: -1 });
symptomReportSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('SymptomReport', symptomReportSchema);
