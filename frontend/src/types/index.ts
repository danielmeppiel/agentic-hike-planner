// Core user types
export interface UserProfile {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  preferences?: UserPreferences;
}

export interface UserPreferences {
  difficultyLevel: 'beginner' | 'intermediate' | 'advanced';
  maxDistance?: number;
  preferredTerrains: string[];
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignUpCredentials {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

// Trip planning types
export interface TripPlan {
  id: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  trails: Trail[];
  participants: string[];
  status: 'draft' | 'planned' | 'completed';
  createdAt: string;
  updatedAt: string;
}

export interface CreateTripRequest {
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  trailIds: string[];
}

// Trail types - Updated to match backend data structure
export interface Trail {
  id: string;
  name: string;
  description: string;
  location: {
    region: string;
    park: string;
    country: string;
    coordinates: {
      start: {
        longitude: number;
        latitude: number;
      };
      end: {
        longitude: number;
        latitude: number;
      };
      waypoints: any[];
    };
  };
  characteristics: {
    difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert';
    distance: number;
    duration: {
      min: number;
      max: number;
    };
    elevationGain: number;
    elevationProfile: number[];
    trailType: string;
    surface: string[];
  };
  features: {
    scenicViews: boolean;
    waterFeatures: boolean;
    wildlife: string[];
    seasonality: {
      bestMonths: number[];
      accessibleMonths: number[];
    };
  };
  safety: {
    riskLevel: number;
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
    breakdown: { [key: number]: number };
  };
  isActive: boolean;
  partitionKey: string;
  createdAt: string;
  updatedAt: string;
}

export interface TrailFilters {
  difficulty?: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  maxDistance?: number;
  maxDuration?: number;
  location?: string;
  features?: string[];
}

// Chat types
export interface Message {
  id: string;
  content: string;
  sender: 'user' | 'ai';
  timestamp: Date | string; // Allow both Date and string to handle serialization
  type?: 'text' | 'action' | 'trail-info' | 'trip-plan';
}

export interface ChatMessage {
  id: string;
  content: string;
  sender: 'user' | 'assistant';
  timestamp: string;
  type?: 'text' | 'suggestion' | 'error';
}

// API response types
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  hasNext: boolean;
}