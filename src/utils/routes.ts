// Define all application routes in one place for easy management
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  CALENDAR: '/calendar',
  DASHBOARD: '/dashboard',
  RESERVATION: '/reservation/:date',
  RESERVATION_WITH_DATE: (date: string) => `/reservation/${date}`,
};

// Helper function to check if user is authenticated
export const isAuthenticated = (): boolean => {
  return !!localStorage.getItem('token');
};

// Helper function to get user email
export const getUserEmail = (): string | null => {
  return localStorage.getItem('user_email');
};

// Helper function to handle logout
export const logout = (): void => {
  localStorage.removeItem('token');
  localStorage.removeItem('user_email');
  localStorage.removeItem('user_name');
  // Redirect to login page
  window.location.href = ROUTES.LOGIN;
};

export default ROUTES; 