import { apiClient } from './apiClient';
import type { Trail, TrailFilters } from '../types';

/**
 * Trail data service for searching, retrieving, and getting recommendations for hiking trails.
 * Provides robust error handling and fallback behavior.
 */
export const trailService = {
  /**
   * Searches for trails based on provided filters.
   * Returns empty array as fallback if API call fails.
   * 
   * @param filters - Search criteria for trails (location, difficulty, distance, etc.)
   * @returns Promise resolving to array of matching trails
   * 
   * @example
   * ```typescript
   * const trails = await trailService.searchTrails({
   *   location: 'California',
   *   difficulty: 'moderate',
   *   maxDistance: 10,
   *   minRating: 4.0
   * });
   * 
   * trails.forEach(trail => {
   *   console.log(`${trail.name} - ${trail.difficulty} - ${trail.distance}mi`);
   * });
   * ```
   */
  async searchTrails(filters: TrailFilters): Promise<Trail[]> {
    try {
      console.log('Calling API with filters:', filters);
      const { data } = await apiClient.get('/trails/search', { params: filters });
      console.log('API response:', data);
      
      // Backend returns { trails: Trail[], pagination: {}, message: '' }
      if (data.trails && Array.isArray(data.trails)) {
        return data.trails;
      } else {
        console.warn('Unexpected API response structure:', data);
        return [];
      }
    } catch (error) {
      console.error('Failed to search trails:', error);
      console.log('Falling back to empty array due to error');
      return [];
    }
  },

  /**
   * Retrieves detailed information about a specific trail.
   * 
   * @param id - Unique identifier of the trail
   * @returns Promise resolving to trail details or null if not found
   * 
   * @example
   * ```typescript
   * const trail = await trailService.getTrailById('trail123');
   * if (trail) {
   *   console.log(`Trail: ${trail.name}`);
   *   console.log(`Difficulty: ${trail.difficulty}`);
   *   console.log(`Distance: ${trail.distance} miles`);
   *   console.log(`Elevation gain: ${trail.elevationGain} feet`);
   * } else {
   *   console.log('Trail not found');
   * }
   * ```
   */
  async getTrailById(id: string): Promise<Trail | null> {
    try {
      console.log('Calling trail by ID API:', id);
      const { data } = await apiClient.get(`/trails/${id}`);
      console.log('Trail by ID API response:', data);
      
      // Backend returns { trail: Trail, message: '' }
      if (data.trail) {
        return data.trail;
      } else {
        console.warn('Unexpected trail by ID API response structure:', data);
        return null;
      }
    } catch (error) {
      console.error('Failed to fetch trail:', error);
      return null;
    }
  },

  /**
   * Retrieves personalized trail recommendations for the current user.
   * Based on user preferences, hiking history, and location.
   * 
   * @returns Promise resolving to array of recommended trails
   * 
   * @example
   * ```typescript
   * const recommendations = await trailService.getRecommendations();
   * console.log(`Found ${recommendations.length} recommended trails:`);
   * 
   * recommendations.forEach((trail, index) => {
   *   console.log(`${index + 1}. ${trail.name} - ${trail.location}`);
   * });
   * ```
   */
  async getRecommendations(): Promise<Trail[]> {
    try {
      console.log('Calling recommendations API');
      const { data } = await apiClient.get('/trails/recommendations');
      console.log('Recommendations API response:', data);
      
      // Backend returns { recommendations: Trail[], message: '', meta: {} }
      if (data.recommendations && Array.isArray(data.recommendations)) {
        return data.recommendations;
      } else {
        console.warn('Unexpected recommendations API response structure:', data);
        return [];
      }
    } catch (error) {
      console.error('Failed to fetch trail recommendations:', error);
      return [];
    }
  },
};