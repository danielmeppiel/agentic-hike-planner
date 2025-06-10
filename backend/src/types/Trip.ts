import { BaseDocument, Coordinates, DateRange, Range, Budget } from './Common';
import { DifficultyLevel } from './User';

/**
 * Trip planning and management types
 * 
 * This module defines data structures for hiking trip planning, including
 * trip details, participant management, preferences, and location handling.
 * These types support the core trip planning functionality of the application.
 */

/**
 * Complete trip plan information
 * 
 * Extends BaseDocument to represent a complete hiking trip plan.
 * Contains all information needed to organize and execute a hiking trip,
 * including participants, selected trails, equipment, and budget.
 * 
 * @example
 * ```typescript
 * const trip: TripPlan = {
 *   id: "trip123",
 *   partitionKey: "user456",
 *   userId: "user456",
 *   title: "Rocky Mountain Adventure", 
 *   description: "3-day hiking trip in Colorado",
 *   status: "planning",
 *   dates: {
 *     startDate: new Date('2024-07-15'),
 *     endDate: new Date('2024-07-17'),
 *     flexibility: 2
 *   },
 *   location: tripLocation,
 *   participants: tripParticipants,
 *   preferences: tripPreferences,
 *   selectedTrails: ["trail1", "trail2"],
 *   equipment: ["tent", "sleeping bag", "first aid kit"],
 *   budget: tripBudget,
 *   createdAt: new Date(),
 *   updatedAt: new Date()
 * };
 * ```
 */
// Trip Planning Model
export interface TripPlan extends BaseDocument {
  /** ID of the user who created this trip */
  userId: string;
  /** Trip title/name */
  title: string;
  /** Detailed trip description */
  description: string;
  /** Current status of the trip planning */
  status: TripStatus;
  /** Trip date range and flexibility */
  dates: DateRange;
  /** Geographic location and search area */
  location: TripLocation;
  /** Information about trip participants */
  participants: TripParticipants;
  /** Trip preferences for trail selection */
  preferences: TripPreferences;
  /** Array of selected trail IDs */
  selectedTrails: string[]; // trail IDs
  /** List of required equipment */
  equipment: string[];
  /** Trip budget information */
  budget: Budget;
}

/**
 * Geographic location specification for trip planning
 * 
 * Defines the target area for trail searching and trip planning.
 * The radius determines how far from the center point to search for trails.
 * 
 * @example
 * ```typescript
 * const location: TripLocation = {
 *   region: "Rocky Mountain National Park",
 *   coordinates: { longitude: -105.6836, latitude: 40.3428 },
 *   radius: 25  // Search within 25km radius
 * };
 * ```
 */
export interface TripLocation {
  /** Geographic region or area name */
  region: string;
  /** Center point coordinates for trail search */
  coordinates: Coordinates;
  /** Search radius in kilometers from the center point */
  radius: number; // km radius for trail search
}

/**
 * Trip participant information and requirements
 * 
 * Manages information about who will be participating in the trip
 * and their collective capabilities and requirements.
 * 
 * @example
 * ```typescript
 * const participants: TripParticipants = {
 *   count: 4,
 *   fitnessLevels: ["intermediate", "advanced", "intermediate", "beginner"],
 *   specialRequirements: ["vegetarian meals", "accessible parking"]
 * };
 * ```
 */
export interface TripParticipants {
  /** Total number of participants */
  count: number;
  /** Fitness levels of all participants (used for trail difficulty matching) */
  fitnessLevels: DifficultyLevel[];
  /** Any special requirements or accommodations needed */
  specialRequirements: string[];
}

/**
 * Trip preferences for trail selection and filtering
 * 
 * Defines the criteria used to select appropriate trails for the trip.
 * These preferences are used by the recommendation engine to suggest
 * trails that match the group's capabilities and interests.
 * 
 * @example
 * ```typescript
 * const preferences: TripPreferences = {
 *   difficulty: ["intermediate", "advanced"],
 *   duration: { min: 4, max: 8 },  // 4-8 hours per day
 *   distance: { min: 10, max: 20 }, // 10-20 km per day  
 *   elevationGain: { min: 500, max: 1500 }, // 500-1500m elevation
 *   trailTypes: ["loop", "out-and-back"]
 * };
 * ```
 */
export interface TripPreferences {
  /** Acceptable difficulty levels for the trip */
  difficulty: DifficultyLevel[];
  /** Preferred duration range in hours */
  duration: Range; // hours
  /** Preferred distance range in kilometers */
  distance: Range; // km
  /** Preferred elevation gain range in meters */
  elevationGain: Range; // meters
  /** Preferred trail types */
  trailTypes: TrailType[];
}

/**
 * Trip status and trail type definitions
 * 
 * These type unions define the possible states and categories
 * used in trip management and trail classification.
 */

/**
 * Trip status throughout the planning and execution lifecycle
 * 
 * Tracks the progression of a trip from initial planning to completion:
 * - planning: Trip is being planned, trails being selected
 * - confirmed: Trip is finalized and confirmed
 * - completed: Trip has been completed
 * - cancelled: Trip was cancelled
 */
// Enums and constants
export type TripStatus = 'planning' | 'confirmed' | 'completed' | 'cancelled';

/**
 * Trail type classifications for different hiking experiences
 * 
 * Categorizes trails by their routing pattern:
 * - loop: Circular route returning to start point
 * - out-and-back: Linear route retracing the same path
 * - point-to-point: Linear route with different start and end points
 * - shuttle: Requires transportation between start and end points
 */
export type TrailType = 'loop' | 'out-and-back' | 'point-to-point' | 'shuttle';

/**
 * API request and response types for trip management
 * 
 * These interfaces define the contract between frontend and backend
 * for trip-related API operations, ensuring type safety and
 * consistent data exchange.
 */

/**
 * Request payload for creating a new trip
 * 
 * Contains all required information to create a new trip plan.
 * Budget is optional as some trips may not have budget constraints.
 * 
 * @example
 * ```typescript
 * const newTrip: CreateTripRequest = {
 *   title: "Weekend Mountain Hike",
 *   description: "Relaxing 2-day mountain hiking trip",
 *   dates: {
 *     startDate: new Date('2024-08-10'),
 *     endDate: new Date('2024-08-11')
 *   },
 *   location: {
 *     region: "Blue Ridge Mountains",
 *     coordinates: { longitude: -82.2664, latitude: 35.5951 },
 *     radius: 30
 *   },
 *   participants: {
 *     count: 2,
 *     fitnessLevels: ["intermediate", "intermediate"],
 *     specialRequirements: []
 *   },
 *   preferences: tripPrefs,
 *   budget: { amount: 200, currency: "USD", includesAccommodation: false }
 * };
 * ```
 */
// Request/Response types for API
export interface CreateTripRequest {
  /** Trip title */
  title: string;
  /** Trip description */
  description: string;
  /** Trip dates */
  dates: DateRange;
  /** Trip location and search area */
  location: TripLocation;
  /** Participant information */
  participants: TripParticipants;
  /** Trail preferences */
  preferences: TripPreferences;
  /** Optional budget constraints */
  budget?: Budget;
}

/**
 * Request payload for updating an existing trip
 * 
 * All fields are optional to support partial updates.
 * Allows updating any aspect of a trip plan.
 * 
 * @example
 * ```typescript
 * const updates: UpdateTripRequest = {
 *   status: "confirmed",
 *   selectedTrails: ["trail1", "trail3", "trail7"],
 *   equipment: ["updated", "equipment", "list"]
 * };
 * ```
 */
export interface UpdateTripRequest {
  /** Updated trip title */
  title?: string;
  /** Updated trip description */
  description?: string;
  /** Updated trip status */
  status?: TripStatus;
  /** Updated trip dates */
  dates?: DateRange;
  /** Updated location information */
  location?: TripLocation;
  /** Updated participant information */
  participants?: TripParticipants;
  /** Partial or complete preference updates */
  preferences?: Partial<TripPreferences>;
  /** Updated trail selections */
  selectedTrails?: string[];
  /** Updated equipment list */
  equipment?: string[];
  /** Updated budget information */
  budget?: Budget;
}

/**
 * Simplified trip information for list views
 * 
 * Contains essential trip information for displaying trips in lists
 * and summaries without the full detail of the complete TripPlan.
 * 
 * @example
 * ```typescript
 * const summary: TripSummary = {
 *   id: "trip123",
 *   title: "Mountain Adventure",
 *   status: "confirmed",
 *   dates: dateRange,
 *   trailCount: 3,
 *   participantCount: 4
 * };
 * ```
 */
export interface TripSummary {
  /** Trip ID */
  id: string;
  /** Trip title */
  title: string;
  /** Current trip status */
  status: TripStatus;
  /** Trip date range */
  dates: DateRange;
  /** Number of selected trails */
  trailCount: number;
  /** Number of participants */
  participantCount: number;
}