import { Container, SqlQuerySpec } from '@azure/cosmos';
import { Trail, CreateTrailInput, UpdateTrailInput, TrailSearchCriteria, Coordinates, Difficulty } from '../types';
import { BaseRepository, QueryResult, QueryOptions } from './BaseRepository';

export class TrailRepository extends BaseRepository<Trail> {
  constructor(container: Container) {
    super(container);
  }

  /**
   * Create a new trail
   */
  async createTrail(input: CreateTrailInput): Promise<Trail> {
    const trailInput = {
      ...input,
      partitionKey: input.location.region, // Use region as partition key for location-based queries
      location: {
        ...input.location,
        coordinates: {
          start: input.location.coordinates.start,
          end: input.location.coordinates.end,
          waypoints: input.location.coordinates.waypoints || []
        }
      },
      characteristics: {
        ...input.characteristics,
        elevationProfile: input.characteristics.elevationProfile || []
      },
      features: {
        ...input.features,
        wildlife: input.features.wildlife || []
      },
      safety: {
        ...input.safety,
        commonHazards: input.safety.commonHazards || [],
        emergencyContacts: input.safety.emergencyContacts || []
      },
      ratings: {
        average: 0,
        count: 0,
        breakdown: {}
      },
      isActive: true
    };

    return this.create(trailInput);
  }

  /**
   * Search trails by region
   */
  async getTrailsByRegion(region: string, options: QueryOptions = {}): Promise<QueryResult<Trail>> {
    return this.getByPartitionKey(region, options);
  }

  /**
   * Search trails with complex criteria
   */
  async searchTrails(criteria: TrailSearchCriteria, options: QueryOptions = {}): Promise<QueryResult<Trail>> {
    const conditions: string[] = ['c.isActive = true'];
    const parameters: any[] = [];

    // Region filter
    if (criteria.region) {
      conditions.push('c.location.region = @region');
      parameters.push({ name: '@region', value: criteria.region });
    }

    // Difficulty filter
    if (criteria.difficulty && criteria.difficulty.length > 0) {
      conditions.push('c.characteristics.difficulty IN (@difficulties)');
      parameters.push({ name: '@difficulties', value: criteria.difficulty });
    }

    // Distance range filter
    if (criteria.distance) {
      if (criteria.distance.min !== undefined) {
        conditions.push('c.characteristics.distance >= @minDistance');
        parameters.push({ name: '@minDistance', value: criteria.distance.min });
      }
      if (criteria.distance.max !== undefined) {
        conditions.push('c.characteristics.distance <= @maxDistance');
        parameters.push({ name: '@maxDistance', value: criteria.distance.max });
      }
    }

    // Duration range filter
    if (criteria.duration) {
      if (criteria.duration.min !== undefined) {
        conditions.push('c.characteristics.duration.min >= @minDuration');
        parameters.push({ name: '@minDuration', value: criteria.duration.min });
      }
      if (criteria.duration.max !== undefined) {
        conditions.push('c.characteristics.duration.max <= @maxDuration');
        parameters.push({ name: '@maxDuration', value: criteria.duration.max });
      }
    }

    // Elevation gain range filter
    if (criteria.elevationGain) {
      if (criteria.elevationGain.min !== undefined) {
        conditions.push('c.characteristics.elevationGain >= @minElevation');
        parameters.push({ name: '@minElevation', value: criteria.elevationGain.min });
      }
      if (criteria.elevationGain.max !== undefined) {
        conditions.push('c.characteristics.elevationGain <= @maxElevation');
        parameters.push({ name: '@maxElevation', value: criteria.elevationGain.max });
      }
    }

    // Trail type filter
    if (criteria.trailType && criteria.trailType.length > 0) {
      conditions.push('c.characteristics.trailType IN (@trailTypes)');
      parameters.push({ name: '@trailTypes', value: criteria.trailType });
    }

    // Features filters
    if (criteria.features) {
      if (criteria.features.scenicViews !== undefined) {
        conditions.push('c.features.scenicViews = @scenicViews');
        parameters.push({ name: '@scenicViews', value: criteria.features.scenicViews });
      }
      if (criteria.features.waterFeatures !== undefined) {
        conditions.push('c.features.waterFeatures = @waterFeatures');
        parameters.push({ name: '@waterFeatures', value: criteria.features.waterFeatures });
      }
      if (criteria.features.wildlife && criteria.features.wildlife.length > 0) {
        conditions.push('EXISTS(SELECT VALUE w FROM w IN c.features.wildlife WHERE w IN (@wildlife))');
        parameters.push({ name: '@wildlife', value: criteria.features.wildlife });
      }
    }

    // Amenities filters
    if (criteria.amenities) {
      if (criteria.amenities.parking !== undefined) {
        conditions.push('c.amenities.parking = @parking');
        parameters.push({ name: '@parking', value: criteria.amenities.parking });
      }
      if (criteria.amenities.restrooms !== undefined) {
        conditions.push('c.amenities.restrooms = @restrooms');
        parameters.push({ name: '@restrooms', value: criteria.amenities.restrooms });
      }
      if (criteria.amenities.camping !== undefined) {
        conditions.push('c.amenities.camping = @camping');
        parameters.push({ name: '@camping', value: criteria.amenities.camping });
      }
      if (criteria.amenities.drinkingWater !== undefined) {
        conditions.push('c.amenities.drinkingWater = @drinkingWater');
        parameters.push({ name: '@drinkingWater', value: criteria.amenities.drinkingWater });
      }
    }

    const querySpec: SqlQuerySpec = {
      query: `SELECT * FROM c WHERE ${conditions.join(' AND ')} ORDER BY c.ratings.average DESC, c.name ASC`,
      parameters
    };

    return this.query(querySpec, options);
  }

  /**
   * Search trails by proximity to coordinates
   */
  async searchTrailsByLocation(
    centerCoords: Coordinates,
    radiusKm: number,
    options: QueryOptions = {}
  ): Promise<QueryResult<Trail>> {
    // Note: This is a simplified distance calculation. For production,
    // consider using Cosmos DB's geospatial functions or a more sophisticated approach
    const querySpec: SqlQuerySpec = {
      query: `
        SELECT * FROM c 
        WHERE c.isActive = true
        AND ST_DISTANCE(
          {"type": "Point", "coordinates": [@longitude, @latitude]},
          {"type": "Point", "coordinates": [c.location.coordinates.start.longitude, c.location.coordinates.start.latitude]}
        ) <= @radius
        ORDER BY ST_DISTANCE(
          {"type": "Point", "coordinates": [@longitude, @latitude]},
          {"type": "Point", "coordinates": [c.location.coordinates.start.longitude, c.location.coordinates.start.latitude]}
        )
      `,
      parameters: [
        { name: '@longitude', value: centerCoords.longitude },
        { name: '@latitude', value: centerCoords.latitude },
        { name: '@radius', value: radiusKm * 1000 } // Convert to meters
      ]
    };

    return this.query(querySpec, options);
  }

  /**
   * Get trails by difficulty level
   */
  async getTrailsByDifficulty(difficulty: Difficulty, options: QueryOptions = {}): Promise<QueryResult<Trail>> {
    const querySpec: SqlQuerySpec = {
      query: 'SELECT * FROM c WHERE c.characteristics.difficulty = @difficulty AND c.isActive = true ORDER BY c.ratings.average DESC',
      parameters: [
        { name: '@difficulty', value: difficulty }
      ]
    };

    return this.query(querySpec, options);
  }

  /**
   * Get top-rated trails
   */
  async getTopRatedTrails(limit: number = 10, minRatingCount: number = 5): Promise<QueryResult<Trail>> {
    const querySpec: SqlQuerySpec = {
      query: `
        SELECT TOP @limit * FROM c 
        WHERE c.isActive = true 
        AND c.ratings.count >= @minRatingCount 
        ORDER BY c.ratings.average DESC, c.ratings.count DESC
      `,
      parameters: [
        { name: '@limit', value: limit },
        { name: '@minRatingCount', value: minRatingCount }
      ]
    };

    return this.query(querySpec, { maxItemCount: limit });
  }

  /**
   * Get trails suitable for a season (month)
   */
  async getTrailsByMonth(month: number, options: QueryOptions = {}): Promise<QueryResult<Trail>> {
    const querySpec: SqlQuerySpec = {
      query: `
        SELECT * FROM c 
        WHERE c.isActive = true 
        AND (
          ARRAY_CONTAINS(c.features.seasonality.bestMonths, @month)
          OR ARRAY_CONTAINS(c.features.seasonality.accessibleMonths, @month)
        )
        ORDER BY c.ratings.average DESC
      `,
      parameters: [
        { name: '@month', value: month }
      ]
    };

    return this.query(querySpec, options);
  }

  /**
   * Update trail rating
   */
  async updateTrailRating(trailId: string, region: string, newRating: number): Promise<Trail> {
    const trail = await this.getById(trailId, region);
    if (!trail) {
      throw new Error(`Trail with id ${trailId} not found`);
    }

    // Calculate new average rating
    const currentTotal = trail.ratings.average * trail.ratings.count;
    const newCount = trail.ratings.count + 1;
    const newAverage = (currentTotal + newRating) / newCount;

    // Update rating breakdown
    const breakdown = { ...trail.ratings.breakdown };
    const ratingKey = Math.round(newRating);
    breakdown[ratingKey] = (breakdown[ratingKey] || 0) + 1;

    const updatedRatings = {
      average: Math.round(newAverage * 100) / 100, // Round to 2 decimal places
      count: newCount,
      breakdown
    };

    return this.update(trailId, region, { ratings: updatedRatings });
  }

  /**
   * Get trails requiring permits
   */
  async getTrailsRequiringPermits(options: QueryOptions = {}): Promise<QueryResult<Trail>> {
    const querySpec: SqlQuerySpec = {
      query: 'SELECT * FROM c WHERE c.safety.requiresPermit = true AND c.isActive = true ORDER BY c.name ASC',
      parameters: []
    };

    return this.query(querySpec, options);
  }

  /**
   * Get trails by risk level
   */
  async getTrailsByRiskLevel(
    minRisk: number = 1,
    maxRisk: number = 5,
    options: QueryOptions = {}
  ): Promise<QueryResult<Trail>> {
    const querySpec: SqlQuerySpec = {
      query: `
        SELECT * FROM c 
        WHERE c.safety.riskLevel >= @minRisk 
        AND c.safety.riskLevel <= @maxRisk 
        AND c.isActive = true 
        ORDER BY c.safety.riskLevel ASC, c.ratings.average DESC
      `,
      parameters: [
        { name: '@minRisk', value: minRisk },
        { name: '@maxRisk', value: maxRisk }
      ]
    };

    return this.query(querySpec, options);
  }

  /**
   * Get trail statistics by region
   */
  async getTrailStatisticsByRegion(region: string): Promise<{
    total: number;
    byDifficulty: { [difficulty: string]: number };
    averageDistance: number;
    averageElevationGain: number;
    averageRating: number;
  }> {
    const trails = await this.getTrailsByRegion(region);
    const trailList = trails.items;

    const stats = {
      total: trailList.length,
      byDifficulty: {} as { [difficulty: string]: number },
      averageDistance: 0,
      averageElevationGain: 0,
      averageRating: 0
    };

    if (trailList.length === 0) {
      return stats;
    }

    // Count by difficulty
    trailList.forEach(trail => {
      stats.byDifficulty[trail.characteristics.difficulty] = 
        (stats.byDifficulty[trail.characteristics.difficulty] || 0) + 1;
    });

    // Calculate averages
    const totalDistance = trailList.reduce((sum, trail) => sum + trail.characteristics.distance, 0);
    const totalElevation = trailList.reduce((sum, trail) => sum + trail.characteristics.elevationGain, 0);
    const totalRating = trailList.reduce((sum, trail) => sum + trail.ratings.average, 0);

    stats.averageDistance = totalDistance / trailList.length;
    stats.averageElevationGain = totalElevation / trailList.length;
    stats.averageRating = totalRating / trailList.length;

    return stats;
  }

  /**
   * Deactivate trail (soft delete)
   */
  async deactivateTrail(trailId: string, region: string): Promise<Trail> {
    return this.update(trailId, region, { isActive: false });
  }
}