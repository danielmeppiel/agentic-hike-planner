import { Container, SqlQuerySpec } from '@azure/cosmos';
import { BaseRepository } from './BaseRepository';
import { AIRecommendation, GenerateRecommendationRequest, RecommendationFeedback } from '../types';

/**
 * Repository for managing AI-generated recommendations with automatic expiration.
 * 
 * ## Partition Key Strategy
 * 
 * Uses **userId as partition key** for user-centric recommendation access:
 * - All user recommendations are co-located for efficient queries
 * - Supports user-scoped recommendation management
 * - Enables personalization features within single partitions
 * - Aligns with user journey and experience patterns
 * 
 * ## Time-To-Live (TTL) Strategy
 * 
 * Implements automatic data lifecycle management:
 * ```json
 * {
 *   "defaultTtl": 2592000,  // 30 days in seconds
 *   "ttlPropertyPath": "/expiresAt"
 * }
 * ```
 * 
 * ### TTL Benefits
 * - **Automatic cleanup**: Expired recommendations are automatically deleted
 * - **Cost optimization**: Reduces storage costs for stale data
 * - **Privacy compliance**: Ensures temporary data doesn't persist indefinitely
 * - **Performance maintenance**: Keeps working set size manageable
 * 
 * ### TTL Implementation Patterns
 * - Set `expiresAt` field to Unix timestamp for custom expiration
 * - Use null/undefined `expiresAt` to prevent automatic deletion
 * - Container-level TTL as fallback for documents without explicit expiration
 * - Monitor TTL effectiveness through Cosmos DB metrics
 * 
 * ## Indexing Strategy
 * 
 * Optimized for recommendation retrieval and analysis:
 * ```json
 * {
 *   "indexingPolicy": {
 *     "includedPaths": [
 *       { "path": "/userId/?" },        // Hash index for user filtering
 *       { "path": "/tripId/?" },        // Hash index for trip-specific recommendations
 *       { "path": "/confidence/?" },    // Range index for quality sorting
 *       { "path": "/createdAt/?" },     // Range index for temporal queries
 *       { "path": "/expiresAt/?" },     // Range index for TTL queries
 *       { "path": "/type/?" },          // Hash index for recommendation categorization
 *       { "path": "/feedback/rating/?" } // Range index for effectiveness analysis
 *     ]
 *   }
 * }
 * ```
 * 
 * ## Recommendation Lifecycle
 * 
 * ```
 * AI Generation → Storage → User Interaction → Feedback → Expiration
 *       ↓            ↓           ↓             ↓           ↓
 *   Algorithm     Database    UI Display   Analytics   Auto-Delete
 *   Processing    Insert      & Actions    Collection   (TTL)
 * ```
 * 
 * ## Machine Learning Integration Patterns
 * 
 * ### Recommendation Quality Tracking
 * - Confidence scores from ML models
 * - User feedback collection (rating, usefulness)
 * - Click-through and conversion tracking
 * - A/B testing support for algorithm improvements
 * 
 * ### Personalization Features
 * - User preference learning from interactions
 * - Contextual recommendations based on trip data
 * - Seasonal and temporal relevance adjustments
 * - Social and collaborative filtering integration
 * 
 * @example
 * ```typescript
 * const recommendationRepository = new RecommendationRepository(container);
 * 
 * // Create AI recommendation with TTL
 * const recommendation = await recommendationRepository.create({
 *   userId: 'user-789',
 *   tripId: 'trip-456', 
 *   type: 'trail-suggestion',
 *   content: {
 *     recommendations: [
 *       { trailId: 'trail-123', score: 0.95, reason: 'Perfect difficulty match' }
 *     ]
 *   },
 *   confidence: 0.87,
 *   source: 'ml-recommendation-engine-v2',
 *   expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
 * });
 * 
 * // Efficient user recommendation queries (single-partition)
 * const userRecs = await recommendationRepository.findByUserId('user-789');
 * const tripRecs = await recommendationRepository.findByTripId('trip-456', 'user-789');
 * ```
 */
export class RecommendationRepository extends BaseRepository<AIRecommendation> {
  /**
   * Initializes the RecommendationRepository with the specified Cosmos DB container.
   * 
   * @param container - The Cosmos DB container configured for AI recommendations with TTL
   */
  constructor(container: Container) {
    super(container);
  }

  /**
   * Creates a new AI recommendation with automatic TTL management.
   * 
   * ## TTL Implementation
   * - Sets partition key to userId for efficient user-scoped queries
   * - Inherits automatic expiration from container TTL (30 days default)
   * - Custom expiration can be set via expiresAt field
   * - Automatic cleanup reduces storage costs and maintains data freshness
   * 
   * ## Recommendation Metadata
   * - Confidence scores for ML model evaluation
   * - Source tracking for algorithm attribution
   * - Structured content for flexible recommendation types
   * - Trip association for contextual relevance
   * 
   * @param recommendationData - AI recommendation data without system-generated fields
   * @returns Promise resolving to the created recommendation with TTL
   * @throws Error if recommendation creation fails
   * 
   * @example
   * ```typescript
   * const weatherRec = await recommendationRepository.create({
   *   userId: 'user-123',
   *   tripId: 'trip-456',
   *   type: 'weather-advisory',
   *   content: {
   *     message: 'Rain expected on day 3, consider waterproof gear',
   *     priority: 'high',
   *     actionable: true
   *   },
   *   confidence: 0.92,
   *   source: 'weather-ai-v1',
   *   expiresAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) // 3 days
   * });
   * ```
   */
  async create(recommendationData: Omit<AIRecommendation, 'id' | 'partitionKey' | 'createdAt' | 'updatedAt'>): Promise<AIRecommendation> {
    const recommendationDocument = {
      ...recommendationData,
      partitionKey: recommendationData.userId,
    };

    return await super.create(recommendationDocument);
  }

  /**
   * Retrieves active (non-expired) recommendations for a specific user.
   * 
   * ## TTL-Aware Query Pattern
   * 
   * Automatically filters out expired recommendations:
   * ```sql
   * SELECT * FROM c 
   * WHERE c.userId = @userId 
   * AND c.expiresAt > @now 
   * ORDER BY c.createdAt DESC
   * ```
   * 
   * ## Single-Partition Efficiency
   * - Uses userId as partition key for optimal performance
   * - No cross-partition scanning required
   * - Minimal RU consumption for user's recommendations
   * - Consistent low latency for personalized experiences
   * 
   * ## Expiration Handling
   * - Only returns recommendations that haven't reached expiresAt timestamp
   * - Expired recommendations remain until TTL cleanup (up to container TTL)
   * - Consider manual cleanup for immediate consistency if needed
   * 
   * @param userId - The user ID to retrieve recommendations for
   * @param limit - Maximum number of recommendations per page (default: 20)
   * @param continuationToken - Token from previous page for pagination
   * @returns Promise resolving to paginated active recommendations
   * @throws Error if query execution fails
   * 
   * @example
   * ```typescript
   * // Get user's current recommendations
   * const activeRecs = await recommendationRepository.findByUserId('user-123');
   * 
   * // Process recommendations by type
   * const groupedRecs = activeRecs.recommendations.reduce((groups, rec) => {
   *   const type = rec.type;
   *   groups[type] = groups[type] || [];
   *   groups[type].push(rec);
   *   return groups;
   * }, {});
   * 
   * console.log(`Trail suggestions: ${groupedRecs['trail-suggestion']?.length || 0}`);
   * console.log(`Weather advisories: ${groupedRecs['weather-advisory']?.length || 0}`);
   * ```
   */
  async findByUserId(userId: string, limit: number = 20, continuationToken?: string): Promise<{
    recommendations: AIRecommendation[];
    continuationToken?: string;
    hasMore: boolean;
  }> {
    const querySpec: SqlQuerySpec = {
      query: 'SELECT * FROM c WHERE c.userId = @userId AND c.expiresAt > @now ORDER BY c.createdAt DESC',
      parameters: [
        { name: '@userId', value: userId },
        { name: '@now', value: new Date().toISOString() },
      ],
    };

    const result = await this.queryWithPagination(querySpec, limit, continuationToken, userId);
    
    return {
      recommendations: result.items,
      continuationToken: result.continuationToken,
      hasMore: result.hasMore,
    };
  }

  async findByTripId(tripId: string, userId: string): Promise<AIRecommendation[]> {
    const querySpec: SqlQuerySpec = {
      query: 'SELECT * FROM c WHERE c.userId = @userId AND c.tripId = @tripId AND c.expiresAt > @now ORDER BY c.confidence DESC',
      parameters: [
        { name: '@userId', value: userId },
        { name: '@tripId', value: tripId },
        { name: '@now', value: new Date().toISOString() },
      ],
    };

    return await this.query(querySpec, userId);
  }

  async findHighConfidenceRecommendations(
    userId: string, 
    minConfidence: number = 0.7, 
    limit: number = 10
  ): Promise<AIRecommendation[]> {
    const querySpec: SqlQuerySpec = {
      query: `
        SELECT * FROM c 
        WHERE c.userId = @userId 
        AND c.confidence >= @minConfidence 
        AND c.expiresAt > @now
        ORDER BY c.confidence DESC
      `,
      parameters: [
        { name: '@userId', value: userId },
        { name: '@minConfidence', value: minConfidence },
        { name: '@now', value: new Date().toISOString() },
      ],
    };

    const result = await this.queryWithPagination(querySpec, limit, undefined, userId);
    return result.items;
  }

  async findRecommendationsForTrail(trailId: string, limit: number = 20): Promise<AIRecommendation[]> {
    const querySpec: SqlQuerySpec = {
      query: `
        SELECT * FROM c 
        WHERE ARRAY_CONTAINS(c.trailIds, @trailId) 
        AND c.expiresAt > @now
        ORDER BY c.confidence DESC
      `,
      parameters: [
        { name: '@trailId', value: trailId },
        { name: '@now', value: new Date().toISOString() },
      ],
    };

    const result = await this.queryWithPagination(querySpec, limit);
    return result.items;
  }

  async findExpiredRecommendations(limit: number = 100): Promise<AIRecommendation[]> {
    const querySpec: SqlQuerySpec = {
      query: 'SELECT * FROM c WHERE c.expiresAt <= @now ORDER BY c.expiresAt ASC',
      parameters: [{ name: '@now', value: new Date().toISOString() }],
    };

    const result = await this.queryWithPagination(querySpec, limit);
    return result.items;
  }

  async deleteExpiredRecommendations(): Promise<number> {
    const expiredRecommendations = await this.findExpiredRecommendations(1000);
    let deletedCount = 0;

    for (const recommendation of expiredRecommendations) {
      try {
        await this.delete(recommendation.id, recommendation.partitionKey);
        deletedCount++;
      } catch (error) {
        console.error(`Failed to delete expired recommendation ${recommendation.id}:`, error);
      }
    }

    return deletedCount;
  }

  async extendRecommendationExpiry(recommendationId: string, userId: string, additionalDays: number = 7): Promise<AIRecommendation> {
    const recommendation = await this.findById(recommendationId, userId);
    if (!recommendation) {
      throw new Error('Recommendation not found');
    }

    const newExpiryDate = new Date(recommendation.expiresAt);
    newExpiryDate.setDate(newExpiryDate.getDate() + additionalDays);

    return await this.update(recommendationId, userId, {
      expiresAt: newExpiryDate,
    });
  }

  async updateRecommendationWithFeedback(
    recommendationId: string, 
    userId: string, 
    feedback: RecommendationFeedback
  ): Promise<AIRecommendation> {
    const recommendation = await this.findById(recommendationId, userId);
    if (!recommendation) {
      throw new Error('Recommendation not found');
    }

    // In a real implementation, this feedback would be used to improve future recommendations
    // For now, we'll just store it as metadata
    const updates: Partial<AIRecommendation> = {
      // Store feedback in a metadata field (would need to add this to the interface)
      // feedback: feedback
    };

    // If the user selected a trail, we might want to boost confidence in similar recommendations
    if (feedback.selectedTrail) {
      // Logic to update recommendation based on selected trail
    }

    return await this.update(recommendationId, userId, updates);
  }

  async getRecommendationStats(userId: string): Promise<{
    total: number;
    active: number;
    expired: number;
    averageConfidence: number;
    topFactors: {
      fitnessMatch: number;
      preferenceAlignment: number;
      seasonalSuitability: number;
      safetyConsiderations: number;
    };
  }> {
    const allRecommendationsQuery: SqlQuerySpec = {
      query: 'SELECT c.confidence, c.factors, c.expiresAt FROM c WHERE c.userId = @userId',
      parameters: [{ name: '@userId', value: userId }],
    };

    const recommendations = await this.query(allRecommendationsQuery, userId);
    const now = new Date();

    let totalConfidence = 0;
    let active = 0;
    let expired = 0;
    const factorSums = {
      fitnessMatch: 0,
      preferenceAlignment: 0,
      seasonalSuitability: 0,
      safetyConsiderations: 0,
    };

    recommendations.forEach(rec => {
      totalConfidence += rec.confidence;
      
      if (new Date(rec.expiresAt) > now) {
        active++;
      } else {
        expired++;
      }

      factorSums.fitnessMatch += rec.factors.fitnessMatch;
      factorSums.preferenceAlignment += rec.factors.preferenceAlignment;
      factorSums.seasonalSuitability += rec.factors.seasonalSuitability;
      factorSums.safetyConsiderations += rec.factors.safetyConsiderations;
    });

    const total = recommendations.length;
    const averageConfidence = total > 0 ? totalConfidence / total : 0;

    return {
      total,
      active,
      expired,
      averageConfidence: Math.round(averageConfidence * 100) / 100,
      topFactors: {
        fitnessMatch: total > 0 ? Math.round((factorSums.fitnessMatch / total) * 100) / 100 : 0,
        preferenceAlignment: total > 0 ? Math.round((factorSums.preferenceAlignment / total) * 100) / 100 : 0,
        seasonalSuitability: total > 0 ? Math.round((factorSums.seasonalSuitability / total) * 100) / 100 : 0,
        safetyConsiderations: total > 0 ? Math.round((factorSums.safetyConsiderations / total) * 100) / 100 : 0,
      },
    };
  }

  async findSimilarRecommendations(
    userId: string, 
    trailIds: string[], 
    confidenceThreshold: number = 0.6,
    limit: number = 5
  ): Promise<AIRecommendation[]> {
    // Find recommendations that share similar trails
    const querySpec: SqlQuerySpec = {
      query: `
        SELECT * FROM c 
        WHERE c.userId = @userId 
        AND c.confidence >= @confidenceThreshold
        AND c.expiresAt > @now
        AND EXISTS(
          SELECT VALUE trail 
          FROM trail IN c.trailIds 
          WHERE trail IN (@trailIds)
        )
        ORDER BY c.confidence DESC
      `,
      parameters: [
        { name: '@userId', value: userId },
        { name: '@confidenceThreshold', value: confidenceThreshold },
        { name: '@now', value: new Date().toISOString() },
        { name: '@trailIds', value: trailIds },
      ],
    };

    const result = await this.queryWithPagination(querySpec, limit, undefined, userId);
    return result.items;
  }
}