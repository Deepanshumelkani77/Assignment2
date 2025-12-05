import React, { useState, useEffect, useContext } from 'react';
import { PlusCircle, Trash2, Edit, Calendar, Clock, User, Search, LogOut, BarChart2, Users, Clock as ClockIcon, Filter, X } from 'react-feather';
import { AppContext } from '../../context/AppContext';
import api from '../../utils/api';
import { format, parseISO, isToday, isTomorrow, isThisWeek, isAfter } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import axios from 'axios';

const AdminDashboard = () => {
  const { user, logout } = useContext(AppContext);
  const [shifts, setShifts] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingShift, setEditingShift] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('shifts'); // 'shifts' or 'employees'
  
  // Form state with validation
  const [formData, setFormData] = useState({
    employee: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    startTime: '09:00',
    endTime: '17:00'
  });
  
  const [formErrors, setFormErrors] = useState({});
  
  // Stats calculation
  const stats = {
    totalShifts: shifts.length,
    activeEmployees: new Set(shifts.map(shift => shift.employee?._id)).size || 0,
    upcomingShifts: shifts.filter(shift => isAfter(parseISO(`${shift.date}T${shift.endTime}`), new Date())).length,
    totalHours: shifts.reduce((acc, shift) => {
      const [startH, startM] = shift.startTime.split(':').map(Number);
      const [endH, endM] = shift.endTime.split(':').map(Number);
      const hours = (endH + endM/60) - (startH + startM/60);
      return acc + (hours > 0 ? hours : 0);
    }, 0).toFixed(1)
  };
  
  // Reset form to default values
  const resetForm = () => {
    setFormData({
      employee: '',
      date: format(new Date(), 'yyyy-MM-dd'),
      startTime: '09:00',
      endTime: '17:00'
    });
    setEditingShift(null);
  };

  const handleLogout = () => {
    logout();
  };

  // Fetch all shifts and employees
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [shiftsRes, employeesRes] = await Promise.all([
          api.get('http://localhost:7000/api/v1/shifts'),
          api.get('http://localhost:7000/api/v1/users/employees')
        ]);
        
        // Add null checks for the response data
        const shiftsData = shiftsRes?.data?.data?.shifts || [];
        const employeesData = employeesRes?.data?.data?.employees || [];
        
        setShifts(shiftsData);
        setEmployees(employeesData);
      } catch (error) {
        console.error('Error fetching data:', error);
        // Set empty arrays on error to prevent undefined errors
        setShifts([]);
        setEmployees([]);
        // Show error message to user
        alert('Failed to load data. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Helper function to convert 24h time to 12h format with AM/PM
  const convertTo12Hour = (time24) => {
    const [hours, minutes] = time24.split(':');
    const parsedHours = parseInt(hours, 10);
    const ampm = parsedHours >= 12 ? 'PM' : 'AM';
    const hours12 = ((parsedHours + 11) % 12 + 1);
    return `${hours12}:${minutes} ${ampm}`;
  };

  // Helper function to convert 24h time to 12h format with AM/PM
  const formatTimeTo12Hour = (time24) => {
    if (!time24) return '';
    
    // Check if already in 12-hour format
    if (time24.includes('AM') || time24.includes('PM')) {
      return time24;
    }
    
    // Ensure time is in HH:MM format
    const [hoursStr, minutes = '00'] = time24.split(':');
    let hours = parseInt(hoursStr, 10);
    
    // Handle invalid hour values
    if (isNaN(hours) || hours < 0 || hours > 23) {
      console.error('Invalid hour value:', hours);
      return '12:00 PM'; // Default to noon if invalid
    }
    
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours || 12; // Convert 0 to 12 for 12 AM/PM
    
    // Ensure minutes are always 2 digits
    const paddedMinutes = minutes.padStart(2, '0');
    return `${hours}:${paddedMinutes} ${ampm}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('handleSubmit called with form data:', formData);
    
    // Basic validation
    if (!formData.employee) {
      console.log('No employee selected');
      toast.error('Please select an employee');
      return;
    }
    
    // Check if the selected date is in the past
    const selectedDate = new Date(formData.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to start of day
    
    if (selectedDate < today) {
      toast.error('Cannot schedule shifts for past dates');
      return;
    }
    
    // If it's today, check the time
    if (selectedDate.getTime() === today.getTime()) {
      const now = new Date();
      const [startHours, startMinutes] = formData.startTime.split(':').map(Number);
      const startTime = new Date();
      startTime.setHours(startHours, startMinutes, 0, 0);
      
      if (startTime < now) {
        toast.error('Cannot schedule shifts in the past. Please select a future time.');
        return;
      }
    }
    
    try {
      // Format times to 12-hour format with AM/PM
      const formattedStartTime = formatTimeTo12Hour(formData.startTime);
      const formattedEndTime = formatTimeTo12Hour(formData.endTime);
      
      // Prepare the payload with properly formatted times
      const payload = {
        employee: formData.employee,
        date: formData.date,
        startTime: formattedStartTime,
        endTime: formattedEndTime
      };
      
      console.log('Sending payload to API:', payload);
      
      let response;
      const apiUrl = editingShift 
        ? `http://localhost:7000/api/v1/shifts/${editingShift._id}`
        : 'http://localhost:7000/api/v1/shifts';
      
      try {
        if (editingShift) {
          // Update existing shift
          console.log('Updating shift with ID:', editingShift._id);
          response = await api.patch(apiUrl, payload);
          console.log('Update response:', response);
          setShifts(shifts.map(shift => 
            shift._id === editingShift._id ? response.data.data.shift : shift
          ));
          toast.success('Shift updated successfully!');
        } else {
          // Create new shift
          console.log('Creating new shift');
          response = await api.post(apiUrl, payload);
          console.log('Create response:', response);
          
          // Add the new shift to the shifts array
          if (response.data && response.data.data && response.data.data.shift) {
            setShifts(prevShifts => [...prevShifts, response.data.data.shift]);
            toast.success('Shift created successfully!');
            resetForm();
            setIsModalOpen(false);
          } else {
            throw new Error('Invalid response format from server');
          }
        }
        
        // Close modal and reset form
        setIsModalOpen(false);
        resetForm();
        
      } catch (apiError) {
        console.error('API Error details:', {
          message: apiError.message,
          response: apiError.response?.data,
          status: apiError.response?.status,
          headers: apiError.response?.headers,
          config: {
            url: apiError.config?.url,
            method: apiError.config?.method,
            data: apiError.config?.data,
            headers: apiError.config?.headers
          }
        });
        throw apiError; // Re-throw to be caught by the outer catch
      }
      
    } catch (error) {
      console.error('Error in handleSubmit:', {
        error,
        errorMessage: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      
      let errorMessage = 'An error occurred while saving the shift';
      
      // Handle validation errors from backend
      if (error.response?.data?.error) {
        // Handle validation error object
        errorMessage = error.response.data.error;
      } else if (error.response?.data?.message) {
        // Handle direct error message
        errorMessage = error.response.data.message;
      } else if (error.message) {
        // Fallback to error message
        errorMessage = error.message;
      }
      
      // Show error in toast
      toast.error(errorMessage, {
        autoClose: 5000,
        closeOnClick: true,
        pauseOnHover: true
      });
    }
  };

  // Helper function to convert 12h time to 24h format for the time input
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

  const handleEdit = (shift) => {
    setEditingShift(shift);
    setFormData({
      employee: shift.employee._id,
      date: format(new Date(shift.date), 'yyyy-MM-dd'),
      startTime: convertTo24Hour(shift.startTime),
      endTime: convertTo24Hour(shift.endTime)
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (shiftId) => {
    if (window.confirm('Are you sure you want to delete this shift?')) {
      try {
        await api.delete(`http://localhost:7000/api/v1/shifts/${shiftId}`);
        setShifts(shifts.filter(shift => shift._id !== shiftId));
        toast.success('Shift deleted successfully!');
      } catch (error) {
        console.error('Error deleting shift:', error);
        const errorMessage = error.response?.data?.message || 'An error occurred while deleting the shift';
        toast.error(errorMessage);
      }
    }
  };

  // Format date for display
  const formatDisplayDate = (dateString) => {
    const date = new Date(dateString);
    if (isToday(date)) return 'Today';
    if (isTomorrow(date)) return 'Tomorrow';
    return format(date, 'MMM d, yyyy');
  };

  // Calculate shift duration
  const calculateDuration = (startTime, endTime) => {
    const [startH, startM] = startTime.split(':').map(Number);
    const [endH, endM] = endTime.split(':').map(Number);
    const hours = (endH + endM/60) - (startH + startM/60);
    return hours > 0 ? `${hours.toFixed(1)}h` : 'Invalid';
  };

  // Filter shifts based on active filter and search term
  const getFilteredShifts = () => {
    let filtered = [...shifts];
    
    // Apply search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(shift => 
        shift.employee?.name?.toLowerCase().includes(searchLower) ||
        shift.employee?.employeeCode?.toLowerCase().includes(searchLower) ||
        shift.department?.toLowerCase().includes(searchLower)
      );
    }
    
    // Apply time filter
    const now = new Date();
    switch(activeFilter) {
      case 'today':
        filtered = filtered.filter(shift => isToday(parseISO(shift.date)));
        break;
      case 'upcoming':
        filtered = filtered.filter(shift => isAfter(parseISO(`${shift.date}T${shift.endTime}`), now));
        break;
      case 'past':
        filtered = filtered.filter(shift => !isAfter(parseISO(`${shift.date}T${shift.endTime}`), now));
        break;
      // 'all' and default show all shifts
    }
    
    return filtered;
  };

  const filteredShifts = getFilteredShifts();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-[#021189]"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Tabs component
  const renderTabs = () => (
    <div className="border-b border-gray-200 mb-6">
      <nav className="-mb-px flex space-x-8">
        <button
          onClick={() => setActiveTab('shifts')}
          className={`${activeTab === 'shifts' ? 'border-[#021189] text-[#021189]' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
        >
          Shifts
        </button>
        <button
          onClick={() => setActiveTab('employees')}
          className={`${activeTab === 'employees' ? 'border-[#021189] text-[#021189]' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
        >
          Employees
        </button>
      </nav>
    </div>
  );

  // Employee list component
  const renderEmployeeList = () => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      {employees.length === 0 ? (
        <div className="text-center py-12">
          <div className="mx-auto h-16 w-16 text-gray-300 mb-4">
            <Users className="h-16 w-16 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-700 mb-1">No employees found</h3>
          <p className="text-gray-500 max-w-md mx-auto">
            No employees have been added to the system yet.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Employee
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Shifts
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {employees.map((employee) => (
                <tr key={employee._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                        <User className="h-5 w-5 text-gray-500" />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {employee.name}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {employee.email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                      {employee.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {shifts.filter(shift => shift.employee?._id === employee._id).length}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-[#021189] text-white shadow-md">
        <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <BarChart2 className="h-8 w-8" />
              <h1 className="text-xl font-bold">ShiftSync Admin</h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="hidden md:flex items-center space-x-1 bg-white/10 px-3 py-1.5 rounded-full">
                <User className="h-4 w-4 text-blue-200" />
                <span className="text-sm font-medium">{user?.name || 'Admin'}</span>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-1.5 bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-full text-sm font-medium transition-colors"
              >
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        {renderTabs()}

        {/* Employees Tab */}
        {activeTab === 'employees' && (
          <div className="mb-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Employee Management</h2>
                <p className="text-sm text-gray-500">View and manage all employees</p>
              </div>
            </div>
            {renderEmployeeList()}
          </div>
        )}

        {/* Shifts Tab */}
        {activeTab === 'shifts' && (
          <div className="mb-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Shift Management</h2>
                <p className="text-sm text-gray-500">View and manage all shifts</p>
              </div>
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="Search shifts..."
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#021189] focus:border-transparent"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <button
                  onClick={() => {
                    resetForm();
                    setIsModalOpen(true);
                  }}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-[#021189] hover:bg-[#0a2ab5] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#021189]"
                >
                  <PlusCircle className="-ml-1 mr-2 h-5 w-5" />
                  Add Shift
                </button>
              </div>
            </div>
            <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Shift Time</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {filteredShifts.map((shift) => {
                  const shiftDate = parseISO(shift.date);
                  const isUpcoming = isAfter(parseISO(`${shift.date}T${shift.endTime}`), new Date());
                  
                  return (
                    <motion.tr 
                      key={shift._id} 
                      className="hover:bg-gray-50"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center">
                            <User className="h-5 w-5 text-[#021189]" />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{shift.employee.name}</div>
                            <div className="text-xs text-gray-500">{shift.employee.employeeCode} • {shift.department || 'No Department'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                          <span className={isToday(shiftDate) ? 'font-semibold text-[#021189]' : ''}>
                            {formatDisplayDate(shift.date)}
                            {isToday(shiftDate) && (
                              <span className="ml-2 px-2 py-0.5 text-xs bg-blue-100 text-[#021189] rounded-full">
                                Today
                              </span>
                            )}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 text-gray-400 mr-2 flex-shrink-0" />
                          <div className="flex flex-col">
                            <span className={`text-sm ${isUpcoming ? 'text-gray-900' : 'text-gray-500'}`}>
                              {shift.startTime} - {shift.endTime}
                            </span>
                            {!isUpcoming && (
                              <span className="text-xs text-gray-400">Completed</span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-4 font-medium rounded-full ${
                          isUpcoming 
                            ? 'bg-blue-100 text-blue-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {calculateDuration(shift.startTime, shift.endTime)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={() => handleEdit(shift)}
                            className="p-1.5 text-gray-500 hover:text-[#021189] hover:bg-blue-50 rounded-full transition-colors"
                            title="Edit shift"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(shift._id)}
                            className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                            title="Delete shift"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
            </div>
          </div>
        )}
      </main>

      {/* Add/Edit Shift Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div 
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={(e) => e.target === e.currentTarget && setIsModalOpen(false)}
          >
            <motion.div 
              className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden"
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 500 }}
            >
              <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">
                  {editingShift ? 'Edit Shift' : 'Schedule New Shift'}
                </h3>
                <button 
                  onClick={() => {
                    setIsModalOpen(false);
                    resetForm();
                  }}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <form onSubmit={(e) => {
                console.log('Form submitted');
                handleSubmit(e);
              }} className="p-6">
                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Employee</label>
                    <div className="relative">
                      <select
                        name="employee"
                        value={formData.employee}
                        onChange={handleInputChange}
                        className={`w-full pl-3 pr-10 py-2.5 border ${
                          formErrors.employee ? 'border-red-300' : 'border-gray-300'
                        } rounded-lg focus:ring-2 focus:ring-[#021189] focus:border-transparent`}
                        required
                      >
                        <option value="">Select Employee</option>
                        {employees.map(emp => (
                          <option key={emp._id} value={emp._id}>
                            {emp.name} ({emp.employeeCode})
                          </option>
                        ))}
                      </select>
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                        <User className="h-5 w-5 text-gray-400" />
                      </div>
                    </div>
                    {formErrors.employee && (
                      <p className="mt-1 text-sm text-red-600">{formErrors.employee}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Date</label>
                    <div className="relative">
                      <input
                        type="date"
                        name="date"
                        value={formData.date}
                        onChange={handleInputChange}
                        className={`w-full pl-3 pr-10 py-2.5 border ${
                          formErrors.date ? 'border-red-300' : 'border-gray-300'
                        } rounded-lg focus:ring-2 focus:ring-[#021189] focus:border-transparent`}
                        required
                      />
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                        <Calendar className="h-5 w-5 text-gray-400" />
                      </div>
                    </div>
                    {formErrors.date && (
                      <p className="mt-1 text-sm text-red-600">{formErrors.date}</p>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Start Time</label>
                      <div className="relative">
                        <input
                          type="time"
                          name="startTime"
                          value={formData.startTime}
                          onChange={handleInputChange}
                          className={`w-full pl-3 pr-10 py-2.5 border ${
                            formErrors.startTime ? 'border-red-300' : 'border-gray-300'
                          } rounded-lg focus:ring-2 focus:ring-[#021189] focus:border-transparent`}
                          required
                        />
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                          <Clock className="h-5 w-5 text-gray-400" />
                        </div>
                      </div>
                      {formErrors.startTime && (
                        <p className="mt-1 text-sm text-red-600">{formErrors.startTime}</p>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">End Time</label>
                      <div className="relative">
                        <input
                          type="time"
                          name="endTime"
                          value={formData.endTime}
                          onChange={handleInputChange}
                          className={`w-full pl-3 pr-10 py-2.5 border ${
                            formErrors.endTime ? 'border-red-300' : 'border-gray-300'
                          } rounded-lg focus:ring-2 focus:ring-[#021189] focus:border-transparent`}
                          required
                        />
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                          <Clock className="h-5 w-5 text-gray-400" />
                        </div>
                      </div>
                      {formErrors.endTime && (
                        <p className="mt-1 text-sm text-red-600">{formErrors.endTime}</p>
                      )}
                    </div>
                  </div>
                  
                  {Object.keys(formErrors).length > 0 && !formErrors.employee && !formErrors.date && !formErrors.startTime && !formErrors.endTime && (
                    <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded">
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div className="ml-3">
                          <p className="text-sm text-red-700">
                            {Object.values(formErrors)[0]}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setIsModalOpen(false);
                      resetForm();
                    }}
                    className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2.5 text-sm font-medium text-white bg-[#021189] rounded-lg hover:bg-[#0a2ab5] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#021189] transition-colors"
                  >
                    {editingShift ? 'Update Shift' : 'Schedule Shift'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminDashboard;
