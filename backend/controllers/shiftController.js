const Shift = require('../models/Shift');
const User = require('../models/User');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

// Convert 12-hour format to 24-hour format for comparison
const convertTo24Hour = (time12h) => {
  const [time, modifier] = time12h.split(' ');
  let [hours, minutes] = time.split(':');
  
  if (hours === '12') {
    hours = '00';
  }
  
  if (modifier === 'PM') {
    hours = parseInt(hours, 10) + 12;
  }
  
  return `${hours}:${minutes}`;
};

// @desc    Create a new shift
// @route   POST /api/v1/shifts
// @access  Private/Admin
exports.createShift = catchAsync(async (req, res, next) => {
  const { employee, date, startTime, endTime } = req.body;
  
  // 1) Basic validation
  if (!employee || !date || !startTime || !endTime) {
    return next(new AppError('Please provide all required fields', 400));
  }
  
  // 2) Check if employee exists and is an employee
  const employeeDoc = await User.findOne({ _id: employee, role: 'employee' });
  if (!employeeDoc) {
    return next(new AppError('No employee found with that ID', 404));
  }
  
  // 3) Validate date format (YYYY-MM-DD)
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!date.match(dateRegex)) {
    return next(new AppError('Invalid date format. Please use YYYY-MM-DD', 400));
  }
  
  // 4) Validate time format (HH:MM AM/PM)
  const timeRegex = /^(0?[1-9]|1[0-2]):[0-5][0-9]\s?(?:AM|PM)$/i;
  if (!startTime.match(timeRegex) || !endTime.match(timeRegex)) {
    return next(new AppError('Invalid time format. Please use HH:MM AM/PM', 400));
  }
  
  // 5) Check if start time is before end time (accounting for overnight shifts)
  const start = new Date(`1970-01-01 ${startTime}`);
  const end = new Date(`1970-01-01 ${endTime}`);
  const diff = (end - start) / (1000 * 60 * 60);
  const hours = diff < 0 ? diff + 24 : diff;
  
  // 6) Check if shift is at least 4 hours
  if (hours < 4) {
    return next(new AppError('Shift must be at least 4 hours long', 400));
  }
  
  // 7) Check for overlapping shifts
  try {
    const hasOverlap = await Shift.hasOverlappingShift(employee, date, startTime, endTime);
    if (hasOverlap) {
      return next(new AppError('This employee already has a shift that overlaps with the specified time', 400));
    }
  } catch (error) {
    return next(new AppError(error.message, 400));
  }
  
  // 8) Create the shift
  const shift = await Shift.create({
    employee,
    date,
    startTime: startTime.toUpperCase(), // Ensure consistent case
    endTime: endTime.toUpperCase(),     // Ensure consistent case
    hours
  });
  
  // Populate employee details in the response
  await shift.populate('employee', 'name email employeeCode department');
  
  res.status(201).json({
    status: 'success',
    data: {
      shift
    }
  });
});

// @desc    Get all shifts (admin) or employee's shifts (employee)
// @route   GET /api/v1/shifts
// @access  Private
exports.getAllShifts = catchAsync(async (req, res, next) => {
  let query;
  
  // If user is admin, get all shifts, otherwise only get their own shifts
  if (req.user.role === 'admin') {
    query = Shift.find().populate('employee', 'name email employeeCode department');
  } else {
    return next(new AppError('Not authorized to access this route', 403));
  }
  
  // Filtering
  const queryObj = { ...req.query };
  const excludedFields = ['page', 'sort', 'limit', 'fields'];
  excludedFields.forEach(el => delete queryObj[el]);
  
  // Advanced filtering
  let queryStr = JSON.stringify(queryObj);
  queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, match => `$${match}`);
  
  query = query.find(JSON.parse(queryStr));
  
  // Sorting
  if (req.query.sort) {
    const sortBy = req.query.sort.split(',').join(' ');
    query = query.sort(sortBy);
  } else {
    query = query.sort('-createdAt');
  }
  
  // Pagination
  const page = req.query.page * 1 || 1;
  const limit = req.query.limit * 1 || 10;
  const skip = (page - 1) * limit;
  
  query = query.skip(skip).limit(limit);
  
  // Execute query
  const shifts = await query;
  
  res.status(200).json({
    status: 'success',
    results: shifts.length,
    data: {
      shifts
    }
  });
});

// @desc    Get all shifts for the logged-in employee
// @route   GET /api/v1/shifts/my-shifts
// @access  Private/Employee
exports.getMyShifts = catchAsync(async (req, res, next) => {
  const shifts = await Shift.find({ employee: req.user.id })
    .sort('-date')
    .populate('employee', 'name employeeCode department');

  res.status(200).json({
    status: 'success',
    results: shifts.length,
    data: {
      shifts
    }
  });
});

// @desc    Get a single shift
// @route   GET /api/v1/shifts/:id
// @access  Private
exports.getShift = catchAsync(async (req, res, next) => {
  let query = Shift.findById(req.params.id);
  
  if (req.user.role === 'admin') {
    query = query.populate('employee', 'name email employeeCode department');
  }
  
  const shift = await query;
  
  if (!shift) {
    return next(new AppError('No shift found with that ID', 404));
  }
  
  // Check if the user is authorized to view this shift
  if (req.user.role !== 'admin' && shift.employee.toString() !== req.user.id) {
    return next(new AppError('You are not authorized to view this shift', 403));
  }
  
  res.status(200).json({
    status: 'success',
    data: {
      shift
    }
  });
});

// @desc    Update a shift
// @route   PATCH /api/v1/shifts/:id
// @access  Private/Admin
exports.updateShift = catchAsync(async (req, res, next) => {
  const { date, startTime, endTime, employee: employeeId } = req.body;
  
  // 1) Get the shift
  const shift = await Shift.findById(req.params.id).populate('employee');
  if (!shift) {
    return next(new AppError('No shift found with that ID', 404));
  }
  
  // 2) If changing employee, verify the new employee exists and is an employee
  if (employeeId && employeeId !== shift.employee._id.toString()) {
    const newEmployee = await User.findOne({ _id: employeeId, role: 'employee' });
    if (!newEmployee) {
      return next(new AppError('No employee found with that ID', 404));
    }
  }
  
  // 3) Check if shift is at least 4 hours
  const effectiveStartTime = startTime || shift.startTime;
  const effectiveEndTime = endTime || shift.endTime;
  
  const start = new Date(`1970-01-01 ${effectiveStartTime}`);
  const end = new Date(`1970-01-01 ${effectiveEndTime}`);
  let diff = (end - start) / (1000 * 60 * 60);
  diff = diff < 0 ? diff + 24 : diff; // Handle overnight shifts
  
  if (diff < 4) {
    return next(new AppError('Shift must be at least 4 hours long', 400));
  }
  
  // 4) Check for overlapping shifts (excluding current shift)
  const effectiveDate = date || shift.date;
  const effectiveEmployeeId = employeeId || shift.employee._id;
  
  const hasOverlap = await Shift.hasOverlappingShift(
    effectiveEmployeeId,
    effectiveDate,
    effectiveStartTime,
    effectiveEndTime,
    shift._id
  );
  
  if (hasOverlap) {
    return next(new AppError('This employee already has a shift that overlaps with the specified time', 400));
  }
  
  // 5) Update the shift
  const updateFields = { ...req.body };
  
  // If time is updated, recalculate hours
  if (startTime || endTime) {
    updateFields.hours = diff;
  }
  
  const updatedShift = await Shift.findByIdAndUpdate(
    req.params.id,
    updateFields,
    {
      new: true,
      runValidators: true,
      populate: 'employee'
    }
  );
  
  res.status(200).json({
    status: 'success',
    data: {
      shift: updatedShift
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
