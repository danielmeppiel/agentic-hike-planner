import { config as dotenvConfig } from 'dotenv';

// Load environment variables
dotenvConfig();

export const config = {
  port: parseInt(process.env.PORT || '3001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  azure: {
    cosmosDb: {
      endpoint: process.env.AZURE_COSMOS_DB_ENDPOINT || 'https://localhost:8081',
      key: process.env.AZURE_COSMOS_DB_KEY || 'C2y6yDjf5/R+ob0N8A7Cgv30VRDJIWEHLM+4QDU5DE2nQ9nDuVTqobD4b8mGGyPMbIZnqyMsEcaGQy67XIw/Jw==',
      databaseName: process.env.AZURE_COSMOS_DB_DATABASE_NAME || 'HikePlanner',
      connectionOptions: {
        maxRetryAttemptCount: 3,
        maxRetryWaitTimeInMs: 30000,
        enableCrossPartitionQuery: true
      }
    }
  },
  containers: {
    users: {
      id: 'users',
      partitionKey: '/partitionKey',
      throughput: 400,
      defaultTtl: undefined // No TTL for users
    },
    trips: {
      id: 'trips',
      partitionKey: '/partitionKey',
      throughput: 400,
      defaultTtl: undefined // No TTL for trips
    },
    trails: {
      id: 'trails',
      partitionKey: '/partitionKey',
      throughput: 1000, // Higher throughput for trail searches
      defaultTtl: undefined // No TTL for trails
    },
    recommendations: {
      id: 'recommendations',
      partitionKey: '/partitionKey',
      throughput: 400,
      defaultTtl: 7 * 24 * 60 * 60 // 7 days TTL for recommendations
    }
  }
};

export type ContainerConfig = typeof config.containers[keyof typeof config.containers];