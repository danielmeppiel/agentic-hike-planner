/**
 * Frontend TypeScript type definitions
 * 
 * This module defines all TypeScript interfaces used in the React frontend,
 * including user interfaces, API contracts, and application state types.
 * Many of these types mirror backend types but are adapted for frontend usage
 * with considerations for serialization and UI-specific requirements.
 * 
 * ## Frontend-Backend Type Consistency
 * 
 * Several types are intentionally duplicated between frontend and backend
 * to maintain separation of concerns while ensuring API compatibility:
 * 
 * - `ApiResponse<T>` and `PaginatedResponse<T>`: Identical structures for API consistency
 * - `UserProfile` and `TripPlan`: Similar but with string dates for JSON serialization
 * - `Trail`: Extended frontend version with flattened structure for UI convenience
 * 
 * ## Usage Patterns
 * 
 * ```typescript
 * // API responses use the standard wrapper
 * const response: ApiResponse<Trail[]> = await api.get('/trails');
 * 
 * // Form data uses request types
 * const newTrip: CreateTripRequest = { title, description, startDate, endDate, trailIds };
 * 
 * // Chat messages support multiple sender types
 * const message: ChatMessage = { id, content, sender: 'assistant', timestamp, type };
 * ```
 */

/**
 * Core user profile for frontend application
 * 
 * Simplified user profile focusing on UI display needs.
 * Differs from backend UserProfile by using optional preferences
 * and simplified structure for frontend state management.
 * 
 * @example
 * ```typescript
 * const user: UserProfile = {
 *   id: "user123",
 *   email: "hiker@example.com",
 *   name: "Trail Explorer",
 *   avatar: "https://example.com/avatar.jpg",
 *   preferences: {
 *     difficultyLevel: "intermediate",
 *     maxDistance: 20,
 *     preferredTerrains: ["mountain", "forest"]
 *   }
 * };
 * ```
 */
// Core user types
export interface UserProfile {
  /** Unique user identifier */
  id: string;
  /** User's email address */
  email: string;
  /** User's display name */
  name: string;
  /** Optional avatar image URL */
  avatar?: string;
  /** Optional user hiking preferences */
  preferences?: UserPreferences;
}

/**
 * User hiking preferences for the frontend
 * 
 * Simplified version of backend UserPreferences, focused on the most
 * commonly used fields in the UI. Uses a more limited difficulty scale
 * compared to the backend's four-level system.
 * 
 * @example
 * ```typescript
 * const preferences: UserPreferences = {
 *   difficultyLevel: "intermediate",
 *   maxDistance: 15,  // kilometers
 *   preferredTerrains: ["forest", "mountain", "coastal"]
 * };
 * ```
 */
export interface UserPreferences {
  /** Preferred difficulty level (simplified 3-level scale) */
  difficultyLevel: 'beginner' | 'intermediate' | 'advanced';
  /** Optional maximum hiking distance in kilometers */
  maxDistance?: number;
  /** Array of preferred terrain types */
  preferredTerrains: string[];
}

/**
 * Login credentials for authentication
 * 
 * Matches backend LoginCredentials exactly for API compatibility.
 * Used in login forms and authentication requests.
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
 * Trip planning types for frontend
 * 
 * These interfaces handle trip planning in the UI, using string dates
 * for form handling and JSON serialization compatibility.
 */

/**
 * Complete trip plan for frontend display
 * 
 * Similar to backend TripPlan but adapted for frontend needs:
 * - Uses string dates for JSON serialization
 * - Includes full trail objects instead of just IDs for UI convenience
 * - Simplified status enum for UI states
 * 
 * @example
 * ```typescript
 * const trip: TripPlan = {
 *   id: "trip123",
 *   title: "Weekend Mountain Adventure",
 *   description: "Two-day hiking trip in the mountains",
 *   startDate: "2024-07-15",
 *   endDate: "2024-07-17",
 *   trails: [trail1, trail2],
 *   participants: ["user1", "user2"],
 *   status: "planned",
 *   createdAt: "2024-06-01T10:00:00Z",
 *   updatedAt: "2024-06-10T15:30:00Z"
 * };
 * ```
 */
// Trip planning types
export interface TripPlan {
  /** Unique trip identifier */
  id: string;
  /** Trip title/name */
  title: string;
  /** Trip description */
  description: string;
  /** Trip start date (ISO string format) */
  startDate: string;
  /** Trip end date (ISO string format) */
  endDate: string;
  /** Array of trail objects (not just IDs for UI convenience) */
  trails: Trail[];
  /** Array of participant IDs */
  participants: string[];
  /** Current trip status */
  status: 'draft' | 'planned' | 'completed';
  /** Creation timestamp (ISO string) */
  createdAt: string;
  /** Last update timestamp (ISO string) */
  updatedAt: string;
}

/**
 * Request payload for creating new trips
 * 
 * Simplified creation request using string dates and trail IDs.
 * Used in trip creation forms and API requests.
 * 
 * @example
 * ```typescript
 * const newTrip: CreateTripRequest = {
 *   title: "Mountain Day Hike",
 *   description: "Easy day hike for beginners",
 *   startDate: "2024-07-20",
 *   endDate: "2024-07-20",
 *   trailIds: ["trail1", "trail3"]
 * };
 * ```
 */
export interface CreateTripRequest {
  /** Trip title */
  title: string;
  /** Trip description */
  description: string;
  /** Start date (ISO string format) */
  startDate: string;
  /** End date (ISO string format) */
  endDate: string;
  /** Array of selected trail IDs */
  trailIds: string[];
}

/**
 * Comprehensive trail information for frontend display
 * 
 * This interface represents the complete trail data structure used
 * throughout the frontend application. It closely mirrors the backend
 * Trail interface but is flattened and adapted for UI rendering.
 * 
 * Key differences from backend:
 * - Flattened nested objects for easier property access
 * - String timestamps for JSON serialization compatibility  
 * - Includes partitionKey for consistency with backend documents
 * 
 * @example
 * ```typescript
 * const trail: Trail = {
 *   id: "trail123",
 *   name: "Eagle Peak Trail",
 *   description: "Challenging mountain trail with spectacular views",
 *   location: {
 *     region: "Rocky Mountain National Park",
 *     park: "Rocky Mountain National Park",
 *     country: "United States",
 *     coordinates: {
 *       start: { longitude: -105.6836, latitude: 40.3428 },
 *       end: { longitude: -105.6756, latitude: 40.3398 },
 *       waypoints: []
 *     }
 *   },
 *   characteristics: {
 *     difficulty: "intermediate",
 *     distance: 12.5,
 *     duration: { min: 4, max: 6 },
 *     elevationGain: 800,
 *     elevationProfile: [1200, 1350, 1500, 1750, 2000],
 *     trailType: "loop",
 *     surface: ["dirt", "rock"]
 *   },
 *   // ... other properties
 *   isActive: true,
 *   partitionKey: "region_rockies",
 *   createdAt: "2024-01-15T10:00:00Z",
 *   updatedAt: "2024-06-10T15:30:00Z"
 * };
 * ```
 */
// Trail types - Updated to match backend data structure
export interface Trail {
  /** Unique trail identifier */
  id: string;
  /** Trail name */
  name: string;
  /** Detailed trail description */
  description: string;
  /** Geographic location and coordinates */
  location: {
    /** Geographic region name */
    region: string;
    /** Park or protected area name */
    park: string;
    /** Country where trail is located */
    country: string;
    /** Trail route coordinates */
    coordinates: {
      /** Starting point coordinates */
      start: {
        longitude: number;
        latitude: number;
      };
      /** Ending point coordinates */
      end: {
        longitude: number;
        latitude: number;
      };
      /** Intermediate waypoints */
      waypoints: any[];
    };
  };
  /** Physical trail characteristics */
  characteristics: {
    /** Trail difficulty level */
    difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert';
    /** Trail distance in kilometers */
    distance: number;
    /** Estimated hiking duration range */
    duration: {
      /** Minimum time in hours */
      min: number;
      /** Maximum time in hours */
      max: number;
    };
    /** Total elevation gain in meters */
    elevationGain: number;
    /** Elevation profile points for visualization */
    elevationProfile: number[];
    /** Type of trail routing */
    trailType: string;
    /** Surface types encountered */
    surface: string[];
  };
  /** Natural features and attractions */
  features: {
    /** Whether trail offers scenic views */
    scenicViews: boolean;
    /** Whether trail features water elements */
    waterFeatures: boolean;
    /** Wildlife commonly observed */
    wildlife: string[];
    /** Seasonal accessibility information */
    seasonality: {
      /** Best months for hiking (1-12) */
      bestMonths: number[];
      /** Months when trail is accessible (1-12) */
      accessibleMonths: number[];
    };
  };
  /** Safety information and requirements */
  safety: {
    /** Risk level on 1-5 scale */
    riskLevel: number;
    /** Common hazards on the trail */
    commonHazards: string[];
    /** Whether permits are required */
    requiresPermit: boolean;
    /** Emergency contact information */
    emergencyContacts: string[];
  };
  /** Available amenities and facilities */
  amenities: {
    /** Parking availability at trailhead */
    parking: boolean;
    /** Restroom facilities available */
    restrooms: boolean;
    /** Camping permitted */
    camping: boolean;
    /** Drinking water available */
    drinkingWater: boolean;
  };
  /** User ratings and reviews */
  ratings: {
    /** Average rating across all reviews */
    average: number;
    /** Total number of ratings */
    count: number;
    /** Rating distribution (rating -> count) */
    breakdown: { [key: number]: number };
  };
  /** Whether the trail is currently active/open */
  isActive: boolean;
  /** Database partition key for backend consistency */
  partitionKey: string;
  /** Creation timestamp (ISO string) */
  createdAt: string;
  /** Last update timestamp (ISO string) */
  updatedAt: string;
}

/**
 * Trail filtering options for search and discovery
 * 
 * Provides filtering capabilities for trail search functionality.
 * Simpler than the backend TrailSearchFilters, focusing on the most
 * commonly used filters in the UI.
 * 
 * @example
 * ```typescript
 * const filters: TrailFilters = {
 *   difficulty: "intermediate",
 *   maxDistance: 20,
 *   maxDuration: 8,
 *   location: "Rocky Mountains",
 *   features: ["scenicViews", "waterFeatures"]
 * };
 * ```
 */
export interface TrailFilters {
  /** Filter by single difficulty level */
  difficulty?: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  /** Maximum distance in kilometers */
  maxDistance?: number;
  /** Maximum duration in hours */
  maxDuration?: number;
  /** Location/region filter */
  location?: string;
  /** Desired trail features */
  features?: string[];
}

/**
 * Chat and messaging types for AI interaction
 * 
 * These interfaces support the chat functionality where users interact
 * with the AI assistant for trip planning and trail recommendations.
 */

/**
 * Individual chat message
 * 
 * Represents a single message in the chat interface. Supports both
 * Date objects and ISO strings for timestamp to handle serialization
 * across different contexts (WebSocket, HTTP, local state).
 * 
 * @example
 * ```typescript
 * const userMessage: Message = {
 *   id: "msg123",
 *   content: "I'm looking for intermediate trails near Denver",
 *   sender: "user",
 *   timestamp: new Date(),
 *   type: "text"
 * };
 * 
 * const aiResponse: Message = {
 *   id: "msg124", 
 *   content: "Here are some great intermediate trails near Denver...",
 *   sender: "ai",
 *   timestamp: "2024-06-10T15:30:00Z",
 *   type: "trail-info"
 * };
 * ```
 */
// Chat types
export interface Message {
  /** Unique message identifier */
  id: string;
  /** Message text content */
  content: string;
  /** Who sent the message */
  sender: 'user' | 'ai';
  /** Message timestamp (flexible format for serialization) */
  timestamp: Date | string; // Allow both Date and string to handle serialization
  /** Optional message type for UI rendering */
  type?: 'text' | 'action' | 'trail-info' | 'trip-plan';
}

/**
 * Chat message with assistant sender type
 * 
 * Alternative message interface using 'assistant' instead of 'ai'
 * for consistency with some AI service APIs. Uses string timestamps
 * for API compatibility.
 * 
 * @example
 * ```typescript
 * const chatMessage: ChatMessage = {
 *   id: "chat456",
 *   content: "I found 5 trails that match your criteria",
 *   sender: "assistant",
 *   timestamp: "2024-06-10T15:30:00Z",
 *   type: "suggestion"
 * };
 * ```
 */
export interface ChatMessage {
  /** Unique message identifier */
  id: string;
  /** Message text content */
  content: string;
  /** Message sender (user or AI assistant) */
  sender: 'user' | 'assistant';
  /** Message timestamp (ISO string format) */
  timestamp: string;
  /** Optional message categorization */
  type?: 'text' | 'suggestion' | 'error';
}

/**
 * API response types for frontend-backend communication
 * 
 * These interfaces ensure type safety for API communication and maintain
 * consistency between frontend expectations and backend responses.
 */

/**
 * Standard API response wrapper
 * 
 * Identical to backend ApiResponse<T> to ensure perfect compatibility
 * between frontend and backend. All API endpoints use this structure
 * for consistent error handling and success indication.
 * 
 * @template T The type of data being returned in the response
 * 
 * @example
 * ```typescript
 * // Successful response
 * const trailsResponse: ApiResponse<Trail[]> = {
 *   success: true,
 *   data: [trail1, trail2, trail3],
 *   message: "Trails retrieved successfully"
 * };
 * 
 * // Error response
 * const errorResponse: ApiResponse<null> = {
 *   success: false,
 *   data: null,
 *   error: "Failed to load trails: Database connection error"
 * };
 * ```
 */
// API response types
export interface ApiResponse<T> {
  /** Indicates whether the API call was successful */
  success: boolean;
  /** The response data payload */
  data: T;
  /** Optional success message */
  message?: string;
  /** Optional error message when success is false */
  error?: string;
}

/**
 * Paginated API response for list endpoints
 * 
 * Nearly identical to backend PaginatedResponse<T> but missing hasPrevious
 * field. This represents a potential frontend-backend inconsistency that
 * should be addressed for complete pagination support.
 * 
 * @template T The type of items in the paginated list
 * 
 * @example
 * ```typescript
 * const paginatedTrails: PaginatedResponse<Trail> = {
 *   items: [trail1, trail2, trail3],
 *   total: 150,
 *   page: 1,
 *   limit: 20,
 *   hasNext: true
 *   // Note: Missing hasPrevious field compared to backend
 * };
 * ```
 * 
 * @todo Add hasPrevious field to match backend PaginatedResponse exactly
 */
export interface PaginatedResponse<T> {
  /** Array of items for the current page */
  items: T[];
  /** Total number of items across all pages */
  total: number;
  /** Current page number */
  page: number;
  /** Number of items per page */
  limit: number;
  /** Whether there are more pages available */
  hasNext: boolean;
}