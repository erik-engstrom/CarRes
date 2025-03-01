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
const mockReservations: Reservation[] = [
  {
    id: 1,
    date: '2023-10-15',
    start_time: '09:00',
    end_time: '12:00',
    user_name: 'John Doe',
    user_email: 'john@example.com',
    created_at: '2023-10-01T12:00:00Z',
    updated_at: '2023-10-01T12:00:00Z'
  },
  {
    id: 2,
    date: '2023-10-20',
    start_time: '14:00',
    end_time: '16:00',
    user_name: 'Jane Smith',
    user_email: 'jane@example.com',
    created_at: '2023-10-02T10:30:00Z',
    updated_at: '2023-10-02T10:30:00Z'
  },
  {
    id: 3,
    date: '2023-11-05',
    start_time: '10:00',
    end_time: '13:00',
    user_name: 'Bob Johnson',
    user_email: 'bob@example.com',
    created_at: '2023-10-03T09:15:00Z',
    updated_at: '2023-10-03T09:15:00Z'
  }
];

// Flag to switch between mock and real API
const USE_MOCK_API = false;

// API client setup
const apiClient = axios.create({
  baseURL: API_URL + '/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if it exists
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  console.log('Token from localStorage:', token ? `Token exists: ${token.substring(0, 10)}...` : 'No token found');
  
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
    console.log('Added Authorization header:', `Bearer ${token.substring(0, 10)}...`);
  }
  
  console.log('API Request:', {
    url: config.baseURL + config.url,
    method: config.method,
    headers: config.headers,
    data: config.data
  });
  
  return config;
});

// Error handling interceptor
apiClient.interceptors.response.use(
  (response) => {
    console.log('API Response:', {
      url: response.config.url,
      status: response.status,
      data: response.data,
      headers: response.headers
    });
    return response;
  },
  (error) => {
    console.error('API Error:', {
      url: error.config?.url,
      status: error.response?.status,
      data: error.response?.data,
      message: error.message,
      headers: error.response?.headers
    });
    if (error.response?.status === 401) {
      // Clear token and redirect to login if unauthorized
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
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

// Cache for API responses
const apiCache: Record<string, { data: any, timestamp: number }> = {};
const CACHE_TTL = 60000; // 1 minute cache TTL

// Function to invalidate cache for a specific date
const invalidateCache = (date: string) => {
  const cacheKey = `reservations_${date}`;
  if (apiCache[cacheKey]) {
    console.log(`Invalidating cache for date: ${date}`);
    delete apiCache[cacheKey];
  }
};

// Real API implementation
const realApi = {
  // Get all reservations
  getAll: async (): Promise<Reservation[]> => {
    try {
      const response = await apiClient.get<any>('/reservations');
      console.log('API response data:', response.data);
      
      // Handle different response formats
      if (Array.isArray(response.data)) {
        return response.data;
      } else if (response.data.data && Array.isArray(response.data.data)) {
        // Transform JSONAPI format to our interface
        return response.data.data.map((item: any) => ({
          id: item.id,
          ...item.attributes
        }));
      } else {
        console.error('Unexpected response format:', response.data);
        return [];
      }
    } catch (error) {
      console.error('Error fetching all reservations:', error);
      throw error;
    }
  },

  // Get reservations for a specific date
  getByDate: async (date: string): Promise<Reservation[]> => {
    // Check cache first
    const cacheKey = `reservations_${date}`;
    const cachedData = apiCache[cacheKey];
    const now = Date.now();
    
    if (cachedData && (now - cachedData.timestamp < CACHE_TTL)) {
      console.log(`Using cached data for date: ${date}`);
      return cachedData.data;
    }
    
    try {
      console.log(`Fetching reservations for date: ${date}`);
      
      // Try both query parameter and path parameter approaches
      let response;
      try {
        // First try with query parameter
        response = await apiClient.get<any>(`/reservations?date=${date}`);
      } catch (queryError) {
        console.warn('Query parameter approach failed, trying path parameter:', queryError);
        // If that fails, try with path parameter
        response = await apiClient.get<any>(`/reservations/by_date/${date}`);
      }
      
      console.log('API response data for date:', date, response.data);
      
      let result: Reservation[] = [];
      
      // Handle different response formats
      if (Array.isArray(response.data)) {
        result = response.data;
      } else if (response.data.data && Array.isArray(response.data.data)) {
        // Transform JSONAPI format to our interface
        result = response.data.data.map((item: any) => ({
          id: item.id,
          ...item.attributes
        }));
      } else {
        console.error('Unexpected response format:', response.data);
        // Return empty array instead of throwing to prevent UI from breaking
        result = [];
      }
      
      // Cache the result
      apiCache[cacheKey] = {
        data: result,
        timestamp: now
      };
      
      return result;
    } catch (error) {
      console.error(`Error fetching reservations for date ${date}:`, error);
      // Return empty array instead of throwing to prevent UI from breaking
      return [];
    }
  },

  // Get a specific reservation
  getById: async (id: number): Promise<Reservation> => {
    try {
      const response = await apiClient.get<any>(`/reservations/${id}`);
      console.log('API response data for id:', id, response.data);
      
      // Handle different response formats
      if (response.data.id) {
        return response.data;
      } else if (response.data.data) {
        return {
          id: response.data.data.id,
          ...response.data.data.attributes
        };
      } else {
        throw new Error('Unexpected response format');
      }
    } catch (error) {
      console.error(`Error fetching reservation with id ${id}:`, error);
      throw error;
    }
  },

  // Create a new reservation
  create: async (data: ReservationInput): Promise<Reservation> => {
    try {
      // Wrap the data in a 'reservation' object as expected by Rails
      const response = await apiClient.post<any>('/reservations', { reservation: data });
      console.log('Create reservation response:', response.data);
      
      // Invalidate cache for this date
      invalidateCache(data.date);
      
      // Handle different response formats
      if (response.data.id) {
        return response.data;
      } else if (response.data.data) {
        return {
          id: response.data.data.id,
          ...response.data.data.attributes
        };
      } else {
        throw new Error('Unexpected response format');
      }
    } catch (error) {
      console.error('Error creating reservation:', error);
      throw error;
    }
  },

  // Update a reservation
  update: async (id: number, data: Partial<ReservationInput>): Promise<Reservation> => {
    try {
      // Wrap the data in a 'reservation' object as expected by Rails
      const response = await apiClient.put<any>(`/reservations/${id}`, { reservation: data });
      console.log('Update reservation response:', response.data);
      
      // Invalidate cache if date is provided
      if (data.date) {
        invalidateCache(data.date);
      }
      
      // Handle different response formats
      if (response.data.id) {
        return response.data;
      } else if (response.data.data) {
        return {
          id: response.data.data.id,
          ...response.data.data.attributes
        };
      } else {
        throw new Error('Unexpected response format');
      }
    } catch (error) {
      console.error(`Error updating reservation with id ${id}:`, error);
      throw error;
    }
  },

  // Delete a reservation
  delete: async (id: number): Promise<void> => {
    try {
      // First get the reservation to know which date's cache to invalidate
      const reservation = await realApi.getById(id);
      
      await apiClient.delete(`/reservations/${id}`);
      
      // Invalidate cache for this reservation's date
      if (reservation && reservation.date) {
        invalidateCache(reservation.date);
      }
    } catch (error) {
      console.error(`Error deleting reservation with id ${id}:`, error);
      throw error;
    }
  }
};

// Export the appropriate API implementation
export const reservationApi = USE_MOCK_API ? mockApi : realApi;

export default reservationApi; 