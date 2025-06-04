import { BaseEntity } from './Common';

export interface AIRecommendation extends BaseEntity {
  userId: string;
  tripId: string;
  trailIds: string[];
  reasoning: string;
  confidence: number; // 0-1 scale
  factors: {
    fitnessMatch: number; // 0-1 scale
    preferenceAlignment: number; // 0-1 scale
    seasonalSuitability: number; // 0-1 scale
    safetyConsiderations: number; // 0-1 scale
  };
  alternatives: {
    trailId: string;
    reason: string;
    confidence: number;
  }[];
  expiresAt: Date;
}

export interface CreateAIRecommendationInput {
  userId: string;
  tripId: string;
  trailIds: string[];
  reasoning: string;
  confidence: number;
  factors: {
    fitnessMatch: number;
    preferenceAlignment: number;
    seasonalSuitability: number;
    safetyConsiderations: number;
  };
  alternatives?: {
    trailId: string;
    reason: string;
    confidence: number;
  }[];
  expiresAt?: Date;
}

export interface UpdateAIRecommendationInput {
  trailIds?: string[];
  reasoning?: string;
  confidence?: number;
  factors?: {
    fitnessMatch?: number;
    preferenceAlignment?: number;
    seasonalSuitability?: number;
    safetyConsiderations?: number;
  };
  alternatives?: {
    trailId: string;
    reason: string;
    confidence: number;
  }[];
  expiresAt?: Date;
}