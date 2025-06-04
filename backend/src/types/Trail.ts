import { BaseEntity, Coordinates, Difficulty, TrailType, NumberRange } from './Common';

export interface Trail extends BaseEntity {
  name: string;
  description: string;
  location: {
    region: string;
    park: string;
    country: string;
    coordinates: {
      start: Coordinates;
      end: Coordinates;
      waypoints: Coordinates[];
    };
  };
  characteristics: {
    difficulty: Difficulty;
    distance: number; // km
    duration: NumberRange; // hours
    elevationGain: number; // meters
    elevationProfile: number[]; // elevation points
    trailType: TrailType;
    surface: string[]; // rock, dirt, paved, etc.
  };
  features: {
    scenicViews: boolean;
    waterFeatures: boolean;
    wildlife: string[];
    seasonality: {
      bestMonths: number[]; // 1-12 representing months
      accessibleMonths: number[];
    };
  };
  safety: {
    riskLevel: number; // 1-5 scale
    commonHazards: string[];
    requiresPermit: boolean;
    emergencyContacts: string[];
  };
  amenities: {
    parking: boolean;
    restrooms: boolean;
    camping: boolean;
    drinkingWater: boolean;
  };
  ratings: {
    average: number;
    count: number;
    breakdown: { [key: number]: number }; // rating -> count
  };
  isActive: boolean;
}

export interface CreateTrailInput {
  name: string;
  description: string;
  location: {
    region: string;
    park: string;
    country: string;
    coordinates: {
      start: Coordinates;
      end: Coordinates;
      waypoints?: Coordinates[];
    };
  };
  characteristics: {
    difficulty: Difficulty;
    distance: number;
    duration: NumberRange;
    elevationGain: number;
    elevationProfile?: number[];
    trailType: TrailType;
    surface: string[];
  };
  features: {
    scenicViews: boolean;
    waterFeatures: boolean;
    wildlife?: string[];
    seasonality: {
      bestMonths: number[];
      accessibleMonths: number[];
    };
  };
  safety: {
    riskLevel: number;
    commonHazards?: string[];
    requiresPermit: boolean;
    emergencyContacts?: string[];
  };
  amenities: {
    parking: boolean;
    restrooms: boolean;
    camping: boolean;
    drinkingWater: boolean;
  };
}

export interface UpdateTrailInput {
  name?: string;
  description?: string;
  location?: {
    region?: string;
    park?: string;
    country?: string;
    coordinates?: {
      start?: Coordinates;
      end?: Coordinates;
      waypoints?: Coordinates[];
    };
  };
  characteristics?: {
    difficulty?: Difficulty;
    distance?: number;
    duration?: NumberRange;
    elevationGain?: number;
    elevationProfile?: number[];
    trailType?: TrailType;
    surface?: string[];
  };
  features?: {
    scenicViews?: boolean;
    waterFeatures?: boolean;
    wildlife?: string[];
    seasonality?: {
      bestMonths?: number[];
      accessibleMonths?: number[];
    };
  };
  safety?: {
    riskLevel?: number;
    commonHazards?: string[];
    requiresPermit?: boolean;
    emergencyContacts?: string[];
  };
  amenities?: {
    parking?: boolean;
    restrooms?: boolean;
    camping?: boolean;
    drinkingWater?: boolean;
  };
  isActive?: boolean;
}

export interface TrailSearchCriteria {
  region?: string;
  difficulty?: Difficulty[];
  distance?: NumberRange;
  duration?: NumberRange;
  elevationGain?: NumberRange;
  trailType?: TrailType[];
  features?: {
    scenicViews?: boolean;
    waterFeatures?: boolean;
    wildlife?: string[];
  };
  amenities?: {
    parking?: boolean;
    restrooms?: boolean;
    camping?: boolean;
    drinkingWater?: boolean;
  };
  location?: {
    center: Coordinates;
    radius: number; // km
  };
}