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
  console.log('Received request to create shift with data:', req.body);
  
  const { employee, date, startTime, endTime } = req.body;
  
  // 1) Basic validation with detailed error messages
  const missingFields = [];
  if (!employee) missingFields.push('employee');
  if (!date) missingFields.push('date');
  if (!startTime) missingFields.push('startTime');
  if (!endTime) missingFields.push('endTime');
  
  if (missingFields.length > 0) {
    console.error('Missing required fields:', missingFields);
    return next(new AppError(`Missing required fields: ${missingFields.join(', ')}`, 400));
  }
  
  // 2) Check if employee exists and is an employee
  let employeeDoc;
  try {
    employeeDoc = await User.findOne({ _id: employee, role: 'employee' });
    console.log('Employee found:', employeeDoc ? employeeDoc._id : 'Not found');
    
    if (!employeeDoc) {
      console.error(`Employee with ID ${employee} not found or not an employee`);
      return next(new AppError('No employee found with that ID or user is not an employee', 404));
    }
  } catch (error) {
    console.error('Error finding employee:', error);
    return next(new AppError('Error validating employee', 500));
  }
  
  // 3) Validate date format (YYYY-MM-DD)
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!date.match(dateRegex)) {
    console.error(`Invalid date format: ${date}. Expected YYYY-MM-DD`);
    return next(new AppError('Invalid date format. Please use YYYY-MM-DD', 400));
  }
  
  // Parse the date to ensure it's valid
  const parsedDate = new Date(date);
  if (isNaN(parsedDate.getTime())) {
    console.error(`Invalid date: ${date}`);
    return next(new AppError('Invalid date provided', 400));
  }
  
  // 4) Validate time format (HH:MM AM/PM)
  const timeRegex = /^(0?[1-9]|1[0-2]):[0-5][0-9]\s?(?:AM|PM)$/i;
  
  if (!startTime) {
    console.error('Start time is required');
    return next(new AppError('Start time is required', 400));
  }
  
  if (!endTime) {
    console.error('End time is required');
    return next(new AppError('End time is required', 400));
  }
  
  if (!startTime.match(timeRegex)) {
    console.error(`Invalid start time format: ${startTime}. Expected HH:MM AM/PM`);
    return next(new AppError(`Invalid start time format: ${startTime}. Please use HH:MM AM/PM`, 400));
  }
  
  if (!endTime.match(timeRegex)) {
    console.error(`Invalid end time format: ${endTime}. Expected HH:MM AM/PM`);
    return next(new AppError(`Invalid end time format: ${endTime}. Please use HH:MM AM/PM`, 400));
  }
  
  // 5) Parse times for validation
  let start, end, hours;
  try {
    start = new Date(`1970-01-01 ${startTime}`);
    end = new Date(`1970-01-01 ${endTime}`);
    
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      console.error('Invalid time values:', { startTime, endTime });
      return next(new AppError('Invalid time values provided', 400));
    }
    
    // 6) Calculate duration
    let diff = (end - start) / (1000 * 60 * 60); // hours
    hours = diff < 0 ? diff + 24 : diff; // handle overnight shifts
    
    console.log('Shift duration calculation:', { 
      startTime, 
      endTime, 
      start: start.toISOString(), 
      end: end.toISOString(),
      diff,
      hours
    });
    
    // 7) Validate shift duration
    if (hours < 4) {
      console.error(`Shift too short: ${hours} hours`);
      return next(new AppError('Shift must be at least 4 hours long', 400));
    }
    
    if (hours > 12) {
      console.error(`Shift too long: ${hours} hours`);
      return next(new AppError('Shift cannot be longer than 12 hours', 400));
    }
  } catch (error) {
    console.error('Error processing shift times:', error);
    return next(new AppError('Error processing shift times', 400));
  }
  
  // 8) Check for overlapping shifts
  try {
    console.log('Checking for overlapping shifts...');
    const hasOverlap = await Shift.hasOverlappingShift(employee, date, startTime, endTime);
    console.log('Overlap check result:', hasOverlap);
    
    if (hasOverlap) {
      console.error('Shift overlaps with existing shift');
      return next(new AppError('This employee already has a shift that overlaps with the specified time', 400));
    }
  } catch (error) {
    console.error('Error checking for overlapping shifts:', error);
    return next(new AppError('Error checking for overlapping shifts: ' + error.message, 400));
  }
  
  // 9) Create the shift
  try {
    console.log('Creating shift with data:', {
      employee,
      date,
      startTime: startTime.toUpperCase(),
      endTime: endTime.toUpperCase(),
      hours
    });
    
    const shift = await Shift.create({
      employee,
      date,
      startTime: startTime.toUpperCase(), // Ensure consistent case
      endTime: endTime.toUpperCase(),     // Ensure consistent case
      hours
    });
    
    console.log('Shift created successfully:', shift._id);
    
    // Populate employee details in the response
    await shift.populate('employee', 'name email employeeCode department');
    
    return res.status(201).json({
      status: 'success',
      data: {
        shift
      }
    });
    
  } catch (error) {
    console.error('Error creating shift:', error);
    
    // Handle duplicate key errors
    if (error.code === 11000) {
      console.error('Duplicate shift detected:', error.keyValue);
      return next(new AppError('A shift with these details already exists', 400));
    }
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(el => el.message);
      console.error('Validation errors:', errors);
      return next(new AppError(`Invalid input data: ${errors.join('. ')}`, 400));
    }
    
    // Handle other errors
    return next(new AppError('Error creating shift: ' + error.message, 500));
  }
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
  try {
    console.log('Fetching shifts for user:', req.user.id);
    
    const shifts = await Shift.find({ employee: req.user.id })
      .sort('-date')
      .populate('employee', 'name email employeeCode department');
    
    console.log('Found shifts:', shifts.length);
    
    res.status(200).json({
      status: 'success',
      results: shifts.length,
      data: {
        shifts
      }
    });
  } catch (error) {
    console.error('Error in getMyShifts:', error);
    next(new AppError('Error fetching shifts', 500));
  }
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
