import { BaseDocument, Coordinates, Difficulty, TrailType, Range, Rating } from './Common';

/**
 * Trail Information Model for storing detailed trail data
 */
export interface Trail extends BaseDocument {
  name: string;
  description: string;
  location: TrailLocation;
  characteristics: TrailCharacteristics;
  features: TrailFeatures;
  safety: TrailSafety;
  amenities: TrailAmenities;
  ratings: Rating;
  isActive: boolean;
}

export interface TrailLocation {
  region: string;
  park: string;
  country: string;
  coordinates: Coordinates;
}

export interface TrailCharacteristics {
  difficulty: Difficulty;
  distance: number; // km
  duration: Range; // hours
  elevationGain: number; // meters
  elevationProfile: number[]; // elevation points along the trail
  trailType: TrailType;
  surface: string[]; // rock, dirt, paved, etc.
}

export interface TrailFeatures {
  scenicViews: boolean;
  waterFeatures: boolean;
  wildlife: string[];
  seasonality: TrailSeasonality;
}

export interface TrailSeasonality {
  bestMonths: number[]; // 1-12 representing months
  accessibleMonths: number[]; // 1-12 representing months
}

export interface TrailSafety {
  riskLevel: number; // 1-5 scale
  commonHazards: string[];
  requiresPermit: boolean;
  emergencyContacts: string[];
}

export interface TrailAmenities {
  parking: boolean;
  restrooms: boolean;
  camping: boolean;
  drinkingWater: boolean;
}

/**
 * Trail search query interface
 */
export interface TrailSearchQuery {
  region?: string;
  difficulty?: Difficulty[];
  distance?: Range;
  duration?: Range;
  elevationGain?: Range;
  trailType?: TrailType[];
  surface?: string[];
  scenicViews?: boolean;
  waterFeatures?: boolean;
  wildlife?: string[];
  bestMonths?: number[];
  riskLevel?: Range;
  requiresPermit?: boolean;
  amenities?: Partial<TrailAmenities>;
  coordinates?: [number, number];
  radius?: number; // km from coordinates
  limit?: number;
  offset?: number;
  sortBy?: 'distance' | 'difficulty' | 'rating' | 'duration';
  sortOrder?: 'asc' | 'desc';
}

/**
 * Create Trail request payload
 */
export interface CreateTrailRequest {
  name: string;
  description: string;
  location: TrailLocation;
  characteristics: TrailCharacteristics;
  features: TrailFeatures;
  safety: TrailSafety;
  amenities: TrailAmenities;
}

/**
 * Update Trail request payload
 */
export interface UpdateTrailRequest {
  name?: string;
  description?: string;
  location?: TrailLocation;
  characteristics?: Partial<TrailCharacteristics>;
  features?: Partial<TrailFeatures>;
  safety?: Partial<TrailSafety>;
  amenities?: Partial<TrailAmenities>;
  isActive?: boolean;
}