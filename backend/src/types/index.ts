/**
 * Backend TypeScript type definitions
 * 
 * Central export point for all backend type definitions. This module
 * re-exports types from all domain-specific modules to provide a
 * single import source for the entire backend type system.
 * 
 * @example
 * ```typescript
 * // Import individual types
 * import { UserProfile, TripPlan, Trail } from '../types';
 * 
 * // Or import specific modules
 * import { CreateUserRequest } from '../types/User';
 * import { TrailSearchFilters } from '../types/Trail';
 * ```
 */

// Re-export all types from their respective modules
export * from './User';
export * from './Trip';
export * from './Trail';
export * from './Recommendation';
export * from './Common';