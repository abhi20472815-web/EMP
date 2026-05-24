const express = require('express');
const router = express.Router();
const {
  createPerformanceReview,
  getPerformanceReviews,
  getEmployeePerformanceStats,
} = require('../controllers/performanceController');
const { protect, authorize } = require('../middleware/auth');

router
  .route('/')
  .post(protect, authorize('admin', 'manager'), createPerformanceReview)
  .get(protect, getPerformanceReviews);

router.get('/stats/:employeeId', protect, getEmployeePerformanceStats);

module.exports = router;
