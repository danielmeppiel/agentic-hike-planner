import { Container, SqlQuerySpec } from '@azure/cosmos';

/**
 * Base repository providing common CRUD operations
 */
export abstract class BaseRepository<T extends { id: string; partitionKey: string }> {
  protected container: Container;

  constructor(container: Container) {
    this.container = container;
  }

  /**
   * Create a new document
   */
  async create(item: T): Promise<T> {
    try {
      const { resource } = await this.container.items.create(item);
      if (!resource) {
        throw new Error('Failed to create item');
      }
      return resource as T;
    } catch (error) {
      console.error('Error creating item:', error);
      throw this.handleCosmosError(error);
    }
  }

  /**
   * Find document by ID and partition key
   */
  async findById(id: string, partitionKey: string): Promise<T | null> {
    try {
      const { resource } = await this.container.item(id, partitionKey).read<T>();
      return resource || null;
    } catch (error: any) {
      if (error.code === 404) {
        return null;
      }
      console.error('Error finding item by ID:', error);
      throw this.handleCosmosError(error);
    }
  }

  /**
   * Update document with optimistic concurrency
   */
  async update(id: string, partitionKey: string, item: Partial<T>, etag?: string): Promise<T> {
    try {
      const options = etag ? { accessCondition: { type: 'IfMatch', condition: etag } } : undefined;
      const { resource } = await this.container.item(id, partitionKey).replace(item, options);
      if (!resource) {
        throw new Error('Failed to update item');
      }
      return resource as T;
    } catch (error) {
      console.error('Error updating item:', error);
      throw this.handleCosmosError(error);
    }
  }

  /**
   * Delete document
   */
  async delete(id: string, partitionKey: string): Promise<void> {
    try {
      await this.container.item(id, partitionKey).delete();
    } catch (error: any) {
      if (error.code === 404) {
        return; // Already deleted
      }
      console.error('Error deleting item:', error);
      throw this.handleCosmosError(error);
    }
  }

  /**
   * Execute a query with pagination
   */
  async query<R = T>(
    querySpec: SqlQuerySpec,
    options: {
      maxItemCount?: number;
      continuationToken?: string;
      partitionKey?: string;
    } = {}
  ): Promise<{ items: R[]; continuationToken?: string; requestCharge: number }> {
    try {
      const queryOptions: any = {
        maxItemCount: options.maxItemCount || 100,
      };

      if (options.continuationToken) {
        queryOptions.continuationToken = options.continuationToken;
      }

      if (options.partitionKey) {
        queryOptions.partitionKey = options.partitionKey;
      }

      const queryIterator = this.container.items.query<R>(querySpec, queryOptions);
      const { resources, requestCharge, continuationToken } = await queryIterator.fetchNext();

      return {
        items: resources || [],
        continuationToken,
        requestCharge: requestCharge || 0,
      };
    } catch (error) {
      console.error('Error executing query:', error);
      throw this.handleCosmosError(error);
    }
  }

  /**
   * Count documents matching a query
   */
  async count(querySpec: SqlQuerySpec, partitionKey?: string): Promise<number> {
    try {
      const countQuery: SqlQuerySpec = {
        query: `SELECT VALUE COUNT(1) FROM (${querySpec.query}) AS subquery`,
        parameters: querySpec.parameters,
      };

      const options = partitionKey ? { partitionKey } : {};
      const { items } = await this.query<number>(countQuery, options);
      return items[0] || 0;
    } catch (error) {
      console.error('Error counting items:', error);
      throw this.handleCosmosError(error);
    }
  }

  /**
   * Batch operations
   */
  async batchCreate(items: T[]): Promise<T[]> {
    const results: T[] = [];
    const batchSize = 100; // Cosmos DB batch limit

    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      const batchPromises = batch.map(item => this.create(item));
      
      try {
        const batchResults = await Promise.all(batchPromises);
        results.push(...batchResults);
      } catch (error) {
        console.error(`Error in batch ${i / batchSize + 1}:`, error);
        throw error;
      }
    }

    return results;
  }

  /**
   * Handle Cosmos DB specific errors
   */
  protected handleCosmosError(error: any): Error {
    if (error.code) {
      switch (error.code) {
        case 400:
          return new Error(`Bad Request: ${error.message}`);
        case 404:
          return new Error(`Not Found: ${error.message}`);
        case 409:
          return new Error(`Conflict: ${error.message}`);
        case 412:
          return new Error(`Precondition Failed: ${error.message}`);
        case 413:
          return new Error(`Request Entity Too Large: ${error.message}`);
        case 429:
          return new Error(`Too Many Requests: ${error.message}`);
        case 500:
          return new Error(`Internal Server Error: ${error.message}`);
        default:
          return new Error(`Cosmos DB Error ${error.code}: ${error.message}`);
      }
    }
    return error instanceof Error ? error : new Error(String(error));
  }

  /**
   * Build ORDER BY clause for queries
   */
  protected buildOrderBy(sortBy?: string, sortOrder: 'asc' | 'desc' = 'asc'): string {
    if (!sortBy) return '';
    const order = sortOrder.toUpperCase();
    return ` ORDER BY c.${sortBy} ${order}`;
  }

  /**
   * Build WHERE clause conditions
   */
  protected buildWhereConditions(conditions: string[]): string {
    return conditions.length > 0 ? ` WHERE ${conditions.join(' AND ')}` : '';
  }
}