const User = require('../models/User');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

// @desc    Get active employees count
// @route   GET /api/v1/users/active-count
// @access  Private/Admin
exports.getActiveEmployeesCount = catchAsync(async (req, res, next) => {
  const activeUsers = await User.find({ 
    role: 'employee',
    active: true 
  }).countDocuments();

  res.status(200).json({
    status: 'success',
    data: {
      activeUsers
    }
  });
});

// @desc    Get all employees (for admin)
// @route   GET /api/v1/users/employees
// @access  Private/Admin
exports.getAllEmployees = catchAsync(async (req, res, next) => {
  const employees = await User.find({ role: 'employee' })
    .select('-password -__v -createdAt -updatedAt');

  res.status(200).json({
    status: 'success',
    results: employees.length,
    data: {
      employees
    }
  });
});

// @desc    Get employee details
// @route   GET /api/v1/users/:id
// @access  Private/Admin
exports.getEmployee = catchAsync(async (req, res, next) => {
  const employee = await User.findById(req.params.id)
    .select('-password -__v -createdAt -updatedAt');

  if (!employee || employee.role !== 'employee') {
    return next(new AppError('No employee found with that ID', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      employee
    }
  });
});
