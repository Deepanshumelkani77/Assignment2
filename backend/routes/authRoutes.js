const express = require('express');
const authController = require('../controllers/authController');
const auth = require('../middleware/auth');

const router = express.Router();

// Authentication routes
router.post('/register', authController.register);
router.post('/login', authController.login);

// Protected routes (require authentication)
router.use(auth.protect);

router.get('/me', authController.getMe);
router.put('/updatedetails', authController.updateDetails);
router.put('/updatepassword', authController.updatePassword);

// Admin only routes
router.use(auth.restrictTo('admin'));
// Add admin-only routes here

module.exports = router;
