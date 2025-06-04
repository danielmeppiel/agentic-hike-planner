import { getDatabaseService } from './database';
import { UserRepository, TripRepository, TrailRepository, RecommendationRepository } from '../repositories';

export class RepositoryFactory {
  private static instance: RepositoryFactory | null = null;
  private userRepository: UserRepository | null = null;
  private tripRepository: TripRepository | null = null;
  private trailRepository: TrailRepository | null = null;
  private recommendationRepository: RecommendationRepository | null = null;

  private constructor() {
    // Private constructor for singleton pattern
  }

  /**
   * Get the singleton instance
   */
  static getInstance(): RepositoryFactory {
    if (!RepositoryFactory.instance) {
      RepositoryFactory.instance = new RepositoryFactory();
    }
    return RepositoryFactory.instance;
  }

  /**
   * Get User Repository
   */
  getUserRepository(): UserRepository {
    if (!this.userRepository) {
      const databaseService = getDatabaseService();
      const container = databaseService.getContainer('users');
      this.userRepository = new UserRepository(container);
    }
    return this.userRepository;
  }

  /**
   * Get Trip Repository
   */
  getTripRepository(): TripRepository {
    if (!this.tripRepository) {
      const databaseService = getDatabaseService();
      const container = databaseService.getContainer('trips');
      this.tripRepository = new TripRepository(container);
    }
    return this.tripRepository;
  }

  /**
   * Get Trail Repository
   */
  getTrailRepository(): TrailRepository {
    if (!this.trailRepository) {
      const databaseService = getDatabaseService();
      const container = databaseService.getContainer('trails');
      this.trailRepository = new TrailRepository(container);
    }
    return this.trailRepository;
  }

  /**
   * Get Recommendation Repository
   */
  getRecommendationRepository(): RecommendationRepository {
    if (!this.recommendationRepository) {
      const databaseService = getDatabaseService();
      const container = databaseService.getContainer('recommendations');
      this.recommendationRepository = new RecommendationRepository(container);
    }
    return this.recommendationRepository;
  }

  /**
   * Get all repositories
   */
  getAllRepositories() {
    return {
      userRepository: this.getUserRepository(),
      tripRepository: this.getTripRepository(),
      trailRepository: this.getTrailRepository(),
      recommendationRepository: this.getRecommendationRepository()
    };
  }

  /**
   * Clear all repository instances (useful for testing)
   */
  clearInstances(): void {
    this.userRepository = null;
    this.tripRepository = null;
    this.trailRepository = null;
    this.recommendationRepository = null;
  }
}

/**
 * Convenience function to get repository factory instance
 */
export function getRepositoryFactory(): RepositoryFactory {
  return RepositoryFactory.getInstance();
}