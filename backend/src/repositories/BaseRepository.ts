import { Container, ItemResponse, FeedResponse, SqlQuerySpec } from '@azure/cosmos';
import { v4 as uuidv4 } from 'uuid';
import { BaseEntity } from '../types';

export interface RepositoryOptions {
  enableCrossPartitionQuery?: boolean;
  maxItemCount?: number;
}

export interface QueryOptions extends RepositoryOptions {
  continuationToken?: string;
}

export interface QueryResult<T> {
  items: T[];
  continuationToken?: string;
  totalCount?: number;
}

export abstract class BaseRepository<T extends BaseEntity> {
  protected container: Container;
  protected defaultOptions: RepositoryOptions;

  constructor(container: Container, options: RepositoryOptions = {}) {
    this.container = container;
    this.defaultOptions = {
      enableCrossPartitionQuery: true,
      maxItemCount: 100,
      ...options
    };
  }

  /**
   * Create a new item
   */
  async create(item: Omit<T, 'id' | 'createdAt' | 'updatedAt'>): Promise<T> {
    const now = new Date();
    const newItem: T = {
      ...item,
      id: uuidv4(),
      createdAt: now,
      updatedAt: now
    } as T;

    try {
      const response: ItemResponse<T> = await this.container.items.create(newItem);
      return response.resource!;
    } catch (error) {
      console.error('Error creating item:', error);
      throw new Error(`Failed to create item: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get an item by ID and partition key
   */
  async getById(id: string, partitionKey: string): Promise<T | null> {
    try {
      const response: ItemResponse<T> = await this.container.item(id, partitionKey).read();
      return response.resource || null;
    } catch (error: any) {
      if (error.code === 404) {
        return null;
      }
      console.error('Error getting item by ID:', error);
      throw new Error(`Failed to get item: ${error.message}`);
    }
  }

  /**
   * Update an item (partial update)
   */
  async update(id: string, partitionKey: string, updates: Partial<Omit<T, 'id' | 'partitionKey' | 'createdAt'>>): Promise<T> {
    try {
      // First get the current item
      const current = await this.getById(id, partitionKey);
      if (!current) {
        throw new Error(`Item with id ${id} not found`);
      }

      // Merge updates with current item
      const updatedItem: T = {
        ...current,
        ...updates,
        updatedAt: new Date()
      };

      const response: ItemResponse<T> = await this.container.item(id, partitionKey).replace(updatedItem);
      return response.resource!;
    } catch (error) {
      console.error('Error updating item:', error);
      throw new Error(`Failed to update item: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Delete an item by ID and partition key
   */
  async delete(id: string, partitionKey: string): Promise<boolean> {
    try {
      await this.container.item(id, partitionKey).delete();
      return true;
    } catch (error: any) {
      if (error.code === 404) {
        return false; // Item was already deleted
      }
      console.error('Error deleting item:', error);
      throw new Error(`Failed to delete item: ${error.message}`);
    }
  }

  /**
   * Query items with a SQL query
   */
  async query(querySpec: SqlQuerySpec, options: QueryOptions = {}): Promise<QueryResult<T>> {
    try {
      const queryOptions = {
        ...this.defaultOptions,
        ...options
      };

      const response: FeedResponse<T> = await this.container.items
        .query(querySpec, queryOptions)
        .fetchAll();

      return {
        items: response.resources,
        continuationToken: response.continuationToken,
        totalCount: response.resources.length
      };
    } catch (error) {
      console.error('Error querying items:', error);
      throw new Error(`Failed to query items: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Query items with pagination
   */
  async queryWithPagination(
    querySpec: SqlQuerySpec, 
    options: QueryOptions = {}
  ): Promise<QueryResult<T>> {
    try {
      const queryOptions = {
        ...this.defaultOptions,
        ...options
      };

      const queryIterator = this.container.items.query(querySpec, queryOptions);
      const response: FeedResponse<T> = await queryIterator.fetchNext();

      return {
        items: response.resources,
        continuationToken: response.continuationToken
      };
    } catch (error) {
      console.error('Error querying items with pagination:', error);
      throw new Error(`Failed to query items: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get all items for a specific partition
   */
  async getByPartitionKey(partitionKey: string, options: QueryOptions = {}): Promise<QueryResult<T>> {
    const querySpec: SqlQuerySpec = {
      query: 'SELECT * FROM c WHERE c.partitionKey = @partitionKey',
      parameters: [
        { name: '@partitionKey', value: partitionKey }
      ]
    };

    return this.query(querySpec, options);
  }

  /**
   * Count items matching a query
   */
  async count(querySpec: SqlQuerySpec, options: RepositoryOptions = {}): Promise<number> {
    try {
      const countQuerySpec: SqlQuerySpec = {
        query: `SELECT VALUE COUNT(1) FROM (${querySpec.query})`,
        parameters: querySpec.parameters || []
      };

      const queryOptions = {
        ...this.defaultOptions,
        ...options
      };

      const response: FeedResponse<number> = await this.container.items
        .query(countQuerySpec, queryOptions)
        .fetchAll();

      return response.resources[0] || 0;
    } catch (error) {
      console.error('Error counting items:', error);
      throw new Error(`Failed to count items: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Check if an item exists
   */
  async exists(id: string, partitionKey: string): Promise<boolean> {
    try {
      const item = await this.getById(id, partitionKey);
      return item !== null;
    } catch (error) {
      return false;
    }
  }

  /**
   * Batch create multiple items
   */
  async batchCreate(items: Omit<T, 'id' | 'createdAt' | 'updatedAt'>[]): Promise<T[]> {
    const results: T[] = [];
    
    // Process in batches to avoid overwhelming the database
    const batchSize = 25; // Cosmos DB batch limit
    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      const batchPromises = batch.map(item => this.create(item));
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
    }

    return results;
  }

  /**
   * Get the underlying Cosmos DB container
   */
  getContainer(): Container {
    return this.container;
  }
}