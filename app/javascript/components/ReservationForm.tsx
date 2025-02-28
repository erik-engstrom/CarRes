import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format, parseISO, isBefore, isAfter, set } from 'date-fns';

interface Reservation {
  id: number;
  date: string;
  startTime: string;
  endTime: string;
}

interface TimeSlot {
  startTime: string;
  endTime: string;
  available: boolean;
}

const ReservationForm: React.FC = () => {
  const { date } = useParams<{ date: string }>();
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState<Date | null>(date ? parseISO(date) : null);
  const [startTime, setStartTime] = useState<string>('');
  const [endTime, setEndTime] = useState<string>('');
  const [existingReservations, setExistingReservations] = useState<Reservation[]>([]);
  const [availableTimeSlots, setAvailableTimeSlots] = useState<TimeSlot[]>([]);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<boolean>(false);

  useEffect(() => {
    // In a real app, you would fetch reservations for the selected date from an API
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
    
    if (selectedDate) {
      const formattedDate = format(selectedDate, 'yyyy-MM-dd');
      const reservationsForDate = mockReservations.filter(
        reservation => reservation.date === formattedDate
      );
      setExistingReservations(reservationsForDate);
      
      // Generate available time slots
      generateAvailableTimeSlots(reservationsForDate);
    }
  }, [selectedDate]);

  const generateAvailableTimeSlots = (reservations: Reservation[]) => {
    // Generate time slots from 8 AM to 8 PM in 1-hour increments
    const slots: TimeSlot[] = [];
    
    for (let hour = 8; hour < 20; hour++) {
      for (let minute = 0; minute < 60; minute += 60) {
        const startHour = hour.toString().padStart(2, '0');
        const startMinute = minute.toString().padStart(2, '0');
        const startTimeStr = `${startHour}:${startMinute}`;
        
        const endHour = (hour + 1).toString().padStart(2, '0');
        const endTimeStr = `${endHour}:${startMinute}`;
        
        // Check if this time slot overlaps with any existing reservation
        const isAvailable = !reservations.some(reservation => {
          const reservationStart = reservation.startTime;
          const reservationEnd = reservation.endTime;
          
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!startTime || !endTime) {
      setError('Please select both start and end times');
      return;
    }
    
    if (startTime >= endTime) {
      setError('End time must be after start time');
      return;
    }
    
    // Check if the selected time slot overlaps with existing reservations
    const isOverlapping = existingReservations.some(reservation => {
      return (
        (startTime >= reservation.startTime && startTime < reservation.endTime) ||
        (endTime > reservation.startTime && endTime <= reservation.endTime) ||
        (startTime <= reservation.startTime && endTime >= reservation.endTime)
      );
    });
    
    if (isOverlapping) {
      setError('The selected time slot overlaps with an existing reservation');
      return;
    }
    
    // In a real app, you would call an API to create the reservation
    // For demo purposes, we'll just show a success message
    setSuccess(true);
    
    // Redirect to dashboard after a short delay
    setTimeout(() => {
      navigate('/dashboard');
    }, 2000);
  };

  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
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
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">New Reservation</h1>
        <button
          onClick={() => navigate('/calendar')}
          className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
        >
          Cancel
        </button>
      </div>
      
      {success ? (
        <div className="bg-green-50 p-4 rounded-md">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-green-800">Reservation created successfully!</h3>
              <div className="mt-2 text-sm text-green-700">
                <p>Redirecting to dashboard...</p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Reservation for {format(selectedDate, 'MMMM d, yyyy')}
            </h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              Select a time slot for your car reservation
            </p>
          </div>
          
          {error && (
            <div className="px-4 py-3 bg-red-50 text-red-700 text-sm">
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="border-t border-gray-200">
            <div className="px-4 py-5 sm:p-6">
              <div className="grid grid-cols-1 gap-6">
                <div>
                  <label htmlFor="start-time" className="block text-sm font-medium text-gray-700">
                    Start Time
                  </label>
                  <select
                    id="start-time"
                    name="start-time"
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
                    value={startTime}
                    onChange={(e) => {
                      setStartTime(e.target.value);
                      // Auto-select end time 1 hour after start time if not already selected
                      if (!endTime) {
                        const selectedSlot = availableTimeSlots.find(slot => slot.startTime === e.target.value);
                        if (selectedSlot) {
                          setEndTime(selectedSlot.endTime);
                        }
                      }
                    }}
                  >
                    <option value="">Select a start time</option>
                    {availableTimeSlots.map((slot, index) => (
                      <option 
                        key={index} 
                        value={slot.startTime}
                        disabled={!slot.available}
                      >
                        {formatTime(slot.startTime)} {!slot.available && '(Unavailable)'}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label htmlFor="end-time" className="block text-sm font-medium text-gray-700">
                    End Time
                  </label>
                  <select
                    id="end-time"
                    name="end-time"
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                  >
                    <option value="">Select an end time</option>
                    {availableTimeSlots
                      .filter(slot => slot.startTime > startTime)
                      .map((slot, index) => (
                        <option 
                          key={index} 
                          value={slot.startTime}
                          disabled={!slot.available}
                        >
                          {formatTime(slot.startTime)} {!slot.available && '(Unavailable)'}
                        </option>
                      ))}
                  </select>
                </div>
                
                {startTime && endTime && (
                  <div className="bg-gray-50 p-4 rounded-md">
                    <h4 className="text-sm font-medium text-gray-900">Reservation Summary</h4>
                    <p className="mt-1 text-sm text-gray-500">
                      Date: {format(selectedDate, 'MMMM d, yyyy')}
                    </p>
                    <p className="mt-1 text-sm text-gray-500">
                      Time: {formatTime(startTime)} - {formatTime(endTime)}
                    </p>
                  </div>
                )}
              </div>
            </div>
            
            <div className="px-4 py-3 bg-gray-50 text-right sm:px-6">
              <button
                type="submit"
                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                Create Reservation
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default ReservationForm; 