import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const AdminDashboard = () => {
  const [user, setUser] = useState({
    name: 'Admin User',
    role: 'Admin',
    email: 'admin@example.com',
  });
  
  const [employees, setEmployees] = useState([
    { id: 1, name: 'John Doe', department: 'Engineering', email: 'john@example.com' },
    { id: 2, name: 'Jane Smith', department: 'HR', email: 'jane@example.com' },
  ]);

  const [shifts, setShifts] = useState([
    { id: 1, employee: 'John Doe', date: '2023-06-15', start: '09:00', end: '17:00', status: 'Scheduled' },
    { id: 2, employee: 'Jane Smith', date: '2023-06-15', start: '13:00', end: '21:00', status: 'Scheduled' },
  ]);

  const navigate = useNavigate();

  useEffect(() => {
    // In a real app, fetch admin data here
    const userName = localStorage.getItem('userName') || 'Admin User';
    setUser(prev => ({ ...prev, name: userName }));
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    navigate('/');
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
            <h1 className="text-xl font-bold text-gray-900">Admin Dashboard</h1>
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
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900">Total Employees</h3>
            <p className="mt-2 text-3xl font-bold text-indigo-600">{employees.length}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900">Active Shifts</h3>
            <p className="mt-2 text-3xl font-bold text-green-600">
              {shifts.filter(shift => shift.status === 'Scheduled').length}
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900">Departments</h3>
            <p className="mt-2 text-3xl font-bold text-purple-600">
              {new Set(employees.map(emp => emp.department)).size}
            </p>
          </div>
        </div>

        {/* Recent Shifts */}
        <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-8">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Recent Shifts</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Shift Time</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {shifts.map((shift) => (
                  <tr key={shift.id}>
                    <td className="px-6 py-4 whitespace-nowrap">{shift.employee}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{shift.date}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {shift.start} - {shift.end}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                        {shift.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
