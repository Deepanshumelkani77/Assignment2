import { Navigate, Outlet, useLocation } from 'react-router-dom';

const ProtectedRoute = ({ requiredRole }) => {
  const token = localStorage.getItem('token');
  const userRole = localStorage.getItem('role');
  const location = useLocation();

  if (!token) {
    // Redirect to login if not authenticated
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  // If no specific role is required or user has the required role, allow access
  if (!requiredRole || userRole === requiredRole) {
    return <Outlet />;
  }

  // Redirect based on user role if they don't have access to the current route
  const redirectPath = userRole === 'admin' ? '/admin/dashboard' : '/employee/dashboard';
  return <Navigate to={redirectPath} state={{ from: location }} replace />;
};

export default ProtectedRoute;
