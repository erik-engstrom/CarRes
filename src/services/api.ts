import axios from 'axios';

const API_URL = '/api';

export interface Reservation {
  id: number;
  date: string;
  start_time: string;
  end_time: string;
  user_name?: string;
  user_email?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ReservationInput {
  date: string;
  start_time: string;
  end_time: string;
  user_name?: string;
  user_email?: string;
}

// Mock data for development
const mockReservations: Reservation[] = [];

// Flag to switch between mock and real API
const USE_MOCK_API = true;

// API client setup
const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if it exists
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Error handling interceptor
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear token and redirect to login if unauthorized
      localStorage.removeItem('token');
      localStorage.removeItem('user_name');
      window.location.href = '/login';
    }
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// Mock API implementation
const mockApi = {
  // Get all reservations
  getAll: async (): Promise<Reservation[]> => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));
    return [...mockReservations];
  },

  // Get reservations for a specific date
  getByDate: async (date: string): Promise<Reservation[]> => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));
    return mockReservations.filter(reservation => reservation.date === date);
  },

  // Get a specific reservation
  getById: async (id: number): Promise<Reservation> => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));
    const reservation = mockReservations.find(res => res.id === id);
    if (!reservation) {
      throw new Error('Reservation not found');
    }
    return { ...reservation };
  },

  // Create a new reservation
  create: async (reservation: ReservationInput): Promise<Reservation> => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Check for overlapping reservations
    const overlapping = mockReservations.some(res => 
      res.date === reservation.date && (
        (reservation.start_time >= res.start_time && reservation.start_time < res.end_time) ||
        (reservation.end_time > res.start_time && reservation.end_time <= res.end_time) ||
        (reservation.start_time <= res.start_time && reservation.end_time >= res.end_time)
      )
    );
    
    if (overlapping) {
      throw new Error('Reservation overlaps with existing reservation');
    }
    
    // Create new reservation with generated ID
    const newId = mockReservations.length > 0 
      ? Math.max(...mockReservations.map(r => r.id)) + 1 
      : 1;
    
    const newReservation: Reservation = {
      id: newId,
      date: reservation.date,
      start_time: reservation.start_time,
      end_time: reservation.end_time,
      user_name: reservation.user_name,
      user_email: reservation.user_email,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    mockReservations.push(newReservation);
    return { ...newReservation };
  },

  // Update a reservation
  update: async (id: number, reservation: Partial<ReservationInput>): Promise<Reservation> => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const index = mockReservations.findIndex(res => res.id === id);
    if (index === -1) {
      throw new Error('Reservation not found');
    }
    
    // Check for overlapping reservations if date or times are changing
    if (reservation.date || reservation.start_time || reservation.end_time) {
      const updatedReservation = {
        ...mockReservations[index],
        ...reservation
      };
      
      const overlapping = mockReservations.some(res => 
        res.id !== id &&
        res.date === updatedReservation.date && (
          (updatedReservation.start_time >= res.start_time && updatedReservation.start_time < res.end_time) ||
          (updatedReservation.end_time > res.start_time && updatedReservation.end_time <= res.end_time) ||
          (updatedReservation.start_time <= res.start_time && updatedReservation.end_time >= res.end_time)
        )
      );
      
      if (overlapping) {
        throw new Error('Reservation overlaps with existing reservation');
      }
    }
    
    // Update the reservation
    mockReservations[index] = {
      ...mockReservations[index],
      ...reservation,
      updated_at: new Date().toISOString()
    };
    
    return { ...mockReservations[index] };
  },

  // Delete a reservation
  delete: async (id: number): Promise<void> => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const index = mockReservations.findIndex(res => res.id === id);
    if (index === -1) {
      throw new Error('Reservation not found');
    }
    
    mockReservations.splice(index, 1);
  }
};

// Real API implementation
const realApi = {
  // Get all reservations
  getAll: async (): Promise<Reservation[]> => {
    const response = await apiClient.get<Reservation[]>('/reservations');
    return response.data;
  },

  // Get reservations for a specific date
  getByDate: async (date: string): Promise<Reservation[]> => {
    const response = await apiClient.get<Reservation[]>(`/reservations?date=${date}`);
    return response.data;
  },

  // Get a specific reservation
  getById: async (id: number): Promise<Reservation> => {
    const response = await apiClient.get<Reservation>(`/reservations/${id}`);
    return response.data;
  },

  // Create a new reservation
  create: async (reservation: ReservationInput): Promise<Reservation> => {
    const response = await apiClient.post<Reservation>('/reservations', { reservation });
    return response.data;
  },

  // Update a reservation
  update: async (id: number, reservation: Partial<ReservationInput>): Promise<Reservation> => {
    const response = await apiClient.patch<Reservation>(`/reservations/${id}`, { reservation });
    return response.data;
  },

  // Delete a reservation
  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/reservations/${id}`);
  }
};

// Export the appropriate API implementation
export const reservationApi = USE_MOCK_API ? mockApi : realApi;

export default reservationApi; 