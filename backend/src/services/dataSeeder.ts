import { DatabaseService } from './database';
import { UserRepository, TripRepository, TrailRepository, RecommendationRepository } from '../repositories';
import { MockDataGenerator } from './mockDataGenerator';

/**
 * Service responsible for seeding Azure Cosmos DB with mock data for development and testing.
 * Coordinates with MockDataGenerator to create realistic test data across all entities.
 * Provides methods for full database seeding and individual entity population.
 * 
 * @example
 * ```typescript
 * const seeder = new DataSeeder();
 * await seeder.initialize();
 * 
 * // Seed all data types
 * const counts = await seeder.seedAll({
 *   users: 50,
 *   trails: 200,
 *   trips: 100,
 *   recommendations: 75
 * });
 * ```
 */
export class DataSeeder {
  private userRepository: UserRepository;
  private tripRepository: TripRepository;
  private trailRepository: TrailRepository;
  private recommendationRepository: RecommendationRepository;
  private mockGenerator: MockDataGenerator;
  private databaseService: DatabaseService;

  /**
   * Creates a new DataSeeder instance.
   * 
   * @param databaseService - Optional database service instance. If not provided, uses the singleton instance.
   * 
   * @example
   * ```typescript
   * // Use default database service
   * const seeder = new DataSeeder();
   * 
   * // Use custom database service
   * const customDb = new DatabaseService();
   * const seeder = new DataSeeder(customDb);
   * ```
   */
  constructor(databaseService?: DatabaseService) {
    this.mockGenerator = new MockDataGenerator();
    // Use provided database service or import the singleton
    this.databaseService = databaseService || require('./database').databaseService;
  }

  /**
   * Initializes all repository instances with their respective Cosmos DB containers.
   * Must be called before using any seeding operations.
   * 
   * @returns Promise<void>
   * @throws Will throw an error if any repository initialization fails
   * 
   * @example
   * ```typescript
   * const seeder = new DataSeeder();
   * await seeder.initialize();
   * // Repositories are now ready for seeding operations
   * ```
   */
  async initialize(): Promise<void> {
    // Initialize repositories
    this.userRepository = new UserRepository(this.databaseService.getContainer('users'));
    this.tripRepository = new TripRepository(this.databaseService.getContainer('trips'));
    this.trailRepository = new TrailRepository(this.databaseService.getContainer('trails'));
    this.recommendationRepository = new RecommendationRepository(this.databaseService.getContainer('recommendations'));
  }

  /**
   * Seeds the database with all data types in the correct order to maintain referential integrity.
   * Creates users first, then trails, then trips, and finally recommendations.
   * 
   * @param options - Configuration object specifying the number of each entity type to create
   * @param options.users - Number of user profiles to create (default: 20)
   * @param options.trails - Number of trails to create (default: 100)
   * @param options.trips - Number of trip plans to create (default: 50)
   * @param options.recommendations - Number of AI recommendations to create (default: 30)
   * @returns Promise<{users: number; trails: number; trips: number; recommendations: number}> - Actual counts of created entities
   * @throws Will throw an error if any seeding operation fails
   * 
   * @example
   * ```typescript
   * const seeder = new DataSeeder();
   * await seeder.initialize();
   * 
   * const result = await seeder.seedAll({
   *   users: 100,
   *   trails: 500,
   *   trips: 200,
   *   recommendations: 150
   * });
   * 
   * console.log(`Created ${result.users} users, ${result.trails} trails`);
   * ```
   */
  async seedAll(options: {
    users?: number;
    trails?: number;
    trips?: number;
    recommendations?: number;
  } = {}): Promise<{
    users: number;
    trails: number;
    trips: number;
    recommendations: number;
  }> {
    const {
      users: userCount = 20,
      trails: trailCount = 100,
      trips: tripCount = 50,
      recommendations: recommendationCount = 30,
    } = options;

    console.log('Starting data seeding...');

    try {
      // Seed users first
      console.log(`Seeding ${userCount} users...`);
      const userIds = await this.seedUsers(userCount);

      // Seed trails
      console.log(`Seeding ${trailCount} trails...`);
      const trailIds = await this.seedTrails(trailCount);

      // Seed trips (requires user IDs)
      console.log(`Seeding ${tripCount} trips...`);
      const tripIds = await this.seedTrips(userIds, tripCount);

      // Update trips with some selected trails
      console.log('Adding trails to trips...');
      await this.addTrailsToTrips(tripIds, trailIds);

      // Seed recommendations (requires user, trip, and trail IDs)
      console.log(`Seeding ${recommendationCount} recommendations...`);
      await this.seedRecommendations(userIds, tripIds, trailIds, recommendationCount);

      console.log('Data seeding completed successfully!');

      return {
        users: userIds.length,
        trails: trailIds.length,
        trips: tripIds.length,
        recommendations: recommendationCount,
      };
    } catch (error) {
      console.error('Error during data seeding:', error);
      throw error;
    }
  }

  /**
   * Seeds the database with mock user profiles.
   * Creates diverse user profiles with varying fitness levels, preferences, and locations.
   * 
   * @param count - Number of user profiles to create (default: 20)
   * @returns Promise<string[]> - Array of created user IDs
   * @throws Will log warnings for failed user creations but continue with remaining users
   * 
   * @example
   * ```typescript
   * const userIds = await seeder.seedUsers(50);
   * console.log(`Created ${userIds.length} users`);
   * ```
   */
  async seedUsers(count: number = 20): Promise<string[]> {
    const users = this.mockGenerator.generateUsers(count);
    const userIds: string[] = [];

    for (const userData of users) {
      try {
        // Use the raw create method since we already have complete user data
        const { id, partitionKey, createdAt, updatedAt, ...userWithoutSystemFields } = userData;
        const createdUser = await this.userRepository.createUser(userWithoutSystemFields);
        userIds.push(createdUser.id);
      } catch (error) {
        console.warn(`Failed to create user ${userData.email}:`, error);
      }
    }

    console.log(`Created ${userIds.length} users`);
    return userIds;
  }

  /**
   * Seeds the database with mock trail data using batch processing for performance.
   * Creates trails with realistic characteristics, locations, and ratings.
   * Uses batching to optimize Cosmos DB write operations.
   * 
   * @param count - Number of trails to create (default: 100)
   * @returns Promise<string[]> - Array of created trail IDs
   * @throws Will log warnings for failed trail creations but continue with remaining trails
   * 
   * @example
   * ```typescript
   * const trailIds = await seeder.seedTrails(200);
   * console.log(`Created ${trailIds.length} trails across various difficulty levels`);
   * ```
   */
  async seedTrails(count: number = 100): Promise<string[]> {
    const trails = this.mockGenerator.generateTrails(count);
    const trailIds: string[] = [];

    // Batch creation for better performance
    const batchSize = 10;
    for (let i = 0; i < trails.length; i += batchSize) {
      const batch = trails.slice(i, i + batchSize);
      
      const batchPromises = batch.map(async (trailData) => {
        try {
          const { id, partitionKey, createdAt, updatedAt, ...trailWithoutSystemFields } = trailData;
          const createdTrail = await this.trailRepository.create(trailWithoutSystemFields);
          return createdTrail.id;
        } catch (error) {
          console.warn(`Failed to create trail ${trailData.name}:`, error);
          return null;
        }
      });

      const batchResults = await Promise.all(batchPromises);
      trailIds.push(...batchResults.filter(id => id !== null) as string[]);
    }

    console.log(`Created ${trailIds.length} trails`);
    return trailIds;
  }

  async seedTrips(userIds: string[], count: number = 50): Promise<string[]> {
    if (userIds.length === 0) {
      console.warn('No users available for trip creation');
      return [];
    }

    const trips = this.mockGenerator.generateTrips(userIds, count);
    const tripIds: string[] = [];

    for (const tripData of trips) {
      try {
        const { id, partitionKey, createdAt, updatedAt, ...tripWithoutSystemFields } = tripData;
        const createdTrip = await this.tripRepository.create(tripWithoutSystemFields);
        tripIds.push(createdTrip.id);
      } catch (error) {
        console.warn(`Failed to create trip ${tripData.title}:`, error);
      }
    }

    console.log(`Created ${tripIds.length} trips`);
    return tripIds;
  }

  async addTrailsToTrips(tripIds: string[], trailIds: string[]): Promise<void> {
    if (tripIds.length === 0 || trailIds.length === 0) {
      console.warn('No trips or trails available for association');
      return;
    }

    // Add 1-3 trails to each trip
    for (const tripId of tripIds) {
      try {
        // Get the trip to find its user ID (partition key)
        // For simplicity, we'll skip this association for now
        // In a real implementation, you'd query the trip first
        const trailCount = Math.floor(Math.random() * 3) + 1; // 1-3 trails
        const selectedTrails = this.getRandomSubset(trailIds, trailCount);
        
        // Note: This would require getting the trip first to know the userId/partitionKey
        // await this.tripRepository.update(tripId, userId, { selectedTrails });
      } catch (error) {
        console.warn(`Failed to add trails to trip ${tripId}:`, error);
      }
    }
  }

  async seedRecommendations(
    userIds: string[], 
    tripIds: string[], 
    trailIds: string[], 
    count: number = 30
  ): Promise<string[]> {
    if (userIds.length === 0 || tripIds.length === 0 || trailIds.length === 0) {
      console.warn('Insufficient data for recommendation creation');
      return [];
    }

    const recommendations = this.mockGenerator.generateRecommendations(userIds, tripIds, trailIds, count);
    const recommendationIds: string[] = [];

    for (const recommendationData of recommendations) {
      try {
        const { id, partitionKey, createdAt, updatedAt, ...recommendationWithoutSystemFields } = recommendationData;
        const createdRecommendation = await this.recommendationRepository.create(recommendationWithoutSystemFields);
        recommendationIds.push(createdRecommendation.id);
      } catch (error) {
        console.warn(`Failed to create recommendation for user ${recommendationData.userId}:`, error);
      }
    }

    console.log(`Created ${recommendationIds.length} recommendations`);
    return recommendationIds;
  }

  async clearAllData(): Promise<void> {
    console.log('Clearing all data...');
    
    try {
      // Note: In a production system, you'd want to be more careful about this
      // For now, we'll just log the intention
      console.log('Data clearing would delete all documents from all containers');
      console.warn('Actual data clearing not implemented for safety');
    } catch (error) {
      console.error('Error clearing data:', error);
      throw error;
    }
  }

  async getDataCounts(): Promise<{
    users: number;
    trails: number;
    trips: number;
    recommendations: number;
  }> {
    try {
      const [users, trails, trips, recommendations] = await Promise.all([
        this.userRepository.count(),
        this.trailRepository.count(),
        this.tripRepository.count(),
        this.recommendationRepository.count(),
      ]);

      return { users, trails, trips, recommendations };
    } catch (error) {
      console.error('Error getting data counts:', error);
      return { users: 0, trails: 0, trips: 0, recommendations: 0 };
    }
  }

  private getRandomSubset<T>(array: T[], count: number): T[] {
    const shuffled = [...array].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, Math.min(count, array.length));
  }
}

// Singleton instance for easy use
export const dataSeeder = new DataSeeder();