const Attendance = require('../models/Attendance');
const User = require('../models/User');

// Helper to get today's date in local YYYY-MM-DD format
const getLocalDateString = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Helper to parse time string (e.g., "09:30") into a Date object for comparison
const parseShiftTime = (timeStr) => {
  const [hours, minutes] = timeStr.split(':').map(Number);
  const d = new Date();
  d.setHours(hours, minutes, 0, 0);
  return d;
};

// @desc    Employee Check-in
// @route   POST /api/attendance/checkin
// @access  Private
exports.checkIn = async (req, res) => {
  try {
    const employeeId = req.user.id;
    const todayStr = getLocalDateString();

    // 1. Check if already checked in today
    const existingRecord = await Attendance.findOne({ employee: employeeId, date: todayStr });
    if (existingRecord) {
      return res.status(400).json({ success: false, error: 'You have already checked in for today.' });
    }

    // 2. Fetch employee's shift configurations
    const employee = await User.findById(employeeId);
    if (!employee) {
      return res.status(404).json({ success: false, error: 'Employee not found.' });
    }

    const userShift = {
      name: (employee.shift && employee.shift.name) ? employee.shift.name : 'Morning',
      startTime: (employee.shift && employee.shift.startTime) ? employee.shift.startTime : '09:00',
      endTime: (employee.shift && employee.shift.endTime) ? employee.shift.endTime : '17:00'
    };
    const now = new Date();
    
    // 3. Calculate late arrival minutes (e.g. shift starts at 09:00, grace is 15 minutes, check-in at 09:20)
    const shiftStart = parseShiftTime(userShift.startTime);
    let status = 'Present';
    let lateMinutes = 0;

    // Grace period threshold (15 minutes past start time)
    const graceTime = new Date(shiftStart.getTime() + 15 * 60 * 1000);

    if (now > graceTime) {
      status = 'Late';
      const diffMs = now - shiftStart;
      lateMinutes = Math.round(diffMs / (1000 * 60)); // convert to minutes
    }

    // 4. Create attendance document
    const attendance = await Attendance.create({
      employee: employeeId,
      date: todayStr,
      checkIn: now,
      status,
      shift: userShift.name,
      lateMinutes,
    });

    res.status(201).json({
      success: true,
      data: attendance,
      message: status === 'Late' ? `Checked in late by ${lateMinutes} minutes.` : 'Checked in successfully.',
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Employee Check-out
// @route   POST /api/attendance/checkout
// @access  Private
exports.checkOut = async (req, res) => {
  try {
    const employeeId = req.user.id;
    const todayStr = getLocalDateString();

    // 1. Find today's check-in record
    const attendance = await Attendance.findOne({ employee: employeeId, date: todayStr });
    if (!attendance) {
      return res.status(400).json({ success: false, error: 'No check-in record found for today. Please check in first.' });
    }

    if (attendance.checkOut) {
      return res.status(400).json({ success: false, error: 'You have already checked out for today.' });
    }

    const now = new Date();
    
    // 2. Calculate hours worked and overtime
    const checkInTime = new Date(attendance.checkIn);
    const diffMs = now - checkInTime;
    const hoursWorked = diffMs / (1000 * 60 * 60);

    // Standard Shift is 8 hours. Overtime applies to extra hours worked
    let overtimeHours = 0;
    if (hoursWorked > 8) {
      overtimeHours = parseFloat((hoursWorked - 8).toFixed(2));
    }

    // 3. Update attendance record
    attendance.checkOut = now;
    attendance.overtimeHours = overtimeHours;
    await attendance.save();

    res.status(200).json({
      success: true,
      data: attendance,
      message: `Checked out successfully. Hours worked: ${hoursWorked.toFixed(2)}h. Overtime: ${overtimeHours}h.`,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Get Today's Check Status
// @route   GET /api/attendance/status
// @access  Private
exports.getTodayStatus = async (req, res) => {
  try {
    const todayStr = getLocalDateString();
    const attendance = await Attendance.findOne({ employee: req.user.id, date: todayStr });
    
    res.status(200).json({
      success: true,
      data: attendance || null,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Get Personal Attendance History
// @route   GET /api/attendance/my-history
// @access  Private
exports.getMyAttendanceHistory = async (req, res) => {
  try {
    const history = await Attendance.find({ employee: req.user.id })
      .sort({ date: -1 })
      .limit(30);

    res.status(200).json({
      success: true,
      count: history.length,
      data: history,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Get Team Active Attendance (Managers Only)
// @route   GET /api/attendance/team
// @access  Private (Manager/Admin Only)
exports.getTeamAttendance = async (req, res) => {
  try {
    const todayStr = getLocalDateString();
    
    // Find all employees reporting to this manager
    const teamMembers = await User.find({ manager: req.user.id });
    const teamIds = teamMembers.map(emp => emp._id);

    // Find attendance records for team members today
    const attendanceRecords = await Attendance.find({
      employee: { $in: teamIds },
      date: todayStr
    });

    // Create a mapping of employee ID to attendance record
    const attendanceMap = {};
    attendanceRecords.forEach(rec => {
      attendanceMap[rec.employee.toString()] = rec;
    });

    // Combine team member details with today's status
    const teamStatus = teamMembers.map(emp => {
      const record = attendanceMap[emp._id.toString()];
      return {
        _id: emp._id,
        name: emp.name,
        email: emp.email,
        designation: emp.designation,
        department: emp.department,
        shift: {
          name: (emp.shift && emp.shift.name) ? emp.shift.name : 'Morning',
          startTime: (emp.shift && emp.shift.startTime) ? emp.shift.startTime : '09:00',
          endTime: (emp.shift && emp.shift.endTime) ? emp.shift.endTime : '17:00',
        },
        attendanceToday: record ? {
          checkIn: record.checkIn,
          checkOut: record.checkOut,
          status: record.status,
          lateMinutes: record.lateMinutes,
          overtimeHours: record.overtimeHours
        } : null
      };
    });

    res.status(200).json({
      success: true,
      count: teamStatus.length,
      data: teamStatus
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Update Employee Shift Schedule
// @route   PUT /api/attendance/shift/:employeeId
// @access  Private (Manager/Admin Only)
exports.updateEmployeeShift = async (req, res) => {
  try {
    const { shiftName } = req.body;
    if (!['Morning', 'Evening', 'Night'].includes(shiftName)) {
      return res.status(400).json({ success: false, error: 'Invalid shift name. Must be Morning, Evening, or Night.' });
    }

    // Set shift start & end times based on shift name
    let startTime = '09:00';
    let endTime = '17:00';
    if (shiftName === 'Evening') {
      startTime = '17:00';
      endTime = '01:00';
    } else if (shiftName === 'Night') {
      startTime = '01:00';
      endTime = '09:00';
    }

    const employee = await User.findById(req.params.employeeId);
    if (!employee) {
      return res.status(404).json({ success: false, error: 'Employee not found.' });
    }

    // Verify manager permissions unless admin
    if (req.user.role !== 'admin' && employee.manager?.toString() !== req.user.id) {
      return res.status(403).json({ success: false, error: 'Not authorized to change shift for this employee.' });
    }

    employee.shift = {
      name: shiftName,
      startTime,
      endTime
    };
    await employee.save();

    res.status(200).json({
      success: true,
      data: employee,
      message: `Successfully scheduled employee shift to ${shiftName} (${startTime} - ${endTime}).`
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Get Monthly Attendance Audit Report (Admins/Managers Only)
// @route   GET /api/attendance/report
// @access  Private (Manager/Admin Only)
exports.getMonthlyAttendanceReport = async (req, res) => {
  try {
    let usersQuery = {};
    
    // If manager, only pull reporting team members
    if (req.user.role === 'manager') {
      usersQuery.manager = req.user.id;
    }

    const employees = await User.find(usersQuery).select('name email designation department shift manager');
    const employeeIds = employees.map(emp => emp._id);

    // Fetch all attendance records for these employees
    const records = await Attendance.find({ employee: { $in: employeeIds } });

    // Group records by employee and aggregate statistics
    const reportMap = {};
    employeeIds.forEach(id => {
      reportMap[id.toString()] = {
        presentCount: 0,
        lateCount: 0,
        totalOvertime: 0,
        recordsList: []
      };
    });

    records.forEach(rec => {
      const empIdStr = rec.employee.toString();
      if (reportMap[empIdStr]) {
        reportMap[empIdStr].presentCount += 1;
        if (rec.status === 'Late') {
          reportMap[empIdStr].lateCount += 1;
        }
        reportMap[empIdStr].totalOvertime += rec.overtimeHours || 0;
        reportMap[empIdStr].recordsList.push(rec);
      }
    });

    const reportData = employees.map(emp => {
      const stats = reportMap[emp._id.toString()] || { presentCount: 0, lateCount: 0, totalOvertime: 0 };
      return {
        _id: emp._id,
        name: emp.name,
        email: emp.email,
        designation: emp.designation,
        department: emp.department,
        shift: {
          name: (emp.shift && emp.shift.name) ? emp.shift.name : 'Morning',
          startTime: (emp.shift && emp.shift.startTime) ? emp.shift.startTime : '09:00',
          endTime: (emp.shift && emp.shift.endTime) ? emp.shift.endTime : '17:00',
        },
        presentDays: stats.presentCount,
        lateDays: stats.lateCount,
        totalOvertimeHours: parseFloat(stats.totalOvertime.toFixed(2)),
      };
    });

    res.status(200).json({
      success: true,
      count: reportData.length,
      data: reportData
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
