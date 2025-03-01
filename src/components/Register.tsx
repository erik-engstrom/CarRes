import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { register } from '../services/auth';

const Register: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  
  // Check if user is already logged in
  useEffect(() => {
    if (localStorage.getItem('token')) {
      navigate('/calendar');
    }
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setIsLoading(false);
      return;
    }
    
    try {
      const response = await register(email, password);
      localStorage.setItem('user_email', response.email);
      navigate('/calendar', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 py-6 px-4">
      <div className="w-full max-w-md space-y-6 bg-white p-6 sm:p-8 rounded-2xl shadow-md transition-all duration-300">
        <div>
          <h2 className="mt-2 text-center text-2xl sm:text-3xl font-extrabold text-gray-800">
            Create Account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-500">
            Join us today and start booking
          </p>
        </div>
        <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
          {error && (
            <div className="rounded-xl bg-red-50 p-3 text-center">
              <div className="text-sm text-red-500">{error}</div>
            </div>
          )}
          <div className="space-y-4">
            <div>
              <label htmlFor="email-address" className="block text-sm font-medium text-gray-600 mb-1">
                Email address
              </label>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none relative block w-full px-3 py-2.5 border border-gray-200 rounded-xl placeholder-gray-400 text-gray-700 focus:outline-none focus:ring-1 focus:ring-indigo-400 focus:border-indigo-400 transition-colors duration-200 ease-in-out"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-600 mb-1">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                className="appearance-none relative block w-full px-3 py-2.5 border border-gray-200 rounded-xl placeholder-gray-400 text-gray-700 focus:outline-none focus:ring-1 focus:ring-indigo-400 focus:border-indigo-400 transition-colors duration-200 ease-in-out"
                placeholder="Create a password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-600 mb-1">
                Confirm Password
              </label>
              <input
                id="confirm-password"
                name="confirm-password"
                type="password"
                autoComplete="new-password"
                required
                className="appearance-none relative block w-full px-3 py-2.5 border border-gray-200 rounded-xl placeholder-gray-400 text-gray-700 focus:outline-none focus:ring-1 focus:ring-indigo-400 focus:border-indigo-400 transition-colors duration-200 ease-in-out"
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2.5 px-4 border border-transparent text-sm font-medium rounded-xl text-white bg-indigo-500 hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 ease-in-out"
            >
              {isLoading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating account...
                </span>
              ) : (
                'Create Account'
              )}
            </button>
          </div>
          
          <div className="text-sm text-center mt-4">
            <Link 
              to="/login" 
              className="font-medium text-indigo-500 hover:text-indigo-600 transition-colors duration-200 ease-in-out"
            >
              Already have an account? Sign in
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Register; 