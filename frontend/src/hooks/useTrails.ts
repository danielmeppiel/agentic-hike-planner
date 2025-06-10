import { useQuery } from '@tanstack/react-query';
import { trailService } from '../services/trailService';
import type { TrailFilters } from '../types';

/**
 * Custom hook for fetching and managing trail search results.
 * Uses React Query for caching and background updates.
 * 
 * @param filters - Search filters for trails (location, difficulty, distance, etc.)
 * @returns React Query result object with trails data, loading state, and error handling
 * 
 * @example
 * ```tsx
 * function TrailSearch() {
 *   const filters = { location: 'California', difficulty: 'moderate' };
 *   const { data: trails, isLoading, error } = useTrails(filters);
 * 
 *   if (isLoading) return <div>Loading trails...</div>;
 *   if (error) return <div>Error loading trails</div>;
 * 
 *   return (
 *     <div>
 *       {trails?.map(trail => (
 *         <TrailCard key={trail.id} trail={trail} />
 *       ))}
 *     </div>
 *   );
 * }
 * ```
 */
export const useTrails = (filters: TrailFilters = {}) => {
  return useQuery({
    queryKey: ['trails', filters],
    queryFn: () => trailService.searchTrails(filters),
    staleTime: 10 * 60 * 1000, // 10 minutes
    enabled: Object.keys(filters).length > 0 || !filters.location, // Always enabled for initial load
  });
};

/**
 * Custom hook for fetching detailed information about a specific trail.
 * 
 * @param id - Unique identifier for the trail
 * @returns React Query result object with trail details, loading state, and error handling
 * 
 * @example
 * ```tsx
 * function TrailDetail({ trailId }: { trailId: string }) {
 *   const { data: trail, isLoading, error } = useTrail(trailId);
 * 
 *   if (isLoading) return <div>Loading trail details...</div>;
 *   if (error) return <div>Trail not found</div>;
 * 
 *   return (
 *     <div>
 *       <h1>{trail.name}</h1>
 *       <p>{trail.description}</p>
 *       <p>Difficulty: {trail.difficulty}</p>
 *     </div>
 *   );
 * }
 * ```
 */
export const useTrail = (id: string) => {
  return useQuery({
    queryKey: ['trail', id],
    queryFn: () => trailService.getTrailById(id),
    staleTime: 15 * 60 * 1000, // 15 minutes
    enabled: !!id,
  });
};