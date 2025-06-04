import { CosmosClient, Database, Container, ContainerDefinition } from '@azure/cosmos';
import { config, ContainerConfig } from '../config';

export class DatabaseService {
  private client: CosmosClient;
  private database: Database | null = null;
  private containers: Map<string, Container> = new Map();

  constructor() {
    this.client = new CosmosClient({
      endpoint: config.azure.cosmosDb.endpoint,
      key: config.azure.cosmosDb.key
    });
  }

  /**
   * Initialize the database and all containers
   */
  async initialize(): Promise<void> {
    try {
      console.log('Initializing database connection...');
      
      // Create or get database
      const { database } = await this.client.databases.createIfNotExists({
        id: config.azure.cosmosDb.databaseName
      });
      this.database = database;
      
      console.log(`Database '${config.azure.cosmosDb.databaseName}' initialized`);

      // Create all containers
      await this.setupContainers();
      
      console.log('Database initialization complete');
    } catch (error) {
      console.error('Failed to initialize database:', error);
      throw error;
    }
  }

  /**
   * Set up all containers with proper configuration
   */
  private async setupContainers(): Promise<void> {
    const containerConfigs = Object.values(config.containers);
    
    for (const containerConfig of containerConfigs) {
      await this.createContainer(containerConfig);
    }
  }

  /**
   * Create a single container with the specified configuration
   */
  private async createContainer(containerConfig: ContainerConfig): Promise<void> {
    if (!this.database) {
      throw new Error('Database not initialized');
    }

    try {
      const containerDefinition: ContainerDefinition = {
        id: containerConfig.id,
        partitionKey: { paths: [containerConfig.partitionKey] }
      };

      if (containerConfig.defaultTtl !== undefined) {
        containerDefinition.defaultTtl = containerConfig.defaultTtl;
      }

      const { container } = await this.database.containers.createIfNotExists(
        containerDefinition,
        { offerThroughput: containerConfig.throughput }
      );

      this.containers.set(containerConfig.id, container);
      console.log(`Container '${containerConfig.id}' initialized with ${containerConfig.throughput} RU/s`);
    } catch (error) {
      console.error(`Failed to create container '${containerConfig.id}':`, error);
      throw error;
    }
  }

  /**
   * Get a container by name
   */
  getContainer(containerName: string): Container {
    const container = this.containers.get(containerName);
    if (!container) {
      throw new Error(`Container '${containerName}' not found. Ensure database is initialized.`);
    }
    return container;
  }

  /**
   * Get all container instances
   */
  getAllContainers(): Map<string, Container> {
    return new Map(this.containers);
  }

  /**
   * Check if the database service is initialized
   */
  isInitialized(): boolean {
    return this.database !== null && this.containers.size > 0;
  }

  /**
   * Health check method
   */
  async healthCheck(): Promise<{ status: string; details: any }> {
    try {
      if (!this.database) {
        return { status: 'unhealthy', details: 'Database not initialized' };
      }

      // Simple read operation to test connectivity
      await this.database.read();
      
      const containerStatuses = Array.from(this.containers.entries()).map(([name, container]) => ({
        name,
        initialized: !!container
      }));

      return {
        status: 'healthy',
        details: {
          database: config.azure.cosmosDb.databaseName,
          endpoint: config.azure.cosmosDb.endpoint,
          containers: containerStatuses
        }
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        details: {
          error: error instanceof Error ? error.message : 'Unknown error',
          database: config.azure.cosmosDb.databaseName,
          endpoint: config.azure.cosmosDb.endpoint
        }
      };
    }
  }

  /**
   * Close database connections (for graceful shutdown)
   */
  async close(): Promise<void> {
    try {
      // CosmosClient doesn't have an explicit close method
      // Clear references to allow garbage collection
      this.containers.clear();
      this.database = null;
      console.log('Database connections closed');
    } catch (error) {
      console.error('Error closing database connections:', error);
      throw error;
    }
  }
}

// Singleton instance
let databaseService: DatabaseService | null = null;

/**
 * Get the singleton database service instance
 */
export function getDatabaseService(): DatabaseService {
  if (!databaseService) {
    databaseService = new DatabaseService();
  }
  return databaseService;
}

/**
 * Initialize the database service (call once at application startup)
 */
export async function initializeDatabaseService(): Promise<DatabaseService> {
  const service = getDatabaseService();
  await service.initialize();
  return service;
}