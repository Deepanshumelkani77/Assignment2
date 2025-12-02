import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import RoleSelection from './components/auth/RoleSelection';
import LoginForm from './components/auth/LoginForm';
import Dashboard from './components/dashboard/Dashboard';
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
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<Dashboard />} />
          {/* Add more protected routes here */}
        </Route>
        
        {/* Catch all - redirect to home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
};

export default App;
