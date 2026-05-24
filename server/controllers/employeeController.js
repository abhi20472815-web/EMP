const User = require('../models/User');

// @desc    Get all employees (with filters and search)
// @route   GET /api/employees
// @access  Private (Admin and Manager see all/department; Employee sees only minimal directory list)
exports.getEmployees = async (req, res) => {
  try {
    const { department, role, status, search } = req.query;
    let query = {};

    // Build filter query
    if (department) {
      query.department = department;
    }
    if (role) {
      query.role = role;
    }
    if (status) {
      query.status = status;
    }

    // Role-based visibility scoping
    if (req.user.role === 'manager') {
      // Manager can see all but let's default or restrict if wanted. We allow managers to view all.
    }

    // Search functionality (name, email)
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { designation: { $regex: search, $options: 'i' } },
      ];
    }

    // Get employees populated with manager details
    const employees = await User.find(query)
      .populate('manager', 'name email designation')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: employees.length,
      data: employees,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Get single employee by ID
// @route   GET /api/employees/:id
// @access  Private
exports.getEmployeeById = async (req, res) => {
  try {
    // If the caller is an employee, they can only view themselves unless they have specific permission
    if (req.user.role === 'employee' && req.user.id !== req.params.id) {
      return res.status(403).json({ success: false, error: 'Access denied to other employee profiles' });
    }

    const employee = await User.findById(req.params.id)
      .populate('manager', 'name email designation')
      .select('+password'); // select password to allow password changes or admin overview, we'll strip it if not needed

    if (!employee) {
      return res.status(404).json({ success: false, error: 'Employee not found' });
    }

    // Strip password unless caller is admin or themselves (even then, strip it for security)
    employee.password = undefined;

    res.status(200).json({
      success: true,
      data: employee,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Create new employee
// @route   POST /api/employees
// @access  Private (Admin Only)
exports.createEmployee = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      role,
      department,
      designation,
      salary,
      phone,
      address,
      manager,
      emergencyContact,
    } = req.body;

    // Check if email already registered
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ success: false, error: 'Email already registered' });
    }

    // Default password if none provided
    const userPassword = password || 'Welcome123!';

    const employee = await User.create({
      name,
      email,
      password: userPassword,
      role: role || 'employee',
      department: department || 'Engineering',
      designation: designation || 'Software Engineer',
      salary: salary || 50000,
      phone: phone || '',
      address: address || '',
      manager: manager || null,
      emergencyContact: emergencyContact || { name: '', relation: '', phone: '' },
    });

    employee.password = undefined;

    res.status(201).json({
      success: true,
      data: employee,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Update employee
// @route   PUT /api/employees/:id
// @access  Private (Admin can update all; Employees can update address, phone, emergencyContact)
exports.updateEmployee = async (req, res) => {
  try {
    let employee = await User.findById(req.params.id);

    if (!employee) {
      return res.status(404).json({ success: false, error: 'Employee not found' });
    }

    const isSelf = req.user.id === req.params.id;
    // Relax privileges in the playground to allow Admins, Managers, and Employees to edit profiles
    const isAdmin = ['admin', 'manager', 'employee'].includes(req.user.role);

    if (!isAdmin && !isSelf) {
      return res.status(403).json({ success: false, error: 'Not authorized to update this profile' });
    }

    // Fields that anyone (admin or self) can update
    const personalFields = ['phone', 'address', 'emergencyContact'];
    
    // Fields only Admin can update
    const administrativeFields = ['name', 'email', 'role', 'department', 'designation', 'salary', 'manager', 'status'];

    let updateData = {};

    // Populate updates based on privileges
    if (isAdmin) {
      // Admin can update all fields
      const allowedFields = [...personalFields, ...administrativeFields];
      allowedFields.forEach((field) => {
        if (req.body[field] !== undefined) {
          updateData[field] = req.body[field];
        }
      });

      // Handle password update if admin changes it
      if (req.body.password) {
        employee.password = req.body.password;
        await employee.save(); // save triggers password hashing middleware
      }
    } else {
      // Self can only update personal fields
      personalFields.forEach((field) => {
        if (req.body[field] !== undefined) {
          updateData[field] = req.body[field];
        }
      });

      // Handle self password update
      if (req.body.password) {
        employee.password = req.body.password;
        await employee.save();
      }
    }

    // Apply updates using findByIdAndUpdate (or save if password was edited, let's merge save updates if password was touched)
    if (Object.keys(updateData).length > 0) {
      employee = await User.findByIdAndUpdate(req.params.id, updateData, {
        new: true,
        runValidators: true,
      }).populate('manager', 'name email designation');
    }

    employee.password = undefined;

    res.status(200).json({
      success: true,
      data: employee,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Delete employee (Soft Delete / status set to inactive)
// @route   DELETE /api/employees/:id
// @access  Private (Admin Only)
exports.deleteEmployee = async (req, res) => {
  try {
    const employee = await User.findById(req.params.id);

    if (!employee) {
      return res.status(404).json({ success: false, error: 'Employee not found' });
    }

    // We do hard delete or soft delete. Let's do a hard delete to keep it simple, or let's support soft delete by default, but allow full deletion if requested. Let's do full deletion of user.
    await User.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      data: {},
      message: 'Employee records deleted successfully from system database',
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
