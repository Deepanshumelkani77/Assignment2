const express = require('express');
const shiftController = require('../controllers/shiftController');
const auth = require('../middleware/auth');
const rbac = require('../middleware/rbac');
const Shift = require('../models/Shift');

const router = express.Router();

// Protect all routes with authentication
router.use(auth.protect);

// Employee routes
router.get('/my-shifts', 
  rbac.restrictTo('employee', 'admin'), 
  shiftController.getMyShifts
);

// Admin-only routes
router.use(rbac.restrictTo('admin'));

// GET /api/v1/shifts - Get all shifts
// POST /api/v1/shifts - Create new shift
router.route('/')
  .get(shiftController.getAllShifts)
  .post(shiftController.createShift);

// Middleware to check ownership for specific shift operations
const checkShiftOwnership = async (req, res, next) => {
  try {
    const shift = await Shift.findById(req.params.id);
    
    if (!shift) {
      return res.status(404).json({
        status: 'error',
        message: 'No shift found with that ID'
      });
    }

    // Allow admin to access any shift
    if (req.user.role === 'admin') {
      return next();
    }

    // Check if the current user owns the shift
    if (shift.employee.toString() !== req.user.id) {
      return res.status(403).json({
        status: 'error',
        message: 'You do not have permission to perform this action'
      });
    }

    next();
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};

// GET /api/v1/shifts/:id - Get single shift
// PATCH /api/v1/shifts/:id - Update shift
// DELETE /api/v1/shifts/:id - Delete shift
router.route('/:id')
  .get(checkShiftOwnership, shiftController.getShift)
  .patch(checkShiftOwnership, shiftController.updateShift)
  .delete(checkShiftOwnership, shiftController.deleteShift);

module.exports = router;
