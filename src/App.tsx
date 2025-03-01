import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ReservationForm from './components/ReservationForm';
import Calendar from './components/Calendar';
import Dashboard from './components/Dashboard';
import Login from './components/Login';
import Register from './components/Register';
import Navigation from './components/Navigation';
import ProtectedRoute from './components/ProtectedRoute';
import ROUTES, { isAuthenticated } from './utils/routes';

const App: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navigation />
      <div className="flex-grow">
        <Routes>
          <Route path={ROUTES.HOME} element={<Home />} />
          <Route path={ROUTES.LOGIN} element={<Login />} />
          <Route path={ROUTES.REGISTER} element={<Register />} />
          <Route 
            path={ROUTES.CALENDAR} 
            element={
              <ProtectedRoute>
                <Calendar />
              </ProtectedRoute>
            } 
          />
          <Route
            path={ROUTES.RESERVATION}
            element={
              <ProtectedRoute>
                <ReservationForm />
              </ProtectedRoute>
            }
          />
          <Route
            path={ROUTES.DASHBOARD}
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to={ROUTES.HOME} replace />} />
        </Routes>
      </div>
    </div>
  );
};

const Home: React.FC = () => {
  const authenticated = isAuthenticated();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl w-full space-y-8 bg-white p-6 sm:p-8 rounded-2xl shadow-md transition-all duration-300">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold text-center text-gray-800 mb-4">
            CarRes - Car Reservation System
          </h1>
          <p className="mt-2 text-center text-gray-500">
            Welcome to the car reservation system! Manage your car bookings with ease.
          </p>
        </div>
        
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          {authenticated ? (
            <>
              <a
                href={ROUTES.CALENDAR}
                className="inline-flex items-center px-5 py-3 border border-transparent text-base font-medium rounded-xl shadow-sm text-white bg-indigo-500 hover:bg-indigo-600 transition-colors duration-200 ease-in-out"
              >
                View Calendar
              </a>
              <a
                href={ROUTES.DASHBOARD}
                className="inline-flex items-center px-5 py-3 border border-gray-200 text-base font-medium rounded-xl shadow-sm text-gray-700 bg-white hover:bg-gray-50 transition-colors duration-200 ease-in-out"
              >
                My Reservations
              </a>
            </>
          ) : (
            <>
              <a
                href={ROUTES.LOGIN}
                className="inline-flex items-center px-5 py-3 border border-transparent text-base font-medium rounded-xl shadow-sm text-white bg-indigo-500 hover:bg-indigo-600 transition-colors duration-200 ease-in-out"
              >
                Login
              </a>
              <a
                href={ROUTES.REGISTER}
                className="inline-flex items-center px-5 py-3 border border-gray-200 text-base font-medium rounded-xl shadow-sm text-gray-700 bg-white hover:bg-gray-50 transition-colors duration-200 ease-in-out"
              >
                Register
              </a>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default App; 