const mongoose = require('mongoose');

const shiftSchema = new mongoose.Schema({
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Employee is required']
  },
  date: {
    type: Date,
    required: [true, 'Date is required']
  },
  startTime: {
    type: String,
    required: [true, 'Start time is required'],
    validate: {
      validator: function(v) {
        return /^([01]?[0-9]|2[0-3]):[0-5][0-9] (AM|PM)$/.test(v);
      },
      message: 'Please use 12-hour format (e.g., "09:00 AM")'
    }
  },
  endTime: {
    type: String,
    required: [true, 'End time is required'],
    validate: {
      validator: function(v) {
        return /^([01]?[0-9]|2[0-3]):[0-5][0-9] (AM|PM)$/.test(v);
      },
      message: 'Please use 12-hour format (e.g., "05:00 PM")'
    }
  },
  hours: {
    type: Number,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Pre-save hook to validate shift duration
shiftSchema.pre('save', function(next) {
  // Validate shift duration
  if (this.startTime && this.endTime) {
    const start = new Date(`1970-01-01 ${this.startTime}`);
    const end = new Date(`1970-01-01 ${this.endTime}`);
    
    // Handle overnight shifts
    let diff = (end - start) / (1000 * 60 * 60);
    diff = diff < 0 ? diff + 24 : diff; // Convert negative diff (overnight) to positive
    
    // Validate minimum shift duration (4 hours)
    if (diff < 4) {
      return next(new Error('Shift must be at least 4 hours long'));
    }
    
    // Validate maximum shift duration (12 hours)
    if (diff > 12) {
      return next(new Error('Shift cannot be longer than 12 hours'));
    }
    
    this.hours = Math.round(diff * 10) / 10; // Round to 1 decimal place
  }
  
  next();
});

// Index for faster querying
shiftSchema.index({ employee: 1, date: 1 });

// Convert 12-hour time to minutes since midnight
const timeToMinutes = (timeStr) => {
  if (!timeStr) return 0;
  
  const [time, period] = timeStr.split(/(?=[AP]M$)/);
  let [hours, minutes] = time.split(':').map(Number);
  
  // Convert to 24-hour format
  if (period === 'PM' && hours < 12) hours += 12;
  if (period === 'AM' && hours === 12) hours = 0;
  
  return hours * 60 + minutes;
};

// Check if two time ranges overlap
const isTimeOverlap = (start1, end1, start2, end2) => {
  // Convert all times to minutes since midnight for easier comparison
  const s1 = timeToMinutes(start1);
  const e1 = timeToMinutes(end1);
  const s2 = timeToMinutes(start2);
  const e2 = timeToMinutes(end2);
  
  // Handle overnight shifts (end time is next day)
  if (e1 < s1) {
    // First shift is overnight, check if it overlaps with second shift
    return (s2 < e1 || s2 > s1) || (e2 > s1 || e2 < e1);
  }
  
  if (e2 < s2) {
    // Second shift is overnight, check if it overlaps with first shift
    return (s1 < e2 || s1 > s2) || (e1 > s2 || e1 < e2);
  }
  
  // Standard overlap check for same-day shifts
  return s1 < e2 && e1 > s2;
};

// Check for overlapping shifts with comprehensive validation
shiftSchema.statics.hasOverlappingShift = async function(employeeId, date, startTime, endTime, excludeShiftId = null) {
  // First, check if the new shift times are valid
  if (startTime === endTime) {
    throw new Error('Start time and end time cannot be the same');
  }
  
  // Get all shifts for the employee on the given date
  const query = {
    employee: employeeId,
    date: date
  };
  
  if (excludeShiftId) {
    query._id = { $ne: excludeShiftId };
  }
  
  const existingShifts = await this.find(query);
  
  // Check for overlaps with existing shifts
  for (const shift of existingShifts) {
    if (isTimeOverlap(
      startTime, endTime,
      shift.startTime, shift.endTime
    )) {
      return true; // Found an overlapping shift
    }
  }
  
  return false; // No overlaps found
};

const Shift = mongoose.model('Shift', shiftSchema);
module.exports = Shift;
