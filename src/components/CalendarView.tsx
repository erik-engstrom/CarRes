import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  addWeeks,
  subWeeks,
  addDays,
  subDays,
  parseISO,
} from 'date-fns';

interface Reservation {
  id: number;
  date: string;
  startTime: string;
  endTime: string;
}

type ViewType = 'month' | 'week' | 'day';

const CalendarView: React.FC = () => {
  const { date: dateParam } = useParams<{ date?: string }>();
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState<Date>(dateParam ? parseISO(dateParam) : new Date());
  const [viewType, setViewType] = useState<ViewType>('month');
  const [reservations, setReservations] = useState<Reservation[]>([]);

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
    
    setReservations(mockReservations);
  }, []);

  const handleDateClick = (date: Date) => {
    navigate(`/reserve/${format(date, 'yyyy-MM-dd')}`);
  };

  const hasReservation = (date: Date) => {
    return reservations.some(reservation => 
      isSameDay(parseISO(reservation.date), date)
    );
  };

  const getReservationsForDate = (date: Date) => {
    return reservations.filter(reservation => 
      isSameDay(parseISO(reservation.date), date)
    );
  };

  const renderMonthView = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);
    
    const dateFormat = "d";
    const days = eachDayOfInterval({ start: startDate, end: endDate });
    
    const rows = [];
    let daysInRow = [];
    
    for (let i = 0; i < days.length; i++) {
      const day = days[i];
      const formattedDate = format(day, dateFormat);
      const isCurrentMonth = isSameMonth(day, monthStart);
      const hasReservationOnDay = hasReservation(day);
      
      daysInRow.push(
        <div
          key={day.toString()}
          className={`calendar-day ${!isCurrentMonth ? 'text-gray-400' : ''} ${hasReservationOnDay ? 'calendar-day-reserved' : ''}`}
          onClick={() => handleDateClick(day)}
        >
          <div className="p-1">
            <div className="text-right">{formattedDate}</div>
            {hasReservationOnDay && (
              <div className="mt-1">
                <div className="h-1.5 bg-primary-600 rounded-full"></div>
              </div>
            )}
          </div>
        </div>
      );
      
      if (daysInRow.length === 7) {
        rows.push(
          <div key={i} className="grid grid-cols-7 gap-px">
            {daysInRow}
          </div>
        );
        daysInRow = [];
      }
    }
    
    return (
      <div>
        <div className="grid grid-cols-7 gap-px text-center text-xs text-gray-500 mb-1">
          <div>Sun</div>
          <div>Mon</div>
          <div>Tue</div>
          <div>Wed</div>
          <div>Thu</div>
          <div>Fri</div>
          <div>Sat</div>
        </div>
        {rows}
      </div>
    );
  };

  const renderWeekView = () => {
    const weekStart = startOfWeek(currentDate);
    const weekEnd = endOfWeek(currentDate);
    const days = eachDayOfInterval({ start: weekStart, end: weekEnd });
    
    return (
      <div className="grid grid-cols-1 gap-4">
        {days.map(day => (
          <div
            key={day.toString()}
            className={`p-4 border rounded-lg ${hasReservation(day) ? 'bg-primary-50' : 'bg-white'}`}
            onClick={() => handleDateClick(day)}
          >
            <div className="font-medium">{format(day, 'EEEE, MMMM d')}</div>
            {getReservationsForDate(day).map(reservation => (
              <div key={reservation.id} className="mt-2 p-2 bg-primary-100 rounded">
                <div className="text-sm font-medium">{reservation.startTime} - {reservation.endTime}</div>
              </div>
            ))}
          </div>
        ))}
      </div>
    );
  };

  const renderDayView = () => {
    const hours = Array.from({ length: 12 }, (_, i) => i + 8); // 8 AM to 7 PM
    const dayReservations = getReservationsForDate(currentDate);
    
    return (
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-4 border-b">
          <h2 className="text-lg font-medium">{format(currentDate, 'EEEE, MMMM d')}</h2>
        </div>
        <div className="divide-y">
          {hours.map(hour => {
            const timeString = `${hour.toString().padStart(2, '0')}:00`;
            const hasReservationAtHour = dayReservations.some(reservation => {
              const startHour = parseInt(reservation.startTime.split(':')[0]);
              const endHour = parseInt(reservation.endTime.split(':')[0]);
              return hour >= startHour && hour < endHour;
            });
            
            return (
              <div
                key={hour}
                className={`p-4 flex items-center ${hasReservationAtHour ? 'bg-primary-50' : ''}`}
                onClick={() => handleDateClick(currentDate)}
              >
                <div className="w-20 text-gray-500">{format(new Date().setHours(hour, 0, 0), 'h:mm a')}</div>
                <div className="flex-grow">
                  {dayReservations.map(reservation => {
                    const startHour = parseInt(reservation.startTime.split(':')[0]);
                    const endHour = parseInt(reservation.endTime.split(':')[0]);
                    
                    if (hour >= startHour && hour < endHour) {
                      return (
                        <div key={reservation.id} className="p-2 bg-primary-100 rounded">
                          <div className="text-sm font-medium">
                            {reservation.startTime} - {reservation.endTime}
                          </div>
                        </div>
                      );
                    }
                    
                    return null;
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const navigatePrevious = () => {
    if (viewType === 'month') {
      setCurrentDate(subMonths(currentDate, 1));
    } else if (viewType === 'week') {
      setCurrentDate(subWeeks(currentDate, 1));
    } else {
      setCurrentDate(subDays(currentDate, 1));
    }
  };

  const navigateNext = () => {
    if (viewType === 'month') {
      setCurrentDate(addMonths(currentDate, 1));
    } else if (viewType === 'week') {
      setCurrentDate(addWeeks(currentDate, 1));
    } else {
      setCurrentDate(addDays(currentDate, 1));
    }
  };

  const renderCalendarHeader = () => {
    let dateFormat = 'MMMM yyyy';
    
    if (viewType === 'week') {
      const weekStart = startOfWeek(currentDate);
      const weekEnd = endOfWeek(currentDate);
      dateFormat = "MMM d";
      return `${format(weekStart, dateFormat)} - ${format(weekEnd, dateFormat)}, ${format(currentDate, 'yyyy')}`;
    } else if (viewType === 'day') {
      dateFormat = 'MMMM d, yyyy';
    }
    
    return format(currentDate, dateFormat);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Car Reservation Calendar</h1>
        <div className="flex space-x-2">
          <button
            className={`px-3 py-1 rounded-md ${viewType === 'month' ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-700'}`}
            onClick={() => setViewType('month')}
          >
            Month
          </button>
          <button
            className={`px-3 py-1 rounded-md ${viewType === 'week' ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-700'}`}
            onClick={() => setViewType('week')}
          >
            Week
          </button>
          <button
            className={`px-3 py-1 rounded-md ${viewType === 'day' ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-700'}`}
            onClick={() => setViewType('day')}
          >
            Day
          </button>
        </div>
      </div>
      
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={navigatePrevious}
            className="p-2 rounded-full hover:bg-gray-100"
          >
            <svg className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h2 className="text-lg font-medium">{renderCalendarHeader()}</h2>
          <button
            onClick={navigateNext}
            className="p-2 rounded-full hover:bg-gray-100"
          >
            <svg className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
        
        {viewType === 'month' && renderMonthView()}
        {viewType === 'week' && renderWeekView()}
        {viewType === 'day' && renderDayView()}
      </div>
    </div>
  );
};

export default CalendarView; 