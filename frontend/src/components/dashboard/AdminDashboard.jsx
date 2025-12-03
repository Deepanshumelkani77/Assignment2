import React, { useState, useContext, useEffect } from 'react';
import { format, parseISO, isSameDay, parse } from 'date-fns';
import { 
  FaTrash, 
  FaPlus, 
  FaCalendarAlt, 
  FaUser, 
  FaClock, 
  FaSignOutAlt,
  FaUserTie,
  FaUsers,
  FaCalendarDay,
  FaClock as FaClockSolid
} from 'react-icons/fa';
import { toast } from 'react-toastify';
import { AppContext } from '../../context/AppContext';
import LogoutButton from '../auth/LogoutButton';

const AdminDashboard = () => {
  const [shifts, setShifts] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddShiftModal, setShowAddShiftModal] = useState(false);
  const [formData, setFormData] = useState({
    employeeId: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    startTime: '09:00',
    endTime: '13:00'
  });
  const [formErrors, setFormErrors] = useState({});
  const { user, API_URL, authToken, logout } = useContext(AppContext);
  
  // Format time to 12-hour format with AM/PM
  const formatTime = (timeStr) => {
    const [hours, minutes] = timeStr.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };
  
  // Calculate shift duration in hours
  const calculateDuration = (startTime, endTime) => {
    const [startHours, startMinutes] = startTime.split(':').map(Number);
    const [endHours, endMinutes] = endTime.split(':').map(Number);
    const totalMinutes = (endHours * 60 + endMinutes) - (startHours * 60 + startMinutes);
    return (totalMinutes / 60).toFixed(1);
  };

  // Fetch shifts and employees data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch shifts
        const shiftsRes = await fetch(`${API_URL}/api/v1/shifts`, {
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (!shiftsRes.ok) {
          throw new Error('Failed to fetch shifts');
        }
        
        const shiftsData = await shiftsRes.json();
        
        // Fetch employees for the dropdown
        const employeesRes = await fetch(`${API_URL}/api/v1/shifts/employees`, {
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (!employeesRes.ok) {
          throw new Error('Failed to fetch employees');
        }
        
        const employeesData = await employeesRes.json();
        
        if (shiftsData.status === 'success' && employeesData.status === 'success') {
          // Sort shifts by date and time
          const sortedShifts = shiftsData.data.shifts.sort((a, b) => {
            const dateA = new Date(`${a.date}T${a.startTime}`);
            const dateB = new Date(`${b.date}T${b.startTime}`);
            return dateA - dateB;
          });
          
          setShifts(sortedShifts);
          setEmployees(employeesData.data.employees);
          
          // Set default employee in form if not set
          if (employeesData.data.employees.length > 0 && !formData.employeeId) {
            setFormData(prev => ({
              ...prev,
              employeeId: employeesData.data.employees[0]._id
            }));
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error(error.message || 'Failed to fetch data');
        if (error.message.includes('401')) {
          logout();
        }
      } finally {
        setIsLoading(false);
      }
    };
    
    if (user) {
      fetchData();
    }
  }, [user, API_URL, authToken]);

  // Handle input change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    
    // Clear error when user types
    if (formErrors[name]) {
      setFormErrors({
        ...formErrors,
        [name]: ''
      });
    }
  };

  // Validate form
  const validateForm = () => {
    const errors = {};
    
    if (!formData.employeeId) {
      errors.employeeId = 'Please select an employee';
    }
    
    if (!formData.date) {
      errors.date = 'Date is required';
    }
    
    if (!formData.startTime) {
      errors.startTime = 'Start time is required';
    }
    
    if (!formData.endTime) {
      errors.endTime = 'End time is required';
    } else {
      // Check if end time is after start time
      const [startHours, startMinutes] = formData.startTime.split(':').map(Number);
      const [endHours, endMinutes] = formData.endTime.split(':').map(Number);
      
      const startTotal = startHours * 60 + startMinutes;
      const endTotal = endHours * 60 + endMinutes;
      
      if (endTotal <= startTotal) {
        errors.endTime = 'End time must be after start time';
      }
      
      // Check minimum shift duration (4 hours)
      if ((endTotal - startTotal) < 240) {
        errors.endTime = 'Shift must be at least 4 hours long';
      }
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      const response = await fetch(`${API_URL}/api/v1/shifts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          ...formData,
          startTime: formData.startTime.padStart(5, '0'),
          endTime: formData.endTime.padStart(5, '0')
        })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        toast.success('Shift created successfully');
        // Add new shift to the beginning of the list and sort
        const updatedShifts = [...shifts, data.data.shift].sort((a, b) => {
          const dateA = new Date(`${a.date}T${a.startTime}`);
          const dateB = new Date(`${b.date}T${b.startTime}`);
          return dateA - dateB;
        });
        
        setShifts(updatedShifts);
        setShowAddShiftModal(false);
        
        // Reset form with default values
        setFormData({
          employeeId: employees[0]?._id || '',
          date: format(new Date(), 'yyyy-MM-dd'),
          startTime: '09:00',
          endTime: '13:00'
        });
      } else {
        throw new Error(data.message || 'Failed to create shift');
      }
    } catch (error) {
      console.error('Error creating shift:', error);
      toast.error(error.message || 'Failed to create shift');
      if (error.message.includes('401')) {
        logout();
      }
    }
  };

  // Handle shift deletion
  const handleDeleteShift = async (shiftId) => {
    if (!window.confirm('Are you sure you want to delete this shift?')) {
      return;
    }
    
    try {
      const response = await fetch(`${API_URL}/api/v1/shifts/${shiftId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        toast.success('Shift deleted successfully');
        setShifts(shifts.filter(shift => shift._id !== shiftId));
      } else {
        const data = await response.json();
        throw new Error(data.message || 'Failed to delete shift');
      }
    } catch (error) {
      console.error('Error deleting shift:', error);
      toast.error(error.message || 'Failed to delete shift');
      if (error.message.includes('401')) {
        logout();
      }
    }
  };

  // Group shifts by date
  const groupShiftsByDate = () => {
    const grouped = {};
    
    shifts.forEach(shift => {
      const date = format(parseISO(shift.date), 'yyyy-MM-dd');
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(shift);
    });
    
    // Sort dates in ascending order
    return Object.entries(grouped).sort(([dateA], [dateB]) => 
      new Date(dateA) - new Date(dateB)
    );
  };
  
  // Get employee name by ID
  const getEmployeeName = (employeeId) => {
    const employee = employees.find(emp => emp._id === employeeId);
    return employee ? employee.name : 'Unknown';
  };
  
  // Get employee department by ID
  const getEmployeeDepartment = (employeeId) => {
    const employee = employees.find(emp => emp._id === employeeId);
    return employee ? employee.department : 'N/A';
  };

  // Calculate stats for the dashboard
  const stats = [
    { 
      name: 'Total Employees', 
    },
    {
      name: 'Total Shifts',
      value: shifts.length,
      icon: <FaCalendarDay className="h-6 w-6 text-green-500" />,
      color: 'bg-green-100',
      textColor: 'text-green-800'
    },
    {
      name: 'Shifts Today',
      value: shifts.filter(shift => isSameDay(parseISO(shift.date), new Date())).length,
      icon: <FaCalendarAlt className="h-6 w-6 text-purple-500" />,
      color: 'bg-purple-100',
      textColor: 'text-purple-800'
    },
    {
      name: 'Active Now',
      value: shifts.filter(shift => {
        const now = new Date();
        const [startHours, startMinutes] = shift.startTime.split(':');
        const [endHours, endMinutes] = shift.endTime.split(':');
        
        const shiftDate = new Date(shift.date);
        const shiftStart = new Date(shiftDate);
        shiftStart.setHours(parseInt(startHours), parseInt(startMinutes), 0, 0);
        
        const shiftEnd = new Date(shiftDate);
        shiftEnd.setHours(parseInt(endHours), parseInt(endMinutes), 0, 0);
        
        return now >= shiftStart && now <= shiftEnd;
      }).length,
      icon: <FaClockSolid className="h-6 w-6 text-yellow-500" />,
      color: 'bg-yellow-100',
      textColor: 'text-yellow-800'
    }
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading shifts...</p>
        </div>
      </div>
    );
  }

  const groupedShifts = groupShiftsByDate();
  const today = new Date();
  
  // Filter shifts for today and upcoming
  const todayShifts = shifts.filter(shift => isSameDay(parseISO(shift.date), today));
  const upcomingShifts = shifts.filter(shift => new Date(shift.date) > today);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Shift Management System</h1>
              <p className="text-sm text-gray-500 mt-1">
                Welcome back, <span className="font-medium text-blue-600">{user?.name || 'Admin'}</span>
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowAddShiftModal(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <FaPlus className="mr-2" />
                Add Shift
              </button>
              <LogoutButton />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        {/* Stats */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          {stats.map((stat, index) => (
            <div 
              key={index} 
              className={`${stat.color} overflow-hidden shadow rounded-lg`}
            >
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    {stat.icon}
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dt className="text-sm font-medium text-gray-900 truncate">
                      {stat.name}
                    </dt>
                    <dd className="flex items-baseline">
                      <div className={`text-2xl font-semibold ${stat.textColor}`}>
                        {stat.value}
                      </div>
                    </dd>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Today's Shifts */}
        {todayShifts.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-gray-900">Today's Shifts</h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {todayShifts.length} {todayShifts.length === 1 ? 'shift' : 'shifts'}
              </span>
            </div>
            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
              <ul className="divide-y divide-gray-200">
                {todayShifts.map((shift) => (
                  <li key={shift._id} className="px-4 py-4 sm:px-6 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <FaUserTie className="h-5 w-5 text-blue-600" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {getEmployeeName(shift.employeeId)}
                            <span className="ml-2 text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                              {getEmployeeDepartment(shift.employeeId)}
                            </span>
                          </div>
                          <div className="text-sm text-gray-500 mt-1">
                            <span className="flex items-center">
                              <FaClock className="mr-1.5 h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                              {formatTime(shift.startTime)} - {formatTime(shift.endTime)}
                              <span className="mx-2 text-gray-300">•</span>
                              <span>{calculateDuration(shift.startTime, shift.endTime)} hours</span>
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleDeleteShift(shift._id)}
                          className="text-red-600 hover:text-red-900 p-1 rounded-full hover:bg-red-50"
                          title="Delete shift"
                        >
                          <FaTrash className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Upcoming Shifts */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-gray-900">
              {upcomingShifts.length > 0 ? 'Upcoming Shifts' : 'No Upcoming Shifts'}
            </h2>
            {upcomingShifts.length > 0 && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                {upcomingShifts.length} {upcomingShifts.length === 1 ? 'shift' : 'shifts'}
              </span>
            )}
          </div>
          
          {upcomingShifts.length > 0 ? (
            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
              <ul className="divide-y divide-gray-200">
                {groupedShifts.map(([date, dateShifts]) => {
                  const shiftDate = parseISO(date);
                  if (shiftDate <= today) return null;
                  
                  return (
                    <li key={date}>
                      <div className="px-4 py-4 sm:px-6">
                        <div className="flex items-center">
                          <h3 className="text-base font-medium text-gray-900">
                            {format(shiftDate, 'EEEE, MMMM d, yyyy')}
                          </h3>
                          <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {dateShifts.length} {dateShifts.length === 1 ? 'shift' : 'shifts'}
                          </span>
                        </div>
                        <div className="mt-2 space-y-3">
                          {dateShifts.map((shift) => (
                            <div 
                              key={shift._id} 
                              className="bg-gray-50 p-4 rounded-lg border border-gray-200"
                            >
                              <div className="flex items-start justify-between">
                                <div>
                                  <div className="flex items-center">
                                    <div className="flex-shrink-0 h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                                      <FaUser className="h-4 w-4 text-blue-600" />
                                    </div>
                                    <div className="ml-3">
                                      <p className="text-sm font-medium text-gray-900">
                                        {getEmployeeName(shift.employeeId)}
                                      </p>
                                      <div className="mt-1 flex items-center text-sm text-gray-500">
                                        <FaClock className="flex-shrink-0 mr-1.5 h-3.5 w-3.5 text-gray-400" />
                                        {formatTime(shift.startTime)} - {formatTime(shift.endTime)}
                                        <span className="mx-2 text-gray-300">•</span>
                                        <span>{calculateDuration(shift.startTime, shift.endTime)} hours</span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                                <div className="flex space-x-2">
                                  <button
                                    onClick={() => handleDeleteShift(shift._id)}
                                    className="text-red-600 hover:text-red-900 p-1 rounded-full hover:bg-red-50"
                                    title="Delete shift"
                                  >
                                    <FaTrash className="h-4 w-4" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          ) : (
            <div className="text-center py-12 bg-white shadow sm:rounded-lg">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No upcoming shifts</h3>
              <p className="mt-1 text-sm text-gray-500">Get started by adding a new shift.</p>
              <div className="mt-6">
                <button
                  type="button"
                  onClick={() => setShowAddShiftModal(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <FaPlus className="-ml-1 mr-2 h-5 w-5" />
                  New Shift
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Add Shift Modal */}
      {showAddShiftModal && (
        <div className="fixed z-50 inset-0 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={() => setShowAddShiftModal(false)}></div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 sm:mx-0 sm:h-10 sm:w-10">
                    <FaCalendarAlt className="h-6 w-6 text-blue-600" aria-hidden="true" />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                    <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                      Add New Shift
                    </h3>
                    <div className="mt-2">
                      <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Employee Select */}
                        <div>
                          <label htmlFor="employeeId" className="block text-sm font-medium text-gray-700">
                            Employee
                          </label>
                          <select
                            id="employeeId"
                            name="employeeId"
                            value={formData.employeeId}
                            onChange={handleInputChange}
                            className={`mt-1 block w-full pl-3 pr-10 py-2 text-base border ${formErrors.employeeId ? 'border-red-300' : 'border-gray-300'} focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md`}
                          >
                            {employees.map((employee) => (
                              <option key={employee._id} value={employee._id}>
                                {employee.name} ({employee.email})
                              </option>
                            ))}
                          </select>
                          {formErrors.employeeId && (
                            <p className="mt-1 text-sm text-red-600">{formErrors.employeeId}</p>
                          )}
                        </div>

                        {/* Date Picker */}
                        <div>
                          <label htmlFor="date" className="block text-sm font-medium text-gray-700">
                            Date
                          </label>
                          <div className="mt-1 relative rounded-md shadow-sm">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <FaCalendarAlt className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                              type="date"
                              name="date"
                              id="date"
                              value={formData.date}
                              onChange={handleInputChange}
                              min={format(new Date(), 'yyyy-MM-dd')}
                              className={`pl-10 block w-full border ${formErrors.date ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                            />
                          </div>
                          {formErrors.date && (
                            <p className="mt-1 text-sm text-red-600">{formErrors.date}</p>
                          )}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          {/* Start Time */}
                          <div>
                            <label htmlFor="startTime" className="block text-sm font-medium text-gray-700">
                              Start Time
                            </label>
                            <div className="mt-1 relative rounded-md shadow-sm">
                              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <FaClock className="h-4 w-4 text-gray-400" />
                              </div>
                              <input
                                type="time"
                                name="startTime"
                                id="startTime"
                                value={formData.startTime}
                                onChange={handleInputChange}
                                className={`pl-10 block w-full border ${formErrors.startTime ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                              />
                            </div>
                            {formErrors.startTime && (
                              <p className="mt-1 text-sm text-red-600">{formErrors.startTime}</p>
                            )}
                          </div>

                          {/* End Time */}
                          <div>
                            <label htmlFor="endTime" className="block text-sm font-medium text-gray-700">
                              End Time
                            </label>
                            <div className="mt-1 relative rounded-md shadow-sm">
                              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <FaClock className="h-4 w-4 text-gray-400" />
                              </div>
                              <input
                                type="time"
                                name="endTime"
                                id="endTime"
                                value={formData.endTime}
                                onChange={handleInputChange}
                                className={`pl-10 block w-full border ${formErrors.endTime ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                              />
                            </div>
                            {formErrors.endTime && (
                              <p className="mt-1 text-sm text-red-600">{formErrors.endTime}</p>
                            )}
                          </div>
                        </div>

                        {/* Duration Preview */}
                        <div className="bg-blue-50 p-3 rounded-md">
                          <p className="text-sm text-blue-700">
                            <span className="font-medium">Shift Duration:</span>{' '}
                            {formData.startTime && formData.endTime ? (
                              <>
                                {calculateDuration(formData.startTime, formData.endTime)} hours
                                {parseFloat(calculateDuration(formData.startTime, formData.endTime)) < 4 && (
                                  <span className="ml-2 text-red-600">
                                    (Minimum 4 hours required)
                                  </span>
                                )}
                              </>
                            ) : '--'}
                          </p>
                        </div>
                      </form>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={handleSubmit}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Save Shift
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddShiftModal(false)}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
