import { Request, Response } from 'express';
import { asyncHandler, createError } from '../middleware/errorHandler';

interface UserProfile {
  id: string;
  email: string;
  name: string;
  preferences: {
    experienceLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert';
    preferredDifficulty: ('beginner' | 'intermediate' | 'advanced' | 'expert')[];
    maxHikeDistance: number;
    fitnessLevel: 'low' | 'moderate' | 'high' | 'very_high';
  };
  statistics: {
    tripsCompleted: number;
    totalMiles: number;
    favoriteTrails: string[];
  };
  createdAt: string;
  updatedAt: string;
}

// Mock user data
const mockUserProfiles: UserProfile[] = [
  {
    id: 'mock-user-id',
    email: 'user@example.com',
    name: 'Mock User',
    preferences: {
      experienceLevel: 'intermediate',
      preferredDifficulty: ['intermediate', 'advanced'],
      maxHikeDistance: 12,
      fitnessLevel: 'high',
    },
    statistics: {
      tripsCompleted: 15,
      totalMiles: 127.5,
      favoriteTrails: ['trail-001', 'trail-002'],
    },
    createdAt: '2023-06-01T10:00:00Z',
    updatedAt: '2024-01-15T14:30:00Z',
  },
];

export class UserController {
  // Get user profile
  public getProfile = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = req.user?.id;

    if (!userId) {
      throw createError('User not authenticated', 401);
    }

    const userProfile = mockUserProfiles.find(profile => profile.id === userId);

    if (!userProfile) {
      throw createError('User profile not found', 404);
    }

    res.status(200).json({
      profile: userProfile,
      message: 'User profile retrieved successfully',
    });
  });

  // Update user profile
  public updateProfile = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = req.user?.id;

    if (!userId) {
      throw createError('User not authenticated', 401);
    }

    const profileIndex = mockUserProfiles.findIndex(profile => profile.id === userId);

    if (profileIndex === -1) {
      throw createError('User profile not found', 404);
    }

    const updates = req.body;
    const existingProfile = mockUserProfiles[profileIndex];

    // Update profile with new data
    const updatedProfile: UserProfile = {
      ...existingProfile,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    mockUserProfiles[profileIndex] = updatedProfile;

    res.status(200).json({
      profile: updatedProfile,
      message: 'User profile updated successfully',
    });
  });

  // Get user statistics
  public getStatistics = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = req.user?.id;

    if (!userId) {
      throw createError('User not authenticated', 401);
    }

    const userProfile = mockUserProfiles.find(profile => profile.id === userId);

    if (!userProfile) {
      throw createError('User profile not found', 404);
    }

    res.status(200).json({
      statistics: userProfile.statistics,
      message: 'User statistics retrieved successfully',
    });
  });

  // Update user preferences
  public updatePreferences = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = req.user?.id;

    if (!userId) {
      throw createError('User not authenticated', 401);
    }

    const profileIndex = mockUserProfiles.findIndex(profile => profile.id === userId);

    if (profileIndex === -1) {
      throw createError('User profile not found', 404);
    }

    const { preferences } = req.body;
    const existingProfile = mockUserProfiles[profileIndex];

    // Update preferences
    const updatedProfile: UserProfile = {
      ...existingProfile,
      preferences: {
        ...existingProfile.preferences,
        ...preferences,
      },
      updatedAt: new Date().toISOString(),
    };

    mockUserProfiles[profileIndex] = updatedProfile;

    res.status(200).json({
      preferences: updatedProfile.preferences,
      message: 'User preferences updated successfully',
    });
  });
}

export class AuthController {
  // Login placeholder (for Azure AD B2C integration)
  public login = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { email, password } = req.body;

    // TODO: Implement Azure AD B2C authentication
    // For now, return mock response
    if (email === 'user@example.com' && password === 'password') {
      res.status(200).json({
        message: 'Login successful',
        token: 'mock-valid-token',
        user: {
          id: 'mock-user-id',
          email: 'user@example.com',
          name: 'Mock User',
        },
      });
    } else {
      throw createError('Invalid credentials', 401);
    }
  });

  // Signup placeholder (for Azure AD B2C integration)
  public signup = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { email, password, name, preferences } = req.body;

    // TODO: Implement Azure AD B2C user registration
    // For now, return mock response for any signup attempt
    if (email && password && name) {
      const userId = 'user-' + Math.random().toString(36).substr(2, 9);
      const token = 'mock-token-' + Math.random().toString(36).substr(2, 9);
      
      res.status(201).json({
        message: 'Signup successful',
        token: token,
        user: {
          id: userId,
          email: email,
          name: name,
          preferences: preferences || {
            experienceLevel: 'intermediate',
            preferredDifficulty: ['intermediate'],
            maxHikeDistance: 10,
            fitnessLevel: 'moderate',
          },
        },
      });
    } else {
      throw createError('Email, password, and name are required', 400);
    }
  });

  // Logout placeholder
  public logout = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    // TODO: Implement proper token invalidation with Azure AD B2C
    res.status(200).json({
      message: 'Logout successful',
    });
  });

  // Token refresh placeholder
  public refreshToken = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    // TODO: Implement token refresh with Azure AD B2C
    res.status(200).json({
      message: 'Token refresh successful',
      token: 'mock-valid-token-refreshed',
    });
  });
}