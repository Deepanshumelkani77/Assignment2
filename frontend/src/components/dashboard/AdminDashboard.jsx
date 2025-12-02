import React, { useState, useContext } from 'react';
import { Link } from 'react-router-dom';
import LogoutButton from '../auth/LogoutButton';
import { AppContext } from '../../context/AppContext';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const { user } = useContext(AppContext);

  // Mock data - in a real app, this would come from an API
  const stats = [
    { name: 'Total Employees', value: '24', change: '+4.75%', changeType: 'positive' },
    { name: 'Active Shifts', value: '12', change: '+2.02%', changeType: 'positive' },
    { name: 'Pending Requests', value: '5', change: '0%', changeType: 'neutral' },
    { name: 'Upcoming Holidays', value: '2', change: '+1.39%', changeType: 'positive' },
  ];

  const recentShifts = [
    { id: 1, name: 'John Doe', date: '2023-11-15', shift: 'Morning', status: 'Completed' },
    { id: 2, name: 'Jane Smith', date: '2023-11-15', shift: 'Evening', status: 'In Progress' },
    { id: 3, name: 'Robert Johnson', date: '2023-11-16', shift: 'Night', status: 'Scheduled' },
  ];

  const upcomingTimeOff = [
    { id: 1, name: 'Emily Davis', startDate: '2023-11-20', endDate: '2023-11-22', type: 'Vacation' },
    { id: 2, name: 'Michael Brown', startDate: '2023-11-25', endDate: '2023-11-26', type: 'Sick Leave' },
  ];

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">{user.name}</p>
              <p className="text-xs text-gray-500">{user.role === 'admin' ? 'Administrator' : 'Employee'}</p>
            </div>
            <LogoutButton />
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
