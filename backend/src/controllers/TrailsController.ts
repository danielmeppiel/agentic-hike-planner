import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { TrailRepository } from '../repositories/TrailRepository';
import { DatabaseService } from '../services/database';
import type { TrailSearchFilters, TrailSearchRequest, DifficultyLevel } from '../types';

/**
 * Controller responsible for trail-related operations including search, retrieval, and recommendations.
 * Handles HTTP endpoints for discovering and accessing trail information from Azure Cosmos DB.
 * 
 * @example
 * ```typescript
 * const trailsController = new TrailsController();
 * app.get('/trails/search', trailsController.searchTrails);
 * app.get('/trails/:id', trailsController.getTrailById);
 * ```
 */
export class TrailsController {
  private trailRepository: TrailRepository | null = null;
  private databaseService: DatabaseService;

  /**
   * Creates a new TrailsController instance and initializes database connectivity.
   * Sets up Azure Cosmos DB connection and trail repository for data access.
   * 
   * @throws Will throw an error if database initialization fails
   */
  constructor() {
    // Initialize database service and repository
    this.databaseService = new DatabaseService(false); // Use real Azure database
    this.initializeRepository();
  }

  /**
   * Initializes the trail repository with Azure Cosmos DB container.
   * This method sets up the connection to the trails container for data operations.
   * 
   * @private
   * @returns Promise<void>
   * @throws Will throw an error if database service initialization fails
   */
  private async initializeRepository(): Promise<void> {
    try {
      await this.databaseService.initialize();
      const trailsContainer = this.databaseService.getContainer('trails');
      this.trailRepository = new TrailRepository(trailsContainer);
    } catch (error) {
      console.error('Failed to initialize trail repository:', error);
      throw error;
    }
  }

  /**
   * Searches for trails based on location, difficulty, and other filters.
   * Supports pagination and various search criteria to help users find suitable trails.
   * 
   * @param req - Express request object containing query parameters:
   *   - location: string - Location name for searching trails
   *   - difficulty: DifficultyLevel - Trail difficulty filter ('beginner' | 'intermediate' | 'advanced' | 'expert')
   *   - maxDistance: number - Maximum trail distance in kilometers
   *   - limit: number - Number of results per page (default: 20)
   *   - offset: number - Number of results to skip for pagination (default: 0)
   * @param res - Express response object
   * @returns Promise<void> - Responds with search results and pagination info
   * 
   * @example
   * ```
   * GET /trails/search?location=Yosemite&difficulty=intermediate&maxDistance=15&limit=10&offset=0
   * Response: {
   *   "trails": [...],
   *   "pagination": {
   *     "total": 45,
   *     "limit": 10,
   *     "offset": 0,
   *     "hasMore": true
   *   },
   *   "message": "Trails retrieved successfully"
   * }
   * ```
   * 
   * @throws Returns 500 error if search operation fails
   */
  public searchTrails = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { location, difficulty, maxDistance, limit = 20, offset = 0 } = req.query;

    console.log('Search trails request received:', { location, difficulty, maxDistance, limit, offset });

    // Ensure repository is initialized
    if (!this.trailRepository) {
      await this.initializeRepository();
    }

    // Build search request object for the repository
    const searchRequest: TrailSearchRequest = {
      query: location && typeof location === 'string' && location.trim() ? location.trim() : undefined,
      filters: {},
      sortBy: 'rating',
      sortOrder: 'desc',
      limit: parseInt(limit as string, 10) || 20,
      offset: parseInt(offset as string, 10) || 0,
    };

    // Build filters
    if (difficulty && typeof difficulty === 'string' && difficulty !== 'all') {
      searchRequest.filters!.difficulty = [difficulty as DifficultyLevel];
      console.log('Applied difficulty filter:', difficulty, 'as array:', searchRequest.filters!.difficulty);
    }
    
    if (maxDistance && typeof maxDistance === 'string') {
      const maxDist = parseFloat(maxDistance);
      if (!isNaN(maxDist)) {
        searchRequest.filters!.distance = { min: 0, max: maxDist };
      }
    }

    try {
      // Use repository to search trails in Azure Cosmos DB
      const result = await this.trailRepository!.searchTrails(searchRequest);
      
      res.status(200).json({
        trails: result.trails,
        pagination: {
          total: result.total,
          limit: searchRequest.limit,
          offset: searchRequest.offset,
          hasMore: result.hasMore,
        },
        message: 'Trails retrieved successfully',
      });
    } catch (error) {
      console.error('Error searching trails:', error);
      res.status(500).json({
        error: {
          message: 'Failed to search trails',
          statusCode: 500,
          timestamp: new Date().toISOString(),
        },
      });
    }
  });

  /**
   * Retrieves detailed information for a specific trail by its ID.
   * Returns comprehensive trail data including location, characteristics, features, and ratings.
   * 
   * @param req - Express request object with trail ID in params
   * @param res - Express response object
   * @returns Promise<void> - Responds with trail details or 404 if not found
   * 
   * @example
   * ```
   * GET /trails/123e4567-e89b-12d3-a456-426614174000
   * Response: {
   *   "trail": {
   *     "id": "123e4567-e89b-12d3-a456-426614174000",
   *     "name": "Half Dome Trail",
   *     "description": "Challenging hike with iconic cable section...",
   *     "characteristics": { "difficulty": "expert", "distance": 22.5 },
   *     ...
   *   },
   *   "message": "Trail retrieved successfully"
   * }
   * ```
   * 
   * @throws Returns 404 error if trail is not found
   * @throws Returns 500 error if retrieval operation fails
   */
  public getTrailById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;

    // Ensure repository is initialized
    if (!this.trailRepository) {
      await this.initializeRepository();
    }

    try {
      const trail = await this.trailRepository!.findById(id, id); // Using id as partitionKey for simplicity

      if (!trail) {
        res.status(404).json({
          error: {
            message: 'Trail not found',
            statusCode: 404,
            timestamp: new Date().toISOString(),
          },
        });
        return;
      }

      res.status(200).json({
        trail,
        message: 'Trail retrieved successfully',
      });
    } catch (error) {
      console.error('Error getting trail by ID:', error);
      res.status(500).json({
        error: {
          message: 'Failed to retrieve trail',
          statusCode: 500,
          timestamp: new Date().toISOString(),
        },
      });
    }
  });

  /**
   * Provides personalized trail recommendations based on user preferences and experience level.
   * Uses filtering algorithms to suggest trails that match the user's fitness level and preferences.
   * 
   * @param req - Express request object with query parameters:
   *   - difficulty: DifficultyLevel - Preferred trail difficulty
   *   - location: string - Preferred location for recommendations
   *   - experienceLevel: string - User's hiking experience level ('beginner', 'intermediate', etc.)
   * @param res - Express response object
   * @returns Promise<void> - Responds with recommended trails and algorithm metadata
   * 
   * @example
   * ```
   * GET /trails/recommendations?difficulty=intermediate&location=California&experienceLevel=beginner
   * Response: {
   *   "recommendations": [
   *     { "id": "...", "name": "Mist Trail", "difficulty": "intermediate" },
   *     ...
   *   ],
   *   "message": "Trail recommendations retrieved successfully",
   *   "meta": {
   *     "algorithm": "database-v1",
   *     "criteria": { "difficulty": "intermediate", "experienceLevel": "beginner" },
   *     "total": 25
   *   }
   * }
   * ```
   * 
   * @throws Returns 500 error if recommendation generation fails
   */
  public getRecommendations = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { difficulty, location, experienceLevel } = req.query;

    // Ensure repository is initialized
    if (!this.trailRepository) {
      await this.initializeRepository();
    }

    try {
      // Build search request for recommendations
      const searchRequest: TrailSearchRequest = {
        filters: {},
        sortBy: 'rating',
        sortOrder: 'desc',
        limit: 10,
        offset: 0,
      };

      // Apply filters based on query parameters
      if (difficulty && typeof difficulty === 'string') {
        searchRequest.filters!.difficulty = [difficulty as DifficultyLevel];
      }

      if (experienceLevel === 'beginner') {
        searchRequest.filters!.difficulty = ['beginner'];
        searchRequest.filters!.distance = { min: 0, max: 5 };
      }

      // Get recommended trails from database
      const result = await this.trailRepository!.searchTrails(searchRequest);
      
      // Limit to top 5 recommendations
      const recommendations = result.trails.slice(0, 5);

      res.status(200).json({
        recommendations,
        message: 'Trail recommendations retrieved successfully',
        meta: {
          algorithm: 'database-v1',
          criteria: { difficulty, location, experienceLevel },
          total: result.total,
        },
      });
    } catch (error) {
      console.error('Error getting trail recommendations:', error);
      res.status(500).json({
        error: {
          message: 'Failed to get trail recommendations',
          statusCode: 500,
          timestamp: new Date().toISOString(),
        },
      });
    }
  });
}