import { BaseDocument, GeoLocation, Coordinates } from './Common';

/**
 * User management types and interfaces
 * 
 * This module defines all user-related data structures including profiles,
 * preferences, authentication, and statistics. These types ensure consistent
 * user data handling across the application.
 */

/**
 * Complete user profile information
 * 
 * Extends BaseDocument to include all user account information.
 * This is the main user entity stored in the database and used
 * throughout the application for personalization and trip planning.
 * 
 * @example
 * ```typescript
 * const user: UserProfile = {
 *   id: "user123",
 *   partitionKey: "user123", 
 *   email: "hiker@example.com",
 *   displayName: "Trail Explorer",
 *   fitnessLevel: "intermediate",
 *   preferences: {
 *     preferredDifficulty: ["intermediate", "advanced"],
 *     maxHikingDistance: 20,
 *     terrainTypes: ["mountain", "forest"],
 *     groupSize: "small"
 *   },
 *   location: userGeoLocation,
 *   isActive: true,
 *   createdAt: new Date(),
 *   updatedAt: new Date()
 * };
 * ```
 */
// User Profile Model
export interface UserProfile extends BaseDocument {
  /** User's email address (used for authentication) */
  email: string;
  /** User's chosen display name */
  displayName: string;
  /** User's self-assessed fitness level for activity matching */
  fitnessLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  /** User's hiking preferences and constraints */
  preferences: UserPreferences;
  /** User's geographic location for local recommendations */
  location: GeoLocation;
  /** Whether the user account is currently active */
  isActive: boolean;
}

/**
 * User hiking preferences and constraints
 * 
 * Defines a user's hiking preferences used by the recommendation engine
 * to suggest appropriate trails and trips. These preferences help filter
 * and rank trails based on personal capabilities and interests.
 * 
 * @example
 * ```typescript
 * const preferences: UserPreferences = {
 *   preferredDifficulty: ["beginner", "intermediate"],
 *   maxHikingDistance: 15,  // 15 km maximum
 *   terrainTypes: ["forest", "mountain", "coastal"],
 *   groupSize: "small"
 * };
 * ```
 */
export interface UserPreferences {
  /** Preferred difficulty levels for trail recommendations */
  preferredDifficulty: DifficultyLevel[];
  /** Maximum hiking distance in kilometers */
  maxHikingDistance: number; // km
  /** Preferred terrain types for hiking */
  terrainTypes: TerrainType[];
  /** Preferred group size for hiking activities */
  groupSize: 'solo' | 'small' | 'large' | 'any';
}

/**
 * User location information
 * 
 * Stores detailed location data for users. The coordinates field is
 * optional to respect user privacy while still enabling location-based
 * features when desired.
 * 
 * @example
 * ```typescript
 * const userLocation: UserLocation = {
 *   city: "Denver",
 *   state: "Colorado", 
 *   country: "United States",
 *   region: "Rocky Mountains",
 *   coordinates: { longitude: -104.9903, latitude: 39.7392 },
 *   address: "123 Mountain View Dr"
 * };
 * ```
 */
export interface UserLocation {
  /** User's city */
  city: string;
  /** User's state or province */
  state: string;
  /** User's country */
  country: string;
  /** Geographic region for broader categorization */
  region: string;
  /** Optional precise coordinates (for privacy) */
  coordinates?: Coordinates; // optional for privacy
  /** Optional street address */
  address?: string;
}

/**
 * User capability and terrain type definitions
 * 
 * These type unions define the standard levels and categories used
 * throughout the application for matching users with appropriate trails.
 */

/**
 * Standardized difficulty levels for user fitness and trail difficulty
 * 
 * Used to match user capabilities with appropriate trail challenges.
 * - beginner: New to hiking, prefers easy trails
 * - intermediate: Some hiking experience, comfortable with moderate challenges  
 * - advanced: Experienced hiker, seeks challenging trails
 * - expert: Highly experienced, comfortable with extreme conditions
 */
// Enums and constants
export type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert';

/**
 * Terrain types for categorizing hiking environments
 * 
 * Used in user preferences and trail classifications to match
 * hikers with their preferred environments and experiences.
 */
export type TerrainType = 'mountain' | 'forest' | 'desert' | 'coastal' | 'canyon' | 'valley' | 'alpine';

/**
 * API request and response types for user management
 * 
 * These interfaces define the contract between frontend and backend
 * for user-related API operations. They ensure type safety and
 * consistent data exchange.
 */

/**
 * Request payload for creating a new user account
 * 
 * Contains all required information to create a user profile.
 * Used during user registration process.
 * 
 * @example
 * ```typescript
 * const newUser: CreateUserRequest = {
 *   email: "newuser@example.com",
 *   displayName: "Trail Beginner",
 *   fitnessLevel: "beginner",
 *   preferences: {
 *     preferredDifficulty: ["beginner"],
 *     maxHikingDistance: 10,
 *     terrainTypes: ["forest"],
 *     groupSize: "small"
 *   },
 *   location: userLocation
 * };
 * ```
 */
// Request/Response types for API
export interface CreateUserRequest {
  /** User's email address */
  email: string;
  /** User's chosen display name */
  displayName: string;
  /** User's fitness level */
  fitnessLevel: DifficultyLevel;
  /** User's hiking preferences */
  preferences: UserPreferences;
  /** User's location information */
  location: GeoLocation;
}

/**
 * Request payload for updating an existing user profile
 * 
 * All fields are optional to support partial updates.
 * Uses Partial<UserPreferences> to allow updating individual preference fields.
 * 
 * @example
 * ```typescript
 * const updateData: UpdateUserRequest = {
 *   displayName: "Updated Name",
 *   preferences: {
 *     maxHikingDistance: 25  // Only updating max distance
 *   }
 * };
 * ```
 */
export interface UpdateUserRequest {
  /** Updated display name */
  displayName?: string;
  /** Updated fitness level */
  fitnessLevel?: DifficultyLevel;
  /** Partial or complete preference updates */
  preferences?: Partial<UserPreferences>;
  /** Updated location information */
  location?: GeoLocation;
}

/**
 * User authentication credentials
 * 
 * Simple email/password authentication structure.
 * Used for login API requests.
 * 
 * @example
 * ```typescript
 * const credentials: LoginCredentials = {
 *   email: "user@example.com",
 *   password: "securePassword123"
 * };
 * ```
 */
export interface LoginCredentials {
  /** User's email address */
  email: string;
  /** User's password */
  password: string;
}

/**
 * User hiking statistics and achievements
 * 
 * Tracks user's hiking history and accomplishments.
 * Used for displaying user progress and achievements
 * in the user dashboard and profile pages.
 * 
 * @example
 * ```typescript
 * const stats: UserStatistics = {
 *   totalTrips: 15,
 *   totalDistance: 250.5,
 *   totalElevationGain: 12000,
 *   favoriteTrails: ["trail1", "trail5", "trail12"],
 *   completedTrails: 42
 * };
 * ```
 */
export interface UserStatistics {
  /** Total number of completed trips */
  totalTrips: number;
  /** Total hiking distance in kilometers */
  totalDistance: number; // km
  /** Total elevation gained in meters */
  totalElevationGain: number; // meters
  /** Array of trail IDs marked as favorites */
  favoriteTrails: string[]; // trail IDs
  /** Total number of unique trails completed */
  completedTrails: number;
}