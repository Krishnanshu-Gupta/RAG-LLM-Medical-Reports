const mongoose = require('mongoose');

const referenceRangeSchema = new mongoose.Schema({
    min: { type: Number, required: true },
    max: { type: Number, required: true },
})

const bloodReportSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    reportDate: { type: Date, required: true },
    hemoglobin: {
        result: { type: Number, required: true },
        unit: { type: String, required: true },
        referenceRange: { type: referenceRangeSchema, required: true }
    },
    whiteBloodCells: {
        result: { type: Number, required: true },
        unit: { type: String, required: true },
        referenceRange: { type: referenceRangeSchema, required: true }
    },
    platelets: {
        result: { type: Number, required: true },
        unit: { type: String, required: true },
        referenceRange: { type: referenceRangeSchema, required: true }
    },
    redBloodCells: {
        result: { type: Number, required: true },
        unit: { type: String, required: true },
        referenceRange: { type: referenceRangeSchema, required: true }
    },
    hematocrit: {
        result: { type: Number, required: true },
        unit: { type: String, required: true },
        referenceRange: { type: referenceRangeSchema, required: true }
    },
    meanCorpuscularVolume: {
        result: { type: Number, required: true },
        unit: { type: String, required: true },
        referenceRange: { type: referenceRangeSchema, required: true }
    },
    meanCorpuscularHemoglobin: {
        result: { type: Number, required: true },
        unit: { type: String, required: true },
        referenceRange: { type: referenceRangeSchema, required: true }
    },
    meanCorpuscularHemoglobinConcentration: {
        result: { type: Number, required: true },
        unit: { type: String, required: true },
        referenceRange: { type: referenceRangeSchema, required: true }
    },
    redCellDistributionWidth: {
        result: { type: Number, required: true },
        unit: { type: String, required: true },
        referenceRange: { type: referenceRangeSchema, required: true }
    }
});

const BloodReport = mongoose.model('BloodReport', bloodReportSchema);

module.exports = BloodReport;
