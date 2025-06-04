/**
 * Common type definitions used across the application
 */

export interface BaseDocument {
  id: string;
  partitionKey: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Location {
  city: string;
  state: string;
  country: string;
  coordinates?: [number, number]; // [longitude, latitude]
}

export interface Coordinates {
  start: [number, number];
  end: [number, number];
  waypoints: [number, number][];
}

export interface DateRange {
  startDate: Date;
  endDate: Date;
  flexibility: number; // days of flexibility
}

export interface Budget {
  amount: number;
  currency: string;
  includesAccommodation: boolean;
}

export interface Range {
  min: number;
  max: number;
}

export interface Rating {
  average: number;
  count: number;
  breakdown: { [key: number]: number };
}

export type FitnessLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert';
export type Difficulty = 'easy' | 'moderate' | 'difficult' | 'expert';
export type TripStatus = 'planning' | 'confirmed' | 'completed' | 'cancelled';
export type TrailType = 'loop' | 'out-and-back' | 'point-to-point';
export type GroupSize = 'solo' | 'small' | 'large' | 'any';