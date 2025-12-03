import { Navigate, useLocation } from 'react-router-dom';
import { useContext } from 'react';
import { toast } from 'react-toastify';
import { AppContext } from '../../context/AppContext';

const ProtectedRoute = ({ requiredRole, children }) => {
  const { user, loading, isAuthenticated } = useContext(AppContext);
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // If not authenticated, redirect to login with return URL
  if (!isAuthenticated || !user) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  // Check if the user has the required role
  if (requiredRole && user.role !== requiredRole) {
    // Show error message
    toast.error('You do not have permission to access this page');
    
    // Redirect to appropriate dashboard based on user role
    const redirectPath = user.role === 'admin' ? '/admin/dashboard' : '/employee/dashboard';
    return <Navigate to={redirectPath} replace />;
  }

  // If user has the required role, render the children
  return children;
};

export default ProtectedRoute;
