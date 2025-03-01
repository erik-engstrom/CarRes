import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { format, parseISO, isValid } from 'date-fns';
import reservationApi, { Reservation, ReservationInput } from '../services/api';
import ROUTES from '../utils/routes';
import axios, { AxiosError } from 'axios';

interface TimeSlot {
  time: string;
  available: boolean;
}

interface LocationState {
  reservation?: string | Reservation;
  selectedDate?: string;
}

const ReservationForm: React.FC = () => {
  const params = useParams();
  const date = params.date;
  const navigate = useNavigate();
  const location = useLocation();
  const locationState = location.state as LocationState;

  // State variables
  const [selectedDateStr, setSelectedDateStr] = useState<string>('');
  const [displayDate, setDisplayDate] = useState<Date | null>(null);
  const [existingReservations, setExistingReservations] = useState<Reservation[]>([]);
  const [availableTimeSlots, setAvailableTimeSlots] = useState<TimeSlot[]>([]);
  const [startTime, setStartTime] = useState<string>('');
  const [endTime, setEndTime] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [currentReservation, setCurrentReservation] = useState<Reservation | null>(null);
  
  // Replace isEditing with a more explicit formMode state
  type FormMode = 'CREATE' | 'EDIT';
  const [formMode, setFormMode] = useState<FormMode>('CREATE');
  const isEditing = formMode === 'EDIT';
  
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [lastUpdatedId, setLastUpdatedId] = useState<number | null>(null);
  // Add a flag to skip auto-edit after creating a reservation
  const [skipAutoEdit, setSkipAutoEdit] = useState<boolean>(false);
  // Add a flag to track if we just created a reservation
  const [justCreated, setJustCreated] = useState<boolean>(false);

  // Add a ref to track which dates we've already fetched
  const fetchedDatesRef = useRef<Set<string>>(new Set());

  // Add a ref for the existing reservations section
  const existingReservationsRef = useRef<HTMLDivElement>(null);

  // Debug logging for state changes
  useEffect(() => {
    console.log('formMode:', formMode);
    console.log('currentReservation:', currentReservation);
    console.log('skipAutoEdit:', skipAutoEdit);
  }, [formMode, currentReservation, skipAutoEdit]);

  // Scroll to existing reservations when lastUpdatedId changes
  useEffect(() => {
    if (lastUpdatedId && existingReservationsRef.current) {
      // Scroll to the existing reservations section with a small delay to ensure rendering is complete
      setTimeout(() => {
        existingReservationsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }, [lastUpdatedId]);

  // Reset edit mode when a success message about creation is shown
  useEffect(() => {
    if (successMessage.includes('created successfully')) {
      setFormMode('CREATE');
      setCurrentReservation(null);
    }
  }, [successMessage]);

  // Add a function to completely reset the form
  const resetForm = useCallback(() => {
    setStartTime('');
    setEndTime('');
    setFormMode('CREATE');
    setCurrentReservation(null);
    setError('');
  }, []);

  // Reset success message after a delay
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage('');
      }, 5000); // Clear after 5 seconds
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  // Generate available time slots based on existing reservations
  const generateAvailableTimeSlots = useCallback((reservations: Reservation[]) => {
    // Filter out the reservation being edited (if any) to make its time slot available
    const filteredReservations = isEditing && currentReservation
      ? reservations.filter(r => r.id !== currentReservation.id)
      : reservations;
      
    // Start with all time slots from 8 AM to 8 PM
    const slots: TimeSlot[] = [];
    for (let hour = 8; hour < 20; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        slots.push({
          time,
          available: true
        });
      }
    }
    
    // Mark slots as unavailable if they overlap with existing reservations
    filteredReservations.forEach(reservation => {
      const startTime = reservation.start_time;
      const endTime = reservation.end_time;
      
      slots.forEach(slot => {
        // Check if this slot is between the start and end time of any reservation
        if (slot.time >= startTime && slot.time < endTime) {
          slot.available = false;
        }
      });
    });
    
    // When editing, mark all time slots covered by the current reservation as available
    if (isEditing && currentReservation) {
      const currentStartTime = currentReservation.start_time;
      const currentEndTime = currentReservation.end_time;
      
      slots.forEach(slot => {
        // If this slot is within the current reservation's time range, mark it as available
        if (slot.time >= currentStartTime && slot.time < currentEndTime) {
          slot.available = true;
        }
      });
    }
    
    return slots;
  }, [isEditing, currentReservation]);

  // Handle date from URL parameter or location state
  useEffect(() => {
    console.log('Processing date from URL or location state');
    console.log('URL date param:', date);
    console.log('Location state:', locationState);
    
    // If we have a reservation object passed from Dashboard, set the date from it
    // This is the only case where we should automatically enter edit mode
    if (locationState?.reservation && typeof locationState.reservation === 'object') {
      const passedReservation = locationState.reservation as Reservation;
      console.log('Setting date from passed reservation:', passedReservation.date);
      
      // Store the date string directly
      const dateStr = passedReservation.date;
      setSelectedDateStr(dateStr);
      
      // Create a display date for formatting
      const [year, month, day] = dateStr.split('-').map(Number);
      if (year && month && day) {
        // Create a date at noon to avoid timezone issues
        const displayDateObj = new Date(year, month - 1, day, 12, 0, 0);
        setDisplayDate(displayDateObj);
      }
      
      // Pre-populate form fields - only when explicitly editing
      setFormMode('EDIT');
      setCurrentReservation(passedReservation);
      setStartTime(passedReservation.start_time);
      setEndTime(passedReservation.end_time);
      
      // Set loading to false since we already have the data
      setLoading(false);
      return;
    }
    
    if (date) {
      // Store the date string directly
      setSelectedDateStr(date);
      
      // Create a display date for formatting
      const [year, month, day] = date.split('-').map(Number);
      if (year && month && day) {
        // Create a date at noon to avoid timezone issues
        const displayDateObj = new Date(year, month - 1, day, 12, 0, 0);
        setDisplayDate(displayDateObj);
        
        // Always enter in CREATE mode when coming from calendar
        setFormMode('CREATE');
      } else {
        console.error('Invalid date parameter:', date);
        setError('Invalid date parameter. Please select a valid date.');
      }
    } else if (locationState?.selectedDate) {
      // If no date in URL but it was passed in location state
      const dateStr = locationState.selectedDate;
      setSelectedDateStr(dateStr);
      
      // Create a display date for formatting
      const [year, month, day] = dateStr.split('-').map(Number);
      if (year && month && day) {
        // Create a date at noon to avoid timezone issues
        const displayDateObj = new Date(year, month - 1, day, 12, 0, 0);
        setDisplayDate(displayDateObj);
      }
    } else {
      // Default to today if no date is provided
      console.log('No date parameter, defaulting to today');
      const today = new Date();
      today.setHours(12, 0, 0, 0);
      
      // Format today as YYYY-MM-DD
      const todayStr = format(today, 'yyyy-MM-dd');
      setSelectedDateStr(todayStr);
      setDisplayDate(today);
    }
  }, [date, locationState]);

  // Fetch reservations when selectedDateStr changes
  useEffect(() => {
    if (!selectedDateStr) return;
    
    console.log('Fetching reservations for date:', selectedDateStr);
    // Always disable auto-edit when loading a date
    // This ensures users have to explicitly click "Edit" on their reservation
    // instead of automatically entering edit mode when they have an existing reservation
    fetchReservations(selectedDateStr, true);
  }, [selectedDateStr]);

  // Fetch reservations for a specific date
  const fetchReservations = async (dateStr: string, disableAutoEdit: boolean = true) => {
    try {
      setLoading(true);
      setError('');
      
      console.log(`Fetching reservations for date: ${dateStr}`);
      const data = await reservationApi.getByDate(dateStr);
      
      setExistingReservations(data);
      console.log(`Found ${data.length} reservations for ${dateStr}`);
      
      // Auto-edit is completely disabled when disableAutoEdit is true
      if (!disableAutoEdit) {
        // Get the current user's email from localStorage
        const userEmail = localStorage.getItem('user_email');
        
        // Check if the user has a reservation for this date
        const userReservation = userEmail 
          ? data.find(reservation => 
              reservation.user_email && 
              reservation.user_email.toLowerCase() === userEmail.toLowerCase()
            )
          : null;
        
        // Only auto-switch to edit mode if:
        // 1. We're not already in edit mode 
        // 2. User has a reservation
        // 3. We're not skipping auto-edit
        // 4. We didn't just create a reservation
        // 5. There's no "created successfully" message
        if (formMode === 'CREATE' && userReservation && !skipAutoEdit && !justCreated && !successMessage.includes('created successfully')) {
          console.log('User has an existing reservation for this date:', userReservation);
          setFormMode('EDIT');
          setCurrentReservation(userReservation);
          setStartTime(userReservation.start_time);
          setEndTime(userReservation.end_time);
        }
      }
      
      // Generate available time slots
      const availableSlots = generateAvailableTimeSlots(data);
      setAvailableTimeSlots(availableSlots);
      console.log('Generated available time slots:', availableSlots.length);
    } catch (err) {
      console.error('Failed to fetch reservations:', err);
      setError('Failed to load reservations. Please try again later.');
      
      // Even if fetching fails, we should still generate time slots
      // so the user can make a reservation
      const availableSlots = generateAvailableTimeSlots([]);
      setAvailableTimeSlots(availableSlots);
    } finally {
      setLoading(false);
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedDateStr || !startTime || !endTime) {
      setError('Please select a date, start time, and end time.');
      return;
    }
    
    try {
      setSubmitting(true);
      setError('');
      
      const reservationData: ReservationInput = {
        date: selectedDateStr,
        start_time: startTime,
        end_time: endTime
      };
      
      if (formMode === 'EDIT' && currentReservation) {
        // Update existing reservation
        await reservationApi.update(currentReservation.id, reservationData);
        setSuccessMessage('Reservation updated successfully!');
        
        // Reset form and editing state
        resetForm();
      } else {
        // Create new reservation
        const createdReservation = await reservationApi.create(reservationData);
        setSuccessMessage('Reservation created successfully!');
        
        // Explicitly reset form and set mode to CREATE
        resetForm();
        
        // Set flags to prevent auto-edit
        setSkipAutoEdit(true);
        setJustCreated(true);
        
        // Instead of refreshing reservations through fetchReservations(selectedDateStr),
        // which might trigger auto-edit logic, manually add the new reservation to the list
        if (createdReservation) {
          setExistingReservations(prev => [...prev, createdReservation]);
          // Calculate new available slots based on updated reservations
          const updatedSlots = generateAvailableTimeSlots([...existingReservations, createdReservation]);
          setAvailableTimeSlots(updatedSlots);
          // Set the lastUpdatedId to scroll to the reservations section
          setLastUpdatedId(createdReservation.id);
        }
        return; // Skip the fetchReservations call below
      }
      
      // Allow React state to update before fetching reservations
      // Only for update operations, not for create
      setTimeout(() => {
        // Refresh reservations to show the updated list, but disable auto-edit after updates
        fetchReservations(selectedDateStr, true);
      }, 50);
      
      // Reset skipAutoEdit after a delay to allow for future edits
      if (skipAutoEdit) {
        setTimeout(() => {
          setSkipAutoEdit(false);
          setJustCreated(false); // Also reset the justCreated flag
        }, 5000); // Reset after 5 seconds
      }
    } catch (err) {
      console.error('Failed to submit reservation:', err);
      setError('Failed to save reservation. Please try again later.');
    } finally {
      setSubmitting(false);
    }
  };

  // Format time for display
  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours, 10);
    const period = hour >= 12 ? 'PM' : 'AM';
    const formattedHour = hour % 12 || 12;
    return `${formattedHour}:${minutes} ${period}`;
  };

  // Format time option text
  const formatTimeOption = (slot: TimeSlot) => {
    const formattedTime = formatTime(slot.time);
    
    // Check if this time is part of the current reservation being edited
    const isPartOfCurrentReservation = isEditing && currentReservation && 
      (slot.time >= currentReservation.start_time && slot.time < currentReservation.end_time);
    
    // When editing, show a special indicator for times that are part of the current reservation
    if (isPartOfCurrentReservation) {
      return `${formattedTime} (Your Current Reservation)`;
    }
    
    // Otherwise, show availability status
    return slot.available ? formattedTime : `${formattedTime} (Unavailable)`;
  };

  // Render existing reservations
  const renderExistingReservations = () => {
    if (existingReservations.length === 0) {
      return <p className="text-gray-500 mt-4">No reservations for this date.</p>;
    }

    // Handle reservation deletion
    const handleDelete = async (id: number) => {
      try {
        if (window.confirm('Are you sure you want to delete this reservation?')) {
          setLoading(true);
          await reservationApi.delete(id);
          
          // Update the list of reservations after deletion
          const formattedDate = selectedDateStr ? selectedDateStr : '';
          if (formattedDate) {
            try {
              // Remove this date from fetchedDatesRef to force a refresh next time
              if (fetchedDatesRef.current.has(formattedDate)) {
                fetchedDatesRef.current.delete(formattedDate);
              }
              
              // Use a fresh API call without relying on the cache
              const updatedReservations = await reservationApi.getByDate(formattedDate);
              console.log('Refreshed reservations after deletion:', updatedReservations);
              setExistingReservations(updatedReservations);
              
              // Reset form if we deleted the current reservation
              if (currentReservation && currentReservation.id === id) {
                setFormMode('CREATE');
                setCurrentReservation(null);
                setStartTime('');
                setEndTime('');
              }
              
              // Update available time slots
              const availableSlots = generateAvailableTimeSlots(updatedReservations);
              setAvailableTimeSlots(availableSlots);
              console.log('Available time slots refreshed after deletion');
            } catch (fetchErr) {
              console.error('Failed to refresh reservations after deletion:', fetchErr);
            }
          }
          
          setLoading(false);
          setSuccessMessage('Reservation deleted successfully!');
          
          // Automatically clear success message after 5 seconds
          setTimeout(() => {
            setSuccessMessage('');
          }, 5000);
        }
      } catch (err) {
        console.error('Error deleting reservation:', err);
        setError('Failed to delete reservation');
        setLoading(false);
        
        // Try to refresh the reservations list anyway
        if (selectedDateStr) {
          try {
            const formattedDate = selectedDateStr;
            
            // Remove this date from fetchedDatesRef to force a refresh next time
            if (fetchedDatesRef.current.has(formattedDate)) {
              fetchedDatesRef.current.delete(formattedDate);
            }
            
            // Use a fresh API call without relying on the cache
            const updatedReservations = await reservationApi.getByDate(formattedDate);
            console.log('Refreshed reservations after deletion error:', updatedReservations);
            setExistingReservations(updatedReservations);
            
            // Also refresh available time slots
            const availableSlots = generateAvailableTimeSlots(updatedReservations);
            setAvailableTimeSlots(availableSlots);
          } catch (fetchErr) {
            console.error('Failed to refresh reservations after deletion error:', fetchErr);
          }
        }
      }
    };

    // Get current user email
    const userEmail = localStorage.getItem('user_email');
    
    return (
      <div className="mt-6" ref={existingReservationsRef}>
        <h3 className="text-lg font-medium text-gray-900">Existing Reservations</h3>
        <div className="mt-2 overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {existingReservations.map((reservation) => (
                <tr 
                  key={reservation.id} 
                  className={`${lastUpdatedId === reservation.id ? 'bg-green-50 transition-colors duration-1000' : ''}`}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    {formatTime(reservation.start_time)} - {formatTime(reservation.end_time)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {reservation.user_name || 'Unknown'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {reservation.user_email === userEmail ? (
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                        Your Reservation
                      </span>
                    ) : (
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                        Booked
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {reservation.user_email === userEmail && (
                      <>
                        <button
                          onClick={() => {
                            // Reset form first to clear any existing state
                            resetForm();
                            // Then set edit mode
                            setFormMode('EDIT');
                            setCurrentReservation(reservation);
                            setStartTime(reservation.start_time);
                            setEndTime(reservation.end_time);
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }}
                          className="text-indigo-600 hover:text-indigo-900 mr-4"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(reservation.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // Add a cleanup effect for when the component unmounts
  useEffect(() => {
    return () => {
      // Reset all state variables when component unmounts
      setFormMode('CREATE');
      setCurrentReservation(null);
      setStartTime('');
      setEndTime('');
      setSkipAutoEdit(false);
      setJustCreated(false);
      setSuccessMessage('');
    };
  }, []);

  // Finally, add a direct effect to force formMode to CREATE after a success message
  useEffect(() => {
    if (successMessage && successMessage.includes('created successfully')) {
      // Force the form to be in CREATE mode
      console.log('Creation success detected, forcing CREATE mode');
      setFormMode('CREATE');
      setCurrentReservation(null);
      
      // Scroll to the reservations section
      if (existingReservationsRef.current) {
        setTimeout(() => {
          existingReservationsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
      }
    }
  }, [successMessage]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className={`shadow overflow-hidden sm:rounded-lg p-6 ${
        formMode === 'EDIT' 
          ? 'bg-blue-50 border border-blue-200' 
          : 'bg-white'
      }`}>
        <div className="flex justify-between items-center mb-6">
          <h2 className={`text-2xl font-bold ${formMode === 'EDIT' ? 'text-blue-800' : 'text-gray-900'}`}>
            {formMode === 'EDIT' ? (
              <div className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit Reservation
              </div>
            ) : 'New Reservation'}
          </h2>
          <button
            onClick={() => navigate(ROUTES.CALENDAR)}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            Back to Calendar
          </button>
        </div>
        
        {displayDate && (
          <p className="text-lg text-gray-600 mb-4">
            Date: {format(displayDate, 'EEEE, MMMM d, yyyy')}
          </p>
        )}
        
        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
            <div className="flex">
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}
        
        {successMessage && (
          <div className="bg-green-50 border-l-4 border-green-400 p-4 mb-4">
            <div className="flex">
              <div className="ml-3">
                <p className="text-sm text-green-700">{successMessage}</p>
              </div>
            </div>
          </div>
        )}
        
        {loading ? (
          <div className="flex justify-center items-center h-40">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
          </div>
        ) : (
          <>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="start-time" className="block text-sm font-medium text-gray-700">
                    Start Time
                  </label>
                  <select
                    id="start-time"
                    name="start-time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className={`mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md ${
                      formMode === 'EDIT' ? 'border-blue-300 bg-blue-50' : ''
                    }`}
                    required
                  >
                    <option value="">Select a start time</option>
                    {availableTimeSlots.map((slot) => {
                      // When editing, always make the current reservation's start time available
                      const isCurrentStartTime = formMode === 'EDIT' && currentReservation && slot.time === currentReservation.start_time;
                      const isWithinCurrentReservation = formMode === 'EDIT' && currentReservation && 
                        (slot.time >= currentReservation.start_time && slot.time < currentReservation.end_time);
                      const isUnavailable = !slot.available && slot.time !== startTime && !isCurrentStartTime && !isWithinCurrentReservation;
                      
                      return (
                        <option
                          key={slot.time}
                          value={slot.time}
                          disabled={isUnavailable}
                          className={`
                            ${isUnavailable ? 'text-gray-400' : 
                              isWithinCurrentReservation ? 'text-blue-700 font-medium' : 'text-gray-900'}
                          `}
                        >
                          {formatTimeOption(slot)}
                        </option>
                      );
                    })}
                  </select>
                </div>
                
                <div>
                  <label htmlFor="end-time" className="block text-sm font-medium text-gray-700">
                    End Time
                  </label>
                  <select
                    id="end-time"
                    name="end-time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className={`mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md ${
                      formMode === 'EDIT' ? 'border-blue-300 bg-blue-50' : ''
                    }`}
                    required
                    disabled={!startTime}
                  >
                    <option value="">Select an end time</option>
                    {availableTimeSlots
                      .filter(slot => {
                        // When editing, always include the current end time in the options
                        const isCurrentEndTime = formMode === 'EDIT' && currentReservation && 
                          slot.time === currentReservation.end_time;
                        const isWithinCurrentReservation = formMode === 'EDIT' && currentReservation && 
                          (slot.time >= currentReservation.start_time && slot.time < currentReservation.end_time);
                        
                        // Include the slot if it's after the selected start time or if it's the current end time
                        // or if it's within the current reservation's time range
                        return (startTime && slot.time > startTime) || isCurrentEndTime || isWithinCurrentReservation;
                      })
                      .map((slot) => {
                        // When editing, always make the current reservation's end time available
                        const isCurrentEndTime = formMode === 'EDIT' && currentReservation && slot.time === currentReservation.end_time;
                        const isWithinCurrentReservation = formMode === 'EDIT' && currentReservation && 
                          (slot.time >= currentReservation.start_time && slot.time < currentReservation.end_time);
                        const isUnavailable = !slot.available && slot.time !== endTime && !isCurrentEndTime && !isWithinCurrentReservation;
                        
                        return (
                          <option
                            key={slot.time}
                            value={slot.time}
                            disabled={isUnavailable}
                            className={`
                              ${isUnavailable ? 'text-gray-400' : 
                                isWithinCurrentReservation ? 'text-blue-700 font-medium' : 'text-gray-900'}
                            `}
                          >
                            {formatTimeOption(slot)}
                          </option>
                        );
                      })}
                  </select>
                </div>
              </div>
              
              <div className="flex justify-end">
                {formMode === 'EDIT' && (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="mr-4 inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Cancel Edit
                  </button>
                )}
                <button
                  type="submit"
                  disabled={submitting || !startTime || !endTime}
                  className={`inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white ${
                    submitting || !startTime || !endTime
                      ? 'bg-indigo-300 cursor-not-allowed'
                      : formMode === 'EDIT'
                        ? 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                        : 'bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
                  }`}
                >
                  {submitting ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      {formMode === 'EDIT' ? 'Updating...' : 'Creating...'}
                    </>
                  ) : (
                    <>{formMode === 'EDIT' ? 'Update Reservation' : 'Create Reservation'}</>
                  )}
                </button>
              </div>
            </form>
            
            {renderExistingReservations()}
          </>
        )}
      </div>
    </div>
  );
};

export default ReservationForm; 