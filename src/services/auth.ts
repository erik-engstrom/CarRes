import axios from 'axios';

const API_URL = '/api';

interface LoginResponse {
  token: string;
  email: string;
  message: string;
}

interface RegisterResponse {
  token: string;
  email: string;
  message: string;
}

const authApi = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if it exists
authApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const register = async (email: string, password: string): Promise<RegisterResponse> => {
  try {
    console.log('Sending register request with:', { email, password });
    const response = await authApi.post('/register', {
      email,
      password,
      password_confirmation: password
    });
    
    console.log('Register response:', response.data);
    
    const token = response.headers['authorization']?.split(' ')[1] || response.data.token;
    if (!token) {
      throw new Error('No token received from server');
    }
    
    localStorage.setItem('token', token);
    localStorage.setItem('user_email', email);
    
    return {
      token,
      email,
      message: response.data.message || 'Registered successfully'
    };
  } catch (error) {
    console.error('Register error:', error);
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 422) {
        throw new Error(error.response.data.errors?.join(', ') || 'Registration failed');
      }
      throw new Error(error.response?.data?.error || 'An error occurred during registration');
    }
    throw error;
  }
};

export const login = async (email: string, password: string): Promise<LoginResponse> => {
  try {
    console.log('Sending login request with:', { email, password });
    const response = await authApi.post('/login', {
      email,
      password
    });
    
    console.log('Login response:', response.data);
    
    // Get the JWT token from the Authorization header or response body
    const token = response.headers['authorization']?.split(' ')[1] || response.data.token;
    if (!token) {
      throw new Error('No token received from server');
    }
    
    // Store the token and user data
    localStorage.setItem('token', token);
    localStorage.setItem('user_email', email);
    
    return {
      token,
      email,
      message: response.data.message || 'Logged in successfully'
    };
  } catch (error) {
    console.error('Login error:', error);
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 401) {
        throw new Error('Invalid email or password');
      }
      throw new Error(error.response?.data?.error || 'An error occurred during login');
    }
    throw error;
  }
};

export const logout = async (): Promise<void> => {
  try {
    await authApi.delete('/logout');
  } finally {
    localStorage.removeItem('token');
    localStorage.removeItem('user_email');
    localStorage.removeItem('user_name');
  }
};

export const isAuthenticated = (): boolean => {
  return !!localStorage.getItem('token');
};

export default {
  login,
  logout,
  register,
  isAuthenticated,
}; 