import { BaseDocument } from './Common';

/**
 * AI recommendation system types
 * 
 * This module defines data structures for the AI-powered trail recommendation
 * system, including recommendation models, factors, alternatives, and the
 * AI engine interface. These types support intelligent trail suggestions
 * based on user preferences, trip requirements, and contextual factors.
 */

/**
 * AI-generated trail recommendation
 * 
 * Extends BaseDocument to represent a complete AI recommendation with
 * reasoning, confidence metrics, and alternative suggestions. Each
 * recommendation is generated for a specific user and trip combination.
 * 
 * @example
 * ```typescript
 * const recommendation: AIRecommendation = {
 *   id: "rec123",
 *   partitionKey: "user456",
 *   userId: "user456",
 *   tripId: "trip789",
 *   trailIds: ["trail1", "trail2", "trail3"],
 *   reasoning: "Selected trails match your intermediate fitness level and preference for scenic mountain views with moderate elevation gain.",
 *   confidence: 0.87,
 *   factors: {
 *     fitnessMatch: 0.9,
 *     preferenceAlignment: 0.85,
 *     seasonalSuitability: 0.8,
 *     safetyConsiderations: 0.95
 *   },
 *   alternatives: [
 *     {
 *       trailId: "trail4",
 *       reason: "Slightly more challenging option with better views",
 *       confidence: 0.75
 *     }
 *   ],
 *   expiresAt: new Date('2024-12-31'),
 *   createdAt: new Date(),
 *   updatedAt: new Date()
 * };
 * ```
 */
// AI Recommendation Model
export interface AIRecommendation extends BaseDocument {
  /** ID of the user this recommendation is for */
  userId: string;
  /** ID of the trip this recommendation relates to */
  tripId: string;
  /** Array of recommended trail IDs */
  trailIds: string[];
  /** AI-generated explanation for the recommendation */
  reasoning: string;
  /** Overall confidence in the recommendation (0-1 scale) */
  confidence: number; // 0-1 scale
  /** Breakdown of factors that influenced the recommendation */
  factors: RecommendationFactors;
  /** Alternative trail suggestions */
  alternatives: RecommendationAlternative[];
  /** When this recommendation expires and should be regenerated */
  expiresAt: Date;
}

/**
 * Factors that influence recommendation quality
 * 
 * Provides quantitative metrics for different aspects of recommendation
 * quality, helping users understand why certain trails were suggested.
 * All factors are scored on a 0-1 scale where 1 represents perfect alignment.
 * 
 * @example
 * ```typescript
 * const factors: RecommendationFactors = {
 *   fitnessMatch: 0.9,    // Trails well-matched to user fitness
 *   preferenceAlignment: 0.85,  // Trails align with user preferences
 *   seasonalSuitability: 0.7,   // Good but not perfect seasonal timing
 *   safetyConsiderations: 0.95  // Very safe recommendations
 * };
 * ```
 */
export interface RecommendationFactors {
  /** How well trail difficulty matches user fitness level (0-1) */
  fitnessMatch: number; // 0-1 scale
  /** How well trails align with user stated preferences (0-1) */
  preferenceAlignment: number; // 0-1 scale
  /** How suitable trails are for the planned season (0-1) */
  seasonalSuitability: number; // 0-1 scale
  /** Safety assessment for the recommended trails (0-1) */
  safetyConsiderations: number; // 0-1 scale
}

/**
 * Alternative trail suggestion
 * 
 * Represents an alternative trail option that wasn't included in the
 * main recommendation but could be considered as a backup or variation.
 * 
 * @example
 * ```typescript
 * const alternative: RecommendationAlternative = {
 *   trailId: "trail999",
 *   reason: "More challenging option with better summit views",
 *   confidence: 0.75
 * };
 * ```
 */
export interface RecommendationAlternative {
  /** Trail ID of the alternative option */
  trailId: string;
  /** Explanation of why this is offered as an alternative */
  reason: string;
  /** Confidence in this alternative recommendation (0-1) */
  confidence: number; // 0-1 scale
}

/**
 * Request and response types for recommendation API
 * 
 * These interfaces define the contract for requesting and receiving
 * AI-generated trail recommendations.
 */

/**
 * Request for generating new trail recommendations
 * 
 * Provides the AI engine with all necessary context to generate
 * personalized trail recommendations for a specific trip.
 * 
 * @example
 * ```typescript
 * const request: GenerateRecommendationRequest = {
 *   userId: "user123",
 *   tripId: "trip456",
 *   preferences: {
 *     difficulty: ["intermediate", "advanced"],
 *     maxDistance: 20,
 *     duration: { min: 4, max: 8 },
 *     features: ["scenicViews", "waterFeatures"]
 *   },
 *   location: {
 *     coordinates: [-122.4194, 37.7749],  // San Francisco
 *     radius: 100  // 100km radius
 *   }
 * };
 * ```
 */
// Request/Response types
export interface GenerateRecommendationRequest {
  /** User ID requesting recommendations */
  userId: string;
  /** Trip ID for context */
  tripId: string;
  /** User preferences for trail selection */
  preferences: {
    /** Acceptable difficulty levels */
    difficulty: string[];
    /** Maximum acceptable distance in kilometers */
    maxDistance: number;
    /** Acceptable duration range in hours */
    duration: { min: number; max: number };
    /** Optional preferred features */
    features?: string[];
  };
  /** Location constraints for trail search */
  location: {
    /** Center point coordinates [longitude, latitude] */
    coordinates: [number, number];
    /** Search radius in kilometers */
    radius: number;
  };
}

/**
 * Response containing generated recommendations
 * 
 * Returns AI-generated recommendations with metadata about when
 * they were generated and how many total options were considered.
 * 
 * @example
 * ```typescript
 * const response: RecommendationResponse = {
 *   recommendations: [recommendation1, recommendation2],
 *   totalCount: 2,
 *   generatedAt: new Date()
 * };
 * ```
 */
export interface RecommendationResponse {
  /** Array of generated recommendations */
  recommendations: AIRecommendation[];
  /** Total number of recommendations generated */
  totalCount: number;
  /** Timestamp when recommendations were generated */
  generatedAt: Date;
}

/**
 * AI engine types and processing interfaces
 * 
 * These types define the structure for AI processing context and
 * the interface that AI recommendation engines must implement.
 */

/**
 * Complete context for AI recommendation generation
 * 
 * Provides all available information to the AI engine for generating
 * intelligent recommendations. Uses flexible Record types to accommodate
 * evolving data structures and external integrations.
 * 
 * @example
 * ```typescript
 * const context: AIContext = {
 *   userProfile: {
 *     fitnessLevel: "intermediate",
 *     experience: ["day hiking", "backpacking"],
 *     preferences: { terrainTypes: ["mountain", "forest"] }
 *   },
 *   tripRequirements: {
 *     dates: { start: new Date('2024-07-15'), end: new Date('2024-07-17') },
 *     participants: 2,
 *     preferences: { difficulty: ["intermediate"] }
 *   },
 *   availableTrails: [
 *     {
 *       id: "trail1",
 *       characteristics: { difficulty: "intermediate", distance: 12 },
 *       location: { region: "Rocky Mountains" }
 *     }
 *   ],
 *   weatherData: {
 *     forecast: { temperature: 22, precipitation: 0 },
 *     seasonal: { typicalConditions: "dry and warm" }
 *   }
 * };
 * ```
 */
// AI Processing types
export interface AIContext {
  /** User profile information for personalization */
  userProfile: {
    /** User's fitness level */
    fitnessLevel: string;
    /** User's hiking experience types */
    experience: string[];
    /** User's detailed preferences */
    preferences: Record<string, any>;
  };
  /** Trip-specific requirements and constraints */
  tripRequirements: {
    /** Trip date range */
    dates: { start: Date; end: Date };
    /** Number of participants */
    participants: number;
    /** Trip-specific preferences */
    preferences: Record<string, any>;
  };
  /** Available trails in the search area */
  availableTrails: {
    /** Trail ID */
    id: string;
    /** Trail characteristics */
    characteristics: Record<string, any>;
    /** Trail location information */
    location: Record<string, any>;
  }[];
  /** Optional weather information for enhanced recommendations */
  weatherData?: {
    /** Weather forecast for trip dates */
    forecast: Record<string, any>;
    /** Seasonal weather patterns */
    seasonal: Record<string, any>;
  };
}

/**
 * AI recommendation engine interface
 * 
 * Defines the contract that all AI recommendation engines must implement.
 * This interface supports pluggable AI backends and testing with mock implementations.
 * 
 * @example
 * ```typescript
 * class AzureAIRecommendationEngine implements AIRecommendationEngine {
 *   async generateRecommendations(context: AIContext): Promise<AIRecommendation[]> {
 *     // Implementation using Azure AI Foundry
 *     return recommendations;
 *   }
 *   
 *   async explainRecommendation(recommendationId: string): Promise<string> {
 *     // Generate detailed explanation
 *     return explanation;
 *   }
 *   
 *   async updateRecommendation(recommendationId: string, feedback: RecommendationFeedback): Promise<AIRecommendation> {
 *     // Update recommendation based on user feedback
 *     return updatedRecommendation;
 *   }
 * }
 * ```
 */
export interface AIRecommendationEngine {
  /** Generate new recommendations based on provided context */
  generateRecommendations(context: AIContext): Promise<AIRecommendation[]>;
  /** Generate detailed explanation for an existing recommendation */
  explainRecommendation(recommendationId: string): Promise<string>;
  /** Update recommendation based on user feedback */
  updateRecommendation(recommendationId: string, feedback: RecommendationFeedback): Promise<AIRecommendation>;
}

/**
 * User feedback on recommendation quality
 * 
 * Allows users to provide feedback on recommendations to improve
 * future suggestions. This data is used to train and refine the AI models.
 * 
 * @example
 * ```typescript
 * const feedback: RecommendationFeedback = {
 *   rating: 4,  // 4 out of 5 stars
 *   useful: true,
 *   issues: ["trail was more difficult than expected"],
 *   selectedTrail: "trail2"  // Which recommended trail was actually chosen
 * };
 * ```
 */
export interface RecommendationFeedback {
  /** User rating of the recommendation (1-5 scale) */
  rating: number; // 1-5 scale
  /** Whether the user found the recommendation useful */
  useful: boolean;
  /** Optional list of issues or problems with the recommendation */
  issues?: string[];
  /** ID of the trail actually selected from the recommendation */
  selectedTrail?: string;
}