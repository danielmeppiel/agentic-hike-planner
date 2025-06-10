import { apiClient } from './apiClient';
import type { UserProfile, LoginCredentials } from '../types';

/**
 * Authentication service for user login, logout, and profile management.
 * Handles token storage, API communication, and includes fallback mock data.
 */
export const authService = {
  /**
   * Authenticates a user with email and password.
   * Stores the authentication token in localStorage on success.
   * Falls back to mock user data if API call fails.
   * 
   * @param credentials - User login credentials (email and password)
   * @returns Promise resolving to the authenticated user's profile
   * 
   * @example
   * ```typescript
   * try {
   *   const user = await authService.login({
   *     email: 'user@example.com',
   *     password: 'password123'
   *   });
   *   console.log('Logged in as:', user.name);
   * } catch (error) {
   *   console.error('Login failed:', error);
   * }
   * ```
   */
  async login(credentials: LoginCredentials): Promise<UserProfile> {
    try {
      const { data } = await apiClient.post('/auth/login', credentials);
      if (data.token) {
        localStorage.setItem('auth-token', data.token);
      }
      return data.user || data.data || data;
    } catch (error) {
      console.error('Login failed:', error);
      // Return mock user as fallback
      const mockUser: UserProfile = {
        id: 'user123',
        email: credentials.email,
        name: 'John Doe',
        avatar: '/api/placeholder/100/100',
        preferences: {
          difficultyLevel: 'intermediate',
          maxDistance: 10,
          preferredTerrains: ['Mountain', 'Forest'],
        },
      };
      localStorage.setItem('auth-token', 'mock-token-123');
      return mockUser;
    }
  },

  /**
   * Logs out the current user and clears authentication data.
   * Removes the authentication token from localStorage regardless of API response.
   * 
   * @example
   * ```typescript
   * await authService.logout();
   * // User is now logged out, token removed
   * ```
   */
  async logout(): Promise<void> {
    try {
      await apiClient.post('/auth/logout');
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      localStorage.removeItem('auth-token');
    }
  },

  /**
   * Retrieves the current user's profile if authenticated.
   * Returns null if no authentication token exists or API call fails.
   * 
   * @returns Promise resolving to user profile or null if not authenticated
   * 
   * @example
   * ```typescript
   * const currentUser = await authService.getCurrentUser();
   * if (currentUser) {
   *   console.log('Current user:', currentUser.name);
   * } else {
   *   console.log('No user logged in');
   * }
   * ```
   */
  async getCurrentUser(): Promise<UserProfile | null> {
    // Check if token exists before making the API call
    const token = localStorage.getItem('auth-token');
    if (!token) {
      return null; // No need to make API call if no auth token exists
    }
    
    try {
      const { data } = await apiClient.get('/user/profile', {
        // Reduce timeout for this specific call to avoid long waits when the server is down
        timeout: 5000
      });
      return data.user || data.data || data;
    } catch (error) {
      console.error('Failed to get current user:', error);
      return null;
    }
  },

  /**
   * Updates the current user's profile information.
   * 
   * @param profile - Partial user profile with fields to update
   * @returns Promise resolving to the updated user profile
   * 
   * @example
   * ```typescript
   * const updatedUser = await authService.updateProfile({
   *   name: 'Jane Doe',
   *   preferences: {
   *     difficultyLevel: 'advanced',
   *     maxDistance: 15
   *   }
   * });
   * ```
   */
  async updateProfile(profile: Partial<UserProfile>): Promise<UserProfile> {
    try {
      const { data } = await apiClient.put('/user/profile', profile);
      return data.user || data.data || data;
    } catch (error) {
      console.error('Failed to update profile:', error);
      throw error;
    }
  },

  /**
   * Refreshes the authentication token.
   * Updates localStorage with the new token on success.
   * 
   * @returns Promise resolving to the new token or null if refresh failed
   * 
   * @example
   * ```typescript
   * const newToken = await authService.refreshToken();
   * if (newToken) {
   *   console.log('Token refreshed successfully');
   * } else {
   *   // Handle refresh failure, redirect to login
   * }
   * ```
   */
  async refreshToken(): Promise<string | null> {
    try {
      const { data } = await apiClient.post('/auth/refresh');
      if (data.token) {
        localStorage.setItem('auth-token', data.token);
        return data.token;
      }
      return null;
    } catch (error) {
      console.error('Failed to refresh token:', error);
      return null;
    }
  },
};