import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { asyncHandler, createError } from '../middleware/errorHandler';

/**
 * Represents a hiking trip with all associated details.
 * @interface Trip
 */
interface Trip {
  /** Unique identifier for the trip */
  id: string;
  /** ID of the user who created the trip */
  userId: string;
  /** Display name of the trip */
  name: string;
  /** Optional detailed description of the trip */
  description?: string;
  /** ISO 8601 formatted start date */
  startDate: string;
  /** ISO 8601 formatted end date */
  endDate: string;
  /** Difficulty level of the trip */
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  /** Geographic location of the trip */
  location: {
    /** Human-readable location name */
    name: string;
    /** Latitude coordinate */
    latitude: number;
    /** Longitude coordinate */
    longitude: number;
  };
  /** ISO 8601 formatted creation timestamp */
  createdAt: string;
  /** ISO 8601 formatted last update timestamp */
  updatedAt: string;
}

// Mock data storage (in real app, this would be Azure Cosmos DB)
const mockTrips: Trip[] = [
  {
    id: '123e4567-e89b-12d3-a456-426614174000',
    userId: 'mock-user-id',
    name: 'Mount Washington Hike',
    description: 'Challenging hike to the summit of Mount Washington',
    startDate: '2024-07-15T08:00:00Z',
    endDate: '2024-07-15T18:00:00Z',
    difficulty: 'advanced',
    location: {
      name: 'Mount Washington, NH',
      latitude: 44.2706,
      longitude: -71.3033,
    },
    createdAt: '2024-01-01T10:00:00Z',
    updatedAt: '2024-01-01T10:00:00Z',
  },
];

/**
 * Controller responsible for managing hiking trip operations.
 * Provides CRUD operations for user trips including creation, retrieval, updates, and deletion.
 * Currently uses mock data storage but designed for Azure Cosmos DB integration.
 * 
 * @example
 * ```typescript
 * const tripsController = new TripsController();
 * app.get('/trips', tripsController.getAllTrips);
 * app.post('/trips', tripsController.createTrip);
 * ```
 */
export class TripsController {
  /**
   * Retrieves all trips for the authenticated user.
   * Returns trips associated with the current user's ID from the request context.
   * 
   * @param req - Express request object with authenticated user information in req.user
   * @param res - Express response object
   * @returns Promise<void> - Responds with user's trips and count
   * 
   * @example
   * ```
   * GET /trips
   * Response: {
   *   "trips": [
   *     {
   *       "id": "123e4567-e89b-12d3-a456-426614174000",
   *       "name": "Mount Washington Hike",
   *       "startDate": "2024-07-15T08:00:00Z",
   *       ...
   *     }
   *   ],
   *   "count": 1,
   *   "message": "Trips retrieved successfully"
   * }
   * ```
   * 
   * @throws Returns 401 error if user is not authenticated
   */
  public getAllTrips = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = req.user?.id;
    
    if (!userId) {
      throw createError('User not authenticated', 401);
    }

    // Filter trips by user ID
    const userTrips = mockTrips.filter(trip => trip.userId === userId);

    res.status(200).json({
      trips: userTrips,
      count: userTrips.length,
      message: 'Trips retrieved successfully',
    });
  });

  /**
   * Retrieves a specific trip by its ID for the authenticated user.
   * Ensures users can only access their own trips for security.
   * 
   * @param req - Express request object with trip ID in params and authenticated user
   * @param res - Express response object
   * @returns Promise<void> - Responds with trip details or 404 if not found
   * 
   * @example
   * ```
   * GET /trips/123e4567-e89b-12d3-a456-426614174000
   * Response: {
   *   "trip": {
   *     "id": "123e4567-e89b-12d3-a456-426614174000",
   *     "name": "Mount Washington Hike",
   *     "description": "Challenging hike to the summit...",
   *     ...
   *   },
   *   "message": "Trip retrieved successfully"
   * }
   * ```
   * 
   * @throws Returns 401 error if user is not authenticated
   * @throws Returns 404 error if trip is not found or doesn't belong to user
   */
  public getTripById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      throw createError('User not authenticated', 401);
    }

    const trip = mockTrips.find(t => t.id === id && t.userId === userId);

    if (!trip) {
      throw createError('Trip not found', 404);
    }

    res.status(200).json({
      trip,
      message: 'Trip retrieved successfully',
    });
  });

  /**
   * Creates a new trip for the authenticated user.
   * Generates a unique ID and sets creation timestamps automatically.
   * 
   * @param req - Express request object with trip data in body and authenticated user
   * @param res - Express response object
   * @returns Promise<void> - Responds with created trip data
   * 
   * @example
   * ```
   * POST /trips
   * Body: {
   *   "name": "Yosemite Adventure",
   *   "description": "Weekend hiking trip",
   *   "startDate": "2024-08-15T08:00:00Z",
   *   "endDate": "2024-08-17T18:00:00Z",
   *   "difficulty": "intermediate",
   *   "location": {
   *     "name": "Yosemite National Park, CA",
   *     "latitude": 37.8651,
   *     "longitude": -119.5383
   *   }
   * }
   * Response: {
   *   "trip": { "id": "new-uuid", ... },
   *   "message": "Trip created successfully"
   * }
   * ```
   * 
   * @throws Returns 401 error if user is not authenticated
   * @throws Returns 400 error if required trip data is missing or invalid
   */
  public createTrip = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = req.user?.id;

    if (!userId) {
      throw createError('User not authenticated', 401);
    }

    const { name, description, startDate, endDate, difficulty, location } = req.body;

    const newTrip: Trip = {
      id: uuidv4(),
      userId,
      name,
      description,
      startDate,
      endDate,
      difficulty,
      location,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // In real app, save to Azure Cosmos DB
    mockTrips.push(newTrip);

    res.status(201).json({
      trip: newTrip,
      message: 'Trip created successfully',
    });
  });

  /**
   * Updates an existing trip for the authenticated user.
   * Allows partial updates while automatically updating the modification timestamp.
   * 
   * @param req - Express request object with trip ID in params, update data in body, and authenticated user
   * @param res - Express response object
   * @returns Promise<void> - Responds with updated trip data
   * 
   * @example
   * ```
   * PUT /trips/123e4567-e89b-12d3-a456-426614174000
   * Body: {
   *   "name": "Updated Trip Name",
   *   "difficulty": "advanced"
   * }
   * Response: {
   *   "trip": { "id": "123...", "name": "Updated Trip Name", "updatedAt": "2024-01-01T12:00:00Z", ... },
   *   "message": "Trip updated successfully"
   * }
   * ```
   * 
   * @throws Returns 401 error if user is not authenticated
   * @throws Returns 404 error if trip is not found or doesn't belong to user
   */
  public updateTrip = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      throw createError('User not authenticated', 401);
    }

    const tripIndex = mockTrips.findIndex(t => t.id === id && t.userId === userId);

    if (tripIndex === -1) {
      throw createError('Trip not found', 404);
    }

    const updates = req.body;
    const existingTrip = mockTrips[tripIndex];

    // Update trip with new data
    const updatedTrip: Trip = {
      ...existingTrip,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    mockTrips[tripIndex] = updatedTrip;

    res.status(200).json({
      trip: updatedTrip,
      message: 'Trip updated successfully',
    });
  });

  /**
   * Deletes a trip for the authenticated user.
   * Permanently removes the trip from storage after verifying ownership.
   * 
   * @param req - Express request object with trip ID in params and authenticated user
   * @param res - Express response object
   * @returns Promise<void> - Responds with deletion confirmation
   * 
   * @example
   * ```
   * DELETE /trips/123e4567-e89b-12d3-a456-426614174000
   * Response: {
   *   "message": "Trip deleted successfully"
   * }
   * ```
   * 
   * @throws Returns 401 error if user is not authenticated
   * @throws Returns 404 error if trip is not found or doesn't belong to user
   */
  public deleteTrip = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      throw createError('User not authenticated', 401);
    }

    const tripIndex = mockTrips.findIndex(t => t.id === id && t.userId === userId);

    if (tripIndex === -1) {
      throw createError('Trip not found', 404);
    }

    // Remove trip from mock storage
    mockTrips.splice(tripIndex, 1);

    res.status(200).json({
      message: 'Trip deleted successfully',
    });
  });
}