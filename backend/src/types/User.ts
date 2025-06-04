import { BaseEntity, Coordinates, FitnessLevel, GroupSize } from './Common';

export interface UserProfile extends BaseEntity {
  email: string;
  displayName: string;
  fitnessLevel: FitnessLevel;
  preferences: {
    preferredDifficulty: string[];
    maxHikingDistance: number; // in kilometers
    terrainTypes: string[];
    groupSize: GroupSize;
  };
  location: {
    city: string;
    state: string;
    country: string;
    coordinates?: Coordinates;
  };
  isActive: boolean;
}

export interface CreateUserProfileInput {
  email: string;
  displayName: string;
  fitnessLevel: FitnessLevel;
  preferences: {
    preferredDifficulty: string[];
    maxHikingDistance: number;
    terrainTypes: string[];
    groupSize: GroupSize;
  };
  location: {
    city: string;
    state: string;
    country: string;
    coordinates?: Coordinates;
  };
}

export interface UpdateUserProfileInput {
  displayName?: string;
  fitnessLevel?: FitnessLevel;
  preferences?: {
    preferredDifficulty?: string[];
    maxHikingDistance?: number;
    terrainTypes?: string[];
    groupSize?: GroupSize;
  };
  location?: {
    city?: string;
    state?: string;
    country?: string;
    coordinates?: Coordinates;
  };
}