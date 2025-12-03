import React, { useState, useEffect, useContext } from 'react';
import { Calendar, Clock, User, Clock as ClockIcon } from 'react-feather';
import { AppContext } from '../../context/AppContext';
import axios from 'axios';

const EmployeeDashboard = () => {
  const { user } = useContext(AppContext);
  const [shifts, setShifts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [upcomingShifts, setUpcomingShifts] = useState([]);
  const [pastShifts, setPastShifts] = useState([]);
  const [stats, setStats] = useState({
    totalShifts: 0,
    totalHours: 0,
    upcomingShifts: 0
  });

  // Fetch employee's shifts
  useEffect(() => {
    const fetchShifts = async () => {
      try {
        const response = await axios.get('/api/v1/shifts/my-shifts');
        const shiftsData = response.data.data.shifts;
        
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
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const renderShiftCard = (shift) => (
    <div key={shift._id} className="bg-white rounded-lg shadow p-4 mb-4 border-l-4 border-blue-500">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-lg font-semibold text-gray-800">
            {formatDate(shift.date)}
          </h3>
          <div className="flex items-center mt-2 text-gray-600">
            <ClockIcon className="h-4 w-4 mr-2" />
            <span>{shift.startTime} - {shift.endTime}</span>
            <span className="mx-2">•</span>
            <span>{shift.hours} hours</span>
          </div>
        </div>
        <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">
          {new Date(shift.date) >= new Date() ? 'Upcoming' : 'Completed'}
        </span>
      </div>
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Welcome back, {user?.name}!</h1>
        <p className="text-gray-600">Here's your shift schedule and statistics.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100 text-blue-600">
              <User className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Shifts</p>
              <p className="text-2xl font-semibold text-gray-800">{stats.totalShifts}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100 text-green-600">
              <Clock className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Hours</p>
              <p className="text-2xl font-semibold text-gray-800">{stats.totalHours}h</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-yellow-100 text-yellow-600">
              <Calendar className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Upcoming Shifts</p>
              <p className="text-2xl font-semibold text-gray-800">{stats.upcomingShifts}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Upcoming Shifts */}
      <div className="mb-12">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800">Upcoming Shifts</h2>
        </div>
        
        {upcomingShifts.length > 0 ? (
          <div className="space-y-4">
            {upcomingShifts.map(renderShiftCard)}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <Calendar className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-700 mb-1">No upcoming shifts</h3>
            <p className="text-gray-500">You don't have any shifts scheduled yet.</p>
          </div>
        )}
      </div>

      {/* Past Shifts */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800">Past Shifts</h2>
        </div>
        
        {pastShifts.length > 0 ? (
          <div className="space-y-4">
            {pastShifts.map(renderShiftCard)}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <Clock className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-700 mb-1">No past shifts</h3>
            <p className="text-gray-500">Your shift history will appear here.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmployeeDashboard;
