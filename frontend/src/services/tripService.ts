import { apiClient } from './apiClient';
import type { TripPlan, CreateTripRequest } from '../types';

/**
 * Trip management service for creating, reading, updating, and deleting trip plans.
 * Provides fallback mock data when API calls fail.
 */
export const tripService = {
  /**
   * Retrieves all trips for the current user.
   * Returns mock data as fallback if API call fails.
   * 
   * @returns Promise resolving to array of user's trip plans
   * 
   * @example
   * ```typescript
   * const trips = await tripService.getUserTrips();
   * trips.forEach(trip => {
   *   console.log(`Trip: ${trip.title} - Status: ${trip.status}`);
   * });
   * ```
   */
  async getUserTrips(): Promise<TripPlan[]> {
    try {
      const { data } = await apiClient.get('/trips');
      return data.trips || data.data || data;
    } catch (error) {
      console.error('Failed to fetch user trips:', error);
      // Return mock data as fallback
      return [
        {
          id: '1',
          title: 'Mount Washington Adventure',
          description: 'A challenging hike to the summit',
          startDate: '2024-07-15',
          endDate: '2024-07-15',
          trails: [],
          participants: ['user123'],
          status: 'planned',
          createdAt: '2024-06-01T00:00:00Z',
          updatedAt: '2024-06-01T00:00:00Z',
        },
        {
          id: '2',
          title: 'Blue Ridge Trail',
          description: 'Scenic mountain trail with waterfalls',
          startDate: '2024-06-20',
          endDate: '2024-06-20',
          trails: [],
          participants: ['user123'],
          status: 'completed',
          createdAt: '2024-05-15T00:00:00Z',
          updatedAt: '2024-06-20T00:00:00Z',
        },
      ];
    }
  },

  /**
   * Creates a new trip plan.
   * Returns mock trip data as fallback if API call fails.
   * 
   * @param trip - Trip creation request data
   * @returns Promise resolving to the created trip plan
   * 
   * @example
   * ```typescript
   * const newTrip = await tripService.createTrip({
   *   title: 'Weekend Hike',
   *   description: 'A relaxing weekend in the mountains',
   *   startDate: '2024-07-01',
   *   endDate: '2024-07-02'
   * });
   * console.log('Created trip:', newTrip.id);
   * ```
   */
  async createTrip(trip: CreateTripRequest): Promise<TripPlan> {
    try {
      const { data } = await apiClient.post('/trips', trip);
      return data.trip || data.data || data;
    } catch (error) {
      console.error('Failed to create trip:', error);
      // Return mock response as fallback
      return {
        id: Date.now().toString(),
        title: trip.title,
        description: trip.description,
        startDate: trip.startDate,
        endDate: trip.endDate,
        trails: [],
        participants: ['user123'],
        status: 'draft',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }
  },

  /**
   * Updates an existing trip plan.
   * 
   * @param id - Unique identifier of the trip to update
   * @param updates - Partial trip data with fields to update
   * @returns Promise resolving to the updated trip plan
   * @throws Error if update fails
   * 
   * @example
   * ```typescript
   * try {
   *   const updatedTrip = await tripService.updateTrip('trip123', {
   *     status: 'confirmed',
   *     description: 'Updated description'
   *   });
   *   console.log('Trip updated:', updatedTrip.title);
   * } catch (error) {
   *   console.error('Update failed:', error);
   * }
   * ```
   */
  async updateTrip(id: string, updates: Partial<TripPlan>): Promise<TripPlan> {
    try {
      const { data } = await apiClient.put(`/trips/${id}`, updates);
      return data.trip || data.data || data;
    } catch (error) {
      console.error('Failed to update trip:', error);
      throw error;
    }
  },

  /**
   * Deletes a trip plan.
   * 
   * @param id - Unique identifier of the trip to delete
   * @throws Error if deletion fails
   * 
   * @example
   * ```typescript
   * try {
   *   await tripService.deleteTrip('trip123');
   *   console.log('Trip deleted successfully');
   * } catch (error) {
   *   console.error('Delete failed:', error);
   * }
   * ```
   */
  async deleteTrip(id: string): Promise<void> {
    try {
      await apiClient.delete(`/trips/${id}`);
    } catch (error) {
      console.error('Failed to delete trip:', error);
      throw error;
    }
  },

  /**
   * Retrieves a specific trip by its ID.
   * 
   * @param id - Unique identifier of the trip
   * @returns Promise resolving to the trip plan or null if not found
   * 
   * @example
   * ```typescript
   * const trip = await tripService.getTripById('trip123');
   * if (trip) {
   *   console.log('Found trip:', trip.title);
   * } else {
   *   console.log('Trip not found');
   * }
   * ```
   */
  async getTripById(id: string): Promise<TripPlan | null> {
    try {
      const { data } = await apiClient.get(`/trips/${id}`);
      return data.trip || data.data || data;
    } catch (error) {
      console.error('Failed to fetch trip:', error);
      return null;
    }
  },
};