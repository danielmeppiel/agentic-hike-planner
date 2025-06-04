import { Container, SqlQuerySpec } from '@azure/cosmos';
import { v4 as uuidv4 } from 'uuid';
import { BaseRepository } from './BaseRepository';
import { TripPlan, CreateTripPlanRequest, UpdateTripPlanRequest } from '../types';

/**
 * Repository for trip plan operations
 */
export class TripRepository extends BaseRepository<TripPlan> {
  constructor(container: Container) {
    super(container);
  }

  /**
   * Create a new trip plan
   */
  async createTrip(userId: string, tripData: CreateTripPlanRequest): Promise<TripPlan> {
    const now = new Date();
    const tripId = uuidv4();
    
    const tripPlan: TripPlan = {
      id: tripId,
      partitionKey: userId, // User-based partitioning
      userId,
      status: 'planning',
      selectedTrails: [],
      equipment: tripData.equipment || [],
      ...tripData,
      createdAt: now,
      updatedAt: now,
    };

    return this.create(tripPlan);
  }

  /**
   * Update trip plan
   */
  async updateTrip(
    tripId: string,
    userId: string,
    updateData: UpdateTripPlanRequest,
    etag?: string
  ): Promise<TripPlan> {
    const existingTrip = await this.findById(tripId, userId);
    if (!existingTrip) {
      throw new Error('Trip not found');
    }

    if (existingTrip.userId !== userId) {
      throw new Error('Unauthorized: Trip belongs to different user');
    }

    const updatedTrip: TripPlan = {
      ...existingTrip,
      ...updateData,
      updatedAt: new Date(),
    };

    return this.update(tripId, userId, updatedTrip, etag);
  }

  /**
   * Find all trips for a user
   */
  async findByUserId(
    userId: string,
    options: {
      status?: string;
      limit?: number;
      offset?: number;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
    } = {}
  ): Promise<{ trips: TripPlan[]; continuationToken?: string }> {
    const conditions: string[] = ['c.userId = @userId'];
    const parameters: any[] = [{ name: '@userId', value: userId }];

    if (options.status) {
      conditions.push('c.status = @status');
      parameters.push({ name: '@status', value: options.status });
    }

    const whereClause = this.buildWhereConditions(conditions);
    const orderByClause = this.buildOrderBy(options.sortBy || 'createdAt', options.sortOrder || 'desc');
    
    parameters.push(
      { name: '@offset', value: options.offset || 0 },
      { name: '@limit', value: options.limit || 20 }
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

    const queryOptions = { partitionKey: userId };
    const { items, continuationToken } = await this.query<TripPlan>(querySpec, queryOptions);
    return { trips: items, continuationToken };
  }

  /**
   * Find trips by status
   */
  async findByStatus(
    status: string,
    options: { limit?: number; offset?: number } = {}
  ): Promise<{ trips: TripPlan[]; continuationToken?: string }> {
    const querySpec: SqlQuerySpec = {
      query: `
        SELECT * FROM c 
        WHERE c.status = @status
        ORDER BY c.createdAt DESC
        OFFSET @offset LIMIT @limit
      `,
      parameters: [
        { name: '@status', value: status },
        { name: '@offset', value: options.offset || 0 },
        { name: '@limit', value: options.limit || 20 },
      ],
    };

    const { items, continuationToken } = await this.query<TripPlan>(querySpec);
    return { trips: items, continuationToken };
  }

  /**
   * Find trips by region
   */
  async findByRegion(
    region: string,
    options: { limit?: number; offset?: number } = {}
  ): Promise<{ trips: TripPlan[]; continuationToken?: string }> {
    const querySpec: SqlQuerySpec = {
      query: `
        SELECT * FROM c 
        WHERE c.location.region = @region
        ORDER BY c.dates.startDate ASC
        OFFSET @offset LIMIT @limit
      `,
      parameters: [
        { name: '@region', value: region },
        { name: '@offset', value: options.offset || 0 },
        { name: '@limit', value: options.limit || 20 },
      ],
    };

    const { items, continuationToken } = await this.query<TripPlan>(querySpec);
    return { trips: items, continuationToken };
  }

  /**
   * Find trips by date range
   */
  async findByDateRange(
    startDate: Date,
    endDate: Date,
    options: { limit?: number; offset?: number } = {}
  ): Promise<{ trips: TripPlan[]; continuationToken?: string }> {
    const querySpec: SqlQuerySpec = {
      query: `
        SELECT * FROM c 
        WHERE c.dates.startDate >= @startDate AND c.dates.endDate <= @endDate
        ORDER BY c.dates.startDate ASC
        OFFSET @offset LIMIT @limit
      `,
      parameters: [
        { name: '@startDate', value: startDate.toISOString() },
        { name: '@endDate', value: endDate.toISOString() },
        { name: '@offset', value: options.offset || 0 },
        { name: '@limit', value: options.limit || 20 },
      ],
    };

    const { items, continuationToken } = await this.query<TripPlan>(querySpec);
    return { trips: items, continuationToken };
  }

  /**
   * Search trips with multiple criteria
   */
  async searchTrips(criteria: {
    userId?: string;
    status?: string;
    region?: string;
    startDate?: Date;
    endDate?: Date;
    difficulty?: string[];
    participantCount?: number;
    limit?: number;
    offset?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<{ trips: TripPlan[]; continuationToken?: string; totalCount?: number }> {
    const conditions: string[] = [];
    const parameters: any[] = [];

    if (criteria.userId) {
      conditions.push('c.userId = @userId');
      parameters.push({ name: '@userId', value: criteria.userId });
    }

    if (criteria.status) {
      conditions.push('c.status = @status');
      parameters.push({ name: '@status', value: criteria.status });
    }

    if (criteria.region) {
      conditions.push('c.location.region = @region');
      parameters.push({ name: '@region', value: criteria.region });
    }

    if (criteria.startDate) {
      conditions.push('c.dates.startDate >= @startDate');
      parameters.push({ name: '@startDate', value: criteria.startDate.toISOString() });
    }

    if (criteria.endDate) {
      conditions.push('c.dates.endDate <= @endDate');
      parameters.push({ name: '@endDate', value: criteria.endDate.toISOString() });
    }

    if (criteria.difficulty && criteria.difficulty.length > 0) {
      conditions.push('ARRAY_CONTAINS(@difficulties, c.preferences.difficulty[0])');
      parameters.push({ name: '@difficulties', value: criteria.difficulty });
    }

    if (criteria.participantCount) {
      conditions.push('c.participants.count = @participantCount');
      parameters.push({ name: '@participantCount', value: criteria.participantCount });
    }

    const whereClause = this.buildWhereConditions(conditions);
    const orderByClause = this.buildOrderBy(criteria.sortBy || 'createdAt', criteria.sortOrder || 'desc');
    
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

    const queryOptions = criteria.userId ? { partitionKey: criteria.userId } : {};
    const { items, continuationToken } = await this.query<TripPlan>(querySpec, queryOptions);
    
    // Get total count if needed
    let totalCount: number | undefined;
    if (criteria.offset === 0) {
      const countQuery: SqlQuerySpec = {
        query: `SELECT VALUE COUNT(1) FROM c ${whereClause}`,
        parameters: parameters.filter(p => p.name !== '@offset' && p.name !== '@limit'),
      };
      totalCount = await this.count(countQuery);
    }

    return { trips: items, continuationToken, totalCount };
  }

  /**
   * Update trip status
   */
  async updateStatus(tripId: string, userId: string, status: string): Promise<TripPlan> {
    const trip = await this.findById(tripId, userId);
    if (!trip) {
      throw new Error('Trip not found');
    }

    return this.update(tripId, userId, {
      ...trip,
      status: status as any,
      updatedAt: new Date(),
    });
  }

  /**
   * Add trail to trip
   */
  async addTrail(tripId: string, userId: string, trailId: string): Promise<TripPlan> {
    const trip = await this.findById(tripId, userId);
    if (!trip) {
      throw new Error('Trip not found');
    }

    if (trip.selectedTrails.includes(trailId)) {
      return trip; // Trail already added
    }

    const updatedTrails = [...trip.selectedTrails, trailId];
    return this.update(tripId, userId, {
      ...trip,
      selectedTrails: updatedTrails,
      updatedAt: new Date(),
    });
  }

  /**
   * Remove trail from trip
   */
  async removeTrail(tripId: string, userId: string, trailId: string): Promise<TripPlan> {
    const trip = await this.findById(tripId, userId);
    if (!trip) {
      throw new Error('Trip not found');
    }

    const updatedTrails = trip.selectedTrails.filter(id => id !== trailId);
    return this.update(tripId, userId, {
      ...trip,
      selectedTrails: updatedTrails,
      updatedAt: new Date(),
    });
  }

  /**
   * Get trip statistics
   */
  async getTripStats(): Promise<{
    totalTrips: number;
    tripsByStatus: { [key: string]: number };
    averageParticipants: number;
  }> {
    // Total trips
    const totalQuery: SqlQuerySpec = {
      query: 'SELECT VALUE COUNT(1) FROM c',
      parameters: [],
    };
    const totalTrips = await this.count(totalQuery);

    // Trips by status
    const statusQuery: SqlQuerySpec = {
      query: `
        SELECT c.status, COUNT(1) as count 
        FROM c 
        GROUP BY c.status
      `,
      parameters: [],
    };
    
    const { items } = await this.query<{ status: string; count: number }>(statusQuery);
    const tripsByStatus: { [key: string]: number } = {};
    items.forEach(item => {
      tripsByStatus[item.status] = item.count;
    });

    // Average participants
    const avgQuery: SqlQuerySpec = {
      query: 'SELECT VALUE AVG(c.participants.count) FROM c',
      parameters: [],
    };
    const { items: avgItems } = await this.query<number>(avgQuery);
    const averageParticipants = Math.round((avgItems[0] || 0) * 100) / 100;

    return {
      totalTrips,
      tripsByStatus,
      averageParticipants,
    };
  }
}