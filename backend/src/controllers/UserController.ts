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

  // Sign up placeholder
  public signUp = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { name, email, password, confirmPassword } = req.body;

    // Basic validation
    if (!name || !email || !password || !confirmPassword) {
      throw createError('All fields are required', 400);
    }

    if (password !== confirmPassword) {
      throw createError('Passwords do not match', 400);
    }

    if (password.length < 6) {
      throw createError('Password must be at least 6 characters long', 400);
    }

    // Check if user already exists
    const existingUser = mockUserProfiles.find(profile => profile.email === email);
    if (existingUser) {
      throw createError('User with this email already exists', 409);
    }

    // Create new user
    const newUser: UserProfile = {
      id: 'user-' + Date.now(),
      email,
      name,
      preferences: {
        experienceLevel: 'beginner',
        preferredDifficulty: ['beginner'],
        maxHikeDistance: 5,
        fitnessLevel: 'moderate',
      },
      statistics: {
        tripsCompleted: 0,
        totalMiles: 0,
        favoriteTrails: [],
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Add to mock database
    mockUserProfiles.push(newUser);

    res.status(201).json({
      message: 'Account created successfully',
      token: 'mock-token-' + Date.now(),
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
      },
    });
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