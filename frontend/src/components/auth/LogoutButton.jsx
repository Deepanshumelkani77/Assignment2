import React, { useContext } from 'react';
import { AppContext } from '../../context/AppContext';

const LogoutButton = ({ className = '' }) => {
  const { logout } = useContext(AppContext);

  return (
    <button
      onClick={logout}
      className={`px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors ${className}`}
    >
      Logout
    </button>
  );
};

export default LogoutButton;
