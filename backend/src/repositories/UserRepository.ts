import { Container, SqlQuerySpec } from '@azure/cosmos';
import { v4 as uuidv4 } from 'uuid';
import { BaseRepository } from './BaseRepository';
import { UserProfile, CreateUserProfileRequest, UpdateUserProfileRequest } from '../types';

/**
 * Repository for user profile operations
 */
export class UserRepository extends BaseRepository<UserProfile> {
  constructor(container: Container) {
    super(container);
  }

  /**
   * Create a new user profile
   */
  async createUser(userData: CreateUserProfileRequest): Promise<UserProfile> {
    const now = new Date();
    const userId = uuidv4();
    
    const userProfile: UserProfile = {
      id: userId,
      partitionKey: userId, // User-based partitioning
      ...userData,
      createdAt: now,
      updatedAt: now,
      isActive: true,
    };

    return this.create(userProfile);
  }

  /**
   * Find user by email
   */
  async findByEmail(email: string): Promise<UserProfile | null> {
    const querySpec: SqlQuerySpec = {
      query: 'SELECT * FROM c WHERE c.email = @email AND c.isActive = true',
      parameters: [{ name: '@email', value: email }],
    };

    const { items } = await this.query<UserProfile>(querySpec, { maxItemCount: 1 });
    return items[0] || null;
  }

  /**
   * Update user profile
   */
  async updateUser(
    userId: string,
    updateData: UpdateUserProfileRequest,
    etag?: string
  ): Promise<UserProfile> {
    const existingUser = await this.findById(userId, userId);
    if (!existingUser) {
      throw new Error('User not found');
    }

    const updatedUser: UserProfile = {
      ...existingUser,
      ...updateData,
      updatedAt: new Date(),
    };

    return this.update(userId, userId, updatedUser, etag);
  }

  /**
   * Find users by fitness level
   */
  async findByFitnessLevel(
    fitnessLevel: string,
    options: { limit?: number; offset?: number } = {}
  ): Promise<{ users: UserProfile[]; continuationToken?: string }> {
    const querySpec: SqlQuerySpec = {
      query: `
        SELECT * FROM c 
        WHERE c.fitnessLevel = @fitnessLevel AND c.isActive = true
        ORDER BY c.createdAt DESC
        OFFSET @offset LIMIT @limit
      `,
      parameters: [
        { name: '@fitnessLevel', value: fitnessLevel },
        { name: '@offset', value: options.offset || 0 },
        { name: '@limit', value: options.limit || 20 },
      ],
    };

    const { items, continuationToken } = await this.query<UserProfile>(querySpec);
    return { users: items, continuationToken };
  }

  /**
   * Find users by location region
   */
  async findByRegion(
    region: string,
    options: { limit?: number; offset?: number } = {}
  ): Promise<{ users: UserProfile[]; continuationToken?: string }> {
    const querySpec: SqlQuerySpec = {
      query: `
        SELECT * FROM c 
        WHERE c.location.state = @region AND c.isActive = true
        ORDER BY c.createdAt DESC
        OFFSET @offset LIMIT @limit
      `,
      parameters: [
        { name: '@region', value: region },
        { name: '@offset', value: options.offset || 0 },
        { name: '@limit', value: options.limit || 20 },
      ],
    };

    const { items, continuationToken } = await this.query<UserProfile>(querySpec);
    return { users: items, continuationToken };
  }

  /**
   * Search users with multiple criteria
   */
  async searchUsers(criteria: {
    email?: string;
    fitnessLevel?: string;
    region?: string;
    isActive?: boolean;
    limit?: number;
    offset?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<{ users: UserProfile[]; continuationToken?: string; totalCount?: number }> {
    const conditions: string[] = [];
    const parameters: any[] = [];

    if (criteria.email) {
      conditions.push('CONTAINS(LOWER(c.email), LOWER(@email))');
      parameters.push({ name: '@email', value: criteria.email });
    }

    if (criteria.fitnessLevel) {
      conditions.push('c.fitnessLevel = @fitnessLevel');
      parameters.push({ name: '@fitnessLevel', value: criteria.fitnessLevel });
    }

    if (criteria.region) {
      conditions.push('c.location.state = @region');
      parameters.push({ name: '@region', value: criteria.region });
    }

    if (criteria.isActive !== undefined) {
      conditions.push('c.isActive = @isActive');
      parameters.push({ name: '@isActive', value: criteria.isActive });
    }

    const whereClause = this.buildWhereConditions(conditions);
    const orderByClause = this.buildOrderBy(criteria.sortBy || 'createdAt', criteria.sortOrder);
    
    parameters.push(
      { name: '@offset', value: criteria.offset || 0 },
      { name: '@limit', value: criteria.limit || 20 }
    );

    const querySpec: SqlQuerySpec = {
      query: `
        SELECT * FROM c
        ${whereClause}
        ${orderByClause}
        OFFSET @offset LIMIT @limit
      `,
      parameters,
    };

    const { items, continuationToken } = await this.query<UserProfile>(querySpec);
    
    // Get total count if needed
    let totalCount: number | undefined;
    if (criteria.offset === 0) {
      const countQuery: SqlQuerySpec = {
        query: `SELECT VALUE COUNT(1) FROM c ${whereClause}`,
        parameters: parameters.filter(p => p.name !== '@offset' && p.name !== '@limit'),
      };
      totalCount = await this.count(countQuery);
    }

    return { users: items, continuationToken, totalCount };
  }

  /**
   * Soft delete user (set isActive to false)
   */
  async softDeleteUser(userId: string): Promise<void> {
    const user = await this.findById(userId, userId);
    if (!user) {
      throw new Error('User not found');
    }

    await this.update(userId, userId, {
      ...user,
      isActive: false,
      updatedAt: new Date(),
    });
  }

  /**
   * Get user statistics
   */
  async getUserStats(): Promise<{
    totalUsers: number;
    activeUsers: number;
    usersByFitnessLevel: { [key: string]: number };
  }> {
    // Total users
    const totalQuery: SqlQuerySpec = {
      query: 'SELECT VALUE COUNT(1) FROM c',
      parameters: [],
    };
    const totalUsers = await this.count(totalQuery);

    // Active users
    const activeQuery: SqlQuerySpec = {
      query: 'SELECT VALUE COUNT(1) FROM c WHERE c.isActive = true',
      parameters: [],
    };
    const activeUsers = await this.count(activeQuery);

    // Users by fitness level
    const fitnessQuery: SqlQuerySpec = {
      query: `
        SELECT c.fitnessLevel, COUNT(1) as count 
        FROM c 
        WHERE c.isActive = true
        GROUP BY c.fitnessLevel
      `,
      parameters: [],
    };
    
    const { items } = await this.query<{ fitnessLevel: string; count: number }>(fitnessQuery);
    const usersByFitnessLevel: { [key: string]: number } = {};
    items.forEach(item => {
      usersByFitnessLevel[item.fitnessLevel] = item.count;
    });

    return {
      totalUsers,
      activeUsers,
      usersByFitnessLevel,
    };
  }
}