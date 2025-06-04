import { BaseDocument } from './Common';

/**
 * AI Recommendation Model for storing AI-generated trail recommendations
 */
export interface AIRecommendation extends BaseDocument {
  userId: string;
  tripId: string;
  trailIds: string[];
  reasoning: string;
  confidence: number; // 0-1 scale
  factors: RecommendationFactors;
  alternatives: AlternativeRecommendation[];
  expiresAt: Date;
}

export interface RecommendationFactors {
  fitnessMatch: number; // 0-1 scale
  preferenceAlignment: number; // 0-1 scale
  seasonalSuitability: number; // 0-1 scale
  safetyConsiderations: number; // 0-1 scale
}

export interface AlternativeRecommendation {
  trailId: string;
  reason: string;
  confidence: number; // 0-1 scale
}

/**
 * Create AIRecommendation request payload
 */
export interface CreateAIRecommendationRequest {
  userId: string;
  tripId: string;
  trailIds: string[];
  reasoning: string;
  confidence: number;
  factors: RecommendationFactors;
  alternatives?: AlternativeRecommendation[];
  expiresAt: Date;
}

/**
 * Update AIRecommendation request payload
 */
export interface UpdateAIRecommendationRequest {
  trailIds?: string[];
  reasoning?: string;
  confidence?: number;
  factors?: Partial<RecommendationFactors>;
  alternatives?: AlternativeRecommendation[];
  expiresAt?: Date;
}

/**
 * Recommendation generation request
 */
export interface GenerateRecommendationRequest {
  userId: string;
  tripId: string;
  maxRecommendations?: number;
  includeAlternatives?: boolean;
}