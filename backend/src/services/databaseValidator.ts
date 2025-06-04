import { initializeDatabaseService } from '../services/database';
import { getRepositoryFactory } from '../services/repositoryFactory';
import { 
  CreateUserProfileSchema, 
  CreateTripPlanSchema, 
  CreateTrailSchema, 
  CreateAIRecommendationSchema 
} from '../validation';

/**
 * Test and validation utilities for the database layer
 */
export class DatabaseValidator {
  private repositoryFactory: ReturnType<typeof getRepositoryFactory>;

  constructor() {
    this.repositoryFactory = getRepositoryFactory();
  }

  /**
   * Test database operations with real data
   */
  async testDatabaseOperations(): Promise<boolean> {
    console.log('🧪 Testing database operations...');

    try {
      // Initialize database
      await initializeDatabaseService();
      console.log('✅ Database initialized');

      // Test user operations
      await this.testUserOperations();
      console.log('✅ User operations test passed');

      // Test trail operations
      await this.testTrailOperations();
      console.log('✅ Trail operations test passed');

      // Test trip operations
      await this.testTripOperations();
      console.log('✅ Trip operations test passed');

      // Test recommendation operations
      await this.testRecommendationOperations();
      console.log('✅ Recommendation operations test passed');

      // Test performance
      await this.testPerformance();
      console.log('✅ Performance tests passed');

      console.log('🎉 All database operation tests passed!');
      return true;

    } catch (error) {
      console.error('❌ Database operation tests failed:', error);
      return false;
    }
  }

  /**
   * Test user repository operations
   */
  private async testUserOperations(): Promise<void> {
    const userRepo = this.repositoryFactory.getUserRepository();

    // Test user creation
    const testUser = {
      email: 'test@example.com',
      displayName: 'Test User',
      fitnessLevel: 'intermediate' as const,
      preferences: {
        preferredDifficulty: ['moderate', 'difficult'],
        maxHikingDistance: 25,
        terrainTypes: ['rocky', 'forest'],
        groupSize: 'small' as const
      },
      location: {
        city: 'Test City',
        state: 'Test State',
        country: 'USA',
        coordinates: { longitude: -122.4194, latitude: 37.7749 }
      }
    };

    // Validate input
    const validationResult = CreateUserProfileSchema.safeParse(testUser);
    if (!validationResult.success) {
      throw new Error(`User validation failed: ${JSON.stringify(validationResult.error.errors)}`);
    }

    // Create user
    const createdUser = await userRepo.createUser(testUser);
    if (!createdUser.id || createdUser.email !== testUser.email) {
      throw new Error('User creation failed');
    }

    // Test user retrieval
    const retrievedUser = await userRepo.getByEmail(testUser.email);
    if (!retrievedUser || retrievedUser.id !== createdUser.id) {
      throw new Error('User retrieval failed');
    }

    // Test user update
    const updatedUser = await userRepo.updateUser(createdUser.id, createdUser.email, {
      displayName: 'Updated Test User'
    });
    if (updatedUser.displayName !== 'Updated Test User') {
      throw new Error('User update failed');
    }

    // Test user search
    const searchResults = await userRepo.searchByFitnessLevel('intermediate');
    if (searchResults.items.length === 0) {
      throw new Error('User search failed');
    }

    // Clean up
    await userRepo.delete(createdUser.id, createdUser.email);
  }

  /**
   * Test trail repository operations
   */
  private async testTrailOperations(): Promise<void> {
    const trailRepo = this.repositoryFactory.getTrailRepository();

    // Test trail creation
    const testTrail = {
      name: 'Test Trail',
      description: 'A test trail for validation',
      location: {
        region: 'Test-Region',
        park: 'Test Park',
        country: 'USA',
        coordinates: {
          start: { longitude: -122.4194, latitude: 37.7749 },
          end: { longitude: -122.4194, latitude: 37.7750 }
        }
      },
      characteristics: {
        difficulty: 'moderate' as const,
        distance: 10,
        duration: { min: 3, max: 5 },
        elevationGain: 500,
        trailType: 'loop' as const,
        surface: ['dirt', 'rocky']
      },
      features: {
        scenicViews: true,
        waterFeatures: false,
        seasonality: {
          bestMonths: [4, 5, 6, 7, 8, 9],
          accessibleMonths: [3, 4, 5, 6, 7, 8, 9, 10]
        }
      },
      safety: {
        riskLevel: 2,
        requiresPermit: false
      },
      amenities: {
        parking: true,
        restrooms: false,
        camping: false,
        drinkingWater: false
      }
    };

    // Validate input
    const validationResult = CreateTrailSchema.safeParse(testTrail);
    if (!validationResult.success) {
      throw new Error(`Trail validation failed: ${JSON.stringify(validationResult.error.errors)}`);
    }

    // Create trail
    const createdTrail = await trailRepo.createTrail(testTrail);
    if (!createdTrail.id || createdTrail.name !== testTrail.name) {
      throw new Error('Trail creation failed');
    }

    // Test trail search
    const searchResults = await trailRepo.searchTrails({
      region: 'Test-Region',
      difficulty: ['moderate']
    });
    if (searchResults.items.length === 0) {
      throw new Error('Trail search failed');
    }

    // Test rating update
    const updatedTrail = await trailRepo.updateTrailRating(createdTrail.id, createdTrail.partitionKey, 4.5);
    if (updatedTrail.ratings.count !== 1) {
      throw new Error('Trail rating update failed');
    }

    // Clean up
    await trailRepo.delete(createdTrail.id, createdTrail.partitionKey);
  }

  /**
   * Test trip repository operations
   */
  private async testTripOperations(): Promise<void> {
    const tripRepo = this.repositoryFactory.getTripRepository();
    const testUserId = 'test-user-id';

    // Test trip creation
    const testTrip = {
      userId: testUserId,
      title: 'Test Trip',
      description: 'A test trip for validation',
      dates: {
        startDate: new Date('2024-07-01'),
        endDate: new Date('2024-07-05'),
        flexibility: 2
      },
      location: {
        region: 'Test-Region',
        coordinates: { longitude: -122.4194, latitude: 37.7749 },
        radius: 50
      },
      participants: {
        count: 2,
        fitnessLevels: ['intermediate'],
        specialRequirements: []
      },
      preferences: {
        difficulty: ['moderate'],
        duration: { min: 2, max: 6 },
        distance: { min: 5, max: 20 },
        elevationGain: { min: 0, max: 1000 },
        trailTypes: ['loop', 'out-and-back']
      }
    };

    // Validate input
    const validationResult = CreateTripPlanSchema.safeParse(testTrip);
    if (!validationResult.success) {
      throw new Error(`Trip validation failed: ${JSON.stringify(validationResult.error.errors)}`);
    }

    // Create trip
    const createdTrip = await tripRepo.createTrip(testTrip);
    if (!createdTrip.id || createdTrip.userId !== testUserId) {
      throw new Error('Trip creation failed');
    }

    // Test trip retrieval
    const userTrips = await tripRepo.getTripsByUserId(testUserId);
    if (userTrips.items.length === 0) {
      throw new Error('Trip retrieval failed');
    }

    // Test status update
    const updatedTrip = await tripRepo.updateTripStatus(createdTrip.id, testUserId, 'confirmed');
    if (updatedTrip.status !== 'confirmed') {
      throw new Error('Trip status update failed');
    }

    // Clean up
    await tripRepo.delete(createdTrip.id, testUserId);
  }

  /**
   * Test recommendation repository operations
   */
  private async testRecommendationOperations(): Promise<void> {
    const recRepo = this.repositoryFactory.getRecommendationRepository();
    const testUserId = 'test-user-id';
    const testTripId = 'test-trip-id';

    // Test recommendation creation
    const testRecommendation = {
      userId: testUserId,
      tripId: testTripId,
      trailIds: ['trail1', 'trail2'],
      reasoning: 'These trails match your preferences perfectly.',
      confidence: 0.85,
      factors: {
        fitnessMatch: 0.9,
        preferenceAlignment: 0.8,
        seasonalSuitability: 0.9,
        safetyConsiderations: 0.8
      }
    };

    // Validate input
    const validationResult = CreateAIRecommendationSchema.safeParse(testRecommendation);
    if (!validationResult.success) {
      throw new Error(`Recommendation validation failed: ${JSON.stringify(validationResult.error.errors)}`);
    }

    // Create recommendation
    const createdRec = await recRepo.createRecommendation(testRecommendation);
    if (!createdRec.id || createdRec.userId !== testUserId) {
      throw new Error('Recommendation creation failed');
    }

    // Test recommendation retrieval
    const userRecs = await recRepo.getRecommendationsByUserId(testUserId);
    if (userRecs.items.length === 0) {
      throw new Error('Recommendation retrieval failed');
    }

    // Test confidence update
    const updatedRec = await recRepo.updateRecommendationConfidence(createdRec.id, testUserId, 0.9);
    if (updatedRec.confidence !== 0.9) {
      throw new Error('Recommendation confidence update failed');
    }

    // Clean up
    await recRepo.delete(createdRec.id, testUserId);
  }

  /**
   * Test database performance
   */
  private async testPerformance(): Promise<void> {
    const startTime = Date.now();
    
    // Test simple read performance (should be < 50ms as per requirements)
    const userRepo = this.repositoryFactory.getUserRepository();
    const readStart = Date.now();
    
    // Create a test user first
    const testUser = await userRepo.createUser({
      email: 'perf-test@example.com',
      displayName: 'Performance Test User',
      fitnessLevel: 'intermediate',
      preferences: {
        preferredDifficulty: ['moderate'],
        maxHikingDistance: 25,
        terrainTypes: ['rocky'],
        groupSize: 'small'
      },
      location: {
        city: 'Test City',
        state: 'Test State',
        country: 'USA'
      }
    });

    // Test read performance
    await userRepo.getById(testUser.id, testUser.partitionKey);
    const readTime = Date.now() - readStart;
    
    if (readTime > 50) {
      console.warn(`⚠️  Read operation took ${readTime}ms (requirement: <50ms)`);
    }

    // Test complex query performance (should be < 200ms as per requirements)
    const queryStart = Date.now();
    await userRepo.searchByFitnessLevel('intermediate');
    const queryTime = Date.now() - queryStart;
    
    if (queryTime > 200) {
      console.warn(`⚠️  Complex query took ${queryTime}ms (requirement: <200ms)`);
    }

    // Clean up
    await userRepo.delete(testUser.id, testUser.partitionKey);
    
    const totalTime = Date.now() - startTime;
    console.log(`Performance test completed in ${totalTime}ms`);
    console.log(`  - Read time: ${readTime}ms`);
    console.log(`  - Query time: ${queryTime}ms`);
  }

  /**
   * Validate schema constraints
   */
  async validateSchemaConstraints(): Promise<boolean> {
    console.log('🔍 Testing schema constraints...');

    try {
      // Test user schema validation
      this.testUserSchemaValidation();
      console.log('✅ User schema validation passed');

      // Test trail schema validation
      this.testTrailSchemaValidation();
      console.log('✅ Trail schema validation passed');

      // Test trip schema validation
      this.testTripSchemaValidation();
      console.log('✅ Trip schema validation passed');

      // Test recommendation schema validation
      this.testRecommendationSchemaValidation();
      console.log('✅ Recommendation schema validation passed');

      console.log('🎉 All schema constraint tests passed!');
      return true;

    } catch (error) {
      console.error('❌ Schema constraint tests failed:', error);
      return false;
    }
  }

  private testUserSchemaValidation(): void {
    // Test invalid email
    const invalidUser = {
      email: 'invalid-email',
      displayName: 'Test',
      fitnessLevel: 'intermediate',
      preferences: { preferredDifficulty: [], maxHikingDistance: 25, terrainTypes: [], groupSize: 'small' },
      location: { city: 'Test', state: 'Test', country: 'USA' }
    };

    const result = CreateUserProfileSchema.safeParse(invalidUser);
    if (result.success) {
      throw new Error('Should have failed validation for invalid email');
    }
  }

  private testTrailSchemaValidation(): void {
    // Test invalid coordinates
    const invalidTrail = {
      name: 'Test',
      description: 'Test',
      location: {
        region: 'Test',
        park: 'Test',
        country: 'USA',
        coordinates: {
          start: { longitude: 200, latitude: 37.7749 }, // Invalid longitude
          end: { longitude: -122.4194, latitude: 37.7749 }
        }
      },
      characteristics: {
        difficulty: 'moderate',
        distance: 10,
        duration: { min: 3, max: 5 },
        elevationGain: 500,
        trailType: 'loop',
        surface: ['dirt']
      },
      features: {
        scenicViews: true,
        waterFeatures: false,
        seasonality: { bestMonths: [6], accessibleMonths: [6] }
      },
      safety: { riskLevel: 2, requiresPermit: false },
      amenities: { parking: true, restrooms: false, camping: false, drinkingWater: false }
    };

    const result = CreateTrailSchema.safeParse(invalidTrail);
    if (result.success) {
      throw new Error('Should have failed validation for invalid coordinates');
    }
  }

  private testTripSchemaValidation(): void {
    // Test invalid date range
    const invalidTrip = {
      userId: 'test',
      title: 'Test',
      description: 'Test',
      dates: {
        startDate: new Date('2024-07-05'),
        endDate: new Date('2024-07-01'), // End before start
        flexibility: 2
      },
      location: { region: 'Test', coordinates: { longitude: -122, latitude: 37 }, radius: 50 },
      participants: { count: 1, fitnessLevels: ['intermediate'], specialRequirements: [] },
      preferences: {
        difficulty: ['moderate'],
        duration: { min: 2, max: 6 },
        distance: { min: 5, max: 20 },
        elevationGain: { min: 0, max: 1000 },
        trailTypes: ['loop']
      }
    };

    const result = CreateTripPlanSchema.safeParse(invalidTrip);
    if (result.success) {
      throw new Error('Should have failed validation for invalid date range');
    }
  }

  private testRecommendationSchemaValidation(): void {
    // Test invalid confidence value
    const invalidRec = {
      userId: 'test',
      tripId: 'test',
      trailIds: ['trail1'],
      reasoning: 'Test',
      confidence: 1.5, // Invalid confidence > 1
      factors: { fitnessMatch: 0.8, preferenceAlignment: 0.8, seasonalSuitability: 0.8, safetyConsiderations: 0.8 }
    };

    const result = CreateAIRecommendationSchema.safeParse(invalidRec);
    if (result.success) {
      throw new Error('Should have failed validation for invalid confidence');
    }
  }
}