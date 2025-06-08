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
        const data = {};

        // Personal Information
        data.age = parseInt(formData.get('age'));
        data.gender = formData.get('gender');
        data.height = parseInt(formData.get('height'));
        data.weight = parseInt(formData.get('weight'));

        // Vital Signs
        data.systolic = parseInt(formData.get('bloodPressureSystolic'));
        data.diastolic = parseInt(formData.get('bloodPressureDiastolic'));
        data.heartRate = parseInt(formData.get('heartRate'));
        data.respiratoryRate = parseInt(formData.get('respiratoryRate'));
        data.oxygenSaturation = parseInt(formData.get('oxygenSaturation'));
        data.glucoseLevel = parseInt(formData.get('glucoseLevel'));
        data.cholesterol = {
            total: parseInt(formData.get('totalCholesterol')),
            hdl: parseInt(formData.get('hdlCholesterol')),
            ldl: parseInt(formData.get('ldlCholesterol'))
        };

        // Medical History
        data.medicalConditions = Array.from(formData.getAll('medicalConditions'));
        data.familyHistory = formData.get('familyHistory');

        // Lifestyle
        data.activityLevel = formData.get('activityLevel');
        data.smokingStatus = formData.get('smokingStatus');
        data.alcoholConsumption = formData.get('alcoholConsumption');
        data.sleepHours = parseInt(formData.get('sleepHours'));
        data.stressLevel = formData.get('stressLevel');
        data.dietType = formData.get('dietType');

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
                body: JSON.stringify(data)
            });

            console.log('Response status:', response.status); // Add status logging
            console.log('Response headers:', response.headers); // Add headers logging
            
            const data = await response.json();
            console.log('Server response:', data); // Debug log

            if (!response.ok) {
                throw new Error(data.message || 'Error submitting health prediction');
            }

            displayResults(data.prediction);
            renderHealthPredictionChart(data.prediction);
            displayPredictionInfo(data.prediction);
        } catch (error) {
            console.error('Error:', error); // Debug log
            showError(error.message);
        }
    });

    // Display prediction results
    function displayResults(prediction) {
        console.log('Displaying results:', prediction); // Debug log
        
        // Ensure the prediction results container is visible
        const predictionResults = document.getElementById('prediction-results');
        if (predictionResults) {
            predictionResults.style.display = 'block';
        }

        // Format the prediction data for the chart
        const chartData = {
            bmiScore: prediction.scores.bmi,
            bloodPressureScore: prediction.scores.bloodPressure,
            heartRateScore: prediction.scores.heartRate,
            metabolicHealthScore: prediction.scores.metabolicHealth,
            respiratoryHealthScore: prediction.scores.respiratoryHealth,
            lifestyleScore: prediction.scores.lifestyle
        };

        // Render the chart
        renderHealthPredictionChart(chartData);

        // Display detailed information
        displayPredictionInfo(prediction);
    }

    function renderHealthPredictionChart(predictionData) {
        const ctx = document.getElementById('healthPredictionChart').getContext('2d');
        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['BMI', 'Blood Pressure', 'Heart Rate', 'Metabolic Health', 'Respiratory Health', 'Lifestyle'],
                datasets: [{
                    label: 'Health Scores',
                    data: [
                        predictionData.bmiScore,
                        predictionData.bloodPressureScore,
                        predictionData.heartRateScore,
                        predictionData.metabolicHealthScore,
                        predictionData.respiratoryHealthScore,
                        predictionData.lifestyleScore
                    ],
                    backgroundColor: [
                        'rgba(255, 99, 132, 0.2)',
                        'rgba(54, 162, 235, 0.2)',
                        'rgba(255, 206, 86, 0.2)',
                        'rgba(75, 192, 192, 0.2)',
                        'rgba(153, 102, 255, 0.2)',
                        'rgba(255, 159, 64, 0.2)'
                    ],
                    borderColor: [
                        'rgba(255, 99, 132, 1)',
                        'rgba(54, 162, 235, 1)',
                        'rgba(255, 206, 86, 1)',
                        'rgba(75, 192, 192, 1)',
                        'rgba(153, 102, 255, 1)',
                        'rgba(255, 159, 64, 1)'
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    }

    function displayPredictionInfo(predictionData) {
        const infoDiv = document.getElementById('predictionInfo');
        infoDiv.innerHTML = `
            <p>BMI Score: ${predictionData.scores.bmi}</p>
            <p>Blood Pressure Analysis: ${predictionData.scores.bloodPressure}</p>
            <p>Heart Rate Evaluation: ${predictionData.scores.heartRate}</p>
            <p>Metabolic Health Score: ${predictionData.scores.metabolicHealth}</p>
            <p>Respiratory Health Score: ${predictionData.scores.respiratoryHealth}</p>
            <p>Lifestyle Score: ${predictionData.scores.lifestyle}</p>
        `;
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
