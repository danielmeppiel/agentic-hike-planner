import { Container, SqlQuerySpec } from '@azure/cosmos';
import { UserProfile, CreateUserProfileInput, UpdateUserProfileInput } from '../types';
import { BaseRepository, QueryResult, QueryOptions } from './BaseRepository';

export class UserRepository extends BaseRepository<UserProfile> {
  constructor(container: Container) {
    super(container);
  }

  /**
   * Create a new user profile
   */
  async createUser(input: CreateUserProfileInput): Promise<UserProfile> {
    const userInput = {
      ...input,
      partitionKey: input.email, // Use email as partition key for user data
      isActive: true
    };

    return this.create(userInput);
  }

  /**
   * Get user by email
   */
  async getByEmail(email: string): Promise<UserProfile | null> {
    const querySpec: SqlQuerySpec = {
      query: 'SELECT * FROM c WHERE c.email = @email AND c.isActive = true',
      parameters: [
        { name: '@email', value: email }
      ]
    };

    const result = await this.query(querySpec);
    return result.items[0] || null;
  }

  /**
   * Update user profile
   */
  async updateUser(userId: string, email: string, updates: UpdateUserProfileInput): Promise<UserProfile> {
    return this.update(userId, email, updates);
  }

  /**
   * Deactivate user (soft delete)
   */
  async deactivateUser(userId: string, email: string): Promise<UserProfile> {
    return this.update(userId, email, { isActive: false });
  }

  /**
   * Search users by location
   */
  async searchByLocation(
    city?: string, 
    state?: string, 
    country?: string, 
    options: QueryOptions = {}
  ): Promise<QueryResult<UserProfile>> {
    const conditions: string[] = ['c.isActive = true'];
    const parameters: any[] = [];

    if (city) {
      conditions.push('c.location.city = @city');
      parameters.push({ name: '@city', value: city });
    }

    if (state) {
      conditions.push('c.location.state = @state');
      parameters.push({ name: '@state', value: state });
    }

    if (country) {
      conditions.push('c.location.country = @country');
      parameters.push({ name: '@country', value: country });
    }

    const querySpec: SqlQuerySpec = {
      query: `SELECT * FROM c WHERE ${conditions.join(' AND ')}`,
      parameters
    };

    return this.query(querySpec, options);
  }

  /**
   * Search users by fitness level
   */
  async searchByFitnessLevel(fitnessLevel: string, options: QueryOptions = {}): Promise<QueryResult<UserProfile>> {
    const querySpec: SqlQuerySpec = {
      query: 'SELECT * FROM c WHERE c.fitnessLevel = @fitnessLevel AND c.isActive = true',
      parameters: [
        { name: '@fitnessLevel', value: fitnessLevel }
      ]
    };

    return this.query(querySpec, options);
  }

  /**
   * Get users with similar preferences
   */
  async getUsersWithSimilarPreferences(
    preferredDifficulty: string[],
    terrainTypes: string[],
    options: QueryOptions = {}
  ): Promise<QueryResult<UserProfile>> {
    // Use array_contains to find users with overlapping preferences
    const querySpec: SqlQuerySpec = {
      query: `
        SELECT * FROM c 
        WHERE c.isActive = true 
        AND (
          EXISTS(SELECT VALUE d FROM d IN c.preferences.preferredDifficulty WHERE d IN (@difficulties))
          OR EXISTS(SELECT VALUE t FROM t IN c.preferences.terrainTypes WHERE t IN (@terrainTypes))
        )
      `,
      parameters: [
        { name: '@difficulties', value: preferredDifficulty },
        { name: '@terrainTypes', value: terrainTypes }
      ]
    };

    return this.query(querySpec, options);
  }

  /**
   * Get users within a certain distance range preference
   */
  async getUsersByDistancePreference(
    minDistance: number,
    maxDistance: number,
    options: QueryOptions = {}
  ): Promise<QueryResult<UserProfile>> {
    const querySpec: SqlQuerySpec = {
      query: `
        SELECT * FROM c 
        WHERE c.isActive = true 
        AND c.preferences.maxHikingDistance >= @minDistance 
        AND c.preferences.maxHikingDistance <= @maxDistance
      `,
      parameters: [
        { name: '@minDistance', value: minDistance },
        { name: '@maxDistance', value: maxDistance }
      ]
    };

    return this.query(querySpec, options);
  }

  /**
   * Get recently active users (created or updated in the last N days)
   */
  async getRecentlyActiveUsers(days: number = 30, options: QueryOptions = {}): Promise<QueryResult<UserProfile>> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const querySpec: SqlQuerySpec = {
      query: `
        SELECT * FROM c 
        WHERE c.isActive = true 
        AND (c.createdAt >= @cutoffDate OR c.updatedAt >= @cutoffDate)
        ORDER BY c.updatedAt DESC
      `,
      parameters: [
        { name: '@cutoffDate', value: cutoffDate.toISOString() }
      ]
    };

    return this.query(querySpec, options);
  }

  /**
   * Check if email is already in use
   */
  async isEmailInUse(email: string): Promise<boolean> {
    const user = await this.getByEmail(email);
    return user !== null;
  }
}