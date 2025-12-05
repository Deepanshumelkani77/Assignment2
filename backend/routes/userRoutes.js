const express = require('express');
const userController = require('../controllers/userController');
const auth = require('../middleware/auth');
const rbac = require('../middleware/rbac');

const router = express.Router();

// Protect all routes with authentication
router.use(auth.protect);

// Admin-only routes
router.use(rbac.restrictTo('admin'));

// GET /api/v1/users/active-count - Get count of active employees (admin only)
router.get('/active-count', userController.getActiveEmployeesCount);

// GET /api/v1/users/employees - Get all employees (admin only)
router.get('/employees', userController.getAllEmployees);

// GET /api/v1/users/:id - Get specific user (admin only)
router.get('/:id', userController.getEmployee);

module.exports = router;
