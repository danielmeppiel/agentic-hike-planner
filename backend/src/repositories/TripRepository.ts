import { Container, SqlQuerySpec } from '@azure/cosmos';
import { BaseRepository } from './BaseRepository';
import { TripPlan, CreateTripRequest, UpdateTripRequest, TripStatus } from '../types';

/**
 * Repository for managing trip plans and itineraries with Cosmos DB.
 * 
 * ## Partition Key Strategy
 * 
 * Uses **userId as partition key** for user-centric data access:
 * - All trips for a user are co-located in the same logical partition
 * - Enables highly efficient single-partition queries for user's trips
 * - Supports user-scoped operations with minimal RU consumption
 * - Aligns with typical access patterns (users manage their own trips)
 * 
 * ## Indexing Strategy
 * 
 * Optimized for common trip management scenarios:
 * ```json
 * {
 *   "indexingPolicy": {
 *     "includedPaths": [
 *       { "path": "/userId/?" },          // Hash index for user filtering
 *       { "path": "/status/?" },          // Hash index for status filtering  
 *       { "path": "/dates/startDate/?" }, // Range index for date queries
 *       { "path": "/dates/endDate/?" },   // Range index for date ranges
 *       { "path": "/location/region/?" }, // Range index for geographic queries
 *       { "path": "/createdAt/?" }        // Range index for temporal sorting
 *     ]
 *   }
 * }
 * ```
 * 
 * ## Query Performance Patterns
 * 
 * ### Single-Partition Queries (Highly Efficient)
 * - User's trip list: `WHERE c.userId = @userId`
 * - User's trips by status: `WHERE c.userId = @userId AND c.status = @status`
 * - User's upcoming trips: `WHERE c.userId = @userId AND c.dates.startDate > @now`
 * 
 * ### Cross-Partition Queries (Use Sparingly)
 * - All trips by status: `WHERE c.status = @status`
 * - Trips in date range: `WHERE c.dates.startDate BETWEEN @start AND @end`
 * - Regional trip analysis: `WHERE c.location.region = @region`
 * 
 * ## Trip Lifecycle Management
 * 
 * Trip status transitions:
 * ```
 * planning → confirmed → completed
 *     ↓         ↓
 * cancelled   cancelled
 * ```
 * 
 * @example
 * ```typescript
 * const tripRepository = new TripRepository(container);
 * 
 * // Create user's trip (single-partition)
 * const trip = await tripRepository.create({
 *   userId: 'user-123',
 *   title: 'Cascade Mountains Adventure',
 *   location: { region: 'pacific-northwest' },
 *   dates: { startDate: '2024-07-15', endDate: '2024-07-20' }
 * });
 * 
 * // Efficient user trip queries
 * const userTrips = await tripRepository.findByUserId('user-123');
 * const upcomingTrips = await tripRepository.findUpcomingTrips('user-123');
 * ```
 */
export class TripRepository extends BaseRepository<TripPlan> {
  /**
   * Initializes the TripRepository with the specified Cosmos DB container.
   * 
   * @param container - The Cosmos DB container configured for trip plans
   */
  constructor(container: Container) {
    super(container);
  }

  /**
   * Creates a new trip plan with user-specific initialization.
   * 
   * ## Trip Initialization Strategy
   * - Sets partition key to userId for optimal data locality
   * - Initializes trip status to 'planning' for new trips
   * - Creates empty arrays for selectedTrails and equipment 
   * - Provides default budget structure if not specified
   * - Inherits automatic ID generation and timestamps from BaseRepository
   * 
   * ## Business Logic
   * - New trips always start in 'planning' status
   * - Budget defaults to $0 USD without accommodation
   * - Equipment and trail lists start empty for user population
   * - Consider validation for date ranges and location data
   * 
   * @param tripData - Trip creation data including userId for partition key
   * @returns Promise resolving to the created trip plan with all fields
   * @throws Error if trip creation fails or validation errors occur
   * 
   * @example
   * ```typescript
   * const newTrip = await tripRepository.create({
   *   userId: 'user-456',
   *   title: 'Olympic National Park Circuit',
   *   description: 'Multi-day hiking adventure through temperate rainforest',
   *   location: {
   *     region: 'pacific-northwest',
   *     country: 'USA',
   *     coordinates: { latitude: 47.8, longitude: -123.6 }
   *   },
   *   dates: {
   *     startDate: '2024-08-10',
   *     endDate: '2024-08-17'
   *   },
   *   budget: {
   *     amount: 1200,
   *     currency: 'USD', 
   *     includesAccommodation: true
   *   }
   * });
   * ```
   */
  async create(tripData: CreateTripRequest & { userId: string }): Promise<TripPlan> {
    const tripDocument = {
      ...tripData,
      partitionKey: tripData.userId,
      status: 'planning' as TripStatus,
      selectedTrails: [],
      equipment: [],
      budget: tripData.budget || {
        amount: 0,
        currency: 'USD',
        includesAccommodation: false,
      },
    };

    return await super.create(tripDocument);
  }

  async findByUserId(userId: string, limit: number = 20, continuationToken?: string): Promise<{
    trips: TripPlan[];
    continuationToken?: string;
    hasMore: boolean;
  }> {
    const querySpec: SqlQuerySpec = {
      query: 'SELECT * FROM c WHERE c.userId = @userId ORDER BY c.createdAt DESC',
      parameters: [{ name: '@userId', value: userId }],
    };

    const result = await this.queryWithPagination(querySpec, limit, continuationToken, userId);
    
    return {
      trips: result.items,
      continuationToken: result.continuationToken,
      hasMore: result.hasMore,
    };
  }

  async findByStatus(status: TripStatus, limit: number = 50): Promise<TripPlan[]> {
    const querySpec: SqlQuerySpec = {
      query: 'SELECT * FROM c WHERE c.status = @status ORDER BY c.createdAt DESC',
      parameters: [{ name: '@status', value: status }],
    };

    const result = await this.queryWithPagination(querySpec, limit);
    return result.items;
  }

  async findByUserIdAndStatus(userId: string, status: TripStatus): Promise<TripPlan[]> {
    const querySpec: SqlQuerySpec = {
      query: 'SELECT * FROM c WHERE c.userId = @userId AND c.status = @status ORDER BY c.createdAt DESC',
      parameters: [
        { name: '@userId', value: userId },
        { name: '@status', value: status },
      ],
    };

    return await this.query(querySpec, userId);
  }

  async findUpcomingTrips(userId: string, daysAhead: number = 30): Promise<TripPlan[]> {
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + daysAhead);

    const querySpec: SqlQuerySpec = {
      query: `
        SELECT * FROM c 
        WHERE c.userId = @userId 
        AND c.dates.startDate >= @startDate 
        AND c.dates.startDate <= @endDate
        AND c.status IN (@confirmedStatus, @planningStatus)
        ORDER BY c.dates.startDate ASC
      `,
      parameters: [
        { name: '@userId', value: userId },
        { name: '@startDate', value: startDate.toISOString() },
        { name: '@endDate', value: endDate.toISOString() },
        { name: '@confirmedStatus', value: 'confirmed' },
        { name: '@planningStatus', value: 'planning' },
      ],
    };

    return await this.query(querySpec, userId);
  }

  async findByDateRange(startDate: Date, endDate: Date, limit: number = 50): Promise<TripPlan[]> {
    const querySpec: SqlQuerySpec = {
      query: `
        SELECT * FROM c 
        WHERE c.dates.startDate <= @endDate 
        AND c.dates.endDate >= @startDate
        ORDER BY c.dates.startDate ASC
      `,
      parameters: [
        { name: '@startDate', value: startDate.toISOString() },
        { name: '@endDate', value: endDate.toISOString() },
      ],
    };

    const result = await this.queryWithPagination(querySpec, limit);
    return result.items;
  }

  async findByLocation(region: string, radiusKm?: number, limit: number = 20): Promise<TripPlan[]> {
    let query = 'SELECT * FROM c WHERE c.location.region = @region';
    const parameters: any[] = [{ name: '@region', value: region }];

    if (radiusKm) {
      // For simplicity, we'll use region matching. In a real implementation,
      // you'd use geospatial queries with ST_DISTANCE
      query += ' AND c.location.radius <= @radius';
      parameters.push({ name: '@radius', value: radiusKm });
    }

    query += ' ORDER BY c.createdAt DESC';

    const querySpec: SqlQuerySpec = {
      query,
      parameters,
    };

    const result = await this.queryWithPagination(querySpec, limit);
    return result.items;
  }

  async updateTrip(tripId: string, userId: string, updates: UpdateTripRequest): Promise<TripPlan> {
    return await this.update(tripId, userId, updates as Partial<TripPlan>);
  }

  async updateStatus(tripId: string, userId: string, status: TripStatus): Promise<TripPlan> {
    return await this.update(tripId, userId, { status });
  }

  async addTrailToTrip(tripId: string, userId: string, trailId: string): Promise<TripPlan> {
    const trip = await this.findById(tripId, userId);
    if (!trip) {
      throw new Error('Trip not found');
    }

    const updatedTrails = [...new Set([...trip.selectedTrails, trailId])];
    return await this.update(tripId, userId, { selectedTrails: updatedTrails });
  }

  async removeTrailFromTrip(tripId: string, userId: string, trailId: string): Promise<TripPlan> {
    const trip = await this.findById(tripId, userId);
    if (!trip) {
      throw new Error('Trip not found');
    }

    const updatedTrails = trip.selectedTrails.filter(id => id !== trailId);
    return await this.update(tripId, userId, { selectedTrails: updatedTrails });
  }

  async getUserTripStats(userId: string): Promise<{
    total: number;
    byStatus: Record<TripStatus, number>;
    upcoming: number;
    thisYear: number;
  }> {
    const yearStart = new Date(new Date().getFullYear(), 0, 1);
    const now = new Date();

    // Get all user trips
    const allTripsQuery: SqlQuerySpec = {
      query: 'SELECT c.status, c.dates FROM c WHERE c.userId = @userId',
      parameters: [{ name: '@userId', value: userId }],
    };

    const trips = await this.query(allTripsQuery, userId);
    
    const stats = {
      total: trips.length,
      byStatus: {
        planning: 0,
        confirmed: 0,
        completed: 0,
        cancelled: 0,
      } as Record<TripStatus, number>,
      upcoming: 0,
      thisYear: 0,
    };

    trips.forEach(trip => {
      // Count by status
      stats.byStatus[trip.status as TripStatus]++;

      // Count upcoming trips
      const startDate = new Date(trip.dates.startDate);
      if (startDate > now && (trip.status === 'planning' || trip.status === 'confirmed')) {
        stats.upcoming++;
      }

      // Count this year's trips
      if (startDate >= yearStart) {
        stats.thisYear++;
      }
    });

    return stats;
  }

  async searchTrips(userId: string, searchTerm: string, limit: number = 20): Promise<TripPlan[]> {
    const querySpec: SqlQuerySpec = {
      query: `
        SELECT * FROM c 
        WHERE c.userId = @userId 
        AND (
          CONTAINS(LOWER(c.title), LOWER(@searchTerm))
          OR CONTAINS(LOWER(c.description), LOWER(@searchTerm))
          OR CONTAINS(LOWER(c.location.region), LOWER(@searchTerm))
        )
        ORDER BY c.createdAt DESC
      `,
      parameters: [
        { name: '@userId', value: userId },
        { name: '@searchTerm', value: searchTerm },
      ],
    };

    const result = await this.queryWithPagination(querySpec, limit, undefined, userId);
    return result.items;
  }
}