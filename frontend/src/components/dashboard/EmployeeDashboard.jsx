import React, { useState, useEffect, useContext } from 'react';
import { Calendar, Clock, User, Clock as ClockIcon, LogOut } from 'react-feather';
import { AppContext } from '../../context/AppContext';
import api from '../../utils/api';

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
        const response = await api.get('/api/v1/shifts/my-shifts');
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
    
    // Generate a subtle color based on shift department or use default
    const departmentColors = {
      'development': 'from-emerald-100 to-cyan-100',
      'design': 'from-purple-100 to-pink-100',
      'marketing': 'from-amber-100 to-orange-100',
      'support': 'from-blue-100 to-indigo-100',
      'default': 'from-gray-50 to-gray-100'
    };
    
    const cardBg = departmentColors[shift.department?.toLowerCase()] || departmentColors.default;
    
    return (
      <div 
        key={shift._id} 
        className={`bg-gradient-to-br ${cardBg} rounded-xl shadow-sm border border-gray-100 hover:shadow-lg transition-all overflow-hidden hover:-translate-y-0.5`}
      >
        <div className="p-5 relative">
          {isToday && (
            <span className="absolute -top-2 -right-2 bg-gradient-to-r from-amber-400 to-orange-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-md">
              Today
            </span>
          )}
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <div className="flex items-center mb-2">
                <div className={`w-2.5 h-2.5 rounded-full mr-3 ${isUpcoming ? 'bg-[#021189]' : 'bg-gray-400'}`}></div>
                <span className="text-sm font-medium text-gray-600">
                  {isToday ? 'Today' : formatDate(shift.date).split(',')[0]}
                </span>
              </div>
              <h3 className="text-lg font-bold text-gray-800 mb-1">
                {shift.department || 'Shift'}
              </h3>
              <div className="flex items-center text-gray-600 text-sm">
                <ClockIcon className="h-4 w-4 mr-1.5 text-[#021189]" />
                <span>{shift.startTime} - {shift.endTime}</span>
                <span className="mx-2 text-gray-300">•</span>
                <span className="font-semibold text-gray-700">{shift.hours} hours</span>
              </div>
            </div>
            <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
              isUpcoming 
                ? 'bg-gradient-to-r from-[#021189] to-[#1a3cff] text-white' 
                : 'bg-gray-200 text-gray-700'
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
    <div className="min-h-screen bg-gray-200">
      {/* Header Navbar */}
      <nav className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#021189] flex items-center justify-center text-white font-bold">
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
                className="px-4 py-2 bg-[#021189] text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="bg-[#021189] rounded-2xl p-6 mb-8 text-white shadow-lg relative overflow-hidden">
          {/* Decorative elements */}
          <div className="absolute -right-10 -top-10 w-40 h-40 bg-gradient-to-br from-cyan-400/20 to-purple-400/20 rounded-full"></div>
          <div className="absolute -right-5 -bottom-5 w-24 h-24 bg-gradient-to-br from-pink-400/20 to-rose-400/20 rounded-full"></div>
          <div className="absolute -left-10 top-1/2 w-32 h-32 bg-gradient-to-br from-emerald-400/20 to-cyan-400/20 rounded-full transform -translate-y-1/2"></div>
          
          <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-white to-blue-100">
                Welcome back, {user?.name}! 👋
              </h1>
              <p className="text-blue-100/90">Manage and track your shifts efficiently</p>
              
              {/* Quick Stats */}
              <div className="mt-4 flex flex-wrap gap-3">
                <div className="backdrop-blur-sm rounded-lg px-4 py-2 bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                  <p className="text-xs text-blue-100/80">Today</p>
                  <p className="font-semibold">
                    {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                  </p>
                </div>
                <div className="backdrop-blur-sm rounded-lg px-4 py-2 bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                  <p className="text-xs text-blue-100/80">Next Shift</p>
                  <p className="font-semibold">
                    {upcomingShifts.length > 0 ? 
                      `${upcomingShifts[0]?.date} at ${upcomingShifts[0]?.startTime}` : 
                      'No upcoming shifts'}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="backdrop-blur-sm rounded-xl px-6 py-3 bg-gradient-to-br from-blue-600/80 to-indigo-600/80 border border-white/10 hover:shadow-lg transition-all hover:scale-[1.02]">
                <p className="text-xs text-blue-100/80 mb-1">Your Role</p>
                <p className="text-lg font-bold flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                  {user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 hover:shadow-xl transition-all hover:-translate-y-1 group relative overflow-hidden">
            <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-gradient-to-tr from-emerald-100 to-cyan-100 rounded-full transform scale-0 group-hover:scale-100 transition-transform duration-500"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-lg flex items-center justify-center shadow-md shadow-emerald-100">
                  <User className="h-6 w-6 text-white" />
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-cyan-600 bg-clip-text text-transparent">
                    {stats.totalShifts}
                  </p>
                </div>
              </div>
              <h3 className="text-lg font-bold text-gray-800 mb-1">Total Shifts</h3>
              <p className="text-sm text-gray-500">All your scheduled shifts</p>
              <div className="mt-3 h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-emerald-400 to-cyan-400 rounded-full" style={{ width: '100%' }}></div>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 hover:shadow-xl transition-all hover:-translate-y-1 group relative overflow-hidden">
            <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-gradient-to-tr from-amber-100 to-orange-100 rounded-full transform scale-0 group-hover:scale-100 transition-transform duration-500"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-500 rounded-lg flex items-center justify-center shadow-md shadow-amber-100">
                  <Clock className="h-6 w-6 text-white" />
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
                    {stats.totalHours}
                  </p>
                </div>
              </div>
              <h3 className="text-lg font-bold text-gray-800 mb-1">Total Hours</h3>
              <p className="text-sm text-gray-500">Hours worked this month</p>
              <div className="mt-3 h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-amber-400 to-orange-400 rounded-full" style={{ width: '75%' }}></div>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 hover:shadow-xl transition-all hover:-translate-y-1 group relative overflow-hidden">
            <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-gradient-to-tr from-violet-100 to-purple-100 rounded-full transform scale-0 group-hover:scale-100 transition-transform duration-500"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-purple-500 rounded-lg flex items-center justify-center shadow-md shadow-violet-100">
                  <Calendar className="h-6 w-6 text-white" />
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
                    {stats.upcomingShifts}
                  </p>
                </div>
              </div>
              <h3 className="text-lg font-bold text-gray-800 mb-1">Upcoming</h3>
              <p className="text-sm text-gray-500">Shifts scheduled</p>
              <div className="mt-3 h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-violet-400 to-purple-400 rounded-full" style={{ width: '50%' }}></div>
              </div>
            </div>
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
      <footer className="bg-gradient-to-br from-[#021189] via-[#0a2ab5] to-[#1a3cff] text-white mt-16 pt-12 pb-8 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-400 via-pink-400 to-purple-400"></div>
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-cyan-400/10 rounded-full"></div>
        <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-purple-400/10 rounded-full"></div>
        <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="text-lg font-bold mb-4 flex items-center">
                <span className="text-2xl mr-2">📊</span>
                ShiftSync
              </h3>
              <p className="text-sm text-blue-100/80">
                Efficient shift management system for modern workplaces.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-sm text-blue-100/80">
                <li><a href="#" className="hover:text-white transition-colors">My Shifts</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Schedule</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Time Off</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-blue-100/80">
                <li><a href="#" className="hover:text-white transition-colors">About Us</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-sm text-blue-100/80">
                <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Tutorials</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Feedback</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-white/10 pt-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="text-center md:text-left">
                <p className="text-sm text-blue-100/70">
                  © {new Date().getFullYear()} ShiftSync. All rights reserved.
                </p>
              </div>
              <div className="flex items-center gap-6">
                <div className="flex gap-4">
                  <a href="#" className="text-blue-100/70 hover:text-white transition-colors">
                    <span className="sr-only">Twitter</span>
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84"></path>
                    </svg>
                  </a>
                  <a href="#" className="text-blue-100/70 hover:text-white transition-colors">
                    <span className="sr-only">GitHub</span>
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                      <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd"></path>
                    </svg>
                  </a>
                  <a href="#" className="text-blue-100/70 hover:text-white transition-colors">
                    <span className="sr-only">LinkedIn</span>
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                    </svg>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default EmployeeDashboard;
