import { CosmosClient, Database, Container, ContainerDefinition } from '@azure/cosmos';
import { DefaultAzureCredential, ClientSecretCredential } from '@azure/identity';
import { config } from '../config';

/**
 * Service responsible for managing Azure Cosmos DB connections and operations.
 * Handles database initialization, container setup, and provides access to Cosmos DB resources.
 * Supports both Azure AD authentication and access key authentication methods.
 * 
 * @example
 * ```typescript
 * const dbService = new DatabaseService();
 * await dbService.initialize();
 * const container = dbService.getContainer('trails');
 * ```
 */
export class DatabaseService {
  private client: CosmosClient | null = null;
  private database: Database | null = null;
  private containers: Map<string, Container> = new Map();
  private isTestMode: boolean = false;

  /**
   * Creates a new DatabaseService instance and configures Azure Cosmos DB connection.
   * Automatically detects authentication method (Azure AD or access key) based on configuration.
   * 
   * @param testMode - If true, creates a mock service for testing without actual Azure connections
   * @throws Will throw an error if Azure Cosmos DB endpoint is not configured in non-test mode
   * @throws Will throw an error if Azure AD authentication fails and no access key is provided
   * 
   * @example
   * ```typescript
   * // Production use
   * const dbService = new DatabaseService();
   * 
   * // Testing use
   * const testDbService = new DatabaseService(true);
   * ```
   */
  constructor(testMode: boolean = false) {
    this.isTestMode = testMode;
    
    if (!testMode) {
      if (!config.azure.cosmosDb.endpoint) {
        throw new Error('Azure Cosmos DB endpoint is required');
      }

      // Try different authentication methods
      if (config.azure.cosmosDb.key) {
        // Use access key authentication
        this.client = new CosmosClient({
          endpoint: config.azure.cosmosDb.endpoint,
          key: config.azure.cosmosDb.key,
        });
      } else {
        // Use Azure AD authentication with DefaultAzureCredential
        try {
          // Configure DefaultAzureCredential for authentication
          const credential = new DefaultAzureCredential();
          
          this.client = new CosmosClient({
            endpoint: config.azure.cosmosDb.endpoint,
            aadCredentials: credential,
          });
          
          console.log('Using Azure AD authentication for Cosmos DB');
        } catch (error) {
          console.error('Azure AD authentication error:', error);
          throw new Error('Azure Cosmos DB authentication failed. Ensure either access key is provided or Azure AD authentication is configured.');
        }
      }
    }
  }

  /**
   * Initializes the database service by creating the database and setting up containers.
   * Must be called before using any other database operations.
   * 
   * @returns Promise<void>
   * @throws Will throw an error if database creation or container setup fails
   * 
   * @example
   * ```typescript
   * const dbService = new DatabaseService();
   * await dbService.initialize();
   * // Database and containers are now ready for use
   * ```
   */
  async initialize(): Promise<void> {
    if (this.isTestMode) {
      console.log('Database service running in test mode - skipping actual initialization');
      return;
    }

    try {
      // Create database
      const databaseName = config.azure.cosmosDb.databaseName;
      console.log(`Initializing database: ${databaseName}`);
      
      const { database } = await this.client!.databases.createIfNotExists({
        id: databaseName,
      });
      this.database = database;

      // Setup containers
      await this.setupContainers();

      console.log('Database service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize database service:', error);
      throw error;
    }
  }

  /**
   * Sets up all required Cosmos DB containers with their schemas and indexing policies.
   * Creates containers for users, trips, trails, and recommendations with optimized indexing.
   * 
   * @private
   * @returns Promise<void>
   * @throws Will throw an error if any container creation fails
   * 
   * Container schemas:
   * - users: User profiles with indexing on email, fitnessLevel, location
   * - trips: Trip plans with indexing on userId, status, dates, location
   * - trails: Trail data with indexing on difficulty, distance, ratings, location
   * - recommendations: AI recommendations with TTL of 30 days
   */
  private async setupContainers(): Promise<void> {
    if (!this.database) {
      throw new Error('Database not initialized');
    }

    const containerDefinitions: ContainerDefinition[] = [
      {
        id: 'users',
        partitionKey: { paths: ['/partitionKey'] },
        indexingPolicy: {
          includedPaths: [
            { path: '/email/?' },
            { path: '/fitnessLevel/?' },
            { path: '/location/region/?' },
            { path: '/createdAt/?' },
          ],
          excludedPaths: [{ path: '/*' }],
        },
      },
      {
        id: 'trips',
        partitionKey: { paths: ['/partitionKey'] },
        indexingPolicy: {
          includedPaths: [
            { path: '/userId/?' },
            { path: '/status/?' },
            { path: '/dates/startDate/?' },
            { path: '/dates/endDate/?' },
            { path: '/location/region/?' },
            { path: '/createdAt/?' },
          ],
          excludedPaths: [{ path: '/*' }],
        },
      },
      {
        id: 'trails',
        partitionKey: { paths: ['/partitionKey'] },
        indexingPolicy: {
          includedPaths: [
            { path: '/characteristics/difficulty/?' },
            { path: '/characteristics/distance/?' },
            { path: '/characteristics/duration/?' },
            { path: '/location/region/?' },
            { path: '/location/country/?' },
            { path: '/ratings/average/?' },
            { path: '/isActive/?' },
          ],
          excludedPaths: [{ path: '/*' }],
        },
      },
      {
        id: 'recommendations',
        partitionKey: { paths: ['/partitionKey'] },
        indexingPolicy: {
          includedPaths: [
            { path: '/userId/?' },
            { path: '/tripId/?' },
            { path: '/confidence/?' },
            { path: '/createdAt/?' },
            { path: '/expiresAt/?' },
          ],
          excludedPaths: [{ path: '/*' }],
        },
        defaultTtl: 30 * 24 * 60 * 60, // 30 days TTL for recommendations
      },
    ];

    for (const containerDef of containerDefinitions) {
      try {
        const { container } = await this.database.containers.createIfNotExists(containerDef);
        this.containers.set(containerDef.id, container);
        console.log(`Container '${containerDef.id}' initialized`);
      } catch (error) {
        console.error(`Failed to create container '${containerDef.id}':`, error);
        throw error;
      }
    }
  }

  /**
   * Retrieves a Cosmos DB container by name for data operations.
   * Returns a mock container in test mode for unit testing.
   * 
   * @param containerName - Name of the container to retrieve ('users', 'trips', 'trails', 'recommendations')
   * @returns Container instance for data operations
   * @throws Will throw an error if container is not found or database is not initialized
   * 
   * @example
   * ```typescript
   * const trailsContainer = dbService.getContainer('trails');
   * const result = await trailsContainer.items.query('SELECT * FROM c').fetchAll();
   * ```
   */
  getContainer(containerName: string): Container {
    if (this.isTestMode) {
      // Return a mock container for testing
      return {} as Container;
    }
    
    const container = this.containers.get(containerName);
    if (!container) {
      throw new Error(`Container '${containerName}' not found. Make sure database is initialized.`);
    }
    return container;
  }

  /**
   * Performs a health check on the database connection.
   * Tests connectivity by performing a simple read operation on the database.
   * 
   * @returns Promise<{status: string; database: string; authenticationType?: string}> Health status information
   * 
   * @example
   * ```typescript
   * const health = await dbService.healthCheck();
   * console.log(health); 
   * // { status: "healthy", database: "hikedb", authenticationType: "azure-ad" }
   * ```
   */
  async healthCheck(): Promise<{ status: string; database: string; authenticationType?: string }> {
    try {
      if (this.isTestMode) {
        return {
          status: 'healthy (test mode)',
          database: 'test',
          authenticationType: 'test',
        };
      }

      if (!this.database) {
        throw new Error('Database not initialized');
      }

      // Simple read operation to check connectivity
      await this.database.read();
      
      // Determine authentication type
      const authenticationType = config.azure.cosmosDb.key ? 'access-key' : 'azure-ad';
      
      return {
        status: 'healthy',
        database: this.database.id,
        authenticationType,
      };
    } catch (error) {
      console.error('Database health check failed:', error);
      return {
        status: 'unhealthy',
        database: 'unknown',
        authenticationType: 'unknown',
      };
    }
  }

  /**
   * Closes the database connection and cleans up resources.
   * Currently a no-op as Cosmos DB client doesn't require explicit closing.
   * Provided for consistency and future use.
   * 
   * @returns Promise<void>
   * 
   * @example
   * ```typescript
   * await dbService.close();
   * console.log('Database connection closed');
   * ```
   */
  async close(): Promise<void> {
    // Cosmos DB client doesn't require explicit closing
    // This method is here for consistency and future use
    console.log('Database service closed');
  }
}

// Singleton instance - only create if we have credentials
let databaseService: DatabaseService;
try {
  databaseService = new DatabaseService();
} catch (error) {
  // If no credentials, create a test instance
  console.warn('No database credentials found, using test mode');
  databaseService = new DatabaseService(true);
}

// Test instance for testing without credentials
export const testDatabaseService = new DatabaseService(true);

export { databaseService };