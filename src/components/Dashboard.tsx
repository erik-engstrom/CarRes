import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import reservationApi, { Reservation } from '../services/api';
import ROUTES from '../utils/routes';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
  const [reservationToDelete, setReservationToDelete] = useState<number | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    const fetchReservations = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await reservationApi.getAll();
        
        // Get the current user's email from localStorage
        const userEmail = localStorage.getItem('user_email');
        
        // Filter reservations to only show those belonging to the current user
        const userReservations = userEmail 
          ? data.filter(reservation => 
              reservation.user_email && 
              reservation.user_email.toLowerCase() === userEmail.toLowerCase()
            )
          : [];
          
        setReservations(userReservations);
      } catch (err) {
        console.error('Failed to fetch reservations:', err);
        setError('Failed to load reservations. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchReservations();
  }, []);

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  const formatDate = (dateString: string) => {
    const date = parseISO(dateString);
    return format(date, 'MMMM d, yyyy');
  };

  const confirmDelete = (id: number) => {
    setReservationToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const handleCancelReservation = async (id: number) => {
    try {
      setError(null);
      await reservationApi.delete(id);
      setReservations(reservations.filter(res => res.id !== id));
      setSuccessMessage('Reservation cancelled successfully');
      
      setIsDeleteModalOpen(false);
      setReservationToDelete(null);
    } catch (err) {
      console.error('Failed to cancel reservation:', err);
      setError('Failed to cancel reservation. Please try again later.');
      
      setIsDeleteModalOpen(false);
      setReservationToDelete(null);
    }
  };

  return (
    <div className="p-4 sm:p-8 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Your Reservations</h1>
      </div>

      {error && (
        <div className="mb-6 p-3 sm:p-4 bg-red-50 text-red-500 rounded-xl border border-red-100 text-sm">
          {error}
        </div>
      )}

      {successMessage && (
        <div className="mb-6 p-3 sm:p-4 bg-green-50 text-green-600 rounded-xl border border-green-100 text-sm">
          {successMessage}
        </div>
      )}

      {loading ? (
        <div className="text-center py-8 sm:py-12 bg-white shadow-md rounded-2xl">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-3 border-indigo-500 border-t-transparent"></div>
          <p className="mt-3 text-sm text-gray-500">Loading reservations...</p>
        </div>
      ) : reservations.length === 0 ? (
        <div className="bg-white shadow-md rounded-2xl p-6 sm:p-8 text-center">
          <svg className="mx-auto h-10 w-10 sm:h-12 sm:w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <h3 className="mt-3 text-lg font-medium text-gray-800">No reservations yet</h3>
          <p className="mt-2 text-sm text-gray-500">Get started by creating a new reservation.</p>
          <div className="mt-6">
            <button
              onClick={() => navigate(ROUTES.CALENDAR)}
              className="inline-flex items-center px-3 py-2 sm:px-4 sm:py-2 border border-transparent rounded-xl text-sm font-medium text-white bg-indigo-500 hover:bg-indigo-600 transition-colors duration-200 ease-in-out focus:outline-none focus:ring-1 focus:ring-indigo-400"
            >
              Create Reservation
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white shadow-md rounded-2xl overflow-hidden">
          <ul className="divide-y divide-gray-100">
            {reservations.map((reservation) => (
              <li key={reservation.id} className="p-4 sm:p-6 transition-colors duration-200 ease-in-out hover:bg-gray-50">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <h2 className="text-base sm:text-lg font-medium text-gray-800">
                      {formatDate(reservation.date)}
                    </h2>
                    <p className="mt-1 text-sm text-gray-500">
                      {formatTime(reservation.start_time)} - {formatTime(reservation.end_time)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 sm:space-x-3">
                    <button
                      onClick={() => navigate(ROUTES.RESERVATION_WITH_DATE(reservation.date), { 
                        state: { reservation: reservation } 
                      })}
                      className="flex-1 sm:flex-none inline-flex items-center justify-center px-3 py-1.5 border border-gray-200 rounded-lg text-sm font-medium text-indigo-600 bg-white hover:bg-indigo-50 transition-colors duration-200 ease-in-out focus:outline-none focus:ring-1 focus:ring-indigo-400"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => confirmDelete(reservation.id)}
                      className="flex-1 sm:flex-none inline-flex items-center justify-center px-3 py-1.5 border border-gray-200 rounded-lg text-sm font-medium text-red-600 bg-white hover:bg-red-50 transition-colors duration-200 ease-in-out focus:outline-none focus:ring-1 focus:ring-red-400"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {isDeleteModalOpen && (
        <div className="fixed inset-0 overflow-y-auto z-50">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                    <svg className="h-6 w-6 text-red-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">Cancel Reservation</h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        Are you sure you want to cancel this reservation? This action cannot be undone.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={() => reservationToDelete !== null && handleCancelReservation(reservationToDelete)}
                >
                  Cancel Reservation
                </button>
                <button
                  type="button"
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={() => {
                    setIsDeleteModalOpen(false);
                    setReservationToDelete(null);
                  }}
                >
                  Keep Reservation
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard; 