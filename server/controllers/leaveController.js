const Leave = require('../models/Leave');
const User = require('../models/User');

// @desc    Apply for a leave
// @route   POST /api/leaves
// @access  Private
exports.applyLeave = async (req, res) => {
  try {
    const { type, startDate, endDate, reason } = req.body;

    if (!type || !startDate || !endDate || !reason) {
      return res.status(400).json({ success: false, error: 'Please provide all required fields' });
    }

    const leave = await Leave.create({
      employeeId: req.user.id,
      type,
      startDate,
      endDate,
      reason,
    });

    res.status(201).json({
      success: true,
      data: leave,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Get leave requests (Filters based on role)
// @route   GET /api/leaves
// @access  Private
exports.getLeaves = async (req, res) => {
  try {
    let query = {};

    // Filter by role
    if (req.user.role === 'employee') {
      // Employees see only their own leave requests
      query.employeeId = req.user.id;
    } else if (req.user.role === 'manager') {
      // Managers can see all leaves, or we can filter leaves of employees who report to them or are in the same department
      // Let's filter by department for standard managers, or fetch all. Let's fetch all and populate to display.
      // But to be awesome, let's show all so the manager has full visibility, or prioritize leaves for employees they manage.
      // We will populate user department, and let frontend filter, or query directly.
    }

    const leaves = await Leave.find(query)
      .populate('employeeId', 'name email department designation role')
      .populate('approvedBy', 'name designation')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: leaves.length,
      data: leaves,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Update leave status (Approve/Reject)
// @route   PUT /api/leaves/:id
// @access  Private (Admin & Manager Only)
exports.updateLeaveStatus = async (req, res) => {
  try {
    const { status, comment } = req.body;

    if (!status || !['Approved', 'Rejected'].includes(status)) {
      return res.status(400).json({ success: false, error: 'Please provide a valid status (Approved or Rejected)' });
    }

    let leave = await Leave.findById(req.params.id);

    if (!leave) {
      return res.status(404).json({ success: false, error: 'Leave request not found' });
    }

    // Verify manager/admin access
    // Admin can do anything; manager can review if they are not the requester
    if (leave.employeeId.toString() === req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'You cannot approve or reject your own leave request' });
    }

    leave.status = status;
    leave.comment = comment || '';
    leave.approvedBy = req.user.id;

    await leave.save();

    // Reload with populated fields for returning
    leave = await Leave.findById(req.params.id)
      .populate('employeeId', 'name email department designation')
      .populate('approvedBy', 'name designation');

    res.status(200).json({
      success: true,
      data: leave,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
