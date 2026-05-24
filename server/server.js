const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const seedData = require('./utils/seeder');

// Load environment variables
dotenv.config();

// Connect to Database
connectDB().then(() => {
  // Run Database Seeder
  seedData();
});

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes Mounts
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/employees', require('./routes/employeeRoutes'));
app.use('/api/leaves', require('./routes/leaveRoutes'));
app.use('/api/performance', require('./routes/performanceRoutes'));
app.use('/api/notices', require('./routes/noticeRoutes'));
app.use('/api/attendance', require('./routes/attendanceRoutes'));

// Root Healthcheck Route
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Employee Management System API is running...',
    version: '1.0.0',
  });
});

// Fallback Route
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    error: 'API Endpoint Not Found',
  });
});

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.log(`Error: ${err.message}`);
  // Close server & exit process
  server.close(() => process.exit(1));
});
