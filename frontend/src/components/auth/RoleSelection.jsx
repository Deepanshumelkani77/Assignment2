import React from 'react';
import { useNavigate } from 'react-router-dom';

const RoleSelection = () => {
  const navigate = useNavigate();

  const roleCategories = [
    {
      id: 'admin',
      title: 'Administrator',
      description: 'Access admin dashboard to manage employee shifts and schedules',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      bgColor: 'bg-white',
      borderColor: 'border-blue-200',
      hoverColor: 'hover:border-blue-400',
      color: 'from-blue-500 to-blue-600',
      roles: ['Shift Management', 'Employee Oversight', 'Reporting']
    },
    {
      id: 'employee',
      title: 'Employee',
      description: 'View your schedule and manage your shifts',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      bgColor: 'bg-white',
      borderColor: 'border-green-200',
      hoverColor: 'hover:border-green-400',
      color: 'from-green-500 to-green-600',
      roles: ['View Schedule', 'Shift Requests', 'Availability']
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-center gap-4">
            <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
              ESB
            </div>
            <div className="text-center">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                Employee Shift Board
              </h1>
              <p className="text-sm sm:text-base text-gray-600 font-medium">
                Efficient Workforce Management System
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Welcome to Shift Management Portal
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Please select your role to continue to the login page
          </p>
        </div>

        {/* Role Selection Cards */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {roleCategories.map((category) => (
            <button
              key={category.id}
              onClick={() => navigate(`/login/${category.id}`)}
              className={`${category.bgColor} ${category.borderColor} ${category.hoverColor} border-2 rounded-2xl p-8 transition-all duration-300 hover:shadow-2xl hover:scale-105 active:scale-100 text-left group`}
            >
              <div className="flex flex-col items-center text-center space-y-4">
                <div className={`w-20 h-20 bg-gradient-to-br ${category.color} rounded-full flex items-center justify-center text-4xl shadow-lg group-hover:scale-110 transition-transform`}>
                  {category.icon}
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-bold text-gray-900">
                    {category.title}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {category.description}
                  </p>
                  <div className="pt-2">
                    <div className="inline-flex items-center gap-2 text-sm font-semibold text-gray-700">
                      <span>Continue</span>
                      <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </div>
                <div className="pt-4 border-t border-gray-200 w-full">
                  <div className="flex flex-wrap justify-center gap-2">
                    {category.roles.map((role, index) => (
                      <span key={index} className="inline-block px-3 py-1 bg-gray-50 rounded-full text-xs font-medium text-gray-700 shadow-sm">
                        {role}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Info Section */}
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-4xl mx-auto">
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl">📅</span>
              </div>
              <h4 className="font-semibold text-gray-900 mb-1">Easy Scheduling</h4>
              <p className="text-sm text-gray-600">Simple and intuitive shift management</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl">⚡</span>
              </div>
              <h4 className="font-semibold text-gray-900 mb-1">Quick Access</h4>
              <p className="text-sm text-gray-600">Fast and efficient workflow</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl">🔒</span>
              </div>
              <h4 className="font-semibold text-gray-900 mb-1">Secure</h4>
              <p className="text-sm text-gray-600">Your data is protected</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-sm text-gray-500">
            © {new Date().getFullYear()} Employee Shift Board. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
};

export default RoleSelection;