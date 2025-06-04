import { BaseDocument, Location, FitnessLevel, GroupSize } from './Common';

/**
 * User Profile Model for storing user information and preferences
 */
export interface UserProfile extends BaseDocument {
  email: string;
  displayName: string;
  fitnessLevel: FitnessLevel;
  preferences: UserPreferences;
  location: Location;
  isActive: boolean;
}

export interface UserPreferences {
  preferredDifficulty: string[];
  maxHikingDistance: number; // km
  terrainTypes: string[];
  groupSize: GroupSize;
}

/**
 * Create UserProfile request payload
 */
export interface CreateUserProfileRequest {
  email: string;
  displayName: string;
  fitnessLevel: FitnessLevel;
  preferences: UserPreferences;
  location: Location;
}

/**
 * Update UserProfile request payload
 */
export interface UpdateUserProfileRequest {
  displayName?: string;
  fitnessLevel?: FitnessLevel;
  preferences?: Partial<UserPreferences>;
  location?: Location;
  isActive?: boolean;
}