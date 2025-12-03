const mongoose = require('mongoose');

const shiftSchema = new mongoose.Schema({
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Employee ID is required']
  },
  date: {
    type: Date,
    required: [true, 'Date is required']
  },
  startTime: {
    type: String,
    required: [true, 'Start time is required'],
    match: [/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please enter a valid time in HH:MM format']
  },
  endTime: {
    type: String,
    required: [true, 'End time is required'],
    match: [/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please enter a valid time in HH:MM format'],
    validate: {
      validator: function(v) {
        // End time should be after start time
        const [startHours, startMinutes] = this.startTime.split(':').map(Number);
        const [endHours, endMinutes] = v.split(':').map(Number);
        
        const startTotal = startHours * 60 + startMinutes;
        const endTotal = endHours * 60 + endMinutes;
        
        return endTotal > startTotal;
      },
      message: 'End time must be after start time'
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Add index for faster queries on employee and date
shiftSchema.index({ employeeId: 1, date: 1 });

// Validate minimum shift duration (4 hours)
shiftSchema.pre('save', function(next) {
  const [startHours, startMinutes] = this.startTime.split(':').map(Number);
  const [endHours, endMinutes] = this.endTime.split(':').map(Number);
  
  const startTotal = startHours * 60 + startMinutes;
  const endTotal = endHours * 60 + endMinutes;
  
  if ((endTotal - startTotal) < 240) { // 240 minutes = 4 hours
    const err = new Error('Shift must be at least 4 hours long');
    return next(err);
  }
  
  next();
});

// Method to check for overlapping shifts
shiftSchema.statics.hasOverlappingShift = async function(employeeId, date, startTime, endTime, excludeShiftId = null) {
  const [startHours, startMinutes] = startTime.split(':').map(Number);
  const [endHours, endMinutes] = endTime.split(':').map(Number);
  
  const query = {
    employeeId,
    date: new Date(date),
    $or: [
      // New shift starts during an existing shift
      {
        startTime: { $lte: startTime },
        endTime: { $gt: startTime }
      },
      // New shift ends during an existing shift
      {
        startTime: { $lt: endTime },
        endTime: { $gte: endTime }
      },
      // New shift completely contains an existing shift
      {
        startTime: { $gte: startTime },
        endTime: { $lte: endTime }
      }
    ]
  };
  
  if (excludeShiftId) {
    query._id = { $ne: excludeShiftId };
  }
  
  return this.findOne(query);
};

module.exports = mongoose.model('Shift', shiftSchema);
