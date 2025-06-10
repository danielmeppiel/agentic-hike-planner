import { BaseDocument, Coordinates, Range } from './Common';
import { DifficultyLevel } from './User';
import { TrailType } from './Trip';

/**
 * Trail information and management types
 * 
 * This module defines comprehensive data structures for hiking trails,
 * including location details, characteristics, features, safety information,
 * amenities, and user ratings. These types support trail discovery,
 * filtering, and detailed trail information display.
 */

/**
 * Complete trail information
 * 
 * Extends BaseDocument to represent a comprehensive trail record.
 * Contains all information needed for trail discovery, planning,
 * and safety assessment.
 * 
 * @example
 * ```typescript
 * const trail: Trail = {
 *   id: "trail123",
 *   partitionKey: "region_rockies",
 *   name: "Eagle Peak Trail",
 *   description: "Challenging mountain trail with spectacular views",
 *   location: trailLocation,
 *   characteristics: trailCharacteristics,
 *   features: trailFeatures,
 *   safety: trailSafety,
 *   amenities: trailAmenities,
 *   ratings: trailRatings,
 *   isActive: true,
 *   createdAt: new Date(),
 *   updatedAt: new Date()
 * };
 * ```
 */
// Trail Information Model
export interface Trail extends BaseDocument {
  /** Trail name */
  name: string;
  /** Detailed trail description */
  description: string;
  /** Geographic location information */
  location: TrailLocation;
  /** Physical characteristics and difficulty */
  characteristics: TrailCharacteristics;
  /** Natural and scenic features */
  features: TrailFeatures;
  /** Safety information and requirements */
  safety: TrailSafety;
  /** Available amenities and facilities */
  amenities: TrailAmenities;
  /** User ratings and reviews summary */
  ratings: TrailRatings;
  /** Whether the trail is currently open and available */
  isActive: boolean;
}

/**
 * Geographic location details for trails
 * 
 * Provides comprehensive location context including administrative
 * boundaries and precise coordinate mapping.
 * 
 * @example
 * ```typescript
 * const location: TrailLocation = {
 *   region: "Rocky Mountain National Park",
 *   park: "Rocky Mountain National Park", 
 *   country: "United States",
 *   coordinates: {
 *     start: { longitude: -105.6836, latitude: 40.3428 },
 *     end: { longitude: -105.6756, latitude: 40.3398 },
 *     waypoints: [
 *       { longitude: -105.6800, latitude: 40.3410 },
 *       { longitude: -105.6780, latitude: 40.3404 }
 *     ]
 *   }
 * };
 * ```
 */
export interface TrailLocation {
  /** Geographic region or area */
  region: string;
  /** Park or protected area name */
  park: string;
  /** Country where the trail is located */
  country: string;
  /** Detailed coordinate information for the trail route */
  coordinates: TrailCoordinates;
}

/**
 * Precise coordinate mapping for trail routes
 * 
 * Defines the trail path with start/end points and optional waypoints
 * for navigation and route visualization.
 * 
 * @example
 * ```typescript
 * const coordinates: TrailCoordinates = {
 *   start: { longitude: -122.4194, latitude: 37.7749 },
 *   end: { longitude: -122.4094, latitude: 37.7849 },
 *   waypoints: [
 *     { longitude: -122.4144, latitude: 37.7799 }
 *   ]
 * };
 * ```
 */
export interface TrailCoordinates {
  /** Trail starting point coordinates */
  start: Coordinates;
  /** Trail ending point coordinates */
  end: Coordinates;
  /** Optional intermediate waypoints along the trail */
  waypoints: Coordinates[];
}

/**
 * Physical characteristics and difficulty metrics
 * 
 * Defines quantifiable aspects of the trail that affect difficulty
 * and suitability for different user capabilities.
 * 
 * @example
 * ```typescript
 * const characteristics: TrailCharacteristics = {
 *   difficulty: "intermediate",
 *   distance: 12.5,  // 12.5 km
 *   duration: { min: 4, max: 6 },  // 4-6 hours
 *   elevationGain: 800,  // 800 meters
 *   elevationProfile: [1200, 1350, 1500, 1750, 2000, 1900, 1200],
 *   trailType: "loop",
 *   surface: ["dirt", "rock", "gravel"]
 * };
 * ```
 */
export interface TrailCharacteristics {
  /** Overall difficulty rating */
  difficulty: DifficultyLevel;
  /** Total trail distance in kilometers */
  distance: number; // km
  /** Estimated hiking time range in hours */
  duration: Range; // hours
  /** Total elevation gain in meters */
  elevationGain: number; // meters
  /** Elevation points along the trail for profile visualization */
  elevationProfile: number[]; // elevation points
  /** Type of trail routing */
  trailType: TrailType;
  /** Surface types encountered on the trail */
  surface: SurfaceType[];
}

/**
 * Natural features and scenic attributes
 * 
 * Describes the natural attractions and seasonal characteristics
 * that make each trail unique and appealing to hikers.
 * 
 * @example
 * ```typescript
 * const features: TrailFeatures = {
 *   scenicViews: true,
 *   waterFeatures: true,
 *   wildlife: ["deer", "eagles", "mountain goats"],
 *   seasonality: {
 *     bestMonths: [6, 7, 8, 9],  // June through September
 *     accessibleMonths: [5, 6, 7, 8, 9, 10]  // May through October
 *   }
 * };
 * ```
 */
export interface TrailFeatures {
  /** Whether the trail offers scenic views */
  scenicViews: boolean;
  /** Whether the trail features water (lakes, streams, waterfalls) */
  waterFeatures: boolean;
  /** Wildlife commonly seen on or near the trail */
  wildlife: string[];
  /** Seasonal accessibility and optimal timing */
  seasonality: TrailSeasonality;
}

/**
 * Seasonal accessibility information
 * 
 * Defines when the trail is accessible and when conditions are optimal.
 * Uses month numbers (1-12) for international compatibility.
 * 
 * @example
 * ```typescript
 * const seasonality: TrailSeasonality = {
 *   bestMonths: [7, 8, 9],  // July, August, September
 *   accessibleMonths: [6, 7, 8, 9, 10]  // June through October
 * };
 * ```
 */
export interface TrailSeasonality {
  /** Months with optimal trail conditions (1-12) */
  bestMonths: number[]; // 1-12
  /** Months when trail is accessible (1-12) */
  accessibleMonths: number[]; // 1-12
}

/**
 * Safety information and risk assessment
 * 
 * Provides critical safety information including risk level,
 * common hazards, permit requirements, and emergency contacts.
 * 
 * @example
 * ```typescript
 * const safety: TrailSafety = {
 *   riskLevel: 3,  // Moderate risk (1-5 scale)
 *   commonHazards: ["steep cliffs", "weather changes", "wildlife"],
 *   requiresPermit: true,
 *   emergencyContacts: ["Park Ranger: 555-0123", "Emergency: 911"]
 * };
 * ```
 */
export interface TrailSafety {
  /** Risk assessment on 1-5 scale (1=low risk, 5=high risk) */
  riskLevel: number; // 1-5 scale
  /** List of common hazards hikers should be aware of */
  commonHazards: string[];
  /** Whether a permit is required to hike this trail */
  requiresPermit: boolean;
  /** Emergency contact information for the area */
  emergencyContacts: string[];
}

/**
 * Available amenities and facilities
 * 
 * Indicates what facilities are available at or near the trailhead
 * to help hikers plan and prepare appropriately.
 * 
 * @example
 * ```typescript
 * const amenities: TrailAmenities = {
 *   parking: true,
 *   restrooms: true,
 *   camping: false,
 *   drinkingWater: true
 * };
 * ```
 */
export interface TrailAmenities {
  /** Whether parking is available at the trailhead */
  parking: boolean;
  /** Whether restroom facilities are available */
  restrooms: boolean;
  /** Whether camping is permitted on or near the trail */
  camping: boolean;
  /** Whether drinking water is available */
  drinkingWater: boolean;
}

/**
 * User ratings and review summary
 * 
 * Aggregates user feedback and ratings to help others assess trail quality.
 * The breakdown object maps rating values (1-5) to the count of users
 * who gave that rating.
 * 
 * @example
 * ```typescript
 * const ratings: TrailRatings = {
 *   average: 4.2,
 *   count: 156,
 *   breakdown: {
 *     5: 75,  // 75 users gave 5 stars
 *     4: 45,  // 45 users gave 4 stars
 *     3: 20,  // 20 users gave 3 stars
 *     2: 10,  // 10 users gave 2 stars
 *     1: 6    // 6 users gave 1 star
 *   }
 * };
 * ```
 */
export interface TrailRatings {
  /** Average rating across all reviews */
  average: number;
  /** Total number of ratings */
  count: number;
  /** Distribution of ratings (rating value -> count) */
  breakdown: { [key: number]: number }; // rating -> count
}

/**
 * Surface type definitions
 * 
 * Categorizes the different ground surfaces hikers will encounter,
 * helping them prepare with appropriate footwear and equipment.
 */

/**
 * Trail surface types for terrain classification
 * 
 * Used to categorize trail surfaces for equipment planning and difficulty assessment:
 * - rock: Rocky terrain requiring sturdy footwear
 * - dirt: Natural earth paths, most common surface
 * - paved: Paved or concrete surfaces, easier walking
 * - gravel: Loose gravel surfaces
 * - sand: Sandy terrain, more challenging walking
 * - snow: Snow-covered trails, seasonal conditions
 * - stone-steps: Constructed stone steps
 * - boardwalk: Wooden boardwalk sections
 */
// Enums and constants
export type SurfaceType = 'rock' | 'dirt' | 'paved' | 'gravel' | 'sand' | 'snow' | 'stone-steps' | 'boardwalk';

/**
 * Search and filter types for trail discovery
 * 
 * These interfaces support the trail search and recommendation functionality,
 * allowing users to find trails that match their preferences and capabilities.
 */

/**
 * Comprehensive trail search filters
 * 
 * Allows filtering trails by various criteria including difficulty,
 * physical characteristics, location, features, and amenities.
 * All fields are optional to support flexible search scenarios.
 * 
 * @example
 * ```typescript
 * const filters: TrailSearchFilters = {
 *   difficulty: ["intermediate", "advanced"],
 *   distance: { min: 5, max: 15 },
 *   duration: { min: 2, max: 8 },
 *   elevationGain: { min: 0, max: 1000 },
 *   location: {
 *     coordinates: { longitude: -122.4194, latitude: 37.7749 },
 *     radius: 50  // 50km radius from San Francisco
 *   },
 *   features: ["scenicViews", "waterFeatures"],
 *   amenities: ["parking", "restrooms"],
 *   rating: { min: 3.5, max: 5.0 },
 *   trailType: ["loop", "out-and-back"]
 * };
 * ```
 */
// Search and filter types
export interface TrailSearchFilters {
  /** Filter by difficulty levels */
  difficulty?: DifficultyLevel[];
  /** Filter by distance range in kilometers */
  distance?: Range;
  /** Filter by duration range in hours */
  duration?: Range;
  /** Filter by elevation gain range in meters */
  elevationGain?: Range;
  /** Filter by geographic location and radius */
  location?: {
    /** Center point for location-based search */
    coordinates: Coordinates;
    /** Search radius in kilometers */
    radius: number; // km
  };
  /** Filter by trail features */
  features?: string[];
  /** Filter by available amenities */
  amenities?: string[];
  /** Filter by minimum rating */
  rating?: Range;
  /** Filter by trail types */
  trailType?: TrailType[];
}

/**
 * Trail search request with query and sorting options
 * 
 * Combines text search, filters, and sorting preferences for
 * comprehensive trail discovery functionality.
 * 
 * @example
 * ```typescript
 * const searchRequest: TrailSearchRequest = {
 *   query: "mountain lake views",
 *   filters: {
 *     difficulty: ["intermediate"],
 *     distance: { min: 5, max: 20 }
 *   },
 *   sortBy: "rating",
 *   sortOrder: "desc",
 *   limit: 20,
 *   offset: 0
 * };
 * ```
 */
export interface TrailSearchRequest {
  /** Optional text search query */
  query?: string;
  /** Optional filters to apply */
  filters?: TrailSearchFilters;
  /** Sort field for results */
  sortBy?: 'distance' | 'difficulty' | 'rating' | 'popularity';
  /** Sort direction */
  sortOrder?: 'asc' | 'desc';
  /** Maximum number of results to return */
  limit?: number;
  /** Number of results to skip (for pagination) */
  offset?: number;
}

/**
 * Trail recommendation request for personalized suggestions
 * 
 * Used by the AI recommendation engine to generate personalized
 * trail suggestions based on user profile and preferences.
 * 
 * @example
 * ```typescript
 * const recommendationRequest: TrailRecommendationRequest = {
 *   userId: "user123",
 *   location: { longitude: -122.4194, latitude: 37.7749 },
 *   preferences: {
 *     difficulty: ["intermediate", "advanced"],
 *     maxDistance: 20,
 *     duration: { min: 4, max: 8 },
 *     features: ["scenicViews", "waterFeatures"]
 *   },
 *   limit: 10
 * };
 * ```
 */
export interface TrailRecommendationRequest {
  /** User ID for personalized recommendations */
  userId: string;
  /** User's current or preferred location */
  location: Coordinates;
  /** User's preferences for trail characteristics */
  preferences: {
    /** Preferred difficulty levels */
    difficulty: DifficultyLevel[];
    /** Maximum acceptable distance in kilometers */
    maxDistance: number;
    /** Preferred duration range in hours */
    duration: Range;
    /** Optional preferred features */
    features?: string[];
  };
  /** Maximum number of recommendations to return */
  limit?: number;
}

/**
 * Response types for trail operations
 * 
 * Simplified trail information for list views and search results.
 */

/**
 * Simplified trail information for list displays
 * 
 * Contains essential trail information for displaying trails in search results,
 * recommendations, and list views without the full detail of the complete Trail interface.
 * 
 * @example
 * ```typescript
 * const summary: TrailSummary = {
 *   id: "trail123",
 *   name: "Eagle Peak Trail",
 *   difficulty: "intermediate",
 *   distance: 12.5,
 *   duration: { min: 4, max: 6 },
 *   location: {
 *     region: "Rocky Mountain National Park",
 *     park: "Rocky Mountain National Park"
 *   },
 *   rating: 4.2,
 *   images: ["image1.jpg", "image2.jpg"]
 * };
 * ```
 */
// Response types
export interface TrailSummary {
  /** Trail ID */
  id: string;
  /** Trail name */
  name: string;
  /** Difficulty level */
  difficulty: DifficultyLevel;
  /** Distance in kilometers */
  distance: number;
  /** Duration range in hours */
  duration: Range;
  /** Basic location information */
  location: {
    /** Geographic region */
    region: string;
    /** Park or area name */
    park: string;
  };
  /** Average user rating */
  rating: number;
  /** Optional trail images */
  images?: string[];
}