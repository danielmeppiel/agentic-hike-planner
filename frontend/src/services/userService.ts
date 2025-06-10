import { apiClient } from './apiClient';
import type { UserPreferences } from '../types';

/**
 * Interface for user hiking statistics and activity data.
 */
export interface UserStatistics {
  /** Total number of trips planned or completed */
  totalTrips: number;
  /** Number of completed trips */
  completedTrips: number;
  /** Total distance hiked in miles */
  totalDistance: number;
  /** Total elevation gained in feet */
  totalElevation: number;
  /** Name of user's most frequently hiked trail */
  favoriteTrail?: string;
  /** Average rating given by user to trails */
  averageRating?: number;
}

/**
 * User profile and statistics service for managing user data and preferences.
 * Provides fallback mock data when API calls fail.
 */
export const userService = {
  /**
   * Retrieves user hiking statistics and activity summary.
   * Returns mock statistics as fallback if API call fails.
   * 
   * @returns Promise resolving to user statistics or null
   * 
   * @example
   * ```typescript
   * const stats = await userService.getStatistics();
   * if (stats) {
   *   console.log(`Completed ${stats.completedTrips} of ${stats.totalTrips} trips`);
   *   console.log(`Total distance: ${stats.totalDistance} miles`);
   *   console.log(`Total elevation: ${stats.totalElevation} feet`);
   * }
   * ```
   */
  async getStatistics(): Promise<UserStatistics | null> {
    try {
      const { data } = await apiClient.get('/user/statistics');
      return data.statistics || data.data || data;
    } catch (error) {
      console.error('Failed to fetch user statistics:', error);
      // Return mock statistics as fallback
      return {
        totalTrips: 12,
        completedTrips: 8,
        totalDistance: 85.4,
        totalElevation: 15200,
        favoriteTrail: 'Mount Washington Summit Trail',
        averageRating: 4.2,
      };
    }
  },

  /**
   * Updates user hiking preferences and settings.
   * 
   * @param preferences - Updated user preferences object
   * @returns Promise resolving to the updated preferences
   * @throws Error if update fails
   * 
   * @example
   * ```typescript
   * try {
   *   const updatedPrefs = await userService.updatePreferences({
   *     difficultyLevel: 'advanced',
   *     maxDistance: 15,
   *     preferredTerrains: ['Mountain', 'Desert'],
   *     notifications: {
   *       weatherAlerts: true,
   *       tripReminders: true
   *     }
   *   });
   *   console.log('Preferences updated:', updatedPrefs);
   * } catch (error) {
   *   console.error('Failed to update preferences:', error);
   * }
   * ```
   */
  async updatePreferences(preferences: UserPreferences): Promise<UserPreferences> {
    try {
      const { data } = await apiClient.put('/user/preferences', preferences);
      return data.preferences || data.data || data;
    } catch (error) {
      console.error('Failed to update user preferences:', error);
      throw error;
    }
  },
};