import { Container, SqlQuerySpec } from '@azure/cosmos';
import { TripPlan, CreateTripPlanInput, UpdateTripPlanInput, TripStatus } from '../types';
import { BaseRepository, QueryResult, QueryOptions } from './BaseRepository';

export class TripRepository extends BaseRepository<TripPlan> {
  constructor(container: Container) {
    super(container);
  }

  /**
   * Create a new trip plan
   */
  async createTrip(input: CreateTripPlanInput): Promise<TripPlan> {
    const tripInput = {
      ...input,
      partitionKey: input.userId, // Use userId as partition key for user-specific queries
      status: 'planning' as TripStatus,
      selectedTrails: [],
      equipment: input.equipment || [],
      budget: input.budget || {
        amount: 0,
        currency: 'USD',
        includesAccommodation: false
      }
    };

    return this.create(tripInput);
  }

  /**
   * Get all trips for a user
   */
  async getTripsByUserId(userId: string, options: QueryOptions = {}): Promise<QueryResult<TripPlan>> {
    return this.getByPartitionKey(userId, options);
  }

  /**
   * Get trips by status for a user
   */
  async getTripsByStatus(
    userId: string, 
    status: TripStatus, 
    options: QueryOptions = {}
  ): Promise<QueryResult<TripPlan>> {
    const querySpec: SqlQuerySpec = {
      query: 'SELECT * FROM c WHERE c.userId = @userId AND c.status = @status ORDER BY c.updatedAt DESC',
      parameters: [
        { name: '@userId', value: userId },
        { name: '@status', value: status }
      ]
    };

    return this.query(querySpec, options);
  }

  /**
   * Update trip status
   */
  async updateTripStatus(tripId: string, userId: string, status: TripStatus): Promise<TripPlan> {
    return this.update(tripId, userId, { status });
  }

  /**
   * Add trails to a trip
   */
  async addTrailsToTrip(tripId: string, userId: string, trailIds: string[]): Promise<TripPlan> {
    const trip = await this.getById(tripId, userId);
    if (!trip) {
      throw new Error(`Trip with id ${tripId} not found`);
    }

    const uniqueTrailIds = Array.from(new Set([...trip.selectedTrails, ...trailIds]));
    return this.update(tripId, userId, { selectedTrails: uniqueTrailIds });
  }

  /**
   * Remove trails from a trip
   */
  async removeTrailsFromTrip(tripId: string, userId: string, trailIds: string[]): Promise<TripPlan> {
    const trip = await this.getById(tripId, userId);
    if (!trip) {
      throw new Error(`Trip with id ${tripId} not found`);
    }

    const filteredTrailIds = trip.selectedTrails.filter(id => !trailIds.includes(id));
    return this.update(tripId, userId, { selectedTrails: filteredTrailIds });
  }

  /**
   * Search trips by location/region
   */
  async searchTripsByRegion(region: string, options: QueryOptions = {}): Promise<QueryResult<TripPlan>> {
    const querySpec: SqlQuerySpec = {
      query: 'SELECT * FROM c WHERE c.location.region = @region ORDER BY c.createdAt DESC',
      parameters: [
        { name: '@region', value: region }
      ]
    };

    return this.query(querySpec, options);
  }

  /**
   * Search trips by date range
   */
  async searchTripsByDateRange(
    startDate: Date,
    endDate: Date,
    options: QueryOptions = {}
  ): Promise<QueryResult<TripPlan>> {
    const querySpec: SqlQuerySpec = {
      query: `
        SELECT * FROM c 
        WHERE c.dates.startDate >= @startDate 
        AND c.dates.endDate <= @endDate 
        ORDER BY c.dates.startDate ASC
      `,
      parameters: [
        { name: '@startDate', value: startDate.toISOString() },
        { name: '@endDate', value: endDate.toISOString() }
      ]
    };

    return this.query(querySpec, options);
  }

  /**
   * Get upcoming trips for a user
   */
  async getUpcomingTrips(userId: string, options: QueryOptions = {}): Promise<QueryResult<TripPlan>> {
    const now = new Date();
    const querySpec: SqlQuerySpec = {
      query: `
        SELECT * FROM c 
        WHERE c.userId = @userId 
        AND c.dates.startDate >= @now 
        AND c.status IN ('planning', 'confirmed')
        ORDER BY c.dates.startDate ASC
      `,
      parameters: [
        { name: '@userId', value: userId },
        { name: '@now', value: now.toISOString() }
      ]
    };

    return this.query(querySpec, options);
  }

  /**
   * Get past trips for a user
   */
  async getPastTrips(userId: string, options: QueryOptions = {}): Promise<QueryResult<TripPlan>> {
    const now = new Date();
    const querySpec: SqlQuerySpec = {
      query: `
        SELECT * FROM c 
        WHERE c.userId = @userId 
        AND c.dates.endDate < @now 
        ORDER BY c.dates.endDate DESC
      `,
      parameters: [
        { name: '@userId', value: userId },
        { name: '@now', value: now.toISOString() }
      ]
    };

    return this.query(querySpec, options);
  }

  /**
   * Search trips by difficulty preferences
   */
  async searchTripsByDifficulty(
    difficulties: string[], 
    options: QueryOptions = {}
  ): Promise<QueryResult<TripPlan>> {
    const querySpec: SqlQuerySpec = {
      query: `
        SELECT * FROM c 
        WHERE EXISTS(SELECT VALUE d FROM d IN c.preferences.difficulty WHERE d IN (@difficulties))
        ORDER BY c.createdAt DESC
      `,
      parameters: [
        { name: '@difficulties', value: difficulties }
      ]
    };

    return this.query(querySpec, options);
  }

  /**
   * Get trips with specific participant count range
   */
  async getTripsByParticipantCount(
    minCount: number,
    maxCount: number,
    options: QueryOptions = {}
  ): Promise<QueryResult<TripPlan>> {
    const querySpec: SqlQuerySpec = {
      query: `
        SELECT * FROM c 
        WHERE c.participants.count >= @minCount 
        AND c.participants.count <= @maxCount
        ORDER BY c.participants.count ASC
      `,
      parameters: [
        { name: '@minCount', value: minCount },
        { name: '@maxCount', value: maxCount }
      ]
    };

    return this.query(querySpec, options);
  }

  /**
   * Get trips by budget range
   */
  async getTripsByBudgetRange(
    minBudget: number,
    maxBudget: number,
    currency: string = 'USD',
    options: QueryOptions = {}
  ): Promise<QueryResult<TripPlan>> {
    const querySpec: SqlQuerySpec = {
      query: `
        SELECT * FROM c 
        WHERE c.budget.amount >= @minBudget 
        AND c.budget.amount <= @maxBudget 
        AND c.budget.currency = @currency
        ORDER BY c.budget.amount ASC
      `,
      parameters: [
        { name: '@minBudget', value: minBudget },
        { name: '@maxBudget', value: maxBudget },
        { name: '@currency', value: currency }
      ]
    };

    return this.query(querySpec, options);
  }

  /**
   * Get trip statistics for a user
   */
  async getUserTripStatistics(userId: string): Promise<{
    total: number;
    byStatus: { [status: string]: number };
    completedThisYear: number;
    averageDuration: number;
  }> {
    const allTrips = await this.getTripsByUserId(userId);
    const trips = allTrips.items;

    const stats = {
      total: trips.length,
      byStatus: {} as { [status: string]: number },
      completedThisYear: 0,
      averageDuration: 0
    };

    // Count by status
    trips.forEach(trip => {
      stats.byStatus[trip.status] = (stats.byStatus[trip.status] || 0) + 1;
    });

    // Count completed this year
    const currentYear = new Date().getFullYear();
    stats.completedThisYear = trips.filter(trip => 
      trip.status === 'completed' && 
      new Date(trip.dates.endDate).getFullYear() === currentYear
    ).length;

    // Calculate average duration
    if (trips.length > 0) {
      const totalDuration = trips.reduce((sum, trip) => {
        const start = new Date(trip.dates.startDate);
        const end = new Date(trip.dates.endDate);
        return sum + (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24); // days
      }, 0);
      stats.averageDuration = totalDuration / trips.length;
    }

    return stats;
  }
}