import React, { useState, useEffect, useContext } from 'react';
import { PlusCircle, Trash2, Edit, Calendar, Clock, User, Search, LogOut, BarChart2, Users, Clock as ClockIcon, Filter, X } from 'react-feather';
import { AppContext } from '../../context/AppContext';
import axios from 'axios';
import { format, parseISO, isToday, isTomorrow, isThisWeek, isAfter } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const AdminDashboard = () => {
  const { user, logout } = useContext(AppContext);
  const [shifts, setShifts] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEmployeesLoading, setIsEmployeesLoading] = useState(false);
  const [employeesError, setEmployeesError] = useState(null);
  const [editingShift, setEditingShift] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  
  // Form state with validation
  const [formData, setFormData] = useState({
    employee: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    startTime: '09:00',
    endTime: '17:00'
  });
  
  const [formErrors, setFormErrors] = useState({});
  
  // Stats state
  const [stats, setStats] = useState({
    totalShifts: 0,
    activeEmployees: 0,
    upcomingShifts: 0,
    totalHours: 0
  });

  // Update stats when shifts change
  useEffect(() => {
    if (shifts.length > 0) {
      setStats(prev => ({
        ...prev,
        totalShifts: shifts.length,
        upcomingShifts: shifts.filter(shift => isAfter(parseISO(`${shift.date}T${shift.endTime}`), new Date())).length,
        totalHours: shifts.reduce((acc, shift) => {
          const [startH, startM] = shift.startTime.split(':').map(Number);
          const [endH, endM] = shift.endTime.split(':').map(Number);
          const hours = (endH + endM/60) - (startH + startM/60);
          return acc + (hours > 0 ? hours : 0);
        }, 0).toFixed(1)
      }));
    }
  }, [shifts]);
  
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

  // Fetch employees with loading and error states
  const fetchEmployees = async () => {
    try {
      setIsEmployeesLoading(true);
      setEmployeesError(null);
      const token = localStorage.getItem('token');
      const apiUrl = 'http://localhost:7000/api/v1/users/employees';
      console.log('Fetching employees from:', apiUrl);
      
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await axios.get(apiUrl, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });
      
      console.log('Raw API response:', response.data);
      
      // Handle different response formats
      let employeesData = [];
      if (Array.isArray(response?.data?.data)) {
        employeesData = response.data.data;
      } else if (response?.data?.data?.employees) {
        employeesData = response.data.data.employees;
      } else if (Array.isArray(response?.data)) {
        employeesData = response.data;
      }
      
      console.log('Processed employees data:', employeesData);
      
      if (employeesData.length === 0) {
        console.warn('No employees found in the database. Please add employee accounts first.');
        setEmployeesError('No employees found. Please add employee accounts first.');
      } else {
        setEmployees(employeesData);
      }
      
      return employeesData;
    } catch (error) {
      console.error('Error fetching employees:', error);
      console.error('Error response:', error.response?.data || error.message);
      const errorMsg = error.response?.data?.message || 'Failed to load employees. Please check your connection and try again.';
      setEmployeesError(errorMsg);
      setEmployees([]);
      return [];
    } finally {
      setIsEmployeesLoading(false);
    }
  };

  // Fetch all shifts and active users count
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [shiftsRes, activeUsersRes] = await Promise.all([
          axios.get('/api/v1/shifts'),
          axios.get('/api/v1/users/active-count')
        ]);
        
        // Add null checks for the response data
        const shiftsData = shiftsRes?.data?.data?.shifts || [];
        const activeUsersCount = activeUsersRes?.data?.data?.activeUsers || 0;
        
        setShifts(shiftsData);
        
        // Update stats with the correct active users count
        setStats(prev => ({
          ...prev,
          activeEmployees: activeUsersCount
        }));
      } catch (error) {
        console.error('Error fetching data:', error);
        // Set empty arrays on error to prevent undefined errors
        setShifts([]);
        // Show error message to user
        alert('Failed to load data. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
    fetchEmployees();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingShift) {
        // Update existing shift
        const response = await axios.patch(`/api/v1/shifts/${editingShift._id}`, formData);
        setShifts(shifts.map(shift => 
          shift._id === editingShift._id ? response.data.data.shift : shift
        ));
      } else {
        // Create new shift
        const response = await axios.post('/api/v1/shifts', formData);
        setShifts([...shifts, response.data.data.shift]);
      }
      
      setIsModalOpen(false);
      resetForm();
    } catch (error) {
      console.error('Error saving shift:', error.response?.data?.message || error.message);
      alert(error.response?.data?.message || 'An error occurred while saving the shift');
    }
  };

  const handleEdit = async (shift) => {
    try {
      if (employees.length === 0) {
        const loadedEmployees = await fetchEmployees();
        if (loadedEmployees.length === 0) {
          alert('Failed to load employees. Please try again.');
          return;
        }
      }
      
      setEditingShift(shift);
      setFormData({
        employee: shift.employee._id,
        date: format(new Date(shift.date), 'yyyy-MM-dd'),
        startTime: shift.startTime,
        endTime: shift.endTime
      });
      setIsModalOpen(true);
    } catch (error) {
      console.error('Error preparing edit form:', error);
      alert('Failed to load shift details. Please try again.');
    }
  };

  const handleDelete = async (shiftId) => {
    if (window.confirm('Are you sure you want to delete this shift?')) {
      try {
        await axios.delete(`/api/v1/shifts/${shiftId}`);
        setShifts(shifts.filter(shift => shift._id !== shiftId));
      } catch (error) {
        console.error('Error deleting shift:', error);
        alert(error.response?.data?.message || 'An error occurred while deleting the shift');
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
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Shifts Card */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all hover:-translate-y-0.5">
            <div className="flex items-center justify-between">
              <div className="p-3 rounded-lg bg-blue-50">
                <Calendar className="h-6 w-6 text-blue-600" />
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-gray-800">{stats.totalShifts}</p>
                <p className="text-sm text-gray-500">Total Shifts</p>
              </div>
            </div>
          </div>

          {/* Active Employees Card */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all hover:-translate-y-0.5">
            <div className="flex items-center justify-between">
              <div className="p-3 rounded-lg bg-emerald-50">
                <Users className="h-6 w-6 text-emerald-600" />
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-gray-800">{stats.activeEmployees}</p>
                <p className="text-sm text-gray-500">Active Employees</p>
              </div>
            </div>
          </div>

          {/* Upcoming Shifts Card */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all hover:-translate-y-0.5">
            <div className="flex items-center justify-between">
              <div className="p-3 rounded-lg bg-amber-50">
                <ClockIcon className="h-6 w-6 text-amber-600" />
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-gray-800">{stats.upcomingShifts}</p>
                <p className="text-sm text-gray-500">Upcoming Shifts</p>
              </div>
            </div>
          </div>

          {/* Total Hours Card */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all hover:-translate-y-0.5">
            <div className="flex items-center justify-between">
              <div className="p-3 rounded-lg bg-violet-50">
                <Clock className="h-6 w-6 text-violet-600" />
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-gray-800">{stats.totalHours}h</p>
                <p className="text-sm text-gray-500">Total Hours</p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <h2 className="text-xl font-bold text-gray-800">Shift Management</h2>
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search employees..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#021189] focus:border-transparent"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <div className="relative">
                <button 
                  onClick={() => setIsFilterOpen(!isFilterOpen)}
                  className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Filter className="h-4 w-4 text-gray-500" />
                  <span className="text-sm font-medium">
                    {activeFilter === 'today' ? 'Today' : 
                     activeFilter === 'upcoming' ? 'Upcoming' : 
                     activeFilter === 'past' ? 'Past' : 'All Shifts'}
                  </span>
                </button>
                
                {isFilterOpen && (
                  <div className="absolute right-0 mt-1 w-40 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                    <div className="p-2">
                      <button 
                        onClick={() => {
                          setActiveFilter('all');
                          setIsFilterOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 text-sm rounded-md ${activeFilter === 'all' ? 'bg-blue-50 text-[#021189]' : 'text-gray-700 hover:bg-gray-50'}`}
                      >
                        All Shifts
                      </button>
                      <button 
                        onClick={() => {
                          setActiveFilter('today');
                          setIsFilterOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 text-sm rounded-md ${activeFilter === 'today' ? 'bg-blue-50 text-[#021189]' : 'text-gray-700 hover:bg-gray-50'}`}
                      >
                        Today
                      </button>
                      <button 
                        onClick={() => {
                          setActiveFilter('upcoming');
                          setIsFilterOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 text-sm rounded-md ${activeFilter === 'upcoming' ? 'bg-blue-50 text-[#021189]' : 'text-gray-700 hover:bg-gray-50'}`}
                      >
                        Upcoming
                      </button>
                      <button 
                        onClick={() => {
                          setActiveFilter('past');
                          setIsFilterOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 text-sm rounded-md ${activeFilter === 'past' ? 'bg-blue-50 text-[#021189]' : 'text-gray-700 hover:bg-gray-50'}`}
                      >
                        Past Shifts
                      </button>
                    </div>
                  </div>
                )}
              </div>
              
              <button
                onClick={async (e) => {
                  e.preventDefault();
                  try {
                    resetForm();
                    if (employees.length === 0) {
                      const loadedEmployees = await fetchEmployees();
                      if (loadedEmployees.length === 0) {
                        alert('Failed to load employees. Please try again.');
                        return;
                      }
                    }
                    setIsModalOpen(true);
                  } catch (error) {
                    console.error('Error preparing new shift form:', error);
                    alert('Failed to prepare new shift form. Please try again.');
                  }
                }}
                className="flex items-center gap-2 px-4 py-2 bg-[#021189] text-white rounded-lg hover:bg-[#0a2ab5] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isLoading || isEmployeesLoading}
              >
                {isLoading || isEmployeesLoading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                ) : (
                  <PlusCircle className="h-4 w-4" />
                )}
                <span className="text-sm font-medium">
                  {isLoading || isEmployeesLoading ? 'Loading...' : 'Add Shift'}
                </span>
              </button>
            </div>
          </div>
        </div>

      {/* Shifts Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {filteredShifts.length === 0 ? (
          <div className="text-center py-12">
            <div className="mx-auto h-16 w-16 text-gray-300 mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-700 mb-1">No shifts found</h3>
            <p className="text-gray-500 max-w-md mx-auto">
              {searchTerm 
                ? 'No shifts match your search. Try adjusting your filters.' 
                : activeFilter === 'today' 
                  ? 'No shifts scheduled for today.' 
                  : activeFilter === 'upcoming' 
                    ? 'No upcoming shifts.' 
                    : activeFilter === 'past' 
                      ? 'No past shifts found.' 
                      : 'No shifts have been added yet.'}
            </p>
            {!searchTerm && activeFilter === 'all' && (
              <button
                onClick={() => {
                  resetForm();
                  setIsModalOpen(true);
                }}
                className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-[#021189] hover:bg-[#0a2ab5] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#021189]"
              >
                <PlusCircle className="-ml-1 mr-2 h-5 w-5" />
                Add Your First Shift
              </button>
            )}
          </div>
        ) : (
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
        )}
      </div>

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
              
              <form onSubmit={handleSubmit} className="p-6">
                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Employee</label>
                    <div className="relative">
                      {isEmployeesLoading ? (
                        <div className="flex items-center justify-center py-2.5 px-3 border border-gray-300 rounded-lg bg-gray-50">
                          <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-[#021189]"></div>
                          <span className="ml-2 text-sm text-gray-600">Loading employees...</span>
                        </div>
                      ) : employeesError ? (
                        <div className="text-red-500 text-sm py-2 px-3 border border-red-200 bg-red-50 rounded-lg">
                          {employeesError}
                          <button 
                            onClick={fetchEmployees}
                            className="ml-2 text-[#021189] hover:underline"
                          >
                            Retry
                          </button>
                        </div>
                      ) : employees.length === 0 ? (
                        <div className="text-yellow-600 text-sm py-2 px-3 border border-yellow-200 bg-yellow-50 rounded-lg">
                          No employees found. Please add employees first.
                        </div>
                      ) : (
                        <>
                          <select
                            name="employee"
                            value={formData.employee}
                            onChange={handleInputChange}
                            className={`w-full pl-3 pr-10 py-2.5 border ${
                              formErrors.employee ? 'border-red-300' : 'border-gray-300'
                            } rounded-lg focus:ring-2 focus:ring-[#021189] focus:border-transparent`}
                            required
                            disabled={isEmployeesLoading || employees.length === 0}
                          >
                            <option value="">Select Employee</option>
                            {employees.map(emp => (
                              <option key={emp._id} value={emp._id}>
                                {emp.name} ({emp.employeeCode || 'No ID'})
                              </option>
                            ))}
                          </select>
                          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                            <User className="h-5 w-5 text-gray-400" />
                          </div>
                        </>
                      )}
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
      </main>
    </div>
  );
};

export default AdminDashboard;
