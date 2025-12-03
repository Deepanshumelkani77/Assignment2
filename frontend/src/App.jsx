import React, { useContext } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import RoleSelection from './components/auth/RoleSelection';
import LoginForm from './components/auth/LoginForm';
import AdminDashboard from './components/dashboard/AdminDashboard';
import EmployeeDashboard from './components/dashboard/EmployeeDashboard';
import ProtectedRoute from './components/auth/ProtectedRoute';
import { AppContext } from './context/AppContext';

const App = () => {
  const { user, loading } = useContext(AppContext);
  const location = useLocation();
  
  // Show loading spinner while checking auth state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Only redirect to dashboard if specifically navigating to root and already logged in
  // But only if we're not on a login page
  if (user && location.pathname === '/' && !location.pathname.includes('/login')) {
    const redirectPath = user.role === 'admin' ? '/admin/dashboard' : '/employee/dashboard';
    return <Navigate to={redirectPath} replace />;
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
        
        {/* Redirect to appropriate dashboard based on role */}
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
