import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const LoginForm = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    employeeCode: '',
    department: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const isAdmin = location.pathname.includes('/admin');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // For demo purposes, check the hardcoded admin credentials
      if (isLogin) {
        if (formData.email === 'hire-me@anshumat.org' && formData.password === 'HireMe@2025!') {
          // Store token in localStorage
          localStorage.setItem('token', 'demo-jwt-token');
          localStorage.setItem('role', 'admin');
          navigate('/dashboard');
        } else {
          // For demo, any other credentials will work as employee
          localStorage.setItem('token', 'demo-employee-token');
          localStorage.setItem('role', 'employee');
          localStorage.setItem('userId', 'emp-' + Math.random().toString(36).substr(2, 9));
          navigate('/dashboard');
        }
      } else {
        // Handle signup logic here
        // For demo, just log and show success message
        console.log('Signup data:', formData);
        setLoading(false);
        alert('Account created successfully! Please login.');
        setIsLogin(true);
      }
    } catch (err) {
      setError(err.message || 'An error occurred. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-blue-600 mb-2">
            {isAdmin ? 'Admin' : 'Employee'} {isLogin ? 'Login' : 'Sign Up'}
          </h1>
          <p className="text-gray-600">
            {isLogin 
              ? 'Sign in to access your account' 
              : 'Create a new account to get started'}
          </p>
        </div>

        <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-100">
          {error && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="John Doe"
                  required={!isLogin}
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="you@example.com"
                required
              />
            </div>

            {!isLogin && !isAdmin && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Employee Code
                  </label>
                  <input
                    type="text"
                    name="employeeCode"
                    value={formData.employeeCode}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="EMP123"
                    required={!isLogin && !isAdmin}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Department
                  </label>
                  <input
                    type="text"
                    name="department"
                    value={formData.department}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., Engineering, HR"
                    required={!isLogin && !isAdmin}
                  />
                </div>
              </>
            )}

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                {isLogin && (
                  <a href="#" className="text-xs text-blue-600 hover:underline">
                    Forgot password?
                  </a>
                )}
              </div>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="••••••••"
                required
                minLength={isLogin ? 1 : 6}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-2 px-4 rounded-md text-white font-medium ${
                loading ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'
              } transition-colors`}
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </span>
              ) : isLogin ? (
                'Sign In'
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          <div className="mt-4 text-center">
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-blue-600 hover:underline text-sm font-medium"
            >
              {isLogin 
                ? "Don't have an account? Sign up" 
                : 'Already have an account? Sign in'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;
