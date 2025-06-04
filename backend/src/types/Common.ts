// Common types used across the application
export interface BaseEntity {
  id: string;
  partitionKey: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Coordinates {
  longitude: number;
  latitude: number;
}

export interface DateRange {
  startDate: Date;
  endDate: Date;
}

export interface NumberRange {
  min: number;
  max: number;
}

export type FitnessLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert';
export type Difficulty = 'easy' | 'moderate' | 'difficult' | 'expert';
export type GroupSize = 'solo' | 'small' | 'large' | 'any';
export type TrailType = 'loop' | 'out-and-back' | 'point-to-point';
export type TripStatus = 'planning' | 'confirmed' | 'completed' | 'cancelled';