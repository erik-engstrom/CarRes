import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth, isSameDay, parseISO, isWithinInterval, isValid } from 'date-fns';
import reservationApi, { Reservation } from '../services/api';

const Calendar: React.FC = () => {
  const navigate = useNavigate();
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch reservations when the month changes
  useEffect(() => {
    const fetchReservations = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await reservationApi.getAll();
        // Filter out any reservations with invalid dates
        const validReservations = response.filter(reservation => {
          try {
            const date = parseISO(reservation.date);
            return isValid(date);
          } catch (e) {
            console.error('Invalid date in reservation:', reservation);
            return false;
          }
        });
        setReservations(validReservations);
      } catch (err) {
        console.error('Failed to fetch reservations:', err);
        setError('Failed to load reservations. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchReservations();
  }, [currentMonth]);

  const onDateClick = (day: Date) => {
    if (!isValid(day)) {
      console.error('Invalid date selected');
      return;
    }

    setSelectedDate(day);
    const formattedDate = format(day, 'yyyy-MM-dd');
    navigate(`/reservation/${formattedDate}`);
  };

  const getReservationCount = (dateStr: string): number => {
    return reservations.filter(reservation => {
      try {
        return reservation.date === dateStr;
      } catch (e) {
        console.error('Error checking reservation date:', e);
        return false;
      }
    }).length;
  };

  const renderHeader = () => {
    const dateFormat = 'MMMM yyyy';
    return (
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
          className="p-2 rounded-xl text-gray-600 hover:bg-gray-100 transition-colors duration-200 ease-in-out focus:outline-none focus:ring-1 focus:ring-indigo-400"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h2 className="text-xl font-medium text-gray-800">
          {format(currentMonth, dateFormat)}
        </h2>
        <button
          onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
          className="p-2 rounded-xl text-gray-600 hover:bg-gray-100 transition-colors duration-200 ease-in-out focus:outline-none focus:ring-1 focus:ring-indigo-400"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    );
  };

  const renderDays = () => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return (
      <div className="grid grid-cols-7 gap-4 mb-4">
        {days.map(day => (
          <div
            key={day}
            className="text-center text-sm font-medium text-gray-600 py-2"
          >
            {day}
          </div>
        ))}
      </div>
    );
  };

  const renderCells = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const rows = [];
    let days = [];
    let day = startDate;

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        const cloneDay = day;
        const dateStr = format(day, 'yyyy-MM-dd');
        const formattedDate = format(day, 'd');
        const reservationCount = getReservationCount(dateStr);
        const isCurrentMonth = isSameMonth(day, monthStart);

        days.push(
          <div
            key={day.toString()}
            className={`
              min-h-[4rem] p-2 rounded-lg transition-colors duration-200 ease-in-out relative
              ${!isCurrentMonth ? 'text-gray-400' : 'text-gray-700'}
              ${isSameDay(day, selectedDate) ? 'bg-indigo-100 text-indigo-700 font-medium' : ''}
              ${isCurrentMonth ? 'cursor-pointer hover:bg-gray-50' : 'cursor-default'}
            `}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (isCurrentMonth) {
                onDateClick(cloneDay);
              }
            }}
          >
            <span className="flex justify-center items-center h-8 text-base">
              {formattedDate}
            </span>
            {reservationCount > 0 && (
              <div className="absolute top-1 right-1 w-6 h-6 flex items-center justify-center bg-red-500 text-white text-xs font-medium rounded-full">
                {reservationCount}
              </div>
            )}
          </div>
        );
        day = addDays(day, 1);
      }
      rows.push(
        <div key={day.toString()} className="grid grid-cols-7 gap-4">
          {days}
        </div>
      );
      days = [];
    }
    return <div className="grid gap-4">{rows}</div>;
  };

  const renderReservationsTable = () => {
    try {
      const monthStart = startOfMonth(currentMonth);
      const monthEnd = endOfMonth(currentMonth);
      
      const currentMonthReservations = reservations.filter(reservation => {
        try {
          const reservationDate = parseISO(reservation.date);
          return isValid(reservationDate) && isWithinInterval(reservationDate, { start: monthStart, end: monthEnd });
        } catch (e) {
          console.error('Error filtering reservation:', e);
          return false;
        }
      });

      // Sort reservations by date and time
      const sortedReservations = [...currentMonthReservations].sort((a, b) => {
        try {
          const dateA = parseISO(a.date);
          const dateB = parseISO(b.date);
          return dateA.getTime() - dateB.getTime();
        } catch (e) {
          console.error('Error sorting reservations:', e);
          return 0;
        }
      });

      return (
        <div className="mt-8">
          <h2 className="text-lg font-semibold mb-4">Reservations for {format(currentMonth, 'MMMM yyyy')}</h2>
          {sortedReservations.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No reservations for this month</p>
          ) : (
            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Time
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {sortedReservations.map((reservation) => (
                    <tr key={reservation.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {format(parseISO(reservation.date), 'MMM d, yyyy')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {reservation.start_time && reservation.end_time ? (
                          `${format(parseISO(`2000-01-01T${reservation.start_time}`), 'h:mm a')} - ${format(parseISO(`2000-01-01T${reservation.end_time}`), 'h:mm a')}`
                        ) : (
                          'Time not specified'
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {reservation.user_name || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => navigate(`/reservation/${reservation.date}`)}
                          className="text-primary-600 hover:text-primary-900 mr-4"
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      );
    } catch (e) {
      console.error('Error rendering reservations table:', e);
      return (
        <div className="mt-8">
          <div className="bg-red-50 text-red-700 p-4 rounded-md">
            Error displaying reservations. Please try refreshing the page.
          </div>
        </div>
      );
    }
  };

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-800">Select a Date</h1>
        <div className="space-x-3">
          <button
            onClick={() => navigate('/dashboard')}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-xl text-sm font-medium text-white bg-indigo-500 hover:bg-indigo-600 transition-colors duration-200 ease-in-out focus:outline-none focus:ring-1 focus:ring-indigo-400"
          >
            My Reservations
          </button>
          <button
            onClick={() => navigate('/')}
            className="inline-flex items-center px-4 py-2 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors duration-200 ease-in-out focus:outline-none focus:ring-1 focus:ring-indigo-400"
          >
            Back to Home
          </button>
        </div>
      </div>
      
      {error && (
        <div className="mb-6 p-4 bg-red-50 text-red-500 rounded-xl border border-red-100 text-sm">
          {error}
        </div>
      )}
      
      <div className="bg-white shadow-md rounded-2xl p-8 transition-all duration-200 ease-in-out">
        {renderHeader()}
        {renderDays()}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-3 border-indigo-500 border-t-transparent"></div>
            <p className="mt-3 text-sm text-gray-500">Loading calendar...</p>
          </div>
        ) : (
          renderCells()
        )}
      </div>
      
      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="flex items-center p-3 bg-white rounded-xl shadow-sm">
          <div className="h-4 w-4 bg-indigo-100 rounded mr-3"></div>
          <span className="text-sm text-gray-600">Selected Date</span>
        </div>
        <div className="flex items-center p-3 bg-white rounded-xl shadow-sm">
          <div className="relative h-4 w-4 mr-3">
            <div className="absolute inset-0 bg-white rounded"></div>
            <div className="absolute inset-0 bg-red-500 rounded-full w-4 h-4 flex items-center justify-center">
              <span className="text-white text-[8px] font-medium">1</span>
            </div>
          </div>
          <span className="text-sm text-gray-600">Reservations Count</span>
        </div>
        <div className="flex items-center p-3 bg-white rounded-xl shadow-sm">
          <div className="h-4 w-4 bg-gray-100 rounded mr-3"></div>
          <span className="text-sm text-gray-600">Available Date</span>
        </div>
      </div>

      {!loading && renderReservationsTable()}
    </div>
  );
};

export default Calendar; 