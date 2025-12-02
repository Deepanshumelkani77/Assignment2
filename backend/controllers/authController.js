const mongoose = require('mongoose');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { promisify } = require('util');

// Generate JWT Token
const signToken = (id, role) => {
  return jwt.sign(
    { id, role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE }
  );
};

// Create and send token
const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id, user.role);
  
  // Remove password from output
  user.password = undefined;

  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user
    }
  });
};

// @desc    Register a new user
// @route   POST /api/v1/auth/register
// @access  Public
exports.register = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    console.log('Registration request body:', req.body);
    const { name, email, password, role = 'employee', employeeCode, department } = req.body;

    // Basic validation
    if (!name || !email || !password) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        status: 'error',
        message: 'Please provide name, email, and password'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        status: 'error',
        message: 'Please provide a valid email address'
      });
    }

    // Check if email already exists
    const existingUser = await User.findOne({ email }).session(session);
    if (existingUser) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        status: 'error',
        message: 'Email already in use'
      });
    }

    // Handle employee-specific validations
    if (role === 'employee') {
      if (!employeeCode || !department) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({
          status: 'error',
          message: 'Employee code and department are required'
        });
      }

      // Check if employee code is already taken
      const existingEmployee = await User.findOne({ employeeCode }).session(session);
      if (existingEmployee) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({
          status: 'error',
          message: 'Employee code already in use'
        });
      }
    }

    // Create user data object
    const userData = {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password,
      role
    };

    // Only add employee-specific fields for employee role
    if (role === 'employee') {
      userData.employeeCode = employeeCode.trim();
      userData.department = department.trim();
    }

    // Create the user
    const newUser = new User(userData);
    await newUser.save({ session });
    
    // Commit the transaction
    await session.commitTransaction();
    await session.endSession();

    // Remove password from output
    newUser.password = undefined;

    // Send response with token
    createSendToken(newUser, 201, res);

  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    
    console.error('Registration error:', error);
    
    // Handle duplicate key errors
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({
        status: 'error',
        message: 'User with this email or employee code already exists'
      });
    }
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({
        status: 'error',
        message: `Validation error: ${messages.join(', ')}`
      });
    }
    
    // Handle other errors
    res.status(500).json({
      status: 'error',
      message: 'An error occurred during registration. Please try again.'
    });
  }
};

// @desc    Login user
// @route   POST /api/v1/auth/login
// @access  Public
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // 1) Check if email and password exist
    if (!email || !password) {
      return res.status(400).json({
        status: 'error',
        message: 'Please provide email and password!'
      });
    }

    // 2) Check if user exists && password is correct
    const user = await User.findOne({ email }).select('+password');

    if (!user || !(await user.comparePassword(password, user.password))) {
      return res.status(401).json({
        status: 'error',
        message: 'Incorrect email or password'
      });
    }

    // 3) If everything ok, send token to client
    createSendToken(user, 200, res);
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};

// @desc    Get current logged in user
// @route   GET /api/v1/auth/me
// @access  Private
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    
    res.status(200).json({
      status: 'success',
      data: {
        user
      }
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};

// @desc    Update user details
// @route   PUT /api/v1/auth/updatedetails
// @access  Private
exports.updateDetails = async (req, res, next) => {
  try {
    const fieldsToUpdate = {
      name: req.body.name,
      email: req.body.email,
      ...(req.body.department && { department: req.body.department })
    };

    const user = await User.findByIdAndUpdate(req.user.id, fieldsToUpdate, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      status: 'success',
      data: {
        user
      }
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};

// @desc    Update password
// @route   PUT /api/v1/auth/updatepassword
// @access  Private
exports.updatePassword = async (req, res, next) => {
  try {
    // 1) Get user from collection
    const user = await User.findById(req.user.id).select('+password');

    // 2) Check if POSTed current password is correct
    if (!(await user.comparePassword(req.body.currentPassword, user.password))) {
      return res.status(401).json({
        status: 'error',
        message: 'Your current password is wrong.'
      });
    }

    // 3) If so, update password
    user.password = req.body.newPassword;
    await user.save();

    // 4) Log user in, send JWT
    createSendToken(user, 200, res);
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};
