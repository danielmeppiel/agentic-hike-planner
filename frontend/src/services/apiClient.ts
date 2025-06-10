import axios from 'axios';

/**
 * Pre-configured Axios client for API requests.
 * Includes automatic authentication, request/response interceptors,
 * and token refresh functionality.
 * 
 * Features:
 * - Automatic Bearer token authentication from localStorage
 * - Token refresh on 401 responses
 * - Automatic logout on refresh failure
 * - 10-second request timeout
 * 
 * @example
 * ```typescript
 * import { apiClient } from './apiClient';
 * 
 * // GET request
 * const response = await apiClient.get('/trails');
 * 
 * // POST request with data
 * const newTrip = await apiClient.post('/trips', tripData);
 * 
 * // PUT request
 * const updatedTrip = await apiClient.put(`/trips/${id}`, updates);
 * ```
 */
const apiClient = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for auth
apiClient.interceptors.request.use((config) => {
  // Get token if it exists
  const token = localStorage.getItem('auth-token');
  
  // Only set Authorization header if token exists
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for error handling and token refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Try to refresh the token
        const refreshResponse = await axios.post('/api/auth/refresh', {}, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('auth-token')}`,
          },
        });

        if (refreshResponse.data.token) {
          localStorage.setItem('auth-token', refreshResponse.data.token);
          originalRequest.headers.Authorization = `Bearer ${refreshResponse.data.token}`;
          return apiClient(originalRequest);
        }
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError);
      }

      // If refresh fails, clear token and redirect to login
      localStorage.removeItem('auth-token');
      window.location.href = '/';
    }
    
    return Promise.reject(error);
  }
);

export { apiClient };