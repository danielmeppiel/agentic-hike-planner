import { initializeDatabaseService } from './database';
import { getRepositoryFactory } from './repositoryFactory';
import { MockDataGenerator } from './mockDataGenerator';
import { UserProfile, TripPlan, Trail, AIRecommendation } from '../types';

export interface SeedingOptions {
  users?: number;
  trails?: number;
  trips?: number;
  recommendations?: number;
  clearExisting?: boolean;
}

export interface SeedingResult {
  users: UserProfile[];
  trails: Trail[];
  trips: TripPlan[];
  recommendations: AIRecommendation[];
  summary: {
    usersCreated: number;
    trailsCreated: number;
    tripsCreated: number;
    recommendationsCreated: number;
    totalTime: number;
  };
}

/**
 * Data seeding service for development and testing
 */
export class DataSeeder {
  private mockGenerator: MockDataGenerator;
  private repositoryFactory: ReturnType<typeof getRepositoryFactory>;

  constructor() {
    this.mockGenerator = new MockDataGenerator();
    this.repositoryFactory = getRepositoryFactory();
  }

  /**
   * Seed the database with mock data
   */
  async seedDatabase(options: SeedingOptions = {}): Promise<SeedingResult> {
    const startTime = Date.now();
    
    console.log('🌱 Starting database seeding...');
    
    // Default options
    const {
      users = 10,
      trails = 50,
      trips = 20,
      recommendations = 30,
      clearExisting = false
    } = options;

    // Initialize database service
    await initializeDatabaseService();
    console.log('✅ Database service initialized');

    const result: SeedingResult = {
      users: [],
      trails: [],
      trips: [],
      recommendations: [],
      summary: {
        usersCreated: 0,
        trailsCreated: 0,
        tripsCreated: 0,
        recommendationsCreated: 0,
        totalTime: 0
      }
    };

    try {
      // Clear existing data if requested
      if (clearExisting) {
        await this.clearAllData();
        console.log('🗑️  Existing data cleared');
      }

      // Seed users
      console.log(`👥 Seeding ${users} users...`);
      result.users = await this.seedUsers(users);
      result.summary.usersCreated = result.users.length;
      console.log(`✅ Created ${result.users.length} users`);

      // Seed trails
      console.log(`🥾 Seeding ${trails} trails...`);
      result.trails = await this.seedTrails(trails);
      result.summary.trailsCreated = result.trails.length;
      console.log(`✅ Created ${result.trails.length} trails`);

      // Seed trips
      console.log(`🎒 Seeding ${trips} trips...`);
      const userIds = result.users.map(user => user.id);
      result.trips = await this.seedTrips(userIds, trips);
      result.summary.tripsCreated = result.trips.length;
      console.log(`✅ Created ${result.trips.length} trips`);

      // Seed recommendations
      console.log(`🤖 Seeding ${recommendations} recommendations...`);
      const tripIds = result.trips.map(trip => trip.id);
      const trailIds = result.trails.map(trail => trail.id);
      result.recommendations = await this.seedRecommendations(userIds, tripIds, trailIds, recommendations);
      result.summary.recommendationsCreated = result.recommendations.length;
      console.log(`✅ Created ${result.recommendations.length} recommendations`);

      const endTime = Date.now();
      result.summary.totalTime = endTime - startTime;

      console.log('🎉 Database seeding completed successfully!');
      console.log(`📊 Summary:`);
      console.log(`   Users: ${result.summary.usersCreated}`);
      console.log(`   Trails: ${result.summary.trailsCreated}`);
      console.log(`   Trips: ${result.summary.tripsCreated}`);
      console.log(`   Recommendations: ${result.summary.recommendationsCreated}`);
      console.log(`   Total time: ${result.summary.totalTime}ms`);

      return result;

    } catch (error) {
      console.error('❌ Error during database seeding:', error);
      throw error;
    }
  }

  /**
   * Seed users only
   */
  async seedUsers(count: number): Promise<UserProfile[]> {
    const userRepository = this.repositoryFactory.getUserRepository();
    const mockUsers = this.mockGenerator.generateUsers(count);
    
    const users: UserProfile[] = [];
    
    for (const mockUser of mockUsers) {
      try {
        const user = await userRepository.create(mockUser);
        users.push(user);
      } catch (error) {
        console.error(`Failed to create user ${mockUser.email}:`, error);
      }
    }
    
    return users;
  }

  /**
   * Seed trails only
   */
  async seedTrails(count: number): Promise<Trail[]> {
    const trailRepository = this.repositoryFactory.getTrailRepository();
    const mockTrails = this.mockGenerator.generateTrails(count);
    
    const trails: Trail[] = [];
    
    // Use batch creation for better performance
    const batchSize = 10;
    for (let i = 0; i < mockTrails.length; i += batchSize) {
      const batch = mockTrails.slice(i, i + batchSize);
      try {
        const batchResults = await trailRepository.batchCreate(batch);
        trails.push(...batchResults);
      } catch (error) {
        console.error(`Failed to create trail batch ${i}-${i + batch.length}:`, error);
        
        // Try individual creation as fallback
        for (const mockTrail of batch) {
          try {
            const trail = await trailRepository.create(mockTrail);
            trails.push(trail);
          } catch (individualError) {
            console.error(`Failed to create trail ${mockTrail.name}:`, individualError);
          }
        }
      }
    }
    
    return trails;
  }

  /**
   * Seed trips only
   */
  async seedTrips(userIds: string[], count: number): Promise<TripPlan[]> {
    const tripRepository = this.repositoryFactory.getTripRepository();
    const mockTrips = this.mockGenerator.generateTrips(userIds, count);
    
    const trips: TripPlan[] = [];
    
    for (const mockTrip of mockTrips) {
      try {
        const trip = await tripRepository.create(mockTrip);
        trips.push(trip);
      } catch (error) {
        console.error(`Failed to create trip ${mockTrip.title}:`, error);
      }
    }
    
    return trips;
  }

  /**
   * Seed recommendations only
   */
  async seedRecommendations(
    userIds: string[], 
    tripIds: string[], 
    trailIds: string[], 
    count: number
  ): Promise<AIRecommendation[]> {
    const recommendationRepository = this.repositoryFactory.getRecommendationRepository();
    const mockRecommendations = this.mockGenerator.generateRecommendations(userIds, tripIds, trailIds, count);
    
    const recommendations: AIRecommendation[] = [];
    
    for (const mockRecommendation of mockRecommendations) {
      try {
        const recommendation = await recommendationRepository.create(mockRecommendation);
        recommendations.push(recommendation);
      } catch (error) {
        console.error(`Failed to create recommendation for user ${mockRecommendation.userId}:`, error);
      }
    }
    
    return recommendations;
  }

  /**
   * Clear all data from the database
   */
  async clearAllData(): Promise<void> {
    console.log('🗑️  Clearing all existing data...');
    
    const repositories = this.repositoryFactory.getAllRepositories();
    
    try {
      // Note: This is a simplified approach for development
      // In production, you might want more sophisticated cleanup
      
      // Clear recommendations (they have TTL, but we'll clear them anyway)
      await this.clearContainer(repositories.recommendationRepository, 'recommendations');
      
      // Clear trips
      await this.clearContainer(repositories.tripRepository, 'trips');
      
      // Clear trails
      await this.clearContainer(repositories.trailRepository, 'trails');
      
      // Clear users
      await this.clearContainer(repositories.userRepository, 'users');
      
    } catch (error) {
      console.error('Error clearing data:', error);
      throw error;
    }
  }

  /**
   * Helper method to clear a container
   */
  private async clearContainer(repository: any, containerName: string): Promise<void> {
    try {
      // Get all items and delete them
      // This is a simple approach for development - in production you might use bulk operations
      const queryResult = await repository.query({ query: 'SELECT c.id, c.partitionKey FROM c' });
      
      let deletedCount = 0;
      for (const item of queryResult.items) {
        try {
          await repository.delete(item.id, item.partitionKey);
          deletedCount++;
        } catch (error) {
          console.warn(`Failed to delete item ${item.id} from ${containerName}:`, error);
        }
      }
      
      if (deletedCount > 0) {
        console.log(`   Deleted ${deletedCount} items from ${containerName}`);
      }
    } catch (error) {
      console.warn(`Error clearing ${containerName}:`, error);
    }
  }

  /**
   * Get seeding statistics
   */
  async getSeedingStatistics(): Promise<{
    users: number;
    trails: number;
    trips: number;
    recommendations: number;
    activeRecommendations: number;
  }> {
    const repositories = this.repositoryFactory.getAllRepositories();
    
    try {
      // Count all items in each container
      const [userCount, trailCount, tripCount, recommendationCount] = await Promise.all([
        repositories.userRepository.count({ query: 'SELECT VALUE COUNT(1) FROM c' }),
        repositories.trailRepository.count({ query: 'SELECT VALUE COUNT(1) FROM c' }),
        repositories.tripRepository.count({ query: 'SELECT VALUE COUNT(1) FROM c' }),
        repositories.recommendationRepository.count({ query: 'SELECT VALUE COUNT(1) FROM c' })
      ]);

      // Count active recommendations
      const now = new Date();
      const activeRecommendationCount = await repositories.recommendationRepository.count({
        query: 'SELECT VALUE COUNT(1) FROM c WHERE c.expiresAt > @now',
        parameters: [{ name: '@now', value: now.toISOString() }]
      });

      return {
        users: userCount,
        trails: trailCount,
        trips: tripCount,
        recommendations: recommendationCount,
        activeRecommendations: activeRecommendationCount
      };
    } catch (error) {
      console.error('Error getting seeding statistics:', error);
      throw error;
    }
  }

  /**
   * Validate seeded data integrity
   */
  async validateSeedData(): Promise<{
    isValid: boolean;
    issues: string[];
    statistics: any;
  }> {
    const issues: string[] = [];
    const repositories = this.repositoryFactory.getAllRepositories();

    try {
      // Get statistics
      const stats = await this.getSeedingStatistics();

      // Validation checks
      
      // Check if users have valid emails
      const usersResult = await repositories.userRepository.query({ 
        query: 'SELECT c.id, c.email FROM c WHERE NOT IS_DEFINED(c.email) OR c.email = ""' 
      });
      if (usersResult.items.length > 0) {
        issues.push(`${usersResult.items.length} users have invalid emails`);
      }

      // Check if trails have valid coordinates
      const trailsResult = await repositories.trailRepository.query({
        query: 'SELECT c.id, c.name FROM c WHERE NOT IS_DEFINED(c.location.coordinates.start.latitude)'
      });
      if (trailsResult.items.length > 0) {
        issues.push(`${trailsResult.items.length} trails have invalid coordinates`);
      }

      // Check if trips have valid date ranges
      const tripsResult = await repositories.tripRepository.query({
        query: 'SELECT c.id, c.title FROM c WHERE c.dates.endDate <= c.dates.startDate'
      });
      if (tripsResult.items.length > 0) {
        issues.push(`${tripsResult.items.length} trips have invalid date ranges`);
      }

      // Check if recommendations are not expired
      const now = new Date();
      const expiredRecsResult = await repositories.recommendationRepository.query({
        query: 'SELECT c.id FROM c WHERE c.expiresAt <= @now',
        parameters: [{ name: '@now', value: now.toISOString() }]
      });
      if (expiredRecsResult.items.length > 0) {
        issues.push(`${expiredRecsResult.items.length} recommendations are already expired`);
      }

      return {
        isValid: issues.length === 0,
        issues,
        statistics: stats
      };

    } catch (error) {
      console.error('Error validating seed data:', error);
      return {
        isValid: false,
        issues: [`Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`],
        statistics: null
      };
    }
  }
}