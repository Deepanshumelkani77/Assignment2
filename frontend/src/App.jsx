import React, { useContext, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import RoleSelection from './components/auth/RoleSelection';
import LoginForm from './components/auth/LoginForm';
import AdminDashboard from './components/dashboard/AdminDashboard';
import EmployeeDashboard from './components/dashboard/EmployeeDashboard';
import ProtectedRoute from './components/auth/ProtectedRoute';
import { AppContext } from './context/AppContext';

const App = () => {
  const { user, loading, checkAuth } = useContext(AppContext);
  const location = useLocation();
  
  // Check authentication status on app load
  useEffect(() => {
    const verifyAuth = async () => {
      try {
        await checkAuth();
      } catch (error) {
        console.error('Authentication check failed:', error);
        toast.error('Failed to verify authentication status');
      }
    };
    
    verifyAuth();
  }, [checkAuth]);
  
  // Show loading spinner while checking auth state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Redirect to appropriate dashboard if user is already authenticated
  if (user) {
    // If trying to access root or login pages, redirect to appropriate dashboard
      if (location.pathname === '/' || location.pathname.startsWith('/login')) {
        const redirectPath = user.role === 'admin' ? '/admin/dashboard' : '/employee/dashboard';
        return <Navigate to={redirectPath} replace />;
      }
      
      // Prevent access to other role's dashboard
      if (
        (user.role === 'admin' && location.pathname.startsWith('/employee')) ||
        (user.role === 'employee' && location.pathname.startsWith('/admin'))
      ) {
        toast.error('You do not have permission to access this page');
        const redirectPath = user.role === 'admin' ? '/admin/dashboard' : '/employee/dashboard';
        return <Navigate to={redirectPath} replace />;
      }
  }
  
  return (
    <div className="min-h-screen bg-white">
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<RoleSelection />} />
        <Route path="/login/admin" element={<LoginForm />} />
        <Route path="/login/employee" element={<LoginForm />} />
        
        {/* Admin Protected Routes */}
        <Route
          path="/admin/*"
          element={
            <ProtectedRoute requiredRole="admin">
              <Routes>
                <Route path="dashboard" element={<AdminDashboard />} />
                {/* Add more admin routes here */}
                <Route index element={<Navigate to="dashboard" replace />} />
              </Routes>
            </ProtectedRoute>
          }
        />
        
        {/* Employee Protected Routes */}
        <Route
          path="/employee/*"
          element={
            <ProtectedRoute requiredRole="employee">
              <Routes>
                <Route path="dashboard" element={<EmployeeDashboard />} />
                {/* Add more employee routes here */}
                <Route index element={<Navigate to="dashboard" replace />} />
              </Routes>
            </ProtectedRoute>
          }
        />
        
        {/* Public error pages */}
        <Route path="/unauthorized" element={
          <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <h1 className="text-4xl font-bold text-red-600 mb-4">403</h1>
              <h2 className="text-2xl font-semibold text-gray-800 mb-2">Access Denied</h2>
              <p className="text-gray-600 mb-6">You don't have permission to access this page.</p>
              <button 
                onClick={() => window.history.back()}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Go Back
              </button>
            </div>
          </div>
        } />
        
        {/* Fallback route */}
        <Route 
          path="*" 
          element={
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
              <div className="text-center">
                <h1 className="text-4xl font-bold text-gray-800 mb-4">404</h1>
                <h2 className="text-2xl font-semibold text-gray-700 mb-2">Page Not Found</h2>
                <p className="text-gray-600 mb-6">The page you're looking for doesn't exist or has been moved.</p>
                <button 
                  onClick={() => window.history.back()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  Go Back
                </button>
              </div>
            </div>
          } 
        />
        
        {/* Redirect to appropriate dashboard based on role */}
        <Route 
          path="/dashboard" 
          element={
            user ? (
              <Navigate 
                to={user.role === 'admin' ? '/admin/dashboard' : '/employee/dashboard'} 
                replace 
              />
            ) : (
              <Navigate to="/" replace />
            )
          } 
        />
        
        {/* Catch all - redirect to appropriate page */}
        <Route 
          path="*" 
          element={
            user ? (
              <Navigate 
                to={user.role === 'admin' ? '/admin/dashboard' : '/employee/dashboard'} 
                replace 
              />
            ) : (
              <Navigate to="/" replace />
            )
          } 
        />
      </Routes>
    </div>
  );
};

export default App;
