import { Request, Response } from 'express';
import { asyncHandler, createError } from '../middleware/errorHandler';

/**
 * Represents a user's profile with hiking preferences and statistics.
 * @interface UserProfile
 */
interface UserProfile {
  /** Unique user identifier */
  id: string;
  /** User's email address */
  email: string;
  /** User's display name */
  name: string;
  /** User's hiking preferences and settings */
  preferences: {
    /** User's self-reported experience level */
    experienceLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert';
    /** Preferred difficulty levels for trail recommendations */
    preferredDifficulty: ('beginner' | 'intermediate' | 'advanced' | 'expert')[];
    /** Maximum hiking distance preference in kilometers */
    maxHikeDistance: number;
    /** User's fitness level assessment */
    fitnessLevel: 'low' | 'moderate' | 'high' | 'very_high';
  };
  /** User's hiking statistics and achievements */
  statistics: {
    /** Total number of completed trips */
    tripsCompleted: number;
    /** Total distance hiked in kilometers */
    totalMiles: number;
    /** List of favorite trail IDs */
    favoriteTrails: string[];
  };
  /** ISO 8601 formatted account creation timestamp */
  createdAt: string;
  /** ISO 8601 formatted last profile update timestamp */
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

/**
 * Controller responsible for user profile management and authentication operations.
 * Handles user profile CRUD operations, preferences, and statistics.
 * Currently uses mock data but designed for Azure Cosmos DB integration.
 * 
 * @example
 * ```typescript
 * const userController = new UserController();
 * app.get('/user/profile', userController.getProfile);
 * app.put('/user/profile', userController.updateProfile);
 * ```
 */
export class UserController {
  /**
   * Retrieves the authenticated user's profile information.
   * Returns complete profile including preferences and statistics.
   * 
   * @param req - Express request object with authenticated user information
   * @param res - Express response object
   * @returns Promise<void> - Responds with user profile data
   * 
   * @example
   * ```
   * GET /user/profile
   * Response: {
   *   "profile": {
   *     "id": "mock-user-id",
   *     "email": "user@example.com",
   *     "name": "Mock User",
   *     "preferences": {
   *       "experienceLevel": "intermediate",
   *       "preferredDifficulty": ["intermediate", "advanced"],
   *       "maxHikeDistance": 12,
   *       "fitnessLevel": "high"
   *     },
   *     "statistics": {
   *       "tripsCompleted": 15,
   *       "totalMiles": 127.5,
   *       "favoriteTrails": ["trail-001", "trail-002"]
   *     }
   *   },
   *   "message": "User profile retrieved successfully"
   * }
   * ```
   * 
   * @throws Returns 401 error if user is not authenticated
   * @throws Returns 404 error if user profile is not found
   */
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

  /**
   * Updates the authenticated user's profile information.
   * Allows partial updates and automatically updates the modification timestamp.
   * 
   * @param req - Express request object with profile updates in body and authenticated user
   * @param res - Express response object
   * @returns Promise<void> - Responds with updated profile data
   * 
   * @example
   * ```
   * PUT /user/profile
   * Body: {
   *   "name": "Updated Name",
   *   "preferences": {
   *     "experienceLevel": "advanced",
   *     "maxHikeDistance": 20
   *   }
   * }
   * Response: {
   *   "profile": {
   *     "id": "mock-user-id",
   *     "name": "Updated Name",
   *     "preferences": { "experienceLevel": "advanced", ... },
   *     "updatedAt": "2024-01-01T12:00:00Z",
   *     ...
   *   },
   *   "message": "User profile updated successfully"
   * }
   * ```
   * 
   * @throws Returns 401 error if user is not authenticated
   * @throws Returns 404 error if user profile is not found
   */
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

  /**
   * Retrieves the authenticated user's hiking statistics.
   * Returns activity metrics like completed trips, total distance, and favorite trails.
   * 
   * @param req - Express request object with authenticated user information
   * @param res - Express response object
   * @returns Promise<void> - Responds with user statistics
   * 
   * @example
   * ```
   * GET /user/statistics
   * Response: {
   *   "statistics": {
   *     "tripsCompleted": 15,
   *     "totalMiles": 127.5,
   *     "favoriteTrails": ["trail-001", "trail-002"]
   *   },
   *   "message": "User statistics retrieved successfully"
   * }
   * ```
   * 
   * @throws Returns 401 error if user is not authenticated
   * @throws Returns 404 error if user profile is not found
   */
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

  /**
   * Updates the authenticated user's hiking preferences.
   * Allows updating specific preference settings while preserving other profile data.
   * 
   * @param req - Express request object with preferences object in body and authenticated user
   * @param res - Express response object
   * @returns Promise<void> - Responds with updated preferences
   * 
   * @example
   * ```
   * PUT /user/preferences
   * Body: {
   *   "preferences": {
   *     "experienceLevel": "expert",
   *     "preferredDifficulty": ["advanced", "expert"],
   *     "maxHikeDistance": 25,
   *     "fitnessLevel": "very_high"
   *   }
   * }
   * Response: {
   *   "preferences": {
   *     "experienceLevel": "expert",
   *     "preferredDifficulty": ["advanced", "expert"],
   *     "maxHikeDistance": 25,
   *     "fitnessLevel": "very_high"
   *   },
   *   "message": "User preferences updated successfully"
   * }
   * ```
   * 
   * @throws Returns 401 error if user is not authenticated
   * @throws Returns 404 error if user profile is not found
   */
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

/**
 * Controller responsible for user authentication operations.
 * Handles login, logout, and token management with Azure AD B2C integration.
 * Currently provides mock implementation for development purposes.
 * 
 * @example
 * ```typescript
 * const authController = new AuthController();
 * app.post('/auth/login', authController.login);
 * app.post('/auth/logout', authController.logout);
 * ```
 */
export class AuthController {
  /**
   * Authenticates a user with email and password.
   * Currently provides mock authentication pending Azure AD B2C integration.
   * 
   * @param req - Express request object with login credentials in body
   * @param res - Express response object
   * @returns Promise<void> - Responds with authentication token and user info
   * 
   * @example
   * ```
   * POST /auth/login
   * Body: {
   *   "email": "user@example.com",
   *   "password": "password"
   * }
   * Response: {
   *   "message": "Login successful",
   *   "token": "mock-valid-token",
   *   "user": {
   *     "id": "mock-user-id",
   *     "email": "user@example.com",
   *     "name": "Mock User"
   *   }
   * }
   * ```
   * 
   * @throws Returns 401 error if credentials are invalid
   */
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

  /**
   * Logs out the authenticated user and invalidates their session.
   * Currently provides mock logout pending Azure AD B2C integration.
   * 
   * @param req - Express request object with authenticated user
   * @param res - Express response object
   * @returns Promise<void> - Responds with logout confirmation
   * 
   * @example
   * ```
   * POST /auth/logout
   * Response: {
   *   "message": "Logout successful"
   * }
   * ```
   */
  public logout = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    // TODO: Implement proper token invalidation with Azure AD B2C
    res.status(200).json({
      message: 'Logout successful',
    });
  });

  /**
   * Refreshes an expired authentication token.
   * Currently provides mock token refresh pending Azure AD B2C integration.
   * 
   * @param req - Express request object with refresh token
   * @param res - Express response object
   * @returns Promise<void> - Responds with new authentication token
   * 
   * @example
   * ```
   * POST /auth/refresh
   * Response: {
   *   "message": "Token refresh successful",
   *   "token": "mock-valid-token-refreshed"
   * }
   * ```
   */
  public refreshToken = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    // TODO: Implement token refresh with Azure AD B2C
    res.status(200).json({
      message: 'Token refresh successful',
      token: 'mock-valid-token-refreshed',
    });
  });
}