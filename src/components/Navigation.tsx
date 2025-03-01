import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import ROUTES, { isAuthenticated, logout } from '../utils/routes';

const Navigation: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const authenticated = isAuthenticated();
  
  const handleLogout = () => {
    logout();
  };
  
  // Don't show navigation on login or register pages
  if (location.pathname === ROUTES.LOGIN || location.pathname === ROUTES.REGISTER) {
    return null;
  }
  
  return (
    <nav className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to={ROUTES.HOME} className="flex-shrink-0 flex items-center">
              <span className="text-indigo-600 font-bold text-xl">CarRes</span>
            </Link>
          </div>
          
          {authenticated ? (
            <div className="flex items-center space-x-2 sm:space-x-4">
              <Link
                to={ROUTES.CALENDAR}
                className={`px-3 py-2 text-sm font-medium rounded-md ${
                  location.pathname === ROUTES.CALENDAR 
                    ? 'bg-indigo-100 text-indigo-700' 
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                Calendar
              </Link>
              <Link
                to={ROUTES.DASHBOARD}
                className={`px-3 py-2 text-sm font-medium rounded-md ${
                  location.pathname === ROUTES.DASHBOARD 
                    ? 'bg-indigo-100 text-indigo-700' 
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                My Reservations
              </Link>
              <button
                onClick={handleLogout}
                className="ml-2 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-md"
              >
                Logout
              </button>
            </div>
          ) : (
            <div className="flex items-center space-x-2 sm:space-x-4">
              <Link
                to={ROUTES.LOGIN}
                className="px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-md"
              >
                Login
              </Link>
              <Link
                to={ROUTES.REGISTER}
                className="px-3 py-2 text-sm font-medium text-white bg-indigo-500 hover:bg-indigo-600 rounded-md"
              >
                Register
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navigation; 