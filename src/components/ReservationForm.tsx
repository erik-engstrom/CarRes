import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import reservationApi, { Reservation, ReservationInput } from '../services/api';

interface TimeSlot {
  startTime: string;
  endTime: string;
  available: boolean;
}

interface LocationState {
  reservation?: Reservation;
}

const ReservationForm: React.FC = () => {
  const { date } = useParams<{ date: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const locationState = location.state as LocationState;
  
  const [selectedDate] = useState<Date | null>(date ? parseISO(date) : null);
  const [startTime, setStartTime] = useState<string>(locationState?.reservation?.start_time || '');
  const [endTime, setEndTime] = useState<string>(locationState?.reservation?.end_time || '');
  const [userName, setUserName] = useState<string>('');
  const [existingReservations, setExistingReservations] = useState<Reservation[]>([]);
  const [currentReservation, setCurrentReservation] = useState<Reservation | null>(locationState?.reservation || null);
  const [availableTimeSlots, setAvailableTimeSlots] = useState<TimeSlot[]>([]);
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [success, setSuccess] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState<boolean>(!!locationState?.reservation);

  // Effect to keep user name in sync with localStorage
  useEffect(() => {
    const storedName = localStorage.getItem('user_name');
    if (storedName) {
      setUserName(storedName);
    } else {
      // If no user name is found, redirect to login
      navigate('/login');
    }
  }, [navigate]);

  useEffect(() => {
    const fetchReservations = async () => {
      if (!selectedDate) return;
      
      try {
        setLoading(true);
        setError('');
        const formattedDate = format(selectedDate, 'yyyy-MM-dd');
        const reservations = await reservationApi.getByDate(formattedDate);
        
        // Find if user has a reservation for this date
        const userEmail = localStorage.getItem('user_email');
        const userReservation = reservations.find(r => r.user_email === userEmail);
        
        if (userReservation) {
          setIsEditing(true);
          setCurrentReservation(userReservation);
          setStartTime(userReservation.start_time);
          setEndTime(userReservation.end_time);
        }
        
        // Filter out user's own reservation from conflicts check
        const otherReservations = reservations.filter(r => r.id !== userReservation?.id);
        setExistingReservations(otherReservations);
        
        // Generate available time slots
        generateAvailableTimeSlots(otherReservations);
      } catch (err) {
        console.error('Failed to fetch reservations:', err);
        setError('Failed to load reservation data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchReservations();
  }, [selectedDate]);

  const generateAvailableTimeSlots = (reservations: Reservation[]) => {
    // Generate time slots from 8 AM to 8 PM in 1-hour increments
    const slots: TimeSlot[] = [];
    
    for (let hour = 8; hour < 20; hour++) {
      for (let minute = 0; minute < 60; minute += 5) {
        const startHour = hour.toString().padStart(2, '0');
        const startMinute = minute.toString().padStart(2, '0');
        const startTimeStr = `${startHour}:${startMinute}`;
        
        const endHour = (hour + 1).toString().padStart(2, '0');
        const endTimeStr = `${endHour}:${startMinute}`;
        
        // Check if this time slot overlaps with any existing reservation
        const isAvailable = !reservations.some(reservation => {
          // Skip checking against the current reservation being edited
          if (isEditing && currentReservation && reservation.id === currentReservation.id) {
            return false;
          }
          
          const reservationStart = reservation.start_time;
          const reservationEnd = reservation.end_time;
          
          // Check if the current slot overlaps with the reservation
          return (
            (startTimeStr >= reservationStart && startTimeStr < reservationEnd) ||
            (endTimeStr > reservationStart && endTimeStr <= reservationEnd) ||
            (startTimeStr <= reservationStart && endTimeStr >= reservationEnd)
          );
        });
        
        slots.push({
          startTime: startTimeStr,
          endTime: endTimeStr,
          available: isAvailable,
        });
      }
    }
    
    setAvailableTimeSlots(slots);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!selectedDate) {
      setError('Invalid date');
      return;
    }
    
    if (!startTime || !endTime) {
      setError('Please select both start and end times');
      return;
    }
    
    if (startTime >= endTime) {
      setError('End time must be after start time');
      return;
    }
    
    // Check if the selected time slot overlaps with existing reservations
    const isOverlapping = existingReservations
      .filter(reservation => !isEditing || reservation.id !== currentReservation?.id)
      .some(reservation => {
        return (
          (startTime >= reservation.start_time && startTime < reservation.end_time) ||
          (endTime > reservation.start_time && endTime <= reservation.end_time) ||
          (startTime <= reservation.start_time && endTime >= reservation.end_time)
        );
      });
    
    if (isOverlapping) {
      setError('The selected time slot overlaps with an existing reservation');
      return;
    }
    
    try {
      setSubmitting(true);
      
      const formattedDate = format(selectedDate, 'yyyy-MM-dd');
      
      const reservationData: ReservationInput = {
        date: formattedDate,
        start_time: startTime,
        end_time: endTime,
        user_name: userName
      };
      
      if (isEditing && currentReservation) {
        await reservationApi.update(currentReservation.id, reservationData);
      } else {
        await reservationApi.create(reservationData);
      }
      
      setSuccess(true);
      
      // Redirect to calendar after a short delay
      setTimeout(() => {
        navigate('/calendar');
      }, 2000);
    } catch (err) {
      console.error('Failed to save reservation:', err);
      setError(`Failed to ${isEditing ? 'update' : 'create'} reservation. Please try again later.`);
    } finally {
      setSubmitting(false);
    }
  };

  // Format time to 12-hour format
  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  const renderExistingReservations = () => {
    const userEmail = localStorage.getItem('user_email');
    console.log('Current user email:', userEmail); // Debug log
    
    const allReservations = [...existingReservations];
    if (currentReservation) {
      allReservations.push(currentReservation);
    }

    // Debug log for reservations
    console.log('All reservations:', allReservations);

    if (allReservations.length === 0) {
      return (
        <div className="text-center py-6 text-gray-500">
          No reservations for this date.
        </div>
      );
    }

    const handleDelete = async (id: number) => {
      if (!window.confirm('Are you sure you want to delete this reservation?')) {
        return;
      }

      try {
        setError('');
        await reservationApi.delete(id);
        
        // Remove the deleted reservation from the list
        const updatedReservations = existingReservations.filter(r => r.id !== id);
        setExistingReservations(updatedReservations);
        
        if (currentReservation?.id === id) {
          setCurrentReservation(null);
          setIsEditing(false);
          setStartTime('');
          setEndTime('');
        }
      } catch (err) {
        console.error('Failed to delete reservation:', err);
        setError('Failed to delete reservation. Please try again later.');
      }
    };

    return (
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Time
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                User
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {allReservations.map((reservation, index) => {
              // Debug log for each reservation
              console.log('Reservation:', reservation);
              console.log('Comparing emails:', {
                userEmail,
                reservationEmail: reservation.user_email
              });
              
              const isUserReservation = userEmail && reservation.user_email && 
                                      userEmail.toLowerCase() === reservation.user_email.toLowerCase();
              
              return (
                <tr key={reservation.id || index} className={`hover:bg-gray-50 ${isUserReservation ? 'bg-indigo-50' : ''}`}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatTime(reservation.start_time)} - {formatTime(reservation.end_time)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {isUserReservation ? 'You' : (reservation.user_name || 'Anonymous')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${isUserReservation ? 'bg-indigo-100 text-indigo-800' : 'bg-green-100 text-green-800'}`}>
                      {isUserReservation ? 'Your Reservation' : 'Confirmed'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    {isUserReservation && (
                      <div className="flex justify-end space-x-3">
                        <button
                          onClick={() => {
                            setCurrentReservation(reservation);
                            setIsEditing(true);
                            setStartTime(reservation.start_time);
                            setEndTime(reservation.end_time);
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }}
                          className="text-indigo-600 hover:text-indigo-900 transition-colors duration-200"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(reservation.id)}
                          className="text-red-600 hover:text-red-900 transition-colors duration-200"
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  if (!selectedDate) {
    return (
      <div className="text-center py-10">
        <div className="text-red-600">Invalid date selected</div>
        <button
          onClick={() => navigate('/calendar')}
          className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-md"
        >
          Back to Calendar
        </button>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-800">
          {isEditing ? 'Edit Reservation' : 'New Reservation'}
        </h1>
        <button
          onClick={() => navigate('/calendar')}
          className="inline-flex items-center px-4 py-2 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors duration-200 ease-in-out focus:outline-none focus:ring-1 focus:ring-indigo-400"
        >
          Cancel
        </button>
      </div>
      
      {success ? (
        <div className="bg-green-50 p-6 rounded-xl border border-green-100">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-green-800">
                Reservation {isEditing ? 'updated' : 'created'} successfully!
              </h3>
              <div className="mt-2 text-sm text-green-700">
                <p>Redirecting to calendar...</p>
              </div>
            </div>
          </div>
        </div>
      ) : loading ? (
        <div className="text-center py-10">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary-500 border-r-transparent"></div>
          <p className="mt-2 text-gray-500">Loading reservation data...</p>
        </div>
      ) : (
        <>
          <div className="bg-white shadow-md rounded-2xl p-6 transition-all duration-200 ease-in-out">
            <div className="mb-6">
              <h3 className="text-lg font-medium text-gray-800">
                Reservation for {format(selectedDate, 'MMMM d, yyyy')}
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                {isEditing ? 'Update your reservation time' : 'Select a time slot for your car reservation'}
              </p>
            </div>
            
            {error && (
              <div className="mb-6 p-4 bg-red-50 text-red-500 rounded-xl border border-red-100 text-sm">
                {error}
              </div>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label htmlFor="start-time" className="block text-sm font-medium text-gray-600 mb-1">
                    Start Time
                  </label>
                  <div className="relative">
                    <select
                      id="start-time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="block w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-700 bg-white hover:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400 focus:border-indigo-400 transition-all duration-200 ease-in-out appearance-none cursor-pointer disabled:bg-gray-50 disabled:cursor-not-allowed"
                      required
                    >
                      <option value="" className="text-gray-500">Select start time</option>
                      {availableTimeSlots.map((slot, index) => (
                        <option 
                          key={index} 
                          value={slot.startTime}
                          disabled={!slot.available && slot.startTime !== startTime}
                          className={`${!slot.available && slot.startTime !== startTime ? 'text-gray-400' : 'text-gray-700'}`}
                        >
                          {formatTime(slot.startTime)} {!slot.available && slot.startTime !== startTime && '(Unavailable)'}
                        </option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                </div>
                
                <div>
                  <label htmlFor="end-time" className="block text-sm font-medium text-gray-600 mb-1">
                    End Time
                  </label>
                  <div className="relative">
                    <select
                      id="end-time"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className="block w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-700 bg-white hover:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400 focus:border-indigo-400 transition-all duration-200 ease-in-out appearance-none cursor-pointer disabled:bg-gray-50 disabled:cursor-not-allowed"
                      required
                    >
                      <option value="" className="text-gray-500">Select end time</option>
                      {availableTimeSlots
                        .filter(slot => slot.startTime > startTime)
                        .map((slot, index) => (
                          <option 
                            key={index} 
                            value={slot.startTime}
                            disabled={!slot.available && slot.startTime !== endTime}
                            className={`${!slot.available && slot.startTime !== endTime ? 'text-gray-400' : 'text-gray-700'}`}
                          >
                            {formatTime(slot.startTime)} {!slot.available && slot.startTime !== endTime && '(Unavailable)'}
                          </option>
                        ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => navigate('/calendar')}
                  className="px-4 py-2 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors duration-200 ease-in-out focus:outline-none focus:ring-1 focus:ring-indigo-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 border border-transparent rounded-xl text-sm font-medium text-white bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 ease-in-out focus:outline-none focus:ring-1 focus:ring-indigo-400"
                >
                  {submitting ? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      {isEditing ? 'Updating Reservation...' : 'Creating Reservation...'}
                    </span>
                  ) : (
                    isEditing ? 'Update Reservation' : 'Create Reservation'
                  )}
                </button>
              </div>
            </form>
          </div>

          <div className="mt-8">
            <div className="bg-white shadow-md rounded-2xl overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-800">
                  Other Reservations on {format(selectedDate, 'MMMM d, yyyy')}
                </h3>
              </div>
              {renderExistingReservations()}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ReservationForm; 