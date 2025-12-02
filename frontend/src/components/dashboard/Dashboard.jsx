import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const [userRole, setUserRole] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    
    if (!token) {
      navigate('/');
    } else {
      setUserRole(role || 'employee');
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('userId');
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-blue-600">ShiftScheduler</h1>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600">
              Logged in as: <span className="font-medium capitalize">{userRole}</span>
            </span>
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-sm text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">
            Welcome to your {userRole === 'admin' ? 'Admin' : 'Employee'} Dashboard
          </h2>
          
          {userRole === 'admin' ? (
            <div className="space-y-6">
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                <h3 className="text-lg font-medium text-blue-800 mb-2">Admin Controls</h3>
                <p className="text-blue-700">
                  You have full access to manage all employee shifts.
                </p>
                <div className="mt-4 flex space-x-3">
                  <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
                    View All Shifts
                  </button>
                  <button className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors">
                    Add New Shift
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-green-50 rounded-lg border border-green-100">
              <h3 className="text-lg font-medium text-green-800 mb-2">Your Shifts</h3>
              <p className="text-green-700">
                View and manage your work schedule.
              </p>
              <div className="mt-4">
                <button className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors">
                  View My Schedule
                </button>
              </div>
            </div>
          )}

          <div className="mt-8">
            <h3 className="text-lg font-medium text-gray-800 mb-4">Recent Activity</h3>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-gray-600 italic">
                {userRole === 'admin' 
                  ? 'No recent activity. Start managing employee shifts.'
                  : 'You have no recent shift updates.'}
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
