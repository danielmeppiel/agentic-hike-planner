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

  /**
   * Retrieves active users with pagination support, ordered by creation date.
   * 
   * ## Query Characteristics
   * - **Cross-partition query**: Scans all user partitions
   * - **Filtered by isActive**: Only returns non-deactivated users
   * - **Ordered by createdAt**: Newest users first (DESC order)
   * - **Paginated**: Uses continuation tokens for efficient paging
   * 
   * ## Use Cases
   * - Administrative user management interfaces
   * - User discovery and recommendation systems
   * - Analytics and reporting dashboards
   * - Bulk operations on active user base
   * 
   * ## Performance Optimization
   * 
   * ### Index Requirements
   * Requires composite index for optimal performance:
   * ```json
   * [
   *   {
   *     "path": "/isActive/?",
   *     "kind": "Hash"
   *   },
   *   {
   *     "path": "/createdAt/?", 
   *     "kind": "Range"
   *   }
   * ]
   * ```
   * 
   * ### Cost Management
   * - Monitor RU consumption for large user bases
   * - Consider caching for frequently accessed pages
   * - Implement smart pagination limits based on usage patterns
   * 
   * @param limit - Maximum number of users per page (default: 50)
   * @param continuationToken - Token from previous page for pagination
   * @returns Promise resolving to paginated user results
   * @throws Error if query execution fails
   * 
   * @example
   * ```typescript
   * // Get first page of active users
   * const firstPage = await userRepository.findActiveUsers(25);
   * console.log(`Found ${firstPage.users.length} active users`);
   * 
   * // Get subsequent pages
   * if (firstPage.hasMore) {
   *   const secondPage = await userRepository.findActiveUsers(
   *     25, 
   *     firstPage.continuationToken
   *   );
   * }
   * 
   * // Process all active users (use with caution for large datasets)
   * let allUsers: UserProfile[] = [];
   * let hasMore = true;
   * let token: string | undefined;
   * 
   * while (hasMore) {
   *   const page = await userRepository.findActiveUsers(100, token);
   *   allUsers.push(...page.users);
   *   token = page.continuationToken;
   *   hasMore = page.hasMore;
   * }
   * ```
   */
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

  /**
   * Finds all active users with a specific fitness level.
   * 
   * ## Query Pattern
   * This cross-partition query filters users by:
   * - Fitness level match (exact string comparison)
   * - Active status (excludes deactivated accounts)
   * 
   * ## Fitness Level Categories
   * Standard values include:
   * - `'beginner'` - New to hiking, short easy trails
   * - `'intermediate'` - Regular hiking experience, moderate challenges
   * - `'advanced'` - Experienced hiker, difficult terrain and conditions
   * - `'expert'` - Professional level, extreme conditions and challenges
   * 
   * ## Use Cases
   * - Group trip planning and partner matching
   * - Fitness-based content recommendation
   * - Community building and user segmentation
   * - Difficulty-appropriate trail suggestions
   * 
   * @param fitnessLevel - The fitness level to filter by
   * @returns Promise resolving to array of users with matching fitness level
   * @throws Error if query execution fails
   * 
   * @example
   * ```typescript
   * // Find hiking partners with similar fitness
   * const intermediateHikers = await userRepository.findByFitnessLevel('intermediate');
   * 
   * // Group formation logic
   * if (intermediateHikers.length >= 4) {
   *   console.log('Enough hikers for an intermediate group trip!');
   * }
   * 
   * // Fitness distribution analysis
   * const fitnessDistribution = await Promise.all([
   *   userRepository.findByFitnessLevel('beginner'),
   *   userRepository.findByFitnessLevel('intermediate'), 
   *   userRepository.findByFitnessLevel('advanced'),
   *   userRepository.findByFitnessLevel('expert')
   * ]);
   * ```
   */
  async findByFitnessLevel(fitnessLevel: string): Promise<UserProfile[]> {
    const querySpec: SqlQuerySpec = {
      query: 'SELECT * FROM c WHERE c.fitnessLevel = @fitnessLevel AND c.isActive = true',
      parameters: [{ name: '@fitnessLevel', value: fitnessLevel }],
    };

    return await this.query(querySpec);
  }

  /**
   * Finds active users in a specific geographic region with pagination.
   * 
   * ## Geographic Query Strategy
   * 
   * ### Current Implementation
   * - Uses simple region-based string matching
   * - Filters by exact region name comparison
   * - Limited to active users only
   * 
   * ### Future Enhancements
   * Consider implementing geospatial queries for more sophisticated location-based searches:
   * ```sql
   * -- Geospatial distance query (future implementation)
   * SELECT * FROM c 
   * WHERE ST_DISTANCE(c.location.coordinates, @center) < @radiusMeters
   * AND c.isActive = true
   * ```
   * 
   * ## Regional Data Patterns
   * 
   * ### Region Standardization
   * Ensure consistent region naming:
   * - Use lowercase, hyphenated format: `'pacific-northwest'`, `'rocky-mountains'`
   * - Consider hierarchical regions: `'usa-colorado-denver'`
   * - Implement region aliases and mapping for user-friendly names
   * 
   * ### Privacy Considerations
   * - Balance location utility with user privacy
   * - Consider opt-in location sharing preferences
   * - Implement location precision controls (city vs neighborhood)
   * 
   * @param region - The geographic region identifier to search within
   * @param limit - Maximum number of users to return (default: 20)
   * @returns Promise resolving to array of users in the specified region
   * @throws Error if query execution fails
   * 
   * @example
   * ```typescript
   * // Find local hiking community
   * const localHikers = await userRepository.findByLocation('pacific-northwest', 50);
   * 
   * // Regional user analysis
   * const popularRegions = ['california', 'colorado', 'washington', 'utah'];
   * const regionalStats = await Promise.all(
   *   popularRegions.map(async region => ({
   *     region,
   *     userCount: (await userRepository.findByLocation(region, 1000)).length
   *   }))
   * );
   * 
   * // Location-based recommendations
   * const nearbyUsers = await userRepository.findByLocation(currentUser.location.region);
   * const potentialConnections = nearbyUsers.filter(user => 
   *   user.fitnessLevel === currentUser.fitnessLevel
   * );
   * ```
   */
  async findByLocation(region: string, limit: number = 20): Promise<UserProfile[]> {
    const querySpec: SqlQuerySpec = {
      query: 'SELECT * FROM c WHERE c.location.region = @region AND c.isActive = true',
      parameters: [{ name: '@region', value: region }],
    };

    const result = await this.queryWithPagination(querySpec, limit);
    return result.items;
  }

  /**
   * Updates a user's profile with partial data.
   * 
   * ## Single-Partition Update
   * This is a highly efficient operation because:
   * - Uses userId as both document ID and partition key  
   * - No cross-partition scanning required
   * - Atomic update within the partition
   * - Optimal RU consumption
   * 
   * @param userId - The unique identifier of the user to update
   * @param updates - Partial user profile data to update
   * @returns Promise resolving to the updated user profile
   * @throws Error if user not found or update fails
   */
  async updateProfile(userId: string, updates: UpdateUserRequest): Promise<UserProfile> {
    return await this.update(userId, userId, updates as Partial<UserProfile>);
  }

  /**
   * Soft-deletes a user by setting isActive to false.
   * 
   * ## Soft Deletion Strategy
   * Preserves user data for:
   * - Audit trail maintenance  
   * - Trip history preservation
   * - Potential account reactivation
   * - Data analytics and compliance
   * 
   * @param userId - The unique identifier of the user to deactivate
   * @returns Promise resolving to the deactivated user profile
   */
  async deactivateUser(userId: string): Promise<UserProfile> {
    return await this.update(userId, userId, { isActive: false });
  }

  /**
   * Reactivates a previously deactivated user account.
   * 
   * @param userId - The unique identifier of the user to reactivate  
   * @returns Promise resolving to the reactivated user profile
   */
  async reactivateUser(userId: string): Promise<UserProfile> {
    return await this.update(userId, userId, { isActive: true });
  }

  /**
   * Retrieves aggregated statistics for a specific user.
   * 
   * ## Cross-Container Query Pattern
   * In a production system, this would join with the trips container:
   * ```sql
   * -- Future implementation with JOIN support
   * SELECT 
   *   COUNT(t.id) as totalTrips,
   *   SUM(CASE WHEN t.status = 'active' THEN 1 ELSE 0 END) as activeTrips,
   *   SUM(CASE WHEN t.status = 'completed' THEN 1 ELSE 0 END) as completedTrips
   * FROM users u
   * JOIN trips t ON u.id = t.userId  
   * WHERE u.id = @userId
   * ```
   * 
   * ## Current Implementation Note
   * Returns placeholder data pending trips container integration.
   * 
   * @param userId - The unique identifier of the user
   * @returns Promise resolving to user statistics or null if user not found
   */
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