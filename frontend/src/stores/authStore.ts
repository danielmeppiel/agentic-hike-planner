import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authService } from '../services/authService';
import type { UserProfile, LoginCredentials, SignupCredentials } from '../types';

interface AuthStore {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  signup: (credentials: SignupCredentials) => Promise<void>;
  logout: () => void;
  signOut: () => void; // Alias for logout to match chat interface
  updateProfile: (profile: Partial<UserProfile>) => Promise<void>;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,

      login: async (credentials) => {
        set({ isLoading: true });
        try {
          const user = await authService.login(credentials);
          set({ user, isAuthenticated: true, isLoading: false });
        } catch (error) {
          console.error('Login error:', error);
          set({ isLoading: false });
          throw error;
        }
      },

      signup: async (credentials) => {
        set({ isLoading: true });
        try {
          const user = await authService.signup(credentials);
          set({ user, isAuthenticated: true, isLoading: false });
        } catch (error) {
          console.error('Signup error:', error);
          set({ isLoading: false });
          throw error;
        }
      },

      logout: () => {
        authService.logout();
        set({ user: null, isAuthenticated: false });
      },

      signOut: () => {
        authService.logout();
        set({ user: null, isAuthenticated: false });
      },

      updateProfile: async (profile) => {
        const currentUser = get().user;
        if (!currentUser) return;

        try {
          const updatedUser = await authService.updateProfile(profile);
          set({ user: updatedUser });
        } catch (error) {
          console.error('Profile update error:', error);
          throw error;
        }
      },

      checkAuth: async () => {
        // First check if we have a token in local storage
        const token = localStorage.getItem('auth-token');
        
        // Auto-mock in development environment if enabled
        if (!token && import.meta.env.DEV && import.meta.env.VITE_AUTO_MOCK_AUTH === 'true') {
          const mockUser: UserProfile = {
            id: 'mock-user-id',
            email: 'user@example.com',
            name: 'Mock User',
            avatar: '/api/placeholder/100/100',
            preferences: {
              difficultyLevel: 'intermediate',
              maxDistance: 10,
              preferredTerrains: ['Mountain', 'Forest'],
            },
          };
          localStorage.setItem('auth-token', 'mock-valid-token');
          set({ user: mockUser, isAuthenticated: true });
          return;
        }
        
        // If no token, set as not authenticated
        if (!token) {
          set({ user: null, isAuthenticated: false });
          return;
        }

        try {
          // Only try to get current user if we have a token
          const user = await authService.getCurrentUser();
          if (user) {
            set({ user, isAuthenticated: true });
          } else {
            // No valid user found despite having a token
            localStorage.removeItem('auth-token'); // Clear invalid token
            set({ user: null, isAuthenticated: false });
          }
        } catch (error) {
          console.error('Auth check error:', error);
          set({ user: null, isAuthenticated: false });
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);