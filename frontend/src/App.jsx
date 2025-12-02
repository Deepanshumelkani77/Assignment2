import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import RoleSelection from './components/auth/RoleSelection';
import LoginForm from './components/auth/LoginForm';
import AdminDashboard from './components/dashboard/AdminDashboard';
import EmployeeDashboard from './components/dashboard/EmployeeDashboard';
import ProtectedRoute from './components/auth/ProtectedRoute';

const App = () => {
  return (
    <div className="min-h-screen bg-white">
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<RoleSelection />} />
        <Route path="/login/admin" element={<LoginForm />} />
        <Route path="/login/employee" element={<LoginForm />} />
        
        {/* Protected Routes */}
        <Route element={<ProtectedRoute requiredRole="admin" />}>
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          {/* Add more admin protected routes here */}
        </Route>
        
        <Route element={<ProtectedRoute requiredRole="employee" />}>
          <Route path="/employee/dashboard" element={<EmployeeDashboard />} />
          {/* Add more employee protected routes here */}
        </Route>
        
        {/* Redirect based on role after login */}
        <Route path="/dashboard" element={
          localStorage.getItem('role') === 'admin' ? 
            <Navigate to="/admin/dashboard" replace /> : 
            <Navigate to="/employee/dashboard" replace />
        } />
        
        {/* Catch all - redirect to home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
};

export default App;
