import { CosmosClient, Database, Container, ContainerDefinition } from '@azure/cosmos';
import { config } from '../config';

/**
 * Azure Cosmos DB service for managing database connections and operations
 */
export class DatabaseService {
  private client: CosmosClient;
  private database: Database | null = null;
  private containers: Map<string, Container> = new Map();

  constructor() {
    this.client = new CosmosClient({
      endpoint: config.azure.cosmosDb.endpoint,
      key: config.azure.cosmosDb.key,
    });
  }

  /**
   * Initialize the database and containers
   */
  async initialize(): Promise<void> {
    try {
      console.log('Initializing Cosmos DB...');
      
      // Create database if it doesn't exist
      const { database } = await this.client.databases.createIfNotExists({
        id: 'agentic-hike-planner',
        throughput: 400, // Shared throughput for cost optimization
      });
      
      this.database = database;
      console.log('Database initialized successfully');

      // Setup containers
      await this.setupContainers();
      console.log('All containers initialized successfully');
      
    } catch (error) {
      console.error('Failed to initialize Cosmos DB:', error);
      throw error;
    }
  }

  /**
   * Setup all required containers with proper configuration
   */
  private async setupContainers(): Promise<void> {
    if (!this.database) {
      throw new Error('Database not initialized');
    }

    const containerDefinitions: ContainerDefinition[] = [
      {
        id: 'users',
        partitionKey: '/partitionKey',
        indexingPolicy: {
          indexingMode: 'consistent',
          automatic: true,
          includedPaths: [
            { path: '/*' },
          ],
          excludedPaths: [
            { path: '/preferences/terrainTypes/*' },
            { path: '/location/coordinates/*' },
          ],
          compositeIndexes: [
            [
              { path: '/fitnessLevel', order: 'ascending' },
              { path: '/location/region', order: 'ascending' },
            ],
          ],
        },
      },
      {
        id: 'trips',
        partitionKey: '/partitionKey',
        indexingPolicy: {
          indexingMode: 'consistent',
          automatic: true,
          includedPaths: [
            { path: '/*' },
          ],
          excludedPaths: [
            { path: '/equipment/*' },
            { path: '/location/coordinates/*' },
          ],
          compositeIndexes: [
            [
              { path: '/userId', order: 'ascending' },
              { path: '/status', order: 'ascending' },
              { path: '/dates/startDate', order: 'ascending' },
            ],
          ],
        },
      },
      {
        id: 'trails',
        partitionKey: '/partitionKey',
        indexingPolicy: {
          indexingMode: 'consistent',
          automatic: true,
          includedPaths: [
            { path: '/*' },
          ],
          excludedPaths: [
            { path: '/location/coordinates/waypoints/*' },
            { path: '/characteristics/elevationProfile/*' },
          ],
          compositeIndexes: [
            [
              { path: '/location/region', order: 'ascending' },
              { path: '/characteristics/difficulty', order: 'ascending' },
              { path: '/characteristics/distance', order: 'ascending' },
            ],
            [
              { path: '/characteristics/difficulty', order: 'ascending' },
              { path: '/ratings/average', order: 'descending' },
            ],
          ],
          spatialIndexes: [
            {
              path: '/location/coordinates/start/*',
              types: ['Point'],
            },
          ],
        },
      },
      {
        id: 'recommendations',
        partitionKey: '/partitionKey',
        defaultTtl: 2592000, // 30 days TTL for recommendations
        indexingPolicy: {
          indexingMode: 'consistent',
          automatic: true,
          includedPaths: [
            { path: '/*' },
          ],
          excludedPaths: [
            { path: '/reasoning' },
            { path: '/alternatives/*/reason' },
          ],
          compositeIndexes: [
            [
              { path: '/userId', order: 'ascending' },
              { path: '/confidence', order: 'descending' },
              { path: '/createdAt', order: 'descending' },
            ],
          ],
        },
      },
    ];

    // Create containers
    for (const containerDef of containerDefinitions) {
      try {
        const { container } = await this.database.containers.createIfNotExists(containerDef);
        this.containers.set(containerDef.id, container);
        console.log(`Container '${containerDef.id}' initialized successfully`);
      } catch (error) {
        console.error(`Failed to initialize container '${containerDef.id}':`, error);
        throw error;
      }
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
   * Get the database instance
   */
  getDatabase(): Database {
    if (!this.database) {
      throw new Error('Database not initialized. Call initialize() first.');
    }
    return this.database;
  }

  /**
   * Check if the service is initialized
   */
  isInitialized(): boolean {
    return this.database !== null && this.containers.size > 0;
  }

  /**
   * Close the connection (cleanup)
   */
  async close(): Promise<void> {
    // Cosmos DB client doesn't require explicit cleanup
    this.database = null;
    this.containers.clear();
    console.log('Database service closed');
  }
}

// Singleton instance
export const databaseService = new DatabaseService();