import { Container, SqlQuerySpec } from '@azure/cosmos';
import { AIRecommendation, CreateAIRecommendationInput, UpdateAIRecommendationInput } from '../types';
import { BaseRepository, QueryResult, QueryOptions } from './BaseRepository';

export class RecommendationRepository extends BaseRepository<AIRecommendation> {
  constructor(container: Container) {
    super(container);
  }

  /**
   * Create a new AI recommendation
   */
  async createRecommendation(input: CreateAIRecommendationInput): Promise<AIRecommendation> {
    const now = new Date();
    const defaultExpiryDays = 7; // Default 7 days expiry
    const defaultExpiry = new Date(now.getTime() + defaultExpiryDays * 24 * 60 * 60 * 1000);

    const recommendationInput = {
      ...input,
      partitionKey: input.userId, // Use userId as partition key for user-specific queries
      alternatives: input.alternatives || [],
      expiresAt: input.expiresAt || defaultExpiry
    };

    return this.create(recommendationInput);
  }

  /**
   * Get recommendations for a user
   */
  async getRecommendationsByUserId(userId: string, options: QueryOptions = {}): Promise<QueryResult<AIRecommendation>> {
    const now = new Date();
    const querySpec: SqlQuerySpec = {
      query: 'SELECT * FROM c WHERE c.userId = @userId AND c.expiresAt > @now ORDER BY c.createdAt DESC',
      parameters: [
        { name: '@userId', value: userId },
        { name: '@now', value: now.toISOString() }
      ]
    };

    return this.query(querySpec, options);
  }

  /**
   * Get recommendations for a specific trip
   */
  async getRecommendationsByTripId(
    userId: string, 
    tripId: string, 
    options: QueryOptions = {}
  ): Promise<QueryResult<AIRecommendation>> {
    const now = new Date();
    const querySpec: SqlQuerySpec = {
      query: 'SELECT * FROM c WHERE c.userId = @userId AND c.tripId = @tripId AND c.expiresAt > @now ORDER BY c.confidence DESC',
      parameters: [
        { name: '@userId', value: userId },
        { name: '@tripId', value: tripId },
        { name: '@now', value: now.toISOString() }
      ]
    };

    return this.query(querySpec, options);
  }

  /**
   * Get recommendations by confidence level
   */
  async getRecommendationsByConfidence(
    userId: string,
    minConfidence: number,
    options: QueryOptions = {}
  ): Promise<QueryResult<AIRecommendation>> {
    const now = new Date();
    const querySpec: SqlQuerySpec = {
      query: `
        SELECT * FROM c 
        WHERE c.userId = @userId 
        AND c.confidence >= @minConfidence 
        AND c.expiresAt > @now 
        ORDER BY c.confidence DESC, c.createdAt DESC
      `,
      parameters: [
        { name: '@userId', value: userId },
        { name: '@minConfidence', value: minConfidence },
        { name: '@now', value: now.toISOString() }
      ]
    };

    return this.query(querySpec, options);
  }

  /**
   * Get recommendations containing specific trails
   */
  async getRecommendationsByTrails(
    trailIds: string[],
    options: QueryOptions = {}
  ): Promise<QueryResult<AIRecommendation>> {
    const now = new Date();
    const querySpec: SqlQuerySpec = {
      query: `
        SELECT * FROM c 
        WHERE EXISTS(SELECT VALUE t FROM t IN c.trailIds WHERE t IN (@trailIds))
        AND c.expiresAt > @now 
        ORDER BY c.confidence DESC
      `,
      parameters: [
        { name: '@trailIds', value: trailIds },
        { name: '@now', value: now.toISOString() }
      ]
    };

    return this.query(querySpec, options);
  }

  /**
   * Get high-quality recommendations (high confidence + good factor scores)
   */
  async getHighQualityRecommendations(
    userId: string,
    minConfidence: number = 0.7,
    minFactorScore: number = 0.6,
    options: QueryOptions = {}
  ): Promise<QueryResult<AIRecommendation>> {
    const now = new Date();
    const querySpec: SqlQuerySpec = {
      query: `
        SELECT * FROM c 
        WHERE c.userId = @userId 
        AND c.confidence >= @minConfidence 
        AND c.factors.fitnessMatch >= @minFactorScore
        AND c.factors.preferenceAlignment >= @minFactorScore
        AND c.expiresAt > @now 
        ORDER BY c.confidence DESC, 
                 (c.factors.fitnessMatch + c.factors.preferenceAlignment + c.factors.seasonalSuitability + c.factors.safetyConsiderations) DESC
      `,
      parameters: [
        { name: '@userId', value: userId },
        { name: '@minConfidence', value: minConfidence },
        { name: '@minFactorScore', value: minFactorScore },
        { name: '@now', value: now.toISOString() }
      ]
    };

    return this.query(querySpec, options);
  }

  /**
   * Get recent recommendations (created within last N days)
   */
  async getRecentRecommendations(
    userId: string,
    days: number = 7,
    options: QueryOptions = {}
  ): Promise<QueryResult<AIRecommendation>> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    const now = new Date();

    const querySpec: SqlQuerySpec = {
      query: `
        SELECT * FROM c 
        WHERE c.userId = @userId 
        AND c.createdAt >= @cutoffDate 
        AND c.expiresAt > @now 
        ORDER BY c.createdAt DESC
      `,
      parameters: [
        { name: '@userId', value: userId },
        { name: '@cutoffDate', value: cutoffDate.toISOString() },
        { name: '@now', value: now.toISOString() }
      ]
    };

    return this.query(querySpec, options);
  }

  /**
   * Update recommendation confidence
   */
  async updateRecommendationConfidence(
    recommendationId: string,
    userId: string,
    newConfidence: number
  ): Promise<AIRecommendation> {
    if (newConfidence < 0 || newConfidence > 1) {
      throw new Error('Confidence must be between 0 and 1');
    }

    return this.update(recommendationId, userId, { confidence: newConfidence });
  }

  /**
   * Add alternative trail to recommendation
   */
  async addAlternativeTrail(
    recommendationId: string,
    userId: string,
    alternative: { trailId: string; reason: string; confidence: number }
  ): Promise<AIRecommendation> {
    const recommendation = await this.getById(recommendationId, userId);
    if (!recommendation) {
      throw new Error(`Recommendation with id ${recommendationId} not found`);
    }

    const updatedAlternatives = [...recommendation.alternatives, alternative];
    return this.update(recommendationId, userId, { alternatives: updatedAlternatives });
  }

  /**
   * Remove alternative trail from recommendation
   */
  async removeAlternativeTrail(
    recommendationId: string,
    userId: string,
    trailId: string
  ): Promise<AIRecommendation> {
    const recommendation = await this.getById(recommendationId, userId);
    if (!recommendation) {
      throw new Error(`Recommendation with id ${recommendationId} not found`);
    }

    const filteredAlternatives = recommendation.alternatives.filter(alt => alt.trailId !== trailId);
    return this.update(recommendationId, userId, { alternatives: filteredAlternatives });
  }

  /**
   * Extend expiry date of a recommendation
   */
  async extendExpiry(
    recommendationId: string,
    userId: string,
    additionalDays: number
  ): Promise<AIRecommendation> {
    const recommendation = await this.getById(recommendationId, userId);
    if (!recommendation) {
      throw new Error(`Recommendation with id ${recommendationId} not found`);
    }

    const newExpiryDate = new Date(recommendation.expiresAt);
    newExpiryDate.setDate(newExpiryDate.getDate() + additionalDays);

    return this.update(recommendationId, userId, { expiresAt: newExpiryDate });
  }

  /**
   * Get expired recommendations for cleanup
   */
  async getExpiredRecommendations(options: QueryOptions = {}): Promise<QueryResult<AIRecommendation>> {
    const now = new Date();
    const querySpec: SqlQuerySpec = {
      query: 'SELECT * FROM c WHERE c.expiresAt <= @now ORDER BY c.expiresAt ASC',
      parameters: [
        { name: '@now', value: now.toISOString() }
      ]
    };

    return this.query(querySpec, options);
  }

  /**
   * Clean up expired recommendations
   */
  async cleanupExpiredRecommendations(): Promise<number> {
    const expiredRecommendations = await this.getExpiredRecommendations();
    let deletedCount = 0;

    for (const recommendation of expiredRecommendations.items) {
      try {
        await this.delete(recommendation.id, recommendation.partitionKey);
        deletedCount++;
      } catch (error) {
        console.error(`Failed to delete expired recommendation ${recommendation.id}:`, error);
      }
    }

    return deletedCount;
  }

  /**
   * Get recommendation statistics for a user
   */
  async getUserRecommendationStatistics(userId: string): Promise<{
    total: number;
    active: number;
    expired: number;
    averageConfidence: number;
    topFactors: { [factor: string]: number };
  }> {
    const allRecommendations = await this.getByPartitionKey(userId);
    const recommendations = allRecommendations.items;
    const now = new Date();

    const stats = {
      total: recommendations.length,
      active: 0,
      expired: 0,
      averageConfidence: 0,
      topFactors: {
        fitnessMatch: 0,
        preferenceAlignment: 0,
        seasonalSuitability: 0,
        safetyConsiderations: 0
      }
    };

    if (recommendations.length === 0) {
      return stats;
    }

    // Count active vs expired
    recommendations.forEach(rec => {
      if (new Date(rec.expiresAt) > now) {
        stats.active++;
      } else {
        stats.expired++;
      }
    });

    // Calculate averages
    const totalConfidence = recommendations.reduce((sum, rec) => sum + rec.confidence, 0);
    stats.averageConfidence = totalConfidence / recommendations.length;

    // Calculate average factor scores
    const factorSums = recommendations.reduce((sums, rec) => ({
      fitnessMatch: sums.fitnessMatch + rec.factors.fitnessMatch,
      preferenceAlignment: sums.preferenceAlignment + rec.factors.preferenceAlignment,
      seasonalSuitability: sums.seasonalSuitability + rec.factors.seasonalSuitability,
      safetyConsiderations: sums.safetyConsiderations + rec.factors.safetyConsiderations
    }), { fitnessMatch: 0, preferenceAlignment: 0, seasonalSuitability: 0, safetyConsiderations: 0 });

    stats.topFactors = {
      fitnessMatch: factorSums.fitnessMatch / recommendations.length,
      preferenceAlignment: factorSums.preferenceAlignment / recommendations.length,
      seasonalSuitability: factorSums.seasonalSuitability / recommendations.length,
      safetyConsiderations: factorSums.safetyConsiderations / recommendations.length
    };

    return stats;
  }
}