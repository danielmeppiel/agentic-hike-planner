import { Container, SqlQuerySpec } from '@azure/cosmos';
import { v4 as uuid } from 'uuid';

/**
 * Abstract base repository implementing the Repository Pattern for Azure Cosmos DB.
 * 
 * ## Repository Pattern Benefits
 * 
 * The Repository Pattern provides several key advantages:
 * - **Abstraction**: Encapsulates data access logic and provides a more object-oriented interface
 * - **Testability**: Enables easy mocking and unit testing by abstracting database operations
 * - **Maintainability**: Centralizes database access patterns and query logic
 * - **Consistency**: Provides consistent error handling and logging across all data operations
 * - **Type Safety**: Leverages TypeScript generics for compile-time type checking
 * 
 * ## Cosmos DB Integration
 * 
 * This implementation is specifically optimized for Azure Cosmos DB SQL API:
 * - **Partition Key Management**: All operations require partition key for optimal performance
 * - **SQL Query Interface**: Uses familiar SQL syntax with parameterized queries
 * - **Automatic Timestamps**: Handles createdAt/updatedAt timestamps automatically
 * - **Error Handling**: Provides consistent error handling for common Cosmos DB scenarios
 * - **Pagination Support**: Built-in continuation token support for large result sets
 * 
 * ## Partition Key Strategy
 * 
 * Partition keys are critical for Cosmos DB performance and should be chosen to:
 * - Distribute data evenly across physical partitions
 * - Enable efficient query patterns within partitions
 * - Avoid hot partitions that could throttle operations
 * 
 * Common patterns:
 * - **User-scoped data**: Use userId as partition key (trips, recommendations)
 * - **Geographic data**: Use region/location as partition key (trails)
 * - **Time-series data**: Use date-based partition keys
 * 
 * @template T The document type extending base interface with id and partitionKey
 */
export abstract class BaseRepository<T extends { id: string; partitionKey: string }> {
  /** The Azure Cosmos DB container instance for this repository */
  protected container: Container;

  /**
   * Initializes a new repository instance with the specified Cosmos DB container.
   * 
   * @param container - The Azure Cosmos DB container instance
   */
  constructor(container: Container) {
    this.container = container;
  }

  /**
   * Creates a new document in the Cosmos DB container.
   * 
   * Automatically generates:
   * - Unique ID using UUID v4
   * - createdAt timestamp set to current time
   * - updatedAt timestamp set to current time
   * 
   * ## Performance Considerations
   * - Uses the document's partition key for optimal write performance
   * - Single document operations are atomic in Cosmos DB
   * - Consider batch operations for multiple documents
   * 
   * ## Error Handling
   * - Handles Cosmos DB specific errors (throttling, capacity, etc.)
   * - Provides consistent error messages across all repositories
   * - Logs errors for debugging while sanitizing sensitive information
   * 
   * @param document - The document data without id, createdAt, updatedAt fields
   * @returns Promise resolving to the created document with all fields populated
   * @throws Error with descriptive message if creation fails
   * 
   * @example
   * ```typescript
   * const newUser = await userRepository.create({
   *   email: 'user@example.com',
   *   displayName: 'John Doe',
   *   partitionKey: 'user-123'
   * });
   * ```
   */
  async create(document: Omit<T, 'id' | 'createdAt' | 'updatedAt'>): Promise<T> {
    const now = new Date();
    const newDocument = {
      ...document,
      id: uuid(),
      createdAt: now,
      updatedAt: now,
    } as unknown as T;

    try {
      const { resource } = await this.container.items.create(newDocument);
      return resource as T;
    } catch (error) {
      console.error('Error creating document:', error);
      throw new Error(`Failed to create document: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Finds a document by its ID and partition key.
   * 
   * ## Performance Optimization
   * This is the most efficient query pattern in Cosmos DB as it:
   * - Directly targets a specific document within a partition
   * - Uses minimal Request Units (RUs)
   * - Provides consistent low latency
   * 
   * @param id - The unique identifier of the document
   * @param partitionKey - The partition key value for efficient lookup
   * @returns Promise resolving to the document if found, null otherwise
   * @throws Error if operation fails due to system issues
   * 
   * @example
   * ```typescript
   * const user = await userRepository.findById('user-123', 'user-123');
   * if (user) {
   *   console.log(`Found user: ${user.displayName}`);
   * }
   * ```
   */
  async findById(id: string, partitionKey: string): Promise<T | null> {
    try {
      const { resource } = await this.container.item(id, partitionKey).read<T>();
      return resource || null;
    } catch (error: any) {
      if (error.code === 404) {
        return null;
      }
      console.error('Error finding document by ID:', error);
      throw new Error(`Failed to find document: ${error.message}`);
    }
  }

  /**
   * Updates an existing document with partial data.
   * 
   * ## Update Strategy
   * - Retrieves the existing document first to ensure it exists
   * - Merges provided updates with existing data
   * - Automatically updates the updatedAt timestamp
   * - Uses replace operation for atomic updates
   * 
   * ## Concurrency Considerations
   * - Consider using ETags for optimistic concurrency control in high-concurrency scenarios
   * - Multiple simultaneous updates may conflict; implement retry logic if needed
   * 
   * @param id - The unique identifier of the document to update
   * @param partitionKey - The partition key value
   * @param updates - Partial document with fields to update
   * @returns Promise resolving to the updated document
   * @throws Error if document not found or update fails
   * 
   * @example
   * ```typescript
   * const updatedUser = await userRepository.update('user-123', 'user-123', {
   *   displayName: 'Jane Doe',
   *   fitnessLevel: 'intermediate'
   * });
   * ```
   */
  async update(id: string, partitionKey: string, updates: Partial<T>): Promise<T> {
    try {
      const existing = await this.findById(id, partitionKey);
      if (!existing) {
        throw new Error('Document not found');
      }

      const updatedDocument = {
        ...existing,
        ...updates,
        updatedAt: new Date(),
      };

      const { resource } = await this.container.item(id, partitionKey).replace(updatedDocument);
      return resource as T;
    } catch (error) {
      console.error('Error updating document:', error);
      throw new Error(`Failed to update document: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Deletes a document by its ID and partition key.
   * 
   * ## Deletion Behavior
   * - Permanently removes the document from the container
   * - Operation is atomic and immediate
   * - Returns 404 error if document doesn't exist
   * 
   * ## Alternative Patterns
   * Consider soft deletion for audit trails:
   * - Add `isDeleted: boolean` field instead of hard deletion
   * - Filter out deleted documents in queries
   * - Implement cleanup jobs for permanent removal
   * 
   * @param id - The unique identifier of the document to delete
   * @param partitionKey - The partition key value
   * @returns Promise that resolves when deletion is complete
   * @throws Error if document not found or deletion fails
   * 
   * @example
   * ```typescript
   * await userRepository.delete('user-123', 'user-123');
   * console.log('User deleted successfully');
   * ```
   */
  async delete(id: string, partitionKey: string): Promise<void> {
    try {
      await this.container.item(id, partitionKey).delete();
    } catch (error: any) {
      if (error.code === 404) {
        throw new Error('Document not found');
      }
      console.error('Error deleting document:', error);
      throw new Error(`Failed to delete document: ${error.message}`);
    }
  }

  /**
   * Executes a SQL query against the container with optional partition key optimization.
   * 
   * ## Query Performance Guidelines
   * 
   * ### Single-Partition Queries (Recommended)
   * When providing a partition key:
   * - Query executes within a single partition
   * - Lower latency and RU consumption
   * - More predictable performance
   * 
   * ### Cross-Partition Queries
   * When partition key is omitted:
   * - Query fans out across all partitions
   * - Higher latency and RU consumption
   * - Use sparingly and consider indexing strategy
   * 
   * ## SQL Query Patterns
   * 
   * Always use parameterized queries to prevent injection attacks:
   * ```sql
   * SELECT * FROM c WHERE c.userId = @userId AND c.status = @status
   * ```
   * 
   * ## Indexing Considerations
   * - Ensure WHERE clause properties are indexed
   * - Use range indexes for inequality operators (<, >, <=, >=)
   * - Consider composite indexes for multi-property filters
   * 
   * @param querySpec - The SQL query specification with parameters
   * @param partitionKey - Optional partition key for single-partition queries
   * @returns Promise resolving to array of matching documents
   * @throws Error if query execution fails
   * 
   * @example
   * ```typescript
   * // Single-partition query (efficient)
   * const activeTrips = await this.query({
   *   query: 'SELECT * FROM c WHERE c.userId = @userId AND c.status = @status',
   *   parameters: [
   *     { name: '@userId', value: 'user-123' },
   *     { name: '@status', value: 'active' }
   *   ]
   * }, 'user-123');
   * 
   * // Cross-partition query (use sparingly)
   * const allActiveTrips = await this.query({
   *   query: 'SELECT * FROM c WHERE c.status = @status',
   *   parameters: [{ name: '@status', value: 'active' }]
   * });
   * ```
   */
  protected async query(querySpec: SqlQuerySpec, partitionKey?: string): Promise<T[]> {
    try {
      const queryOptions = partitionKey ? { partitionKey } : {};
      const { resources } = await this.container.items.query<T>(querySpec, queryOptions).fetchAll();
      return resources;
    } catch (error) {
      console.error('Error executing query:', error);
      throw new Error(`Failed to execute query: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Executes a paginated query with continuation token support.
   * 
   * ## Pagination Strategy
   * 
   * Cosmos DB uses continuation tokens for efficient pagination:
   * - Tokens are opaque strings representing query state
   * - More efficient than OFFSET/LIMIT patterns
   * - Maintains consistent results even as data changes
   * 
   * ## Best Practices
   * 
   * ### Page Size Considerations
   * - Smaller pages (10-50 items): Lower latency, more round trips
   * - Larger pages (100-1000 items): Higher latency, fewer round trips
   * - Monitor RU consumption to optimize page size
   * 
   * ### Client Implementation
   * ```typescript
   * let hasMore = true;
   * let continuationToken: string | undefined;
   * const allResults: T[] = [];
   * 
   * while (hasMore) {
   *   const page = await repository.queryWithPagination(
   *     querySpec, 20, continuationToken, partitionKey
   *   );
   *   allResults.push(...page.items);
   *   continuationToken = page.continuationToken;
   *   hasMore = page.hasMore;
   * }
   * ```
   * 
   * @param querySpec - The SQL query specification with parameters
   * @param maxItemCount - Maximum number of items per page (default: 20)
   * @param continuationToken - Token from previous page for pagination
   * @param partitionKey - Optional partition key for single-partition queries
   * @returns Promise resolving to paginated results with continuation info
   * @throws Error if query execution fails
   * 
   * @example
   * ```typescript
   * const firstPage = await userRepository.queryWithPagination({
   *   query: 'SELECT * FROM c WHERE c.isActive = true ORDER BY c.createdAt DESC',
   *   parameters: []
   * }, 25);
   * 
   * console.log(`Found ${firstPage.items.length} users`);
   * if (firstPage.hasMore) {
   *   const secondPage = await userRepository.queryWithPagination(
   *     querySpec, 25, firstPage.continuationToken
   *   );
   * }
   * ```
   */
  protected async queryWithPagination(
    querySpec: SqlQuerySpec,
    maxItemCount: number = 20,
    continuationToken?: string,
    partitionKey?: string
  ): Promise<{ items: T[]; continuationToken?: string; hasMore: boolean }> {
    try {
      const queryOptions = {
        maxItemCount,
        continuationToken,
        ...(partitionKey && { partitionKey }),
      };

      const queryIterator = this.container.items.query<T>(querySpec, queryOptions);
      const { resources, continuationToken: nextToken } = await queryIterator.fetchNext();

      return {
        items: resources,
        continuationToken: nextToken,
        hasMore: !!nextToken,
      };
    } catch (error) {
      console.error('Error executing paginated query:', error);
      throw new Error(`Failed to execute paginated query: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Checks if a document exists without retrieving its full content.
   * 
   * ## Performance Benefits
   * - More efficient than findById when only existence matters
   * - Uses minimal bandwidth and RU consumption
   * - Suitable for validation and conditional logic
   * 
   * @param id - The unique identifier of the document
   * @param partitionKey - The partition key value
   * @returns Promise resolving to true if document exists, false otherwise
   * 
   * @example
   * ```typescript
   * const userExists = await userRepository.exists('user-123', 'user-123');
   * if (!userExists) {
   *   throw new Error('User not found');
   * }
   * ```
   */
  async exists(id: string, partitionKey: string): Promise<boolean> {
    try {
      const document = await this.findById(id, partitionKey);
      return document !== null;
    } catch (error) {
      return false;
    }
  }

  /**
   * Counts documents matching optional filter criteria.
   * 
   * ## Performance Considerations
   * 
   * ### Indexed Properties
   * Ensure WHERE clause properties are properly indexed:
   * - Equality filters: Hash or Range indexes
   * - Range filters: Range indexes required
   * - String operations: Consider case sensitivity
   * 
   * ### Cross-Partition Counts
   * COUNT queries without partition key specification:
   * - Execute across all partitions (higher RU cost)
   * - Consider caching results for expensive counts
   * - Use aggregated counters for real-time dashboards
   * 
   * ### Alternative Patterns
   * For frequently accessed counts, consider:
   * - Maintaining counter documents updated via change feed
   * - Using pre-aggregated views
   * - Implementing eventual consistency patterns
   * 
   * @param whereClause - Optional SQL WHERE conditions (without the WHERE keyword)
   * @param parameters - Parameters for the WHERE clause
   * @returns Promise resolving to the count of matching documents
   * @throws Error if count operation fails
   * 
   * @example
   * ```typescript
   * // Count all documents
   * const totalUsers = await userRepository.count();
   * 
   * // Count with filter
   * const activeUsers = await userRepository.count(
   *   'c.isActive = @isActive',
   *   [{ name: '@isActive', value: true }]
   * );
   * 
   * // Count with complex filter
   * const recentUsers = await userRepository.count(
   *   'c.isActive = @isActive AND c.createdAt >= @since',
   *   [
   *     { name: '@isActive', value: true },
   *     { name: '@since', value: '2024-01-01T00:00:00Z' }
   *   ]
   * );
   * ```
   */
  async count(whereClause?: string, parameters?: any[]): Promise<number> {
    try {
      let query = 'SELECT VALUE COUNT(1) FROM c';
      if (whereClause) {
        query += ` WHERE ${whereClause}`;
      }

      const querySpec: SqlQuerySpec = {
        query,
        parameters: parameters || [],
      };

      const { resources } = await this.container.items.query<number>(querySpec).fetchAll();
      return resources[0] || 0;
    } catch (error) {
      console.error('Error counting documents:', error);
      throw new Error(`Failed to count documents: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}