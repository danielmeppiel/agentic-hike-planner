import { BaseEntity, Coordinates, DateRange, NumberRange, TripStatus } from './Common';

export interface TripPlan extends BaseEntity {
  userId: string;
  title: string;
  description: string;
  status: TripStatus;
  dates: {
    startDate: Date;
    endDate: Date;
    flexibility: number; // days of flexibility
  };
  location: {
    region: string;
    coordinates: Coordinates;
    radius: number; // km radius for trail search
  };
  participants: {
    count: number;
    fitnessLevels: string[];
    specialRequirements: string[];
  };
  preferences: {
    difficulty: string[];
    duration: NumberRange; // hours
    distance: NumberRange; // km
    elevationGain: NumberRange; // meters
    trailTypes: string[];
  };
  selectedTrails: string[]; // trail IDs
  equipment: string[];
  budget: {
    amount: number;
    currency: string;
    includesAccommodation: boolean;
  };
}

export interface CreateTripPlanInput {
  userId: string;
  title: string;
  description: string;
  dates: {
    startDate: Date;
    endDate: Date;
    flexibility: number;
  };
  location: {
    region: string;
    coordinates: Coordinates;
    radius: number;
  };
  participants: {
    count: number;
    fitnessLevels: string[];
    specialRequirements: string[];
  };
  preferences: {
    difficulty: string[];
    duration: NumberRange;
    distance: NumberRange;
    elevationGain: NumberRange;
    trailTypes: string[];
  };
  equipment?: string[];
  budget?: {
    amount: number;
    currency: string;
    includesAccommodation: boolean;
  };
}

export interface UpdateTripPlanInput {
  title?: string;
  description?: string;
  status?: TripStatus;
  dates?: {
    startDate?: Date;
    endDate?: Date;
    flexibility?: number;
  };
  location?: {
    region?: string;
    coordinates?: Coordinates;
    radius?: number;
  };
  participants?: {
    count?: number;
    fitnessLevels?: string[];
    specialRequirements?: string[];
  };
  preferences?: {
    difficulty?: string[];
    duration?: NumberRange;
    distance?: NumberRange;
    elevationGain?: NumberRange;
    trailTypes?: string[];
  };
  selectedTrails?: string[];
  equipment?: string[];
  budget?: {
    amount?: number;
    currency?: string;
    includesAccommodation?: boolean;
  };
}