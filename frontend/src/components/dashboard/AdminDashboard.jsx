import React, { useState, useEffect, useContext } from 'react';
import { 
  PlusCircle, 
  Trash2, 
  Edit, 
  Calendar, 
  Clock, 
  User, 
  Search, 
  LogOut, 
  BarChart2, 
  Users, 
  Clock as ClockIcon, 
  Filter, 
  X 
} from 'react-feather';
import { AppContext } from '../../context/AppContext';
import api from '../../utils/api';
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
  const [editingShift, setEditingShift] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('shifts');
  
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
    totalEmployees: employees.length,
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
        const [shiftsRes, employeesRes] = await Promise.all([
          api.get('http://localhost:7000/api/v1/shifts'),
          api.get('http://localhost:7000/api/v1/users/employees')
        ]);
        
        setShifts(shiftsRes.data.data.shifts || []);
        setEmployees(employeesRes.data.data.users || []);
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Failed to load data. Please try again.');
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
    let period = 'AM';
    let hour = parseInt(hours, 10);
    
    if (hour >= 12) {
      period = 'PM';
      if (hour > 12) hour -= 12;
    }
    if (hour === 0) hour = 12;
    
    return `${hour}:${minutes} ${period}`;
  };

  // Format time for display
  const formatTimeTo12Hour = (time24) => {
    if (!time24) return '';
    
    const [hours, minutes] = time24.split(':');
    let period = 'AM';
    let hour = parseInt(hours, 10);
    
    if (hour >= 12) {
      period = 'PM';
      if (hour > 12) hour -= 12;
    }
    if (hour === 0) hour = 12;
    
    return `${hour}:${minutes.padStart(2, '0')} ${period}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (editingShift) {
        await api.put(`http://localhost:7000/api/v1/shifts/${editingShift._id}`, formData);
        toast.success('Shift updated successfully');
      } else {
        await api.post('http://localhost:7000/api/v1/shifts', formData);
        toast.success('Shift created successfully');
      }
      
      // Refresh data
      const [shiftsRes, employeesRes] = await Promise.all([
        api.get('/api/v1/shifts'),
        api.get('/api/v1/users/employees')
      ]);
      
      setShifts(shiftsRes.data.data.shifts || []);
      setEmployees(employeesRes.data.data.users || []);
      
      // Close modal and reset form
      setIsModalOpen(false);
      resetForm();
    } catch (error) {
      console.error('Error saving shift:', error);
      const errorMessage = error.response?.data?.message || 'Failed to save shift';
      toast.error(errorMessage);
    }
  };

  // Helper function to convert 12h time to 24h format for the time input
  const convertTo24Hour = (time12h) => {
    if (!time12h) return '';
    
    const [time, period] = time12h.split(' ');
    let [hours, minutes] = time.split(':');
    
    if (period === 'PM' && hours !== '12') {
      hours = parseInt(hours, 10) + 12;
    } else if (period === 'AM' && hours === '12') {
      hours = '00';
    }
    
    return `${hours.padStart(2, '0')}:${minutes}`;
  };

  const handleEdit = (shift) => {
    setEditingShift(shift);
    setFormData({
      employee: shift.employee?._id || '',
      date: shift.date,
      startTime: shift.startTime,
      endTime: shift.endTime
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (shiftId) => {
    if (window.confirm('Are you sure you want to delete this shift?')) {
      try {
        await api.delete(`http://localhost:7000/api/v1/shifts/${shiftId}`);
        toast.success('Shift deleted successfully');
        
        // Refresh shifts
        const res = await api.get('http://localhost:7000/api/v1/shifts');
        setShifts(res.data.data.shifts || []);
      } catch (error) {
        console.error('Error deleting shift:', error);
        toast.error('Failed to delete shift');
      }
    }
  };

  // Format date for display
  const formatDisplayDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Calculate shift duration
  const calculateDuration = (startTime, endTime) => {
    const [startH, startM] = startTime.split(':').map(Number);
    const [endH, endM] = endTime.split(':').map(Number);
    const hours = (endH + endM/60) - (startH + startM/60);
    return hours > 0 ? `${hours.toFixed(1)}h` : '0h';
  };

  // Filter shifts based on active filter and search term
  const getFilteredShifts = () => {
    let filtered = [...shifts];
    
    // Apply search term filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(shift => 
        shift.employee?.name.toLowerCase().includes(term) ||
        shift.date.toLowerCase().includes(term) ||
        shift.startTime.toLowerCase().includes(term) ||
        shift.endTime.toLowerCase().includes(term)
      );
    }
    
    // Apply status filter
    switch (activeFilter) {
      case 'today':
        filtered = filtered.filter(shift => isToday(parseISO(shift.date)));
        break;
      case 'upcoming':
        filtered = filtered.filter(shift => isAfter(parseISO(shift.date), new Date()));
        break;
      case 'past':
        filtered = filtered.filter(shift => !isAfter(parseISO(shift.date), new Date()));
        break;
      default:
        // No filter
        break;
    }
    
    return filtered;
  };

  const filteredShifts = getFilteredShifts();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Render tabs
  const renderTabs = () => (
    <div className="border-b border-gray-200 mb-6">
      <nav className="-mb-px flex space-x-8">
        <button
          onClick={() => setActiveTab('shifts')}
          className={`${
            activeTab === 'shifts' 
              ? 'border-blue-500 text-blue-600' 
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200`}
        >
          <span className="flex items-center">
            <ClockIcon className="h-4 w-4 mr-2" />
            Shifts
          </span>
        </button>
        <button
          onClick={() => setActiveTab('employees')}
          className={`${
            activeTab === 'employees' 
              ? 'border-blue-500 text-blue-600' 
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200`}
        >
          <span className="flex items-center">
            <Users className="h-4 w-4 mr-2" />
            Employees
          </span>
        </button>
      </nav>
    </div>
  );

  // Employee list component
  const renderEmployeeList = () => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      {employees.length === 0 ? (
        <div className="text-center py-12 px-4">
          <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-1">No employees found</h3>
          <p className="text-gray-500">Get started by adding a new employee</p>
        </div>
      ) : (
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Shifts</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {employees.map((employee) => (
              <tr key={employee._id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-10 h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                      <User className="h-5 w-5 text-indigo-600" />
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">{employee.name}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {employee.email}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    employee.role === 'admin' 
                      ? 'bg-purple-100 text-purple-800' 
                      : 'bg-green-100 text-green-800'
                  }`}>
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
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-sm text-gray-500">Manage your team's schedules and shifts</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="hidden md:flex items-center px-3 py-2 rounded-lg bg-gray-100">
              <User className="h-5 w-5 text-gray-500 mr-2" />
              <span className="text-sm font-medium text-gray-700">
                {user?.name || 'Admin'}
              </span>
            </div>
            <button
              onClick={handleLogout}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors duration-200"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Welcome Card */}
        <div className="bg-white shadow rounded-lg p-6 mb-8">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-blue-100 p-3 rounded-lg">
              <BarChart2 className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-4">
              <h2 className="text-xl font-semibold text-gray-900">Welcome back, {user?.name || 'Admin'}</h2>
              <p className="text-gray-600">Manage your team's schedules, shifts, and employee information in one place.</p>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          {/* Total Employees Card */}
          <div className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow duration-200">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-indigo-100 p-3 rounded-md">
                  <Users className="h-6 w-6 text-indigo-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Employees</dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-gray-900">{stats.totalEmployees}</div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          {/* Total Shifts Card */}
          <div className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow duration-200">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-green-100 p-3 rounded-md">
                  <Clock className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Shifts</dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-gray-900">{stats.totalShifts}</div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          {/* Active Employees Card */}
          <div className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow duration-200">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-amber-100 p-3 rounded-md">
                  <User className="h-6 w-6 text-amber-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Active Employees</dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-gray-900">{stats.activeEmployees}</div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          {/* Total Hours Card */}
          <div className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow duration-200">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-purple-100 p-3 rounded-md">
                  <ClockIcon className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Hours</dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-gray-900">{stats.totalHours}</div>
                      <span className="ml-2 text-sm text-gray-500">hours</span>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

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
              <button
                onClick={() => {
                  // Handle add employee
                }}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <PlusCircle className="h-4 w-4 mr-2" />
                Add Employee
              </button>
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
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="Search shifts..."
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="relative">
                  <button
                    type="button"
                    className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    onClick={() => setIsFilterOpen(!isFilterOpen)}
                  >
                    <Filter className="h-4 w-4 mr-2 text-gray-500" />
                    Filter
                  </button>
                  {isFilterOpen && (
                    <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10">
                      <div className="py-1" role="menu" aria-orientation="vertical">
                        <button
                          onClick={() => {
                            setActiveFilter('all');
                            setIsFilterOpen(false);
                          }}
                          className={`${
                            activeFilter === 'all' ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
                          } block w-full text-left px-4 py-2 text-sm`}
                        >
                          All Shifts
                        </button>
                        <button
                          onClick={() => {
                            setActiveFilter('today');
                            setIsFilterOpen(false);
                          }}
                          className={`${
                            activeFilter === 'today' ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
                          } block w-full text-left px-4 py-2 text-sm`}
                        >
                          Today's Shifts
                        </button>
                        <button
                          onClick={() => {
                            setActiveFilter('upcoming');
                            setIsFilterOpen(false);
                          }}
                          className={`${
                            activeFilter === 'upcoming' ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
                          } block w-full text-left px-4 py-2 text-sm`}
                        >
                          Upcoming Shifts
                        </button>
                        <button
                          onClick={() => {
                            setActiveFilter('past');
                            setIsFilterOpen(false);
                          }}
                          className={`${
                            activeFilter === 'past' ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
                          } block w-full text-left px-4 py-2 text-sm`}
                        >
                          Past Shifts
                        </button>
                      </div>
                    </div>
                  )}
                </div>
                <button
                  onClick={() => {
                    resetForm();
                    setIsModalOpen(true);
                  }}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <PlusCircle className="h-4 w-4 mr-2" />
                  New Shift
                </button>
              </div>
            </div>

            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
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
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredShifts.length > 0 ? (
                    filteredShifts.map((shift) => {
                      const shiftDate = parseISO(shift.date);
                      const isUpcoming = isAfter(parseISO(`${shift.date}T${shift.endTime}`), new Date());
                      
                      return (
                        <tr key={shift._id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-10 h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                                <User className="h-5 w-5 text-indigo-600" />
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">{shift.employee?.name || 'N/A'}</div>
                                <div className="text-sm text-gray-500">{shift.employee?.email || ''}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{formatDisplayDate(shift.date)}</div>
                            <div className="text-sm text-gray-500">
                              {isToday(shiftDate) ? 'Today' : isTomorrow(shiftDate) ? 'Tomorrow' : ''}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {formatTimeTo12Hour(shift.startTime)} - {formatTimeTo12Hour(shift.endTime)}
                            </div>
                            <div className="text-sm text-gray-500">
                              {calculateDuration(shift.startTime, shift.endTime)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              isUpcoming ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                            }`}>
                              {isUpcoming ? 'Upcoming' : 'Completed'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button
                              onClick={() => handleEdit(shift)}
                              className="text-blue-600 hover:text-blue-900 mr-4"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(shift._id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="5" className="px-6 py-4 text-center text-sm text-gray-500">
                        No shifts found. Create a new shift to get started.
                      </td>
                    </tr>
                  )}
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
          >
            <motion.div 
              className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden"
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
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
                      <select
                        name="employee"
                        value={formData.employee}
                        onChange={handleInputChange}
                        className="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                        required
                      >
                        <option value="">Select an employee</option>
                        {employees.map((emp) => (
                          <option key={emp._id} value={emp._id}>
                            {emp.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Date</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Calendar className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="date"
                        name="date"
                        value={formData.date}
                        onChange={handleInputChange}
                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        required
                        min={format(new Date(), 'yyyy-MM-dd')}
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Start Time</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Clock className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          type="time"
                          name="startTime"
                          value={formData.startTime}
                          onChange={handleInputChange}
                          className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                          required
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">End Time</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Clock className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          type="time"
                          name="endTime"
                          value={formData.endTime}
                          onChange={handleInputChange}
                          className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                          required
                        />
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setIsModalOpen(false);
                      resetForm();
                    }}
                    className="px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    {editingShift ? 'Update Shift' : 'Create Shift'}
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
