import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';

interface Reservation {
  id: number;
  date: string;
  startTime: string;
  endTime: string;
}

const Dashboard: React.FC = () => {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In a real app, you would fetch reservations from an API
    // For demo purposes, we'll use mock data
    const mockReservations: Reservation[] = [
      {
        id: 1,
        date: '2023-09-15',
        startTime: '09:00',
        endTime: '12:00',
      },
      {
        id: 2,
        date: '2023-09-20',
        startTime: '14:00',
        endTime: '16:00',
      },
    ];
    
    setTimeout(() => {
      setReservations(mockReservations);
      setLoading(false);
    }, 500);
  }, []);

  const formatDateTime = (date: string, time: string) => {
    const dateObj = new Date(`${date}T${time}`);
    return format(dateObj, 'MMM d, yyyy h:mm a');
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Your Reservations</h1>
        <Link
          to="/calendar"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700"
        >
          New Reservation
        </Link>
      </div>
      
      {loading ? (
        <div className="text-center py-10">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-primary-500 border-t-transparent"></div>
          <p className="mt-2 text-gray-500">Loading your reservations...</p>
        </div>
      ) : reservations.length > 0 ? (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {reservations.map((reservation) => (
              <li key={reservation.id}>
                <div className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-medium text-primary-600 truncate">
                      Reservation on {format(new Date(reservation.date), 'MMMM d, yyyy')}
                    </div>
                    <div className="ml-2 flex-shrink-0 flex">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                        Confirmed
                      </span>
                    </div>
                  </div>
                  <div className="mt-2 sm:flex sm:justify-between">
                    <div className="sm:flex">
                      <div className="flex items-center text-sm text-gray-500">
                        <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                        </svg>
                        {formatDateTime(reservation.date, reservation.startTime)} - {format(new Date(`${reservation.date}T${reservation.endTime}`), 'h:mm a')}
                      </div>
                    </div>
                    <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                      <button
                        className="text-red-600 hover:text-red-900 mr-4"
                        onClick={() => {
                          // In a real app, you would call an API to cancel the reservation
                          setReservations(reservations.filter(r => r.id !== reservation.id));
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="text-center py-10 bg-white shadow overflow-hidden sm:rounded-md">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No reservations</h3>
          <p className="mt-1 text-sm text-gray-500">Get started by creating a new reservation.</p>
          <div className="mt-6">
            <Link
              to="/calendar"
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              New Reservation
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard; 