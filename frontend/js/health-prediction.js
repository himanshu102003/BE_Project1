document.addEventListener('DOMContentLoaded', () => {
    // Form elements
    const predictionForm = document.getElementById('health-prediction-form');
    console.log('Form element:', predictionForm); // Debug log

    const resultSection = document.getElementById('prediction-results');
    const progressSteps = document.querySelectorAll('.step');
    const nextButtons = document.querySelectorAll('.next-step');
    const prevButtons = document.querySelectorAll('.prev-step');
    const submitButton = document.querySelector('.submit-btn');
    let currentStep = 0;

    // Initialize form navigation
    function showStep(stepIndex) {
        console.log('Showing step:', stepIndex); // Debug log
        const formSteps = document.querySelectorAll('.form-step');
        formSteps.forEach((step, index) => {
            step.style.display = index === stepIndex ? 'block' : 'none';
        });
        
        // Update progress bar
        progressSteps.forEach((step, index) => {
            if (index <= stepIndex) {
                step.classList.add('active');
            } else {
                step.classList.remove('active');
            }
        });

        // Show/hide navigation buttons
        prevButtons.forEach(button => {
            button.style.display = stepIndex === 0 ? 'none' : 'block';
        });

        nextButtons.forEach(button => {
            button.style.display = stepIndex === formSteps.length - 1 ? 'none' : 'block';
        });

        submitButton.style.display = stepIndex === formSteps.length - 1 ? 'block' : 'none';
    }

    // Handle next/previous navigation
    nextButtons.forEach(button => {
        button.addEventListener('click', () => {
            console.log('Next button clicked, current step:', currentStep); // Debug log
            if (validateCurrentStep()) {
                currentStep++;
                showStep(currentStep);
            }
        });
    });

    prevButtons.forEach(button => {
        button.addEventListener('click', () => {
            console.log('Previous button clicked, current step:', currentStep); // Debug log
            currentStep--;
            showStep(currentStep);
        });
    });

    // Form validation
    function validateCurrentStep() {
        const currentStepElement = document.querySelector(`.form-step[data-section="${currentStep + 1}"]`);
        console.log('Validating step:', currentStep + 1, 'Element:', currentStepElement); // Debug log
        
        if (!currentStepElement) {
            console.error('Step element not found!');
            return false;
        }

        const inputs = currentStepElement.querySelectorAll('input[required], select[required]');
        let isValid = true;

        inputs.forEach(input => {
            if (!input.value) {
                isValid = false;
                input.classList.add('invalid');
                showError(`Please fill in ${input.name}`);
            } else {
                input.classList.remove('invalid');
            }
        });

        return isValid;
    }

    // Handle form submission
    predictionForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        console.log('Form submitted'); // Debug log

        if (!validateCurrentStep()) {
            console.log('Validation failed'); // Debug log
            return;
        }

        const formData = new FormData(predictionForm);
        const predictionData = {
            // Personal Information
            age: parseInt(formData.get('age')),
            gender: formData.get('gender'),
            height: parseFloat(formData.get('height')),
            weight: parseFloat(formData.get('weight')),

            // Vital Signs
            systolic: parseInt(formData.get('bloodPressureSystolic')),
            diastolic: parseInt(formData.get('bloodPressureDiastolic')),
            heartRate: parseInt(formData.get('heartRate')),
            respiratoryRate: parseInt(formData.get('respiratoryRate')),
            oxygenSaturation: parseInt(formData.get('oxygenSaturation')),
            glucoseLevel: parseInt(formData.get('glucoseLevel')),
            cholesterol: {
                total: parseInt(formData.get('totalCholesterol')),
                hdl: parseInt(formData.get('hdlCholesterol')),
                ldl: parseInt(formData.get('ldlCholesterol'))
            },

            // Medical History
            medicalConditions: Array.from(formData.getAll('conditions')),
            familyHistory: formData.get('familyHistory'),

            // Lifestyle Factors
            activityLevel: formData.get('activityLevel'),
            smokingStatus: formData.get('smokingStatus'),
            alcoholConsumption: formData.get('alcoholConsumption'),
            sleepHours: parseInt(formData.get('sleepHours')),
            stressLevel: formData.get('stressLevel'),
            dietType: formData.get('dietType')
        };

        console.log('Prediction data:', predictionData); // Debug log

        try {
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('No authentication token found. Please log in again.');
            }

            console.log('Sending request to server...'); // Debug log
            const response = await fetch('/api/health-prediction', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(predictionData)
            });

            console.log('Response status:', response.status); // Add status logging
            console.log('Response headers:', response.headers); // Add headers logging
            
            const data = await response.json();
            console.log('Server response:', data); // Debug log

            if (!response.ok) {
                throw new Error(data.message || 'Error submitting health prediction');
            }

            displayResults(data.prediction);
        } catch (error) {
            console.error('Error:', error); // Debug log
            showError(error.message);
        }
    });

    // Display prediction results
    function displayResults(prediction) {
        console.log('Displaying results:', prediction); // Debug log
        resultSection.innerHTML = `
            <h2>Your Health Prediction Results</h2>
            <div class="overall-score">
                <h3>Overall Health Score</h3>
                <div class="score-circle ${getScoreClass(prediction.overallScore)}">
                    ${prediction.overallScore}
                </div>
                <p>Status: ${prediction.healthStatus}</p>
            </div>
            
            <div class="detailed-scores">
                <h3>Detailed Health Scores</h3>
                <div class="score-grid">
                    ${Object.entries(prediction.scores).map(([key, value]) => `
                        <div class="score-item">
                            <label>${formatLabel(key)}</label>
                            <div class="score ${getScoreClass(value)}">${value}</div>
                        </div>
                    `).join('')}
                </div>
            </div>

            <div class="risk-factors">
                <h3>Health Risk Assessment</h3>
                <div class="risk-grid">
                    ${Object.entries(prediction.risks).map(([key, value]) => `
                        <div class="risk-item ${getRiskClass(value)}">
                            <label>${formatLabel(key)} Risk</label>
                            <span>${formatRiskLevel(value)}</span>
                        </div>
                    `).join('')}
                </div>
            </div>

            <div class="action-buttons">
                <button onclick="window.location.href='/prediction-history.html'">View History</button>
                <button onclick="window.location.href='/dashboard.html'">Back to Dashboard</button>
            </div>
        `;
        
        resultSection.style.display = 'block';
        predictionForm.style.display = 'none';
    }

    // Helper functions
    function getScoreClass(score) {
        if (score >= 80) return 'excellent';
        if (score >= 60) return 'good';
        if (score >= 40) return 'fair';
        return 'poor';
    }

    function getRiskClass(risk) {
        if (risk < 0.3) return 'low-risk';
        if (risk < 0.6) return 'medium-risk';
        return 'high-risk';
    }

    function formatRiskLevel(risk) {
        if (risk < 0.3) return 'Low';
        if (risk < 0.6) return 'Medium';
        return 'High';
    }

    function formatLabel(key) {
        return key.split(/(?=[A-Z])/).join(' ');
    }

    function showError(message) {
        console.error('Error:', message); // Debug log
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = message;
        
        const existingError = document.querySelector('.error-message');
        if (existingError) {
            existingError.remove();
        }
        
        resultSection.prepend(errorDiv);
        
        setTimeout(() => {
            errorDiv.remove();
        }, 5000);
    }

    // Initialize first step
    showStep(0);
    console.log('Health prediction form initialized'); // Debug log
});
