const express = require('express');
const shiftController = require('../controllers/shiftController');
const auth = require('../middleware/auth');

const router = express.Router();

// Protect all routes after this middleware
router.use(auth.protect);

// Admin only routes
router.route('/')
  .post(auth.restrictTo('admin'), shiftController.createShift)
  .get(shiftController.getAllShifts);

router.route('/employees')
  .get(auth.restrictTo('admin'), shiftController.getEmployees);

router.route('/:id')
  .delete(auth.restrictTo('admin'), shiftController.deleteShift);

module.exports = router;
