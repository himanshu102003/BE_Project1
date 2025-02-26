const mongoose = require('mongoose');

const healthPredictionSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    date: {
        type: Date,
        default: Date.now
    },
    metrics: {
        age: Number,
        gender: String,
        height: Number,
        weight: Number,
        bmi: Number,
        systolic: Number,
        diastolic: Number,
        heartRate: Number,
        respiratoryRate: Number,
        oxygenSaturation: Number,
        glucoseLevel: Number,
        cholesterol: {
            total: Number,
            hdl: Number,
            ldl: Number
        },
        activityLevel: String,
        smokingStatus: String,
        alcoholConsumption: String,
        sleepHours: Number,
        stressLevel: String,
        dietType: String
    },
    scores: {
        bloodPressure: Number,
        heartRate: Number,
        bmi: Number,
        metabolic: Number,
        respiratory: Number,
        lifestyle: Number,
        overall: Number
    },
    risks: {
        heartDisease: Number,
        stroke: Number,
        diabetes: Number,
        obesity: Number,
        hypertension: Number
    },
    healthStatus: String,
    medicalConditions: [String],
    familyHistory: String
});

module.exports = mongoose.model('HealthPrediction', healthPredictionSchema);
