# Health Analytics Dashboard

A comprehensive health monitoring and prediction platform that provides users with insights into their health metrics and potential health risks.

## Features

- User authentication (Signup/Login)
- Health data input and tracking
- Health predictions and risk assessments
- Historical data visualization
- Health trend analysis
- Export health data to CSV

## Tech Stack

### Frontend
- HTML5, CSS3, JavaScript
- Chart.js for data visualization
- Responsive design with CSS Grid and Flexbox

### Backend
- Node.js with Express.js
- MongoDB with Mongoose ODM
- JWT for authentication
- RESTful API architecture

## Project Structure

```
BE_Project/
├── backend/               # Backend server code
│   ├── config/           # Configuration files
│   ├── models/           # MongoDB models
│   ├── node_modules/     # Dependencies
│   ├── server.js         # Main server file
│   └── package.json      # Backend dependencies
├── frontend/             # Frontend code
│   ├── css/              # Stylesheets
│   ├── js/               # JavaScript files
│   ├── dashboard.html    # Main dashboard
│   ├── health-prediction.html # Health prediction form
│   ├── home.html         # Landing page
│   ├── login.html        # Login page
│   ├── prediction-history.html # Prediction history
│   └── signup.html      # User registration
└── README.md            # Project documentation
```

## Prerequisites

- Node.js (v14 or higher)
- npm (comes with Node.js)
- MongoDB (running locally or connection string)

## Setup Instructions

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the backend directory with the following variables:
   ```
   MONGODB_URI=mongodb://localhost:27017/healthcare_analytics
   JWT_SECRET=your_jwt_secret_key
   PORT=5000
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```
   The backend server will start on `http://localhost:5000`

### Frontend Setup

1. Open the `frontend` directory in your browser or use a local server:
   - For Python 3:
     ```bash
     python -m http.server 3000
     ```
   - Or use the Live Server extension in VS Code

2. Open `http://localhost:3000/frontend/home.html` in your browser

## API Endpoints

- `POST /api/signup` - User registration
- `POST /api/login` - User login
- `GET /api/user` - Get user profile (protected)
- `POST /api/health-prediction` - Submit health data for prediction (protected)
- `GET /api/prediction-history` - Get prediction history (protected)
- `GET /api/health-trends` - Get health trends (protected)
- `GET /api/export-health-data` - Export health data to CSV (protected)

## Health Metrics Tracked

- Blood Pressure (Systolic/Diastolic)
- Heart Rate
- BMI (Body Mass Index)
- Respiratory Rate
- Oxygen Saturation
- Blood Glucose Levels
- Cholesterol Levels
- Lifestyle Factors (Activity Level, Sleep, etc.)

## Risk Assessments

- Heart Disease Risk
- Stroke Risk
- Diabetes Risk
- Obesity Risk
- Hypertension Risk

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the `LICENSE` file for details.

## Support

For support, please open an issue in the GitHub repository.