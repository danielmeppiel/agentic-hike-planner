import { BaseDocument, DateRange, Budget, Range, TripStatus } from './Common';

/**
 * Trip Planning Model for storing trip plans and preferences
 */
export interface TripPlan extends BaseDocument {
  userId: string;
  title: string;
  description: string;
  status: TripStatus;
  dates: DateRange;
  location: TripLocation;
  participants: TripParticipants;
  preferences: TripPreferences;
  selectedTrails: string[]; // trail IDs
  equipment: string[];
  budget: Budget;
}

export interface TripLocation {
  region: string;
  coordinates: [number, number]; // [longitude, latitude]
  radius: number; // km radius for trail search
}

export interface TripParticipants {
  count: number;
  fitnessLevels: string[];
  specialRequirements: string[];
}

export interface TripPreferences {
  difficulty: string[];
  duration: Range; // hours
  distance: Range; // km
  elevationGain: Range; // meters
  trailTypes: string[];
}

/**
 * Create TripPlan request payload
 */
export interface CreateTripPlanRequest {
  title: string;
  description: string;
  dates: DateRange;
  location: TripLocation;
  participants: TripParticipants;
  preferences: TripPreferences;
  equipment?: string[];
  budget: Budget;
}

/**
 * Update TripPlan request payload
 */
export interface UpdateTripPlanRequest {
  title?: string;
  description?: string;
  status?: TripStatus;
  dates?: DateRange;
  location?: TripLocation;
  participants?: TripParticipants;
  preferences?: Partial<TripPreferences>;
  selectedTrails?: string[];
  equipment?: string[];
  budget?: Budget;
}