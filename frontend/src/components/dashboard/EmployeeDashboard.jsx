import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const EmployeeDashboard = () => {
  const [user, setUser] = useState({
    name: 'John Doe',
    role: 'Employee',
    department: 'Engineering',
    email: 'john.doe@example.com',
    joinDate: '2023-01-15'
  });
  
  const [upcomingShifts, setUpcomingShifts] = useState([
    { id: 1, date: '2023-06-15', start: '09:00', end: '17:00', type: 'Regular' },
    { id: 2, date: '2023-06-16', start: '13:00', end: '21:00', type: 'Evening' },
    { id: 3, date: '2023-06-17', start: 'Off', end: 'Off', type: 'Day Off' },
  ]);

  const [announcements] = useState([
    { id: 1, title: 'Team Meeting', date: '2023-06-14', content: 'Monthly team sync at 11 AM in Conference Room A' },
    { id: 2, title: 'System Maintenance', date: '2023-06-16', content: 'Planned system maintenance from 2 AM to 4 AM' },
  ]);

  const navigate = useNavigate();

  useEffect(() => {
    // In a real app, fetch employee data here
    const userName = localStorage.getItem('userName') || 'Employee';
    setUser(prev => ({
      ...prev,
      name: userName,
      role: localStorage.getItem('role') || 'Employee'
    }));
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    navigate('/');
  };

  const formatDate = (dateString) => {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 bg-[#041296] rounded-lg flex items-center justify-center text-white font-bold">
              ESB
            </div>
            <h1 className="text-xl font-bold text-gray-900">Employee Dashboard</h1>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600">Welcome, {user.name}</span>
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-sm bg-red-600 text-white rounded-md hover:bg-red-700"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Upcoming Shifts */}
          <div className="lg:col-span-2">
            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
              <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                <h3 className="text-lg leading-6 font-medium text-gray-900">Upcoming Shifts</h3>
              </div>
              <div className="bg-white overflow-hidden">
                <ul className="divide-y divide-gray-200">
                  {upcomingShifts.map((shift) => (
                    <li key={shift.id} className="px-6 py-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-indigo-600">{shift.date}</p>
                          <p className="text-sm text-gray-500">
                            {shift.start} - {shift.end}
                          </p>
                        </div>
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          {shift.type}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Announcements */}
          <div>
            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
              <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                <h3 className="text-lg leading-6 font-medium text-gray-900">Announcements</h3>
              </div>
              <div className="divide-y divide-gray-200">
                {announcements.map((announcement) => (
                  <div key={announcement.id} className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">{announcement.title}</div>
                    <div className="mt-1 text-sm text-gray-500">{announcement.content}</div>
                    <div className="mt-1 text-xs text-gray-400">{announcement.date}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="mt-6 bg-white shadow overflow-hidden sm:rounded-lg">
              <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                <h3 className="text-lg leading-6 font-medium text-gray-900">Quick Actions</h3>
              </div>
              <div className="px-6 py-4 space-y-4">
                <button className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700">
                  Request Time Off
                </button>
                <button className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-indigo-700 bg-indigo-100 hover:bg-indigo-200">
                  View Schedule
                </button>
                <button className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100">
                  Update Availability
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default EmployeeDashboard;
