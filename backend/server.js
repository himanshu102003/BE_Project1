const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('./models/User');
const HealthPrediction = require('./models/HealthPrediction');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Middleware to verify JWT token
const verifyToken = (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
        return res.status(401).json({ message: 'Access denied. No token provided.' });
    }

    try {
        const verified = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret_key');
        req.user = verified;
        next();
    } catch (error) {
        res.status(400).json({ message: 'Invalid token' });
    }
};

// MongoDB Connection
mongoose.connect('mongodb://127.0.0.1:27017/healthcare_analytics', {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log('MongoDB Connected Successfully'))
.catch(err => {
    console.error('MongoDB Connection Error:', err);
    process.exit(1);
});

// Test route
app.get('/api/test', (req, res) => {
    res.json({ message: 'Backend is working!' });
});

// Routes
app.post('/api/signup', async (req, res) => {
    try {
        console.log('Signup request received:', req.body);
        const { username, email, password, age } = req.body;

        if (!username || !email || !password || !age) {
            return res.status(400).json({ 
                message: 'Please provide all required fields',
                received: { username, email, password: '***', age }
            });
        }

        // Check if user already exists
        const userExists = await User.findOne({ $or: [{ email }, { username }] });
        if (userExists) {
            return res.status(400).json({ 
                message: userExists.email === email 
                    ? 'Email already registered' 
                    : 'Username already taken'
            });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create user
        const user = await User.create({
            username,
            email,
            password: hashedPassword,
            age
        });

        console.log('User created successfully:', user._id);

        res.status(201).json({
            message: 'User created successfully',
            user: {
                id: user._id,
                username: user.username,
                email: user.email
            }
        });
    } catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({ 
            message: 'Server error during signup',
            error: error.message 
        });
    }
});

app.post('/api/login', async (req, res) => {
    try {
        console.log('Login request received:', { ...req.body, password: '***' });
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ 
                message: 'Please provide both username and password' 
            });
        }

        // Find user
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Check password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Create token
        const token = jwt.sign(
            { id: user._id, username: user.username },
            process.env.JWT_SECRET || 'your_jwt_secret_key',
            { expiresIn: '24h' }
        );

        console.log('Login successful for user:', user._id);

        res.json({
            message: 'Login successful',
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ 
            message: 'Server error during login',
            error: error.message 
        });
    }
});

// Protected route example
app.get('/api/dashboard-data', verifyToken, async (req, res) => {
    try {
        // Get user data
        const user = await User.findById(req.user.id).select('-password');
        
        // Mock health data - in a real app, this would come from your database
        const healthData = {
            heartDiseaseRisk: Math.floor(Math.random() * 30),
            strokeRisk: Math.floor(Math.random() * 20),
            diabetesRisk: Math.floor(Math.random() * 25),
            overallHealth: ['Poor', 'Fair', 'Good', 'Excellent'][Math.floor(Math.random() * 4)],
            metrics: {
                bloodPressure: Array.from({length: 6}, () => 110 + Math.floor(Math.random() * 30)),
                heartRate: Array.from({length: 6}, () => 60 + Math.floor(Math.random() * 30))
            },
            riskFactors: {
                heartDisease: Math.floor(Math.random() * 100),
                stroke: Math.floor(Math.random() * 100),
                diabetes: Math.floor(Math.random() * 100),
                obesity: Math.floor(Math.random() * 100),
                hypertension: Math.floor(Math.random() * 100)
            }
        };

        res.json({
            user,
            healthData
        });
    } catch (error) {
        console.error('Dashboard data error:', error);
        res.status(500).json({ message: 'Error fetching dashboard data' });
    }
});

// Health Prediction Analysis Route
app.post('/api/health-prediction', verifyToken, async (req, res) => {
    try {
        console.log('Received prediction request from user:', req.user.id); // Log user
        console.log('Request body:', req.body); // Log request data
        
        const {
            age, gender, height, weight,
            systolic, diastolic, heartRate,
            respiratoryRate, oxygenSaturation,
            glucoseLevel, cholesterol,
            activityLevel, smokingStatus,
            alcoholConsumption, sleepHours,
            stressLevel, dietType,
            medicalConditions, familyHistory
        } = req.body;

        // Calculate BMI
        const bmi = weight / ((height / 100) * (height / 100));
        
        // Calculate all health scores
        const bloodPressureScore = calculateBloodPressureScore(systolic, diastolic);
        const heartRateScore = calculateHeartRateScore(heartRate);
        const bmiScore = calculateBMIScore(bmi);
        const metabolicScore = calculateMetabolicScore(glucoseLevel, cholesterol);
        const respiratoryScore = calculateRespiratoryScore(respiratoryRate, oxygenSaturation);
        const lifestyleScore = calculateLifestyleScore(activityLevel, smokingStatus, alcoholConsumption, sleepHours, stressLevel, dietType);

        // Calculate risk factors
        const heartDiseaseRisk = calculateHeartDiseaseRisk(age, gender, bmi, bloodPressureScore, medicalConditions);
        const strokeRisk = calculateStrokeRisk(age, bloodPressureScore, medicalConditions);
        const diabetesRisk = calculateDiabetesRisk(bmi, familyHistory, medicalConditions);
        const obesityRisk = calculateObesityRisk(bmi, activityLevel);
        const hypertensionRisk = calculateHypertensionRisk(systolic, diastolic, age);

        // Calculate overall health score
        const overallScore = calculateOverallScore(bloodPressureScore, heartRateScore, bmiScore, lifestyleScore);
        const healthStatus = getHealthStatus(overallScore);

        // Create new prediction record
        const prediction = new HealthPrediction({
            userId: req.user.id,
            date: new Date(),
            metrics: {
                age, gender, height, weight, bmi,
                systolic, diastolic, heartRate,
                respiratoryRate, oxygenSaturation,
                glucoseLevel, cholesterol,
                activityLevel, smokingStatus,
                alcoholConsumption, sleepHours,
                stressLevel, dietType
            },
            scores: {
                bloodPressure: bloodPressureScore,
                heartRate: heartRateScore,
                bmi: bmiScore,
                metabolic: metabolicScore,
                respiratory: respiratoryScore,
                lifestyle: lifestyleScore,
                overall: overallScore
            },
            risks: {
                heartDisease: heartDiseaseRisk,
                stroke: strokeRisk,
                diabetes: diabetesRisk,
                obesity: obesityRisk,
                hypertension: hypertensionRisk
            },
            healthStatus,
            medicalConditions,
            familyHistory
        });

        await prediction.save();

        res.json({
            message: 'Health prediction completed successfully',
            prediction: {
                overallScore,
                healthStatus,
                scores: prediction.scores,
                risks: prediction.risks
            }
        });
    } catch (error) {
        console.error('Health Prediction Error:', error);
        res.status(500).json({ message: 'Error processing health prediction', error: error.message });
    }
});

// Get User's Prediction History
app.get('/api/health-predictions', verifyToken, async (req, res) => {
    try {
        const predictions = await HealthPrediction.find({ userId: req.user.id })
            .sort({ date: -1 })
            .limit(10);
        
        const trends = calculateHealthTrends(predictions);
        
        res.json({
            predictions,
            trends
        });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching prediction history', error: error.message });
    }
});

// Get Health Trends Analysis
app.get('/api/health-trends', verifyToken, async (req, res) => {
    try {
        const timeframe = req.query.timeframe || '6months';
        const endDate = new Date();
        const startDate = new Date();
        
        switch(timeframe) {
            case '1month':
                startDate.setMonth(startDate.getMonth() - 1);
                break;
            case '3months':
                startDate.setMonth(startDate.getMonth() - 3);
                break;
            case '6months':
                startDate.setMonth(startDate.getMonth() - 6);
                break;
            case '1year':
                startDate.setFullYear(startDate.getFullYear() - 1);
                break;
        }

        const predictions = await HealthPrediction.find({
            userId: req.user.id,
            date: { $gte: startDate, $lte: endDate }
        }).sort({ date: 1 });

        const trends = {
            overallScore: predictions.map(p => ({ date: p.date, value: p.scores.overall })),
            bmi: predictions.map(p => ({ date: p.date, value: p.metrics.bmi })),
            bloodPressure: predictions.map(p => ({ 
                date: p.date, 
                systolic: p.metrics.systolic,
                diastolic: p.metrics.diastolic 
            })),
            lifestyle: predictions.map(p => ({ date: p.date, value: p.scores.lifestyle }))
        };

        res.json({
            timeframe,
            trends,
            summary: calculateHealthTrends(predictions)
        });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching health trends', error: error.message });
    }
});

// Enhanced health prediction calculation
function calculateMetabolicScore(glucoseLevel, cholesterol) {
    let score = 100;
    
    // Glucose analysis (normal range: 70-140 mg/dL)
    if (glucoseLevel < 70 || glucoseLevel > 140) {
        score -= 20;
    } else if (glucoseLevel < 80 || glucoseLevel > 120) {
        score -= 10;
    }
    
    // Cholesterol analysis
    if (cholesterol.total > 200) score -= 10;
    if (cholesterol.ldl > 130) score -= 10;
    if (cholesterol.hdl < 40) score -= 10;
    
    return Math.max(0, score);
}

function calculateRespiratoryScore(respiratoryRate, oxygenSaturation) {
    let score = 100;
    
    // Respiratory rate analysis (normal range: 12-20 breaths/min)
    if (respiratoryRate < 12 || respiratoryRate > 20) {
        score -= 15;
    }
    
    // Oxygen saturation analysis (normal range: 95-100%)
    if (oxygenSaturation < 95) {
        score -= 20;
    } else if (oxygenSaturation < 90) {
        score -= 40;
    }
    
    return Math.max(0, score);
}

function calculateLifestyleScore(activityLevel, smokingStatus, alcoholConsumption, sleepHours, stressLevel, dietType) {
    let score = 0;
    
    // Activity score
    switch(activityLevel) {
        case 'active': score += 25; break;
        case 'moderate': score += 20; break;
        case 'sedentary': score += 5; break;
    }
    
    // Smoking score
    switch(smokingStatus) {
        case 'nonSmoker': score += 25; break;
        case 'formerSmoker': score += 15; break;
        case 'currentSmoker': score += 5; break;
    }
    
    // Alcohol score
    switch(alcoholConsumption) {
        case 'never': score += 15; break;
        case 'occasional': score += 10; break;
        case 'regular': score += 5; break;
    }
    
    // Sleep score (ideal: 7-9 hours)
    if (sleepHours >= 7 && sleepHours <= 9) {
        score += 15;
    } else if (sleepHours >= 6 && sleepHours <= 10) {
        score += 10;
    } else {
        score += 5;
    }
    
    // Stress score
    switch(stressLevel) {
        case 'low': score += 10; break;
        case 'moderate': score += 7; break;
        case 'high': score += 3; break;
    }
    
    // Diet score
    switch(dietType) {
        case 'balanced': score += 10; break;
        case 'vegetarian':
        case 'vegan': score += 8; break;
        case 'keto': score += 7; break;
        default: score += 5;
    }
    
    return score;
}

function calculateHealthTrends(predictions) {
    if (predictions.length < 2) return null;
    
    const latest = predictions[predictions.length - 1];
    const previous = predictions[0];
    
    return {
        weightTrend: calculateTrend(previous.metrics.bmi, latest.metrics.bmi),
        bpTrend: calculateTrend(
            previous.metrics.systolic,
            latest.metrics.systolic
        ),
        glucoseTrend: calculateTrend(
            previous.metrics.glucoseLevel,
            latest.metrics.glucoseLevel
        ),
        overallTrend: calculateTrend(previous.scores.overall, latest.scores.overall)
    };
}

function calculateTrend(oldValue, newValue) {
    const change = ((newValue - oldValue) / oldValue) * 100;
    if (change > 5) return 'increasing';
    if (change < -5) return 'decreasing';
    return 'stable';
}

function generateHealthDataCSV(predictions) {
    const headers = [
        'Date',
        'Overall Score',
        'Health Status',
        'BMI',
        'Blood Pressure',
        'Heart Rate',
        'Oxygen Saturation',
        'Glucose Level',
        'Activity Level',
        'Stress Level'
    ].join(',');
    
    const rows = predictions.map(p => [
        new Date(p.date).toISOString(),
        p.scores.overall,
        p.healthStatus,
        p.metrics.bmi,
        `${p.metrics.systolic}/${p.metrics.diastolic}`,
        p.metrics.heartRate,
        p.metrics.oxygenSaturation,
        p.metrics.glucoseLevel,
        p.metrics.activityLevel,
        p.metrics.stressLevel
    ].join(','));
    
    return [headers, ...rows].join('\n');
}

// Helper functions for health calculations
function calculateBloodPressureScore(systolic, diastolic) {
    // Normal BP: 120/80
    const systolicScore = 100 - Math.abs(120 - systolic);
    const diastolicScore = 100 - Math.abs(80 - diastolic);
    return (systolicScore + diastolicScore) / 2;
}

function calculateHeartRateScore(heartRate) {
    // Normal resting heart rate: 60-100 bpm
    if (heartRate < 60) return 70;
    if (heartRate > 100) return 60;
    return 100 - Math.abs(80 - heartRate);
}

function calculateBMIScore(bmi) {
    // Normal BMI: 18.5-24.9
    if (bmi < 18.5) return 70;
    if (bmi > 30) return 50;
    if (bmi > 25) return 80;
    return 100;
}

function calculateLifestyleScore(activityLevel, smokingStatus, alcoholConsumption) {
    let score = 0;
    
    // Activity score
    switch(activityLevel) {
        case 'active': score += 40; break;
        case 'moderate': score += 30; break;
        case 'sedentary': score += 10; break;
    }
    
    // Smoking score
    switch(smokingStatus) {
        case 'nonSmoker': score += 40; break;
        case 'formerSmoker': score += 30; break;
        case 'currentSmoker': score += 10; break;
    }
    
    // Alcohol score
    switch(alcoholConsumption) {
        case 'never': score += 20; break;
        case 'occasional': score += 15; break;
        case 'regular': score += 5; break;
    }
    
    return score;
}

function calculateHeartDiseaseRisk(age, gender, bmi, bloodPressureScore, conditions) {
    let risk = 0;
    risk += age > 50 ? 30 : 10;
    risk += gender === 'male' ? 20 : 15;
    risk += bmi > 25 ? 20 : 10;
    risk += bloodPressureScore < 70 ? 30 : 10;
    risk += conditions?.includes('heartDisease') ? 40 : 0;
    return Math.min(risk, 100);
}

function calculateStrokeRisk(age, bloodPressureScore, conditions) {
    let risk = 0;
    risk += age > 60 ? 35 : 15;
    risk += bloodPressureScore < 70 ? 35 : 15;
    risk += conditions?.includes('hypertension') ? 30 : 0;
    return Math.min(risk, 100);
}

function calculateDiabetesRisk(bmi, familyHistory, conditions) {
    let risk = 0;
    risk += bmi > 30 ? 40 : 20;
    risk += familyHistory?.toLowerCase().includes('diabetes') ? 30 : 0;
    risk += conditions?.includes('diabetes') ? 40 : 0;
    return Math.min(risk, 100);
}

function calculateObesityRisk(bmi, activityLevel) {
    let risk = 0;
    risk += bmi > 30 ? 50 : (bmi > 25 ? 30 : 10);
    risk += activityLevel === 'sedentary' ? 30 : (activityLevel === 'moderate' ? 15 : 5);
    return Math.min(risk, 100);
}

function calculateHypertensionRisk(systolic, diastolic, age) {
    let risk = 0;
    risk += systolic > 140 || diastolic > 90 ? 40 : 20;
    risk += age > 50 ? 30 : 15;
    return Math.min(risk, 100);
}

function calculateOverallScore(bloodPressureScore, heartRateScore, bmiScore, lifestyleScore) {
    return (bloodPressureScore * 0.3) + (heartRateScore * 0.2) + (bmiScore * 0.2) + (lifestyleScore * 0.3);
}

function getHealthStatus(score) {
    if (score >= 90) return 'Excellent';
    if (score >= 75) return 'Good';
    if (score >= 60) return 'Fair';
    return 'Poor';
}

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
