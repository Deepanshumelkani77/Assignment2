import { createContext, useState, useEffect } from "react";
import { useNavigate } from 'react-router-dom';

const API_URL = 'https://assignment2-t9he.onrender.com';

export const AppContext = createContext();

const AppContextProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Check if user is logged in on initial load
  useEffect(() => {
    const checkAuth = async () => {
      const storedUser = localStorage.getItem('user');
      const token = localStorage.getItem('token');
      
      if (storedUser && token) {
        try {
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);
          
          // Always validate the token with the server
          await checkUserLoggedIn();
          
          // If we're on the login or role selection page but already logged in, redirect to appropriate dashboard
          if (window.location.pathname === '/' || window.location.pathname.includes('/login')) {
            const dashboardPath = parsedUser.role === 'admin' ? '/admin/dashboard' : '/employee/dashboard';
            navigate(dashboardPath, { replace: true });
          }
        } catch (error) {
          console.error('Authentication error:', error);
          // Clear invalid auth data
          localStorage.removeItem('user');
          localStorage.removeItem('token');
          setUser(null);
          
          // Only redirect if we're on a protected route
          if (window.location.pathname.startsWith('/admin/') || 
              window.location.pathname.startsWith('/employee/')) {
            navigate('/', { replace: true });
          }
        }
      } else {
        // No stored user/token but trying to access protected route
        if (window.location.pathname.startsWith('/admin/') || 
            window.location.pathname.startsWith('/employee/')) {
          navigate('/', { replace: true });
        }
      }
    };
    
    checkAuth();
  }, [navigate]);

  // Check if user is logged in with the server
  const checkUserLoggedIn = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No token found');
    }

    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/v1/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        const userData = data.data?.user || data.user;
        if (userData) {
          setUser(userData);
          localStorage.setItem('user', JSON.stringify(userData));
        } else {
          // If no user data in response, clear everything
          console.error('No user data in response');
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setUser(null);
        }
      } else {
        console.error('Auth check failed:', await response.text());
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
      }
    } catch (err) {
      console.error('Error checking auth status:', err);
      // Don't clear user state on network errors to prevent UI flicker
      // The user can still interact with the app in offline mode
    } finally {
      setLoading(false);
    }
  };

  // Register a new user
  const register = async (userData, role = 'employee') => {
    try {
      setLoading(true);
      setError(null);
      
      // Prepare the request body based on role
      const requestBody = {
        name: userData.name.trim(),
        email: userData.email.trim().toLowerCase(),
        password: userData.password,
        role: role
      };

      // Add employee-specific fields if role is employee
      if (role === 'employee') {
        if (!userData.employeeCode || !userData.department) {
          throw new Error('Employee code and department are required');
        }
        requestBody.employeeCode = userData.employeeCode.trim();
        requestBody.department = userData.department.trim();
      }

      console.log('Sending registration request:', requestBody);
      
      const response = await fetch(`${API_URL}/api/v1/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json().catch(err => {
        console.error('Error parsing response:', err);
        throw new Error('Invalid response from server');
      });

      console.log('Registration response:', data);

      if (!response.ok) {
        throw new Error(data.message || data.error?.message || 'Registration failed');
      }

      // If we have a token, store it and the user data
      if (data.token) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.data?.user || data.user));
        setUser(data.data?.user || data.user);
      }

      // Return success with user data
      return { 
        success: true,
        user: data.data?.user
      };
    } catch (err) {
      console.error('Registration error:', err);
      const errorMessage = err.message || 'Registration failed. Please check your details and try again.';
      setError(errorMessage);
      return { 
        success: false, 
        error: errorMessage 
      };
    } finally {
      setLoading(false);
    }
  };

  // Login user
  const login = async (email, password) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${API_URL}/api/v1/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      // Handle different response formats
      const token = data.token || (data.data && data.data.token);
      const userData = data.user || (data.data && data.data.user);
      
      if (!token || !userData) {
        throw new Error('Invalid response from server');
      }
      
      // Store the token and user data
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userData));
      
      setUser(userData);
      
      // Redirect based on role
      const redirectPath = userData.role === 'admin' ? '/admin/dashboard' : '/employee/dashboard';
      navigate(redirectPath);
      
      return data;
    } catch (error) {
      console.error('Login error:', error);
      setError(error.message || 'Login failed. Please try again.');
      // Clear any partial login state on error
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setUser(null);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Logout user
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    navigate('/');
  };

  // Update user profile
  const updateProfile = async (userData) => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/auth/updatedetails`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(userData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Update failed');
      }

      setUser(data.data.user);
      localStorage.setItem('user', JSON.stringify(data.data.user));
      
      return { success: true };
    } catch (err) {
      setError(err.message || 'Update failed. Please try again.');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  // Update password
  const updatePassword = async (currentPassword, newPassword) => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/auth/updatepassword`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Password update failed');
      }
      
      return { success: true };
    } catch (err) {
      setError(err.message || 'Password update failed. Please try again.');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const value = {
    user,
    loading,
    error,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
    register,
    login,
    logout,
    updateProfile,
    updatePassword,
    setError,
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};

export default AppContextProvider;
