# Agentic Hike Planner - Database Layer

Complete database models and schema implementation for the Agentic Hike Planner application using Azure Cosmos DB.

## 🏗️ Architecture Overview

This implementation provides a comprehensive, production-ready database layer with:

- **TypeScript-first approach** with strict type definitions
- **Azure Cosmos DB** with optimized partitioning strategy
- **Repository pattern** for clean data access layer
- **Zod validation** for data integrity
- **Mock data generation** for development and testing
- **CLI tools** for database management

## 📦 Project Structure

```
backend/
├── src/
│   ├── types/                 # TypeScript type definitions
│   │   ├── Common.ts         # Shared types and interfaces
│   │   ├── User.ts           # User profile types
│   │   ├── Trip.ts           # Trip planning types
│   │   ├── Trail.ts          # Trail information types
│   │   └── Recommendation.ts # AI recommendation types
│   ├── validation/           # Zod validation schemas
│   │   ├── common.ts         # Shared validation schemas
│   │   ├── userSchema.ts     # User validation
│   │   ├── tripSchema.ts     # Trip validation
│   │   ├── trailSchema.ts    # Trail validation
│   │   └── recommendationSchema.ts # Recommendation validation
│   ├── services/             # Core services
│   │   ├── database.ts       # Cosmos DB connection service
│   │   ├── repositoryFactory.ts # Repository factory pattern
│   │   ├── mockDataGenerator.ts # Mock data generation
│   │   ├── dataSeeder.ts     # Database seeding service
│   │   └── databaseValidator.ts # Testing and validation
│   ├── repositories/         # Data access layer
│   │   ├── BaseRepository.ts # Base CRUD operations
│   │   ├── UserRepository.ts # User-specific operations
│   │   ├── TripRepository.ts # Trip management
│   │   ├── TrailRepository.ts # Trail discovery
│   │   └── RecommendationRepository.ts # AI recommendations
│   ├── scripts/              # CLI utilities
│   │   ├── seedData.ts       # Database seeding CLI
│   │   └── testDatabase.ts   # Testing CLI
│   └── config/               # Configuration
│       └── index.ts          # Environment configuration
├── package.json              # Dependencies and scripts
└── tsconfig.json            # TypeScript configuration
```

## 🗄️ Data Models

### Core Entities

1. **UserProfile** - User information and preferences
2. **TripPlan** - Trip planning with dates and participants
3. **Trail** - Comprehensive trail information
4. **AIRecommendation** - AI-generated trail recommendations

### Partitioning Strategy

- **Users & Trips**: Partitioned by `userId` for user-centric queries
- **Trails**: Partitioned by `region` for location-based searches
- **Recommendations**: Partitioned by `userId` with TTL for cleanup

## 🚀 Getting Started

### 1. Installation

```bash
cd backend
npm install
```

### 2. Environment Setup

Create a `.env` file in the backend directory:

```env
# Azure Cosmos DB Configuration
AZURE_COSMOS_DB_ENDPOINT=https://your-cosmos.documents.azure.com:443/
AZURE_COSMOS_DB_KEY=your-cosmos-key
AZURE_COSMOS_DB_DATABASE_NAME=HikePlanner

# For local development (Cosmos DB Emulator)
# AZURE_COSMOS_DB_ENDPOINT=https://localhost:8081
# AZURE_COSMOS_DB_KEY=C2y6yDjf5/R+ob0N8A7Cgv30VRDJIWEHLM+4QDU5DE2nQ9nDuVTqobD4b8mGGyPMbIZnqyMsEcaGQy67XIw/Jw==
```

### 3. Build and Test

```bash
# Build TypeScript
npm run build

# Test schema validation
npm run test:db --schema

# Test database operations (requires Cosmos DB)
npm run test:db --operations

# Run all tests
npm run test:db
```

### 4. Seed with Mock Data

```bash
# Seed with default values (10 users, 50 trails, 20 trips, 30 recommendations)
npm run seed

# Custom seeding
npm run seed -- --users 20 --trails 100 --trips 50 --recommendations 60

# Clear existing data first
npm run seed -- --clear --users 10

# Check database statistics
npm run stats

# Validate existing data
npm run validate
```

## 🧪 Testing

### Schema Validation Tests

Tests all Zod validation schemas to ensure:
- Email format validation
- Coordinate range validation (latitude: -90 to 90, longitude: -180 to 180)
- Date range validation (end date after start date)
- Confidence scores (0 to 1 range)
- Required field validation

```bash
npm run test:db -- --schema
```

### Database Operation Tests

Tests all CRUD operations and complex queries:
- Create, read, update, delete operations
- Complex filtering and search queries
- Performance validation (reads <50ms, queries <200ms)
- Data integrity checks

```bash
npm run test:db -- --operations
```

## 📊 Performance Features

### Query Optimization
- **Proper indexing** for common search patterns
- **Partition key optimization** for efficient queries
- **Cross-partition queries** only when necessary
- **Pagination support** with continuation tokens

### Performance Targets
- ✅ **Single reads**: <50ms
- ✅ **Complex queries**: <200ms
- ✅ **Batch operations**: Efficient handling of 100+ items
- ✅ **Memory usage**: Stable during bulk operations

### Scalability Features
- **Connection pooling** for efficient resource usage
- **Batch operations** for bulk data handling
- **TTL support** for automatic cleanup of temporary data
- **Optimistic concurrency** for data consistency

## 🔍 Advanced Queries

### User Repository
```typescript
// Search users by fitness level
const users = await userRepo.searchByFitnessLevel('intermediate');

// Find users with similar preferences
const similarUsers = await userRepo.getUsersWithSimilarPreferences(
  ['moderate', 'difficult'], 
  ['rocky', 'forest']
);

// Get recently active users
const activeUsers = await userRepo.getRecentlyActiveUsers(30);
```

### Trail Repository
```typescript
// Complex trail search
const trails = await trailRepo.searchTrails({
  region: 'California-North',
  difficulty: ['moderate', 'difficult'],
  distance: { min: 5, max: 20 },
  features: { scenicViews: true, waterFeatures: true }
});

// Location-based search
const nearbyTrails = await trailRepo.searchTrailsByLocation(
  { longitude: -122.4194, latitude: 37.7749 },
  50 // 50km radius
);

// Get top-rated trails
const topTrails = await trailRepo.getTopRatedTrails(10);
```

### Trip Repository
```typescript
// Get upcoming trips for user
const upcomingTrips = await tripRepo.getUpcomingTrips(userId);

// Search trips by date range
const summerTrips = await tripRepo.searchTripsByDateRange(
  new Date('2024-06-01'),
  new Date('2024-08-31')
);

// Get trip statistics
const stats = await tripRepo.getUserTripStatistics(userId);
```

### Recommendation Repository
```typescript
// Get high-quality recommendations
const recommendations = await recRepo.getHighQualityRecommendations(
  userId, 
  0.7, // min confidence
  0.6  // min factor score
);

// Get recommendations by confidence
const confident = await recRepo.getRecommendationsByConfidence(userId, 0.8);

// Cleanup expired recommendations
const cleaned = await recRepo.cleanupExpiredRecommendations();
```

## 🛠️ Development Tools

### CLI Commands

```bash
# Database seeding
npm run seed                    # Seed with defaults
npm run seed -- --help         # Show seeding options
npm run seed -- --clear        # Clear existing data first
npm run stats                   # Show database statistics
npm run validate               # Validate data integrity

# Testing
npm run test:db                # Run all database tests
npm run test:db -- --schema    # Schema validation only
npm run test:db -- --operations # CRUD operations only

# Development
npm run build                  # Build TypeScript
npm run dev                    # Start development server (future)
npm run lint                   # Run ESLint
```

### Data Validation

The implementation includes multiple validation layers:

1. **Type-level validation** with TypeScript strict mode
2. **Schema validation** with Zod at the service boundary
3. **Business logic validation** in repository methods
4. **Database constraints** with partition keys and TTL

## 🔧 Configuration

### Container Configuration

```typescript
containers: {
  users: {
    id: 'users',
    partitionKey: '/partitionKey',
    throughput: 400,
    defaultTtl: undefined // No TTL for users
  },
  trails: {
    id: 'trails', 
    partitionKey: '/partitionKey',
    throughput: 1000, // Higher throughput for searches
    defaultTtl: undefined
  },
  recommendations: {
    id: 'recommendations',
    partitionKey: '/partitionKey', 
    throughput: 400,
    defaultTtl: 7 * 24 * 60 * 60 // 7 days TTL
  }
}
```

### Environment Variables

```env
# Required
AZURE_COSMOS_DB_ENDPOINT=https://your-cosmos.documents.azure.com:443/
AZURE_COSMOS_DB_KEY=your-cosmos-key

# Optional
AZURE_COSMOS_DB_DATABASE_NAME=HikePlanner  # default: HikePlanner
NODE_ENV=development                       # default: development
PORT=3001                                  # default: 3001
```

## 🎯 Next Steps

With the database layer complete, you can now:

1. **Start building the API layer** with Express.js endpoints
2. **Integrate with Azure AI Foundry** for recommendation generation
3. **Add authentication** with Azure AD B2C
4. **Build the frontend** with React TypeScript
5. **Deploy to Azure** using the provided infrastructure templates

## 📈 Monitoring & Analytics

The implementation includes built-in monitoring capabilities:

- **Health check endpoints** for database connectivity
- **Performance metrics** for query execution times
- **Usage statistics** for data access patterns
- **Error tracking** with detailed logging
- **Data integrity validation** with automated checks

## 🔐 Security Features

- **Parameterized queries** to prevent injection attacks
- **Partition key validation** for data isolation
- **Input sanitization** with Zod validation
- **Error handling** without exposing sensitive information
- **Connection security** with Azure Cosmos DB encryption

## 📝 Contributing

When extending the database layer:

1. **Add new types** in the appropriate `/types` files
2. **Create validation schemas** in `/validation`
3. **Extend repository methods** for new operations
4. **Update mock data generators** for testing
5. **Add validation tests** for new functionality
6. **Update documentation** with examples

---

🎉 **The database foundation is now complete and ready for production use!**