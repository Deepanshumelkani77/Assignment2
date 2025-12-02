import { Navigate, Outlet } from 'react-router-dom';

const ProtectedRoute = ({ requiredRole }) => {
  const token = localStorage.getItem('token');
  const userRole = localStorage.getItem('role');

  if (!token) {
    return <Navigate to="/" replace />;
  }

  if (requiredRole && userRole !== requiredRole) {
    // If the user doesn't have the required role, redirect to dashboard or home
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
