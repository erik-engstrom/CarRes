import React from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import ReservationForm from './components/ReservationForm';
import Calendar from './components/Calendar';
import Dashboard from './components/Dashboard';
import Login from './components/Login';
import Register from './components/Register';
import ProtectedRoute from './components/ProtectedRoute';

const HomePage: React.FC = () => {
  const isAuthenticated = !!localStorage.getItem('token');

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl w-full space-y-8 bg-white p-8 rounded-2xl shadow-md transition-all duration-300">
        <div>
          <h1 className="text-4xl font-bold text-center text-gray-800 mb-4">
            CarRes - Car Reservation System
          </h1>
          <p className="mt-2 text-center text-gray-500">
            Welcome to the car reservation system! Manage your car bookings with ease.
          </p>
        </div>
        
        {isAuthenticated ? (
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link
              to="/calendar"
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-xl shadow-sm text-white bg-indigo-500 hover:bg-indigo-600 transition-colors duration-200 ease-in-out"
            >
              View Calendar
            </Link>
            <Link
              to="/dashboard"
              className="inline-flex items-center px-6 py-3 border border-gray-200 text-base font-medium rounded-xl shadow-sm text-gray-700 bg-white hover:bg-gray-50 transition-colors duration-200 ease-in-out"
            >
              My Reservations
            </Link>
            <button
              onClick={() => {
                localStorage.removeItem('token');
                window.location.reload();
              }}
              className="inline-flex items-center px-6 py-3 border border-gray-200 text-base font-medium rounded-xl shadow-sm text-gray-700 bg-white hover:bg-gray-50 transition-colors duration-200 ease-in-out"
            >
              Logout
            </button>
          </div>
        ) : (
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link
              to="/login"
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-xl shadow-sm text-white bg-indigo-500 hover:bg-indigo-600 transition-colors duration-200 ease-in-out"
            >
              Login
            </Link>
            <Link
              to="/register"
              className="inline-flex items-center px-6 py-3 border border-gray-200 text-base font-medium rounded-xl shadow-sm text-gray-700 bg-white hover:bg-gray-50 transition-colors duration-200 ease-in-out"
            >
              Register
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/calendar" element={<Calendar />} />
        <Route
          path="/reservation/:date"
          element={
            <ProtectedRoute>
              <ReservationForm />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<div className="p-6 text-center"><h1 className="text-2xl text-red-600">Page Not Found</h1></div>} />
      </Routes>
    </div>
  );
};

export default App; 