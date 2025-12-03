const Shift = require('../models/Shift');
const User = require('../models/User');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

// @desc    Create a new shift
// @route   POST /api/v1/shifts
// @access  Private/Admin
exports.createShift = catchAsync(async (req, res, next) => {
  const { employeeId, date, startTime, endTime } = req.body;

  // Check if employee exists
  const employee = await User.findById(employeeId);
  if (!employee) {
    return next(new AppError('No employee found with that ID', 404));
  }

  // Check for overlapping shifts
  const hasOverlap = await Shift.hasOverlappingShift(employeeId, date, startTime, endTime);
  if (hasOverlap) {
    return next(new AppError('This shift overlaps with an existing shift for this employee', 400));
  }

  // Create new shift
  const shift = await Shift.create({
    employeeId,
    date,
    startTime,
    endTime
  });

  res.status(201).json({
    status: 'success',
    data: {
      shift
    }
  });
});

// @desc    Get all shifts (Admin) or user's shifts (Employee)
// @route   GET /api/v1/shifts
// @access  Private
exports.getAllShifts = catchAsync(async (req, res, next) => {
  let query;
  
  // If user is admin, get all shifts, otherwise get only user's shifts
  if (req.user.role === 'admin') {
    query = Shift.find().populate('employeeId', 'name email');
  } else {
    query = Shift.find({ employeeId: req.user.id });
  }

  // Execute query
  const shifts = await query.sort({ date: 1, startTime: 1 });

  res.status(200).json({
    status: 'success',
    results: shifts.length,
    data: {
      shifts
    }
  });
});

// @desc    Delete a shift
// @route   DELETE /api/v1/shifts/:id
// @access  Private/Admin
exports.deleteShift = catchAsync(async (req, res, next) => {
  const shift = await Shift.findByIdAndDelete(req.params.id);

  if (!shift) {
    return next(new AppError('No shift found with that ID', 404));
  }

  res.status(204).json({
    status: 'success',
    data: null
  });
});

// @desc    Get all employees (for admin to assign shifts)
// @route   GET /api/v1/shifts/employees
// @access  Private/Admin
exports.getEmployees = catchAsync(async (req, res, next) => {
  const employees = await User.find({ role: 'employee' }).select('name email');
  
  res.status(200).json({
    status: 'success',
    results: employees.length,
    data: {
      employees
    }
  });
});
