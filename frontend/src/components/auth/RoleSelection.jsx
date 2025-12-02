import React from 'react';
import { useNavigate } from 'react-router-dom';

const RoleSelection = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-blue-600 mb-2">Welcome to ShiftScheduler</h1>
        <p className="text-gray-600">Please select your role to continue</p>
      </div>
      
      <div className="flex flex-col md:flex-row gap-6 w-full max-w-2xl">
        <div 
          onClick={() => navigate('/login/admin')}
          className="flex-1 p-8 bg-white rounded-xl shadow-lg border-2 border-blue-100 hover:border-blue-400 transition-all cursor-pointer transform hover:scale-105"
        >
          <div className="text-center">
            <div className="mx-auto w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-blue-600 mb-2">Admin Login</h2>
            <p className="text-gray-600">Access admin dashboard and manage employee shifts</p>
          </div>
        </div>

        <div 
          onClick={() => navigate('/login/employee')}
          className="flex-1 p-8 bg-white rounded-xl shadow-lg border-2 border-blue-100 hover:border-blue-400 transition-all cursor-pointer transform hover:scale-105"
        >
          <div className="text-center">
            <div className="mx-auto w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-blue-600 mb-2">Employee Login</h2>
            <p className="text-gray-600">View and manage your work schedule</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoleSelection;
