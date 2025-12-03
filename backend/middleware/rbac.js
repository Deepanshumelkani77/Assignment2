const AppError = require('../utils/appError');

// Higher-order function to check user roles
const restrictTo = (...roles) => {
  return (req, res, next) => {
    // roles is an array of allowed roles, e.g., ['admin', 'employee']
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('You do not have permission to perform this action', 403)
      );
    }
    next();
  };
};

// Middleware to check if user is the owner of the resource or an admin
const checkOwnership = (model) => {
  return async (req, res, next) => {
    try {
      if (!req.params.id) {
        return next(new AppError('Resource ID is required', 400));
      }
      
      const doc = await model.findById(req.params.id);
      
      if (!doc) {
        return next(new AppError('No document found with that ID', 404));
      }
      
      // Allow admins to access any resource
      if (req.user.role === 'admin') {
        return next();
      }
      
      // Check if the user is the owner of the resource
      const ownerId = doc.employee?._id ? doc.employee._id.toString() : doc.employee?.toString();
      if (ownerId && ownerId === req.user.id) {
        return next();
      }
      
      return next(
        new AppError('You do not have permission to access this resource', 403)
      );
    } catch (error) {
      next(error);
    }
  };
};

module.exports = {
  restrictTo,
  checkOwnership
};
