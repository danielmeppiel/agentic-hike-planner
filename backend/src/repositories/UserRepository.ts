import { Container, SqlQuerySpec } from '@azure/cosmos';
import { BaseRepository } from './BaseRepository';
import { UserProfile, CreateUserRequest, UpdateUserRequest } from '../types';

/**
 * Repository for managing user profiles with Cosmos DB.
 * 
 * ## Partition Key Strategy
 * 
 * Uses **userId as partition key** for optimal data isolation:
 * - Single-user operations are highly efficient
 * - User data remains within one logical partition
 * - Supports user-centric query patterns effectively
 * - Enables future sharding by user for horizontal scaling
 * 
 * ## Indexing Strategy
 * 
 * Optimized indexes for common query patterns:
 * - `/email/?` - Hash index for login lookups
 * - `/fitnessLevel/?` - Range index for filtering by fitness
 * - `/location/region/?` - Range index for geographic queries  
 * - `/createdAt/?` - Range index for temporal sorting
 * - `/isActive/?` - Hash index for active user filtering
 * 
 * ## Query Patterns
 * 
 * ### Single-Partition Queries (Most Efficient)
 * - User profile lookup by ID
 * - User profile updates
 * - User statistics and preferences
 * 
 * ### Cross-Partition Queries (Use Judiciously)
 * - Email-based login (requires unique constraint)
 * - Search by fitness level or location
 * - Administrative user listing
 * 
 * @example
 * ```typescript
 * const userRepository = new UserRepository(container);
 * 
 * // Create new user
 * const user = await userRepository.createUser({
 *   email: 'hiker@example.com',
 *   displayName: 'Mountain Explorer',
 *   fitnessLevel: 'intermediate'
 * });
 * 
 * // Efficient single-partition lookup
 * const profile = await userRepository.findById(user.id, user.id);
 * 
 * // Search users by criteria (cross-partition)
 * const localHikers = await userRepository.findByLocation('pacific-northwest');
 * ```
 */
export class UserRepository extends BaseRepository<UserProfile> {
  /**
   * Initializes the UserRepository with the specified Cosmos DB container.
   * 
   * @param container - The Cosmos DB container configured for user profiles
   */
  constructor(container: Container) {
    super(container);
  }

  /**
   * Creates a new user profile with generated ID and partition key.
   * 
   * ## User Creation Strategy
   * - Generates cryptographically secure UUID for user ID
   * - Sets partition key equal to user ID for optimal data locality
   * - Automatically sets isActive flag to true for new users
   * - Inherits automatic timestamp generation from BaseRepository
   * 
   * ## Business Rules
   * - Email uniqueness should be enforced at application level
   * - Consider email verification workflow before activation
   * - Validate fitness level against allowed values
   * - Sanitize and validate location data
   * 
   * @param userData - User profile data without system-generated fields
   * @returns Promise resolving to the created user profile with all fields
   * @throws Error if user creation fails or validation errors occur
   * 
   * @example
   * ```typescript
   * const newUser = await userRepository.createUser({
   *   email: 'alex@hikemore.com',
   *   displayName: 'Alex Trail Runner',
   *   fitnessLevel: 'advanced',
   *   location: {
   *     city: 'Boulder',
   *     region: 'colorado',
   *     country: 'USA'
   *   },
   *   preferences: {
   *     maxHikingDistance: 20,
   *     preferredTerrainTypes: ['mountain', 'forest'],
   *     difficultyPreference: 'challenging'
   *   }
   * });
   * ```
   */
  async createUser(userData: CreateUserRequest): Promise<UserProfile> {
    // Generate a unique ID for the user first
    const userId = require('crypto').randomUUID();
    
    const userDocument = {
      ...userData,
      id: userId,
      partitionKey: userId, // Set partition key to be the same as user ID
      isActive: true,
    };

    const createdUser = await super.create(userDocument as Omit<UserProfile, 'createdAt' | 'updatedAt'>);
    return createdUser;
  }

  /**
   * Finds a user by email address across all partitions.
   * 
   * ## Performance Considerations
   * 
   * This is a **cross-partition query** that:
   * - Scans across all user partitions to find matching email
   * - Higher RU consumption compared to ID-based lookups
   * - Suitable for login scenarios where email is the primary identifier
   * 
   * ## Optimization Strategies
   * 
   * ### Email Index
   * Ensure `/email/?` is properly indexed for efficient lookups:
   * ```json
   * {
   *   "indexingMode": "consistent",
   *   "includedPaths": [
   *     { "path": "/email/?" }
   *   ]
   * }
   * ```
   * 
   * ### Caching
   * Consider caching email-to-userId mappings for frequently accessed users:
   * - Redis cache with email as key, userId as value
   * - TTL-based invalidation strategy
   * - Cache warming for active users
   * 
   * ### Alternative Patterns
   * For high-scale applications, consider:
   * - Separate email-to-userId lookup table
   * - Deterministic partition key based on email hash
   * - Event-driven cache updates via change feed
   * 
   * @param email - The email address to search for
   * @returns Promise resolving to user profile if found, null otherwise
   * @throws Error if search operation fails
   * 
   * @example
   * ```typescript
   * // Login flow
   * const user = await userRepository.findByEmail('user@example.com');
   * if (!user) {
   *   throw new Error('Invalid email or password');
   * }
   * if (!user.isActive) {
   *   throw new Error('Account is deactivated');
   * }
   * ```
   */
  async findByEmail(email: string): Promise<UserProfile | null> {
    const querySpec: SqlQuerySpec = {
      query: 'SELECT * FROM c WHERE c.email = @email AND c.isActive = true',
      parameters: [{ name: '@email', value: email }],
    };

    const users = await this.query(querySpec);
    return users.length > 0 ? users[0] : null;
  }

  async findActiveUsers(limit: number = 50, continuationToken?: string): Promise<{
    users: UserProfile[];
    continuationToken?: string;
    hasMore: boolean;
  }> {
    const querySpec: SqlQuerySpec = {
      query: 'SELECT * FROM c WHERE c.isActive = true ORDER BY c.createdAt DESC',
    };

    const result = await this.queryWithPagination(querySpec, limit, continuationToken);
    
    return {
      users: result.items,
      continuationToken: result.continuationToken,
      hasMore: result.hasMore,
    };
  }

  async findByFitnessLevel(fitnessLevel: string): Promise<UserProfile[]> {
    const querySpec: SqlQuerySpec = {
      query: 'SELECT * FROM c WHERE c.fitnessLevel = @fitnessLevel AND c.isActive = true',
      parameters: [{ name: '@fitnessLevel', value: fitnessLevel }],
    };

    return await this.query(querySpec);
  }

  async findByLocation(region: string, limit: number = 20): Promise<UserProfile[]> {
    const querySpec: SqlQuerySpec = {
      query: 'SELECT * FROM c WHERE c.location.region = @region AND c.isActive = true',
      parameters: [{ name: '@region', value: region }],
    };

    const result = await this.queryWithPagination(querySpec, limit);
    return result.items;
  }

  async updateProfile(userId: string, updates: UpdateUserRequest): Promise<UserProfile> {
    return await this.update(userId, userId, updates as Partial<UserProfile>);
  }

  async deactivateUser(userId: string): Promise<UserProfile> {
    return await this.update(userId, userId, { isActive: false });
  }

  async reactivateUser(userId: string): Promise<UserProfile> {
    return await this.update(userId, userId, { isActive: true });
  }

  async getUserStats(userId: string): Promise<{
    totalTrips: number;
    activeTrips: number;
    completedTrips: number;
  } | null> {
    try {
      // This would typically join with trips container, but for now we'll return basic info
      const user = await this.findById(userId, userId);
      if (!user) {
        return null;
      }

      // In a real implementation, this would query the trips container
      // For now, return placeholder data
      return {
        totalTrips: 0,
        activeTrips: 0,
        completedTrips: 0,
      };
    } catch (error) {
      console.error('Error getting user stats:', error);
      throw error;
    }
  }

  async searchUsers(searchTerm: string, limit: number = 20): Promise<UserProfile[]> {
    const querySpec: SqlQuerySpec = {
      query: `
        SELECT * FROM c 
        WHERE c.isActive = true 
        AND (
          CONTAINS(LOWER(c.displayName), LOWER(@searchTerm)) 
          OR CONTAINS(LOWER(c.location.city), LOWER(@searchTerm))
          OR CONTAINS(LOWER(c.location.region), LOWER(@searchTerm))
        )
        ORDER BY c.displayName
      `,
      parameters: [{ name: '@searchTerm', value: searchTerm }],
    };

    const result = await this.queryWithPagination(querySpec, limit);
    return result.items;
  }

  async findUsersWithPreferences(preferences: {
    fitnessLevel?: string[];
    terrainTypes?: string[];
    maxDistance?: number;
  }): Promise<UserProfile[]> {
    let whereConditions: string[] = ['c.isActive = true'];
    const parameters: any[] = [];

    if (preferences.fitnessLevel && preferences.fitnessLevel.length > 0) {
      whereConditions.push('c.fitnessLevel IN (@fitnessLevels)');
      parameters.push({ name: '@fitnessLevels', value: preferences.fitnessLevel });
    }

    if (preferences.maxDistance) {
      whereConditions.push('c.preferences.maxHikingDistance >= @maxDistance');
      parameters.push({ name: '@maxDistance', value: preferences.maxDistance });
    }

    const querySpec: SqlQuerySpec = {
      query: `SELECT * FROM c WHERE ${whereConditions.join(' AND ')} ORDER BY c.createdAt DESC`,
      parameters,
    };

    return await this.query(querySpec);
  }
}