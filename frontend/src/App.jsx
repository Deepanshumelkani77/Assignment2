import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import RoleSelection from './components/auth/RoleSelection';
import LoginForm from './components/auth/LoginForm';
import AdminDashboard from './components/dashboard/AdminDashboard';
import EmployeeDashboard from './components/dashboard/EmployeeDashboard';
import ProtectedRoute from './components/auth/ProtectedRoute';
import { useContext } from 'react';
import { AppContext } from './context/AppContext';

const App = () => {
  const { user } = useContext(AppContext);
  
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
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <Routes>
                    <Route 
                      index 
                      element={
                        <Navigate 
                          to={localStorage.getItem('user') && JSON.parse(localStorage.getItem('user')).role === 'admin' 
                            ? '/admin/dashboard' 
                            : '/employee/dashboard'
                          } 
                          replace 
                        />
                      } 
                    />
                  </Routes>
                </ProtectedRoute>
              } 
            />
            
            {/* Catch all - redirect to home */}
            <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
};

export default App;
