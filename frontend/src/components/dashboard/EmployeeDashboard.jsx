import React, { useState, useEffect, useContext } from 'react';
import { Calendar, Clock, User, Clock as ClockIcon, LogOut } from 'react-feather';
import { AppContext } from '../../context/AppContext';
import axios from 'axios';

const EmployeeDashboard = () => {
  const { user, logout } = useContext(AppContext);
  const [shifts, setShifts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [upcomingShifts, setUpcomingShifts] = useState([]);
  const [pastShifts, setPastShifts] = useState([]);
  const [stats, setStats] = useState({
    totalShifts: 0,
    totalHours: 0,
    upcomingShifts: 0
  });

  const handleLogout = () => {
    logout();
  };

  // Fetch employee's shifts
  useEffect(() => {
    const fetchShifts = async () => {
      try {
        const response = await axios.get('/api/v1/shifts/my-shifts');
        const shiftsData = response?.data?.data?.shifts || [];
        
        if (!Array.isArray(shiftsData)) {
          throw new Error('Invalid shifts data received');
        }
        
        // Sort shifts by date (newest first)
        const sortedShifts = [...shiftsData].sort((a, b) => 
          new Date(b.date) - new Date(a.date)
        );
        
        // Separate upcoming and past shifts
        const now = new Date();
        const upcoming = [];
        const past = [];
        
        sortedShifts.forEach(shift => {
          const shiftDate = new Date(shift.date);
          if (shiftDate >= now) {
            upcoming.push(shift);
          } else {
            past.push(shift);
          }
        });
        
        // Calculate statistics
        const totalHours = shiftsData.reduce((sum, shift) => sum + shift.hours, 0);
        
        setShifts(sortedShifts);
        setUpcomingShifts(upcoming);
        setPastShifts(past);
        setStats({
          totalShifts: shiftsData.length,
          totalHours: totalHours.toFixed(1),
          upcomingShifts: upcoming.length
        });
      } catch (error) {
        console.error('Error fetching shifts:', error);
        setShifts([]);
        setUpcomingShifts([]);
        setPastShifts([]);
        setStats({
          totalShifts: 0,
          totalHours: 0,
          upcomingShifts: 0
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchShifts();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const formatDate = (dateString) => {
    const options = { 
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const renderShiftCard = (shift, index) => {
    const isUpcoming = new Date(shift.date) >= new Date();
    const shiftDate = new Date(shift.date);
    const today = new Date();
    const isToday = shiftDate.toDateString() === today.toDateString();
    
    return (
      <div 
        key={shift._id} 
        className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-all overflow-hidden"
      >
        <div className="p-5">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <div className="flex items-center mb-2">
                <div className={`w-2 h-2 rounded-full mr-3 ${isUpcoming ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                <span className="text-sm font-medium text-gray-500">
                  {isToday ? 'Today' : formatDate(shift.date).split(',')[0]}
                </span>
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-1">
                {shift.department || 'Shift'}
              </h3>
              <div className="flex items-center text-gray-600 text-sm">
                <ClockIcon className="h-4 w-4 mr-1.5 text-blue-500" />
                <span>{shift.startTime} - {shift.endTime}</span>
                <span className="mx-2 text-gray-300">•</span>
                <span className="font-medium">{shift.hours} hours</span>
              </div>
            </div>
            <span className={`px-3 py-1 text-xs font-medium rounded-full ${
              isUpcoming 
                ? 'bg-blue-50 text-blue-700' 
                : 'bg-gray-50 text-gray-600'
            }`}>
              {isUpcoming ? 'Upcoming' : 'Completed'}
            </span>
          </div>
          {shift.notes && (
            <div className="mt-3 p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">{shift.notes}</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Navbar */}
      <nav className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold">
                {user?.name?.charAt(0)?.toUpperCase()}
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-800">Shift Management</h2>
                <p className="text-xs text-gray-500">Employee Dashboard</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right hidden md:block">
                <p className="text-sm font-semibold text-gray-800">{user?.name}</p>
                <p className="text-xs text-gray-500">{user?.role?.toUpperCase()}</p>
              </div>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-2xl p-6 mb-8 text-white shadow-lg">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold mb-2">Welcome back, {user?.name}! 👋</h1>
              <p className="text-blue-100">Manage and track your shifts efficiently</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="bg-white/20 backdrop-blur-sm rounded-xl px-6 py-3">
                <p className="text-xs text-blue-100 mb-1">Your Role</p>
                <p className="text-lg font-bold">{user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200 hover:shadow-xl transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <User className="h-6 w-6 text-blue-600" />
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-gray-800">{stats.totalShifts}</p>
              </div>
            </div>
            <h3 className="text-lg font-semibold text-gray-800">Total Shifts</h3>
            <p className="text-sm text-gray-500">All your scheduled shifts</p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200 hover:shadow-xl transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Clock className="h-6 w-6 text-green-600" />
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-green-600">{stats.totalHours}</p>
              </div>
            </div>
            <h3 className="text-lg font-semibold text-gray-800">Total Hours</h3>
            <p className="text-sm text-gray-500">Hours worked this month</p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200 hover:shadow-xl transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Calendar className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-yellow-600">{stats.upcomingShifts}</p>
              </div>
            </div>
            <h3 className="text-lg font-semibold text-gray-800">Upcoming</h3>
            <p className="text-sm text-gray-500">Shifts scheduled</p>
          </div>
        </div>

        {/* Shifts Sections */}
        <div className="space-y-8">
          {/* Upcoming Shifts */}
          <section className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-800">Upcoming Shifts</h2>
              <p className="text-sm text-gray-500">Your scheduled shifts</p>
            </div>
            <div className="p-6">
              {upcomingShifts.length > 0 ? (
                <div className="grid gap-4">
                  {upcomingShifts.map((shift, index) => renderShiftCard(shift, index))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Calendar className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-700 mb-1">No upcoming shifts</h3>
                  <p className="text-gray-500">You don't have any shifts scheduled yet.</p>
                </div>
              )}
            </div>
          </section>

          {/* Past Shifts */}
          <section className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-800">Past Shifts</h2>
              <p className="text-sm text-gray-500">Your completed shifts</p>
            </div>
            <div className="p-6">
              {pastShifts.length > 0 ? (
                <div className="grid gap-4">
                  {pastShifts.map((shift, index) => renderShiftCard(shift, index))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Clock className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-700 mb-1">No past shifts</h3>
                  <p className="text-gray-500">Your shift history will appear here.</p>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-800 text-white mt-12">
        <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div>
              <p className="text-sm text-gray-300">
                © {new Date().getFullYear()} Shift Management System. All rights reserved.
              </p>
            </div>
            <div className="flex gap-6 text-sm text-gray-300">
              <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
              <a href="#" className="hover:text-white transition-colors">Support</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default EmployeeDashboard;
