import React, { useState, useContext, useEffect } from 'react';
import { format, parseISO, isSameDay } from 'date-fns';
import { 
  FaCalendarAlt, 
  FaClock, 
  FaUser, 
  FaSignOutAlt,
  FaClock as FaClockSolid
} from 'react-icons/fa';
import { toast } from 'react-toastify';
import LogoutButton from '../auth/LogoutButton';
import { AppContext } from '../../context/AppContext';

const EmployeeDashboard = () => {
  const [shifts, setShifts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
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

  // Fetch employee's shifts
  useEffect(() => {
    const fetchShifts = async () => {
      try {
        setIsLoading(true);
        
        const response = await fetch(`${API_URL}/api/v1/shifts/my-shifts`, {
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch shifts');
        }
        
        const data = await response.json();
        
        if (data.status === 'success') {
          // Sort shifts by date and time
          const sortedShifts = data.data.shifts.sort((a, b) => {
            const dateA = new Date(`${a.date}T${a.startTime}`);
            const dateB = new Date(`${b.date}T${b.startTime}`);
            return dateA - dateB;
          });
          
          setShifts(sortedShifts);
        }
      } catch (error) {
        console.error('Error fetching shifts:', error);
        toast.error(error.message || 'Failed to fetch shifts');
        if (error.message.includes('401')) {
          logout();
        }
      } finally {
        setIsLoading(false);
      }
    };
    
    if (user) {
      fetchShifts();
    }
  }, [user, API_URL, authToken, logout]);
  
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
  
  const today = new Date();
  const todayShifts = shifts.filter(shift => isSameDay(parseISO(shift.date), today));
  const upcomingShifts = shifts.filter(shift => new Date(shift.date) > today);
  const groupedShifts = groupShiftsByDate();
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your shifts...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">My Schedule</h1>
              <p className="text-sm text-gray-500 mt-1">
                Welcome back, <span className="font-medium text-blue-600">{user?.name || 'Employee'}</span>
              </p>
            </div>
            <LogoutButton />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        {/* Today's Shift */}
        {todayShifts.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Today's Shift</h2>
            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
              <ul className="divide-y divide-gray-200">
                {todayShifts.map((shift) => (
                  <li key={shift._id} className="px-4 py-4 sm:px-6 hover:bg-gray-50">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                        <FaClockSolid className="h-5 w-5 text-green-600" />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {formatTime(shift.startTime)} - {formatTime(shift.endTime)}
                        </div>
                        <div className="text-sm text-gray-500 mt-1">
                          <span className="flex items-center">
                            <FaCalendarAlt className="mr-1.5 h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                            {format(parseISO(shift.date), 'EEEE, MMMM d, yyyy')}
                            <span className="mx-2 text-gray-300">•</span>
                            <span>{calculateDuration(shift.startTime, shift.endTime)} hours</span>
                          </span>
                        </div>
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
              <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
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
                              <div className="flex items-center">
                                <div className="flex-shrink-0 h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                                  <FaClock className="h-4 w-4 text-blue-600" />
                                </div>
                                <div className="ml-3">
                                  <div className="text-sm font-medium text-gray-900">
                                    {formatTime(shift.startTime)} - {formatTime(shift.endTime)}
                                  </div>
                                  <div className="mt-1 flex items-center text-sm text-gray-500">
                                    <span>{calculateDuration(shift.startTime, shift.endTime)} hours</span>
                                  </div>
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
              <h3 className="mt-2 text-sm font-medium text-gray-900">No shifts scheduled</h3>
              <p className="mt-1 text-sm text-gray-500">You don't have any upcoming shifts scheduled yet.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default EmployeeDashboard;
