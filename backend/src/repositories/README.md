# Repository Pattern & Cosmos DB Integration Guide

## Overview

This document provides comprehensive guidance on the repository pattern implementation and Azure Cosmos DB integration patterns used throughout the data access layer.

## Repository Pattern Architecture

### Benefits

The Repository Pattern provides several key advantages for data access:

- **Abstraction**: Encapsulates data access logic and provides a more object-oriented interface
- **Testability**: Enables easy mocking and unit testing by abstracting database operations  
- **Maintainability**: Centralizes database access patterns and query logic
- **Consistency**: Provides consistent error handling and logging across all data operations
- **Type Safety**: Leverages TypeScript generics for compile-time type checking

### Structure

```
repositories/
├── BaseRepository.ts         # Abstract base class with common CRUD operations
├── UserRepository.ts         # User profile management
├── TripRepository.ts         # Trip planning and management
├── TrailRepository.ts        # Trail data and search functionality
├── RecommendationRepository.ts # AI recommendations with TTL
└── index.ts                  # Repository exports
```

## Cosmos DB Integration Patterns

### Partition Key Strategies

Partition keys are critical for Cosmos DB performance and should be chosen to:
- Distribute data evenly across physical partitions
- Enable efficient query patterns within partitions  
- Avoid hot partitions that could throttle operations

#### Partition Key Patterns by Entity

| Entity | Partition Key | Strategy | Benefits |
|--------|---------------|----------|----------|
| Users | `userId` | User-scoped isolation | Single-user operations are highly efficient |
| Trips | `userId` | User-centric access | User's trips co-located for efficient queries |
| Recommendations | `userId` | User-personalization | Enables single-partition recommendation retrieval |
| Trails | `region` | Geographic distribution | Regional searches avoid cross-partition queries |

### Query Performance Guidelines

#### Single-Partition Queries (Recommended)
When providing a partition key:
- Query executes within a single partition
- Lower latency and RU consumption
- More predictable performance

```typescript
// Efficient single-partition query
const userTrips = await tripRepository.findByUserId('user-123');
```

#### Cross-Partition Queries (Use Sparingly)
When partition key is omitted:
- Query fans out across all partitions
- Higher latency and RU consumption
- Use sparingly and consider indexing strategy

```typescript
// Cross-partition query - use judiciously
const allActiveTrips = await tripRepository.findByStatus('active');
```

### Indexing Strategies

#### Automatic Indexing
Cosmos DB automatically indexes all document properties by default, but custom indexing policies optimize performance:

```json
{
  "indexingMode": "consistent",
  "includedPaths": [
    { "path": "/userId/?" },          // Hash index for exact matches
    { "path": "/createdAt/?" },       // Range index for sorting/filtering
    { "path": "/status/?" },          // Hash index for status filtering
    { "path": "/location/region/?" }  // Range index for geographic queries
  ],
  "excludedPaths": [
    { "path": "/*" }  // Exclude all other paths to reduce RU costs
  ]
}
```

#### Composite Indexes
For multi-property queries and sorting:

```json
{
  "compositeIndexes": [
    [
      { "path": "/location/region", "order": "ascending" },
      { "path": "/ratings/average", "order": "descending" }
    ]
  ]
}
```

## Advanced Query Patterns

### Dynamic Query Building

The TrailRepository demonstrates sophisticated dynamic query construction:

```typescript
// Dynamic WHERE clause building with parameterization
let whereConditions: string[] = ['c.isActive = true'];
const parameters: any[] = [];

if (filters.difficulty) {
  whereConditions.push('c.characteristics.difficulty IN (@difficulties)');
  parameters.push({ name: '@difficulties', value: filters.difficulty });
}

const querySpec: SqlQuerySpec = {
  query: `SELECT * FROM c WHERE ${whereConditions.join(' AND ')}`,
  parameters
};
```

### Pagination with Continuation Tokens

Cosmos DB uses continuation tokens for efficient pagination:

```typescript
protected async queryWithPagination(
  querySpec: SqlQuerySpec,
  maxItemCount: number = 20,
  continuationToken?: string,
  partitionKey?: string
): Promise<{ items: T[]; continuationToken?: string; hasMore: boolean }> {
  const queryOptions = {
    maxItemCount,
    continuationToken,
    ...(partitionKey && { partitionKey })
  };

  const queryIterator = this.container.items.query<T>(querySpec, queryOptions);
  const { resources, continuationToken: nextToken } = await queryIterator.fetchNext();

  return {
    items: resources,
    continuationToken: nextToken,
    hasMore: !!nextToken
  };
}
```

### Text Search Patterns

Full-text search using CONTAINS function:

```sql
SELECT * FROM c 
WHERE (
  CONTAINS(LOWER(c.name), LOWER(@searchTerm))
  OR CONTAINS(LOWER(c.description), LOWER(@searchTerm))
  OR CONTAINS(LOWER(c.location.park), LOWER(@searchTerm))
)
AND c.isActive = true
```

## Time-To-Live (TTL) Patterns

### Automatic Data Lifecycle Management

The RecommendationRepository demonstrates TTL implementation:

```json
{
  "defaultTtl": 2592000,  // 30 days in seconds
  "ttlPropertyPath": "/expiresAt"
}
```

### TTL Benefits
- **Automatic cleanup**: Expired documents are automatically deleted
- **Cost optimization**: Reduces storage costs for stale data
- **Privacy compliance**: Ensures temporary data doesn't persist indefinitely
- **Performance maintenance**: Keeps working set size manageable

### TTL Query Patterns

Filter out expired documents in queries:

```sql
SELECT * FROM c 
WHERE c.userId = @userId 
AND c.expiresAt > @now 
ORDER BY c.createdAt DESC
```

## Error Handling Patterns

### Consistent Error Response

All repositories implement consistent error handling:

```typescript
async findById(id: string, partitionKey: string): Promise<T | null> {
  try {
    const { resource } = await this.container.item(id, partitionKey).read<T>();
    return resource || null;
  } catch (error: any) {
    if (error.code === 404) {
      return null; // Document not found is expected
    }
    console.error('Error finding document by ID:', error);
    throw new Error(`Failed to find document: ${error.message}`);
  }
}
```

### Common Error Scenarios

#### HTTP Status Code Handling
- `404`: Document not found (expected in many scenarios)
- `409`: Conflict (document already exists)
- `429`: Request rate too large (throttling)
- `413`: Request entity too large
- `500`: Internal server error

#### Retry Strategies
Consider implementing exponential backoff for:
- Throttling responses (429)
- Temporary service unavailability (503)
- Network timeouts

```typescript
// Example retry pattern for throttling
const maxRetries = 3;
let retryCount = 0;

while (retryCount < maxRetries) {
  try {
    return await this.container.items.create(document);
  } catch (error: any) {
    if (error.code === 429 && retryCount < maxRetries - 1) {
      const delay = Math.pow(2, retryCount) * 1000; // Exponential backoff
      await new Promise(resolve => setTimeout(resolve, delay));
      retryCount++;
      continue;
    }
    throw error;
  }
}
```

## Performance Best Practices

### RU (Request Unit) Optimization

1. **Use appropriate page sizes**: Balance between latency and throughput
2. **Leverage indexing**: Ensure WHERE clause properties are indexed
3. **Minimize cross-partition queries**: Design partition keys for access patterns
4. **Monitor query metrics**: Use Cosmos DB metrics to identify expensive queries

### Query Optimization Checklist

- [ ] Use parameterized queries to prevent SQL injection
- [ ] Specify partition key when possible for single-partition queries
- [ ] Implement appropriate indexing for filter and sort properties
- [ ] Use continuation tokens instead of OFFSET for pagination
- [ ] Monitor and optimize for RU consumption patterns
- [ ] Consider caching for frequently accessed, relatively static data

### Connection Management

- Reuse CosmosClient instances across requests
- Configure connection pooling appropriately
- Implement proper connection cleanup in application shutdown

## Security Considerations

### Data Access Patterns
- Always validate user permissions before data access
- Implement row-level security through partition key design
- Use parameterized queries to prevent SQL injection
- Sanitize and validate all user inputs

### Authentication & Authorization
- Use Azure AD authentication when possible
- Implement least privilege access principles
- Rotate access keys regularly
- Monitor access patterns for anomalies

## Monitoring & Observability

### Key Metrics to Monitor
- Request Unit (RU) consumption patterns
- Query execution latency
- Throttling rates (429 responses)
- Error rates by operation type
- Storage utilization and growth

### Logging Best Practices
- Log query execution for debugging
- Include correlation IDs for request tracing  
- Log performance metrics for optimization
- Sanitize logs to prevent sensitive data exposure

## Testing Strategies

### Unit Testing
Mock repository interfaces for business logic testing:

```typescript
const mockUserRepository = {
  findById: jest.fn(),
  create: jest.fn(),
  update: jest.fn()
} as jest.Mocked<UserRepository>;
```

### Integration Testing
Test actual Cosmos DB operations with test containers:

```typescript
describe('UserRepository Integration', () => {
  let container: Container;
  let userRepository: UserRepository;

  beforeAll(async () => {
    // Setup test container
    container = await setupTestContainer();
    userRepository = new UserRepository(container);
  });

  afterAll(async () => {
    // Cleanup test data
    await cleanupTestContainer(container);
  });
});
```

### Performance Testing
Monitor RU consumption and latency under load:

```typescript
// Benchmark query performance
const startTime = Date.now();
const result = await repository.searchTrails(complexQuery);
const duration = Date.now() - startTime;
const ruCost = result.requestCharge;

console.log(`Query completed in ${duration}ms, cost: ${ruCost} RUs`);
```

## Migration & Schema Evolution

### Document Schema Versioning
Include version information in documents:

```typescript
interface VersionedDocument {
  id: string;
  partitionKey: string;
  schemaVersion: string; // e.g., "1.0", "1.1"
  // ... other properties
}
```

### Migration Strategies
- Use change feed for gradual migrations
- Implement backward compatibility in queries
- Version API endpoints during schema changes
- Plan for zero-downtime deployment scenarios

## Conclusion

This repository pattern implementation provides a robust foundation for Azure Cosmos DB data access. The patterns demonstrated here prioritize performance, maintainability, and scalability while providing comprehensive error handling and monitoring capabilities.

For specific implementation details, refer to the individual repository class documentation and the BaseRepository abstract class which serves as the foundation for all data access operations.