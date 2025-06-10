import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tripService } from '../services/tripService';
import type { CreateTripRequest, TripPlan } from '../types';

/**
 * Custom hook for fetching user's trip list.
 * Uses React Query for caching and automatic background updates.
 * 
 * @returns React Query result object with trips data, loading state, and error handling
 * 
 * @example
 * ```tsx
 * function TripsList() {
 *   const { data: trips, isLoading, error } = useTrips();
 * 
 *   if (isLoading) return <div>Loading trips...</div>;
 *   if (error) return <div>Error loading trips</div>;
 * 
 *   return (
 *     <div>
 *       {trips?.map(trip => (
 *         <TripCard key={trip.id} trip={trip} />
 *       ))}
 *     </div>
 *   );
 * }
 * ```
 */
export const useTrips = () => {
  return useQuery({
    queryKey: ['trips'],
    queryFn: tripService.getUserTrips,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Custom hook for creating new trips.
 * Automatically invalidates the trips cache on successful creation.
 * 
 * @returns React Query mutation object with mutate function, loading state, and error handling
 * 
 * @example
 * ```tsx
 * function CreateTripForm() {
 *   const createTripMutation = useCreateTrip();
 * 
 *   const handleSubmit = (tripData: CreateTripRequest) => {
 *     createTripMutation.mutate(tripData, {
 *       onSuccess: () => {
 *         console.log('Trip created successfully!');
 *       },
 *       onError: (error) => {
 *         console.error('Failed to create trip:', error);
 *       }
 *     });
 *   };
 * 
 *   return (
 *     <form onSubmit={handleSubmit}>
 *       <div>Form fields go here</div>
 *       <button 
 *         type="submit" 
 *         disabled={createTripMutation.isPending}
 *       >
 *         {createTripMutation.isPending ? 'Creating...' : 'Create Trip'}
 *       </button>
 *     </form>
 *   );
 * }
 * ```
 */
export const useCreateTrip = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (tripData: CreateTripRequest) => tripService.createTrip(tripData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trips'] });
    },
  });
};

/**
 * Custom hook for updating existing trips.
 * Automatically invalidates the trips cache on successful update.
 * 
 * @returns React Query mutation object with mutate function, loading state, and error handling
 * 
 * @example
 * ```tsx
 * function EditTripForm({ tripId }: { tripId: string }) {
 *   const updateTripMutation = useUpdateTrip();
 * 
 *   const handleUpdate = (updates: Partial<TripPlan>) => {
 *     updateTripMutation.mutate(
 *       { id: tripId, updates },
 *       {
 *         onSuccess: () => {
 *           console.log('Trip updated successfully!');
 *         }
 *       }
 *     );
 *   };
 * 
 *   return (
 *     <div>
 *       <button onClick={() => handleUpdate({ status: 'confirmed' })}>
 *         Confirm Trip
 *       </button>
 *     </div>
 *   );
 * }
 * ```
 */
export const useUpdateTrip = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<TripPlan> }) =>
      tripService.updateTrip(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trips'] });
    },
  });
};

/**
 * Custom hook for deleting trips.
 * Automatically invalidates the trips cache on successful deletion.
 * 
 * @returns React Query mutation object with mutate function, loading state, and error handling
 * 
 * @example
 * ```tsx
 * function TripCard({ trip }: { trip: TripPlan }) {
 *   const deleteTripMutation = useDeleteTrip();
 * 
 *   const handleDelete = () => {
 *     if (confirm('Are you sure you want to delete this trip?')) {
 *       deleteTripMutation.mutate(trip.id, {
 *         onSuccess: () => {
 *           console.log('Trip deleted successfully!');
 *         }
 *       });
 *     }
 *   };
 * 
 *   return (
 *     <div>
 *       <h3>{trip.title}</h3>
 *       <button onClick={handleDelete}>
 *         Delete Trip
 *       </button>
 *     </div>
 *   );
 * }
 * ```
 */
export const useDeleteTrip = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => tripService.deleteTrip(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trips'] });
    },
  });
};