import { apiClient } from './apiClient';
import type { UserProfile, LoginCredentials, SignupCredentials } from '../types';

export const authService = {
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

  async signup(credentials: SignupCredentials): Promise<UserProfile> {
    try {
      const { data } = await apiClient.post('/auth/signup', credentials);
      if (data.token) {
        localStorage.setItem('auth-token', data.token);
      }
      return data.user || data.data || data;
    } catch (error) {
      console.error('Signup failed:', error);
      // Return mock user as fallback
      const mockUser: UserProfile = {
        id: 'user' + Math.random().toString(36).substr(2, 9),
        email: credentials.email,
        name: credentials.name,
        avatar: '/api/placeholder/100/100',
        preferences: credentials.preferences || {
          difficultyLevel: 'intermediate',
          maxDistance: 10,
          preferredTerrains: ['Mountain', 'Forest'],
        },
      };
      localStorage.setItem('auth-token', 'mock-token-' + Math.random().toString(36).substr(2, 9));
      return mockUser;
    }
  },

  async logout(): Promise<void> {
    try {
      await apiClient.post('/auth/logout');
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      localStorage.removeItem('auth-token');
    }
  },

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

  async updateProfile(profile: Partial<UserProfile>): Promise<UserProfile> {
    try {
      const { data } = await apiClient.put('/user/profile', profile);
      return data.user || data.data || data;
    } catch (error) {
      console.error('Failed to update profile:', error);
      throw error;
    }
  },

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