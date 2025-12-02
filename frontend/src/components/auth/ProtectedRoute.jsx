import { Navigate, useLocation } from 'react-router-dom';
import { useContext } from 'react';
import { AppContext } from '../../context/AppContext';

const ProtectedRoute = ({ requiredRole, children }) => {
  const { isAuthenticated, isAdmin, loading } = useContext(AppContext);
  const location = useLocation();

  if (loading) {
    // Show loading spinner or skeleton while checking auth status
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirect to login if not authenticated
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  // Check if the user has the required role
  if (requiredRole && ((requiredRole === 'admin' && !isAdmin) || (requiredRole === 'employee' && isAdmin))) {
    // Redirect to appropriate dashboard if role doesn't match
    const redirectPath = isAdmin ? '/admin/dashboard' : '/employee/dashboard';
    return <Navigate to={redirectPath} replace />;
  }

  // Render the protected content
  return children;
};

export default ProtectedRoute;
