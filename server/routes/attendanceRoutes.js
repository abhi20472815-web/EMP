const express = require('express');
const router = express.Router();
const {
  checkIn,
  checkOut,
  getTodayStatus,
  getMyAttendanceHistory,
  getTeamAttendance,
  updateEmployeeShift,
  getMonthlyAttendanceReport,
} = require('../controllers/attendanceController');
const { protect, authorize } = require('../middleware/auth');

// Lock down all routes behind authentication checks
router.use(protect);

router.post('/checkin', checkIn);
router.post('/checkout', checkOut);
router.get('/status', getTodayStatus);
router.get('/my-history', getMyAttendanceHistory);

// Manager and Admin restricted routes
router.get('/team', authorize('manager', 'admin'), getTeamAttendance);
router.get('/report', authorize('manager', 'admin'), getMonthlyAttendanceReport);
router.put('/shift/:employeeId', authorize('manager', 'admin'), updateEmployeeShift);

module.exports = router;
