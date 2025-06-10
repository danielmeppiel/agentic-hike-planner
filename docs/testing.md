# Testing Strategy and Workflow Documentation

This document provides comprehensive guidance on testing strategies, patterns, and workflows for the Agentic Hike Planner Azure-based application.

## 🎯 Testing Philosophy

Our testing strategy prioritizes **speed and simplicity** while ensuring comprehensive coverage of Azure service integrations. We implement a multi-layered testing approach that balances thorough validation with rapid development iteration.

### Core Principles
- **Test Isolation**: Each test is independent and can run in parallel
- **Azure-First**: Native Azure service testing with minimal mocking
- **Cost-Conscious**: Optimized test patterns to minimize Azure resource costs
- **Safety**: Comprehensive safeguards to prevent data corruption or unintended changes
- **Performance**: Continuous benchmarking of Azure service interactions

## 📊 Testing Layers

### 1. Unit Tests (`tests/unit/`)

**Purpose**: Test individual components in isolation without external dependencies.

**Location**: `tests/unit/`

**Coverage Goals**: 90%+ code coverage

**Command**:
```bash
# Run all unit tests
npm run test:unit

# Run specific unit test file
npm run test:unit -- --testPathPattern=database

# Run with coverage report
npm run test:unit -- --coverage
```

**Example Pattern**:
```typescript
// tests/unit/database-service.test.ts
import { DatabaseService } from '../../backend/src/services/database';

describe('DatabaseService Unit Tests', () => {
  test('should create DatabaseService in test mode', () => {
    const service = new DatabaseService(true);
    expect(service).toBeDefined();
    expect(service.isTestMode).toBe(true);
  });

  test('should handle configuration errors gracefully', () => {
    expect(() => {
      new DatabaseService(false, { invalidConfig: true });
    }).toThrow('Invalid database configuration');
  });
});
```

**Best Practices**:
- Mock all external dependencies (Azure services, file system, network calls)
- Test both success and error scenarios
- Use descriptive test names that explain the expected behavior
- Keep tests fast (<1 second per test)

### 2. Integration Tests (`tests/integration/azure/`)

**Purpose**: Test interactions with real Azure services to validate end-to-end functionality.

**Location**: `tests/integration/azure/`

**Prerequisites**:
```bash
# Required environment variables for real Azure testing
export AZURE_COSMOS_DB_ENDPOINT="https://your-cosmos.documents.azure.com:443/"
export AZURE_COSMOS_DB_KEY="your-cosmos-key"

# Optional: Enable write operations (use with caution)
export RUN_WRITE_TESTS="true"
```

**Commands**:
```bash
# Run all integration tests
npm run test:integration

# Run Azure-specific integration tests
npm run test:azure

# Run integration tests with specific pattern
npm run test:integration -- --testPathPattern=cosmos-db
```

**Example Pattern**:
```typescript
// tests/integration/azure/cosmos-db.test.ts
import { DatabaseService } from '../../../backend/src/services/database';
import { AzureTestEnvironment } from '../../utils/azure-test-data';

describe('Cosmos DB Integration Tests', () => {
  let databaseService: DatabaseService;

  beforeAll(async () => {
    AzureTestEnvironment.requireRealAzure('Cosmos DB integration tests');
    databaseService = new DatabaseService();
    await databaseService.initialize();
  });

  afterAll(async () => {
    await databaseService.cleanup();
  });

  test('should connect to Cosmos DB successfully', async () => {
    const health = await databaseService.healthCheck();
    expect(health.status).toBe('healthy');
    expect(health.latency).toBeLessThan(1000);
  });

  test('should perform CRUD operations', async () => {
    if (!process.env.RUN_WRITE_TESTS) {
      console.log('⏭️ Skipping write test - RUN_WRITE_TESTS not enabled');
      return;
    }

    const testUser = {
      id: 'test-user-' + Date.now(),
      email: 'test@example.com',
      displayName: 'Test User'
    };

    // Create
    const created = await databaseService.users.create(testUser);
    expect(created.id).toBe(testUser.id);

    // Read
    const retrieved = await databaseService.users.getById(testUser.id);
    expect(retrieved).toMatchObject(testUser);

    // Update
    const updated = await databaseService.users.update(testUser.id, {
      displayName: 'Updated Test User'
    });
    expect(updated.displayName).toBe('Updated Test User');

    // Delete
    await databaseService.users.delete(testUser.id);
    const deleted = await databaseService.users.getById(testUser.id);
    expect(deleted).toBeNull();
  });
});
```

**Azure Service Testing Patterns**:

#### Cosmos DB Testing
```typescript
// Test connection and authentication
test('should authenticate with Cosmos DB', async () => {
  const client = new CosmosClient(config);
  const response = await client.getDatabaseAccount();
  expect(response.resource).toBeDefined();
});

// Test query performance and RU consumption
test('should execute queries within performance thresholds', async () => {
  const startTime = Date.now();
  const { resources, requestCharge } = await container.items
    .query('SELECT * FROM c WHERE c.type = "user"')
    .fetchAll();
  
  const latency = Date.now() - startTime;
  expect(latency).toBeLessThan(500); // 500ms threshold
  expect(requestCharge).toBeLessThan(10); // 10 RU threshold
});
```

#### Key Vault Testing
```typescript
// Test secret retrieval
test('should retrieve secrets from Key Vault', async () => {
  const credential = new DefaultAzureCredential();
  const client = new SecretClient(vaultUrl, credential);
  
  const secret = await client.getSecret('test-secret');
  expect(secret.value).toBeDefined();
});
```

#### Storage Account Testing
```typescript
// Test blob operations
test('should upload and retrieve blobs', async () => {
  const blobServiceClient = new BlobServiceClient(connectionString);
  const containerClient = blobServiceClient.getContainerClient('test-container');
  
  const testData = 'Test file content';
  const blobName = `test-blob-${Date.now()}.txt`;
  
  // Upload
  await containerClient.uploadBlockBlob(blobName, testData, testData.length);
  
  // Download and verify
  const downloadResponse = await containerClient.getBlobClient(blobName).download();
  const downloadedContent = await streamToText(downloadResponse.readableStreamBody);
  expect(downloadedContent).toBe(testData);
});
```

### 3. Performance Tests (`tests/performance/`)

**Purpose**: Benchmark Azure service performance and identify optimization opportunities.

**Location**: `tests/performance/`

**Command**:
```bash
# Run performance benchmarks
npm run test:performance

# Run specific performance test
npx ts-node tests/performance/cosmos-db-benchmark.ts
```

**Example Pattern**:
```typescript
// tests/performance/cosmos-db-benchmark.ts
import { CosmosDbPerformanceBenchmark } from '../utils/performance-utils';

async function runCosmosBenchmark() {
  const benchmark = new CosmosDbPerformanceBenchmark({
    endpoint: process.env.AZURE_COSMOS_DB_ENDPOINT!,
    key: process.env.AZURE_COSMOS_DB_KEY!,
    databaseName: 'HikePlannerDB',
    containerName: 'Users'
  });

  console.log('🚀 Starting Cosmos DB Performance Benchmark...');

  const results = await benchmark.runFullBenchmark({
    operationCount: 100,
    concurrency: 10,
    documentSize: 'medium' // small, medium, large
  });

  console.log('📊 Benchmark Results:');
  console.log(`- Average Write Latency: ${results.write.avgLatency}ms`);
  console.log(`- Average Read Latency: ${results.read.avgLatency}ms`);
  console.log(`- Average RU Cost: ${results.avgRequestCharge} RU`);
  console.log(`- Operations per Second: ${results.throughput} ops/sec`);

  // Performance assertions
  expect(results.write.avgLatency).toBeLessThan(100);
  expect(results.read.avgLatency).toBeLessThan(50);
  expect(results.avgRequestCharge).toBeLessThan(5);
}
```

**Performance Metrics**:
- **Latency**: Response time for operations
- **Throughput**: Operations per second
- **Request Units (RU)**: Cosmos DB consumption
- **Memory Usage**: Application memory consumption
- **Network I/O**: Data transfer patterns

### 4. End-to-End Tests (`tests/e2e/`)

**Purpose**: Test complete user workflows across frontend and backend.

**Tools**: Playwright or Cypress for browser automation

**Command**:
```bash
# Run e2e tests
npm run test:e2e

# Run e2e tests in headed mode
npm run test:e2e -- --headed

# Run specific e2e test
npm run test:e2e -- --grep "user registration"
```

**Example Pattern**:
```typescript
// tests/e2e/user-journey.spec.ts
import { test, expect } from '@playwright/test';

test.describe('User Registration and Trip Planning Journey', () => {
  test('should complete full user journey', async ({ page }) => {
    // Navigate to app
    await page.goto('/');
    
    // Register new user
    await page.click('[data-testid="register-button"]');
    await page.fill('[data-testid="email-input"]', 'test@example.com');
    await page.fill('[data-testid="password-input"]', 'TestPassword123!');
    await page.click('[data-testid="submit-registration"]');
    
    // Verify registration success
    await expect(page.locator('[data-testid="dashboard"]')).toBeVisible();
    
    // Plan a hiking trip
    await page.click('[data-testid="plan-trip-button"]');
    await page.fill('[data-testid="destination-input"]', 'Yosemite National Park');
    await page.selectOption('[data-testid="difficulty-select"]', 'intermediate');
    await page.click('[data-testid="generate-plan"]');
    
    // Verify trip plan generated
    await expect(page.locator('[data-testid="trip-plan"]')).toBeVisible();
    await expect(page.locator('[data-testid="recommended-trails"]')).toContainText('Recommended Trails');
  });
});
```

## 🔧 Test Environment Setup

### Local Development Testing

**Prerequisites**:
```bash
# Install dependencies
npm install

# Backend dependencies
cd backend && npm install

# Frontend dependencies  
cd frontend && npm install
```

**Environment Configuration**:
```bash
# Copy environment templates
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# Configure test environment variables
# backend/.env
AZURE_COSMOS_DB_ENDPOINT=https://your-test-cosmos.documents.azure.com:443/
AZURE_COSMOS_DB_KEY=your-test-cosmos-key
AZURE_KEY_VAULT_URL=https://your-test-keyvault.vault.azure.net/
AZURE_STORAGE_CONNECTION_STRING=your-test-storage-connection

# Test-specific settings
RUN_WRITE_TESTS=false  # Set to true only when testing against non-production
TEST_DATA_PREFIX=test- # Prefix for all test data
CLEANUP_TEST_DATA=true # Auto-cleanup test data after tests
```

### CI/CD Testing Environment

**GitHub Actions Configuration**:
```yaml
# .github/workflows/test.yml
name: Test Suite

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run unit tests
        run: npm run test:unit
      
      - name: Upload coverage reports
        uses: codecov/codecov-action@v4
        with:
          files: ./coverage/lcov.info

  integration-tests:
    runs-on: ubuntu-latest
    environment: testing
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Azure Login
        uses: azure/login@v2
        with:
          client-id: ${{ secrets.AZURE_CLIENT_ID }}
          tenant-id: ${{ secrets.AZURE_TENANT_ID }}
          subscription-id: ${{ secrets.AZURE_SUBSCRIPTION_ID }}
      
      - name: Run integration tests
        env:
          AZURE_COSMOS_DB_ENDPOINT: ${{ secrets.TEST_COSMOS_DB_ENDPOINT }}
          AZURE_COSMOS_DB_KEY: ${{ secrets.TEST_COSMOS_DB_KEY }}
        run: npm run test:integration

  performance-tests:
    runs-on: ubuntu-latest
    environment: testing
    if: github.event_name == 'push' && github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Run performance benchmarks
        env:
          AZURE_COSMOS_DB_ENDPOINT: ${{ secrets.TEST_COSMOS_DB_ENDPOINT }}
          AZURE_COSMOS_DB_KEY: ${{ secrets.TEST_COSMOS_DB_KEY }}
        run: npm run test:performance
```

## 🔒 Testing Safety Guidelines

### 1. Test Data Management

**Data Isolation**:
```typescript
// Always use test prefixes for data identification
const TEST_PREFIX = 'test-';
const testUserId = `${TEST_PREFIX}user-${Date.now()}`;

// Use separate partition keys for test data
const testPartitionKey = `${TEST_PREFIX}${environment}`;
```

**Automatic Cleanup**:
```typescript
// Setup cleanup in test teardown
afterEach(async () => {
  await cleanupTestData(TEST_PREFIX);
});

afterAll(async () => {
  await verifyNoTestDataRemains(TEST_PREFIX);
});
```

### 2. Write Operation Controls

**Safe Write Testing**:
```typescript
// Guard write operations with environment checks
beforeEach(() => {
  if (!process.env.RUN_WRITE_TESTS) {
    test.skip('Write operations disabled - set RUN_WRITE_TESTS=true to enable');
  }
  
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Write tests cannot run in production environment');
  }
});
```

**Read-Only Mode**:
```typescript
// Default to read-only operations
const testConfig = {
  readOnly: process.env.RUN_WRITE_TESTS !== 'true',
  allowedOperations: ['read', 'query'],
  restrictedOperations: ['create', 'update', 'delete']
};
```

### 3. Resource Usage Controls

**Cost Management**:
```typescript
// Monitor and limit RU consumption
class TestResourceMonitor {
  private totalRUs = 0;
  private readonly MAX_RU_THRESHOLD = 1000;

  async trackOperation<T>(operation: () => Promise<T>): Promise<T> {
    const startRU = await this.getCurrentRUs();
    const result = await operation();
    const endRU = await this.getCurrentRUs();
    
    this.totalRUs += (endRU - startRU);
    
    if (this.totalRUs > this.MAX_RU_THRESHOLD) {
      throw new Error(`Test exceeded RU threshold: ${this.totalRUs}/${this.MAX_RU_THRESHOLD}`);
    }
    
    return result;
  }
}
```

**Throttling Respect**:
```typescript
// Implement backoff for throttled operations
const withRetry = async (operation: () => Promise<any>, maxRetries = 3) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation();
    } catch (error) {
      if (error.code === 429 && i < maxRetries - 1) {
        const delay = Math.pow(2, i) * 1000; // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      throw error;
    }
  }
};
```

## 🛠️ Azure Service Mocking Strategies

### 1. Cosmos DB Mocking

**Local Cosmos DB Emulator**:
```bash
# Install and start Cosmos DB Emulator (Windows/Docker)
docker run -p 8081:8081 -p 10250:10250 -p 10251:10251 -p 10252:10252 -p 10253:10253 -p 10254:10254 mcr.microsoft.com/cosmosdb/linux/azure-cosmos-emulator:latest

# Configure connection for local emulator
export AZURE_COSMOS_DB_ENDPOINT="https://localhost:8081"
export AZURE_COSMOS_DB_KEY="C2y6yDjf5/R+ob0N8A7Cgv30VRDJIWEHLM+4QDU5DE2nQ9nDuVTqobD4b8mGGyPMbIZnqyMsEcaGQy67XIw/Jw=="
```

**In-Memory Mocking**:
```typescript
// tests/mocks/cosmos-db-mock.ts
export class MockCosmosContainer {
  private items = new Map<string, any>();

  async create(item: any): Promise<any> {
    this.items.set(item.id, { ...item, _ts: Date.now() });
    return { resource: item, requestCharge: 5.5 };
  }

  async read(id: string): Promise<any> {
    const item = this.items.get(id);
    return item ? { resource: item, requestCharge: 1.0 } : null;
  }

  query(sqlQuery: string) {
    return {
      fetchAll: async () => {
        const resources = Array.from(this.items.values());
        return { resources, requestCharge: 2.3 };
      }
    };
  }
}
```

### 2. Key Vault Mocking

```typescript
// tests/mocks/key-vault-mock.ts
export class MockSecretClient {
  private secrets = new Map([
    ['cosmos-db-key', 'mock-cosmos-key'],
    ['storage-connection-string', 'mock-storage-connection']
  ]);

  async getSecret(name: string) {
    const value = this.secrets.get(name);
    if (!value) throw new Error(`Secret ${name} not found`);
    
    return {
      name,
      value,
      properties: { createdOn: new Date() }
    };
  }
}
```

### 3. Storage Account Mocking

```typescript
// tests/mocks/storage-mock.ts
export class MockBlobServiceClient {
  private containers = new Map<string, Map<string, Buffer>>();

  getContainerClient(containerName: string) {
    if (!this.containers.has(containerName)) {
      this.containers.set(containerName, new Map());
    }

    const container = this.containers.get(containerName)!;

    return {
      uploadBlockBlob: async (blobName: string, data: string | Buffer) => {
        container.set(blobName, Buffer.from(data));
        return { requestId: 'mock-request-id' };
      },

      getBlobClient: (blobName: string) => ({
        download: async () => {
          const data = container.get(blobName);
          if (!data) throw new Error(`Blob ${blobName} not found`);
          
          return {
            readableStreamBody: Readable.from([data])
          };
        }
      })
    };
  }
}
```

## 📈 Test Coverage and Quality Metrics

### Coverage Targets
- **Unit Tests**: 90%+ statement coverage
- **Integration Tests**: 100% Azure service interaction coverage
- **E2E Tests**: 100% critical user journey coverage
- **Performance Tests**: 100% key operation benchmark coverage

### Quality Gates
```typescript
// jest.config.js
module.exports = {
  collectCoverageFrom: [
    'backend/src/**/*.ts',
    'frontend/src/**/*.{ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**'
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 85,
      lines: 90,
      statements: 90
    },
    './backend/src/services/': {
      branches: 90,
      functions: 95,
      lines: 95,
      statements: 95
    }
  }
};
```

### Continuous Quality Monitoring
```bash
# Generate coverage reports
npm run test:coverage

# Run quality analysis
npm run lint
npm run type-check

# Performance regression testing
npm run test:performance -- --compare-baseline
```

## 🐛 Troubleshooting Common Testing Issues

### Azure Authentication Failures

**Problem**: Tests fail with authentication errors
**Solution**:
```bash
# Verify Azure CLI login
az login
az account show

# Check service principal permissions
az role assignment list --assignee <service-principal-id>

# Verify environment variables
echo $AZURE_COSMOS_DB_ENDPOINT
echo $AZURE_COSMOS_DB_KEY
```

### Cosmos DB Connection Issues

**Problem**: Connection timeouts or throttling
**Solution**:
```bash
# Check Cosmos DB account status
az cosmosdb show --name <account-name> --resource-group <rg-name>

# Verify network connectivity
curl -v $AZURE_COSMOS_DB_ENDPOINT

# Increase timeout in tests
jest.setTimeout(30000); // 30 seconds
```

### Test Data Cleanup Issues

**Problem**: Test data not cleaned up properly
**Solution**:
```typescript
// Implement robust cleanup with retries
const cleanupWithRetry = async (prefix: string, maxRetries = 3) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      await cleanupTestData(prefix);
      return;
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
};
```

### Performance Test Inconsistencies

**Problem**: Performance results vary significantly
**Solution**:
```typescript
// Run multiple iterations and calculate statistics
const runPerformanceTest = async (iterations = 10) => {
  const results = [];
  
  for (let i = 0; i < iterations; i++) {
    const result = await performOperation();
    results.push(result.latency);
  }
  
  const avg = results.reduce((a, b) => a + b) / results.length;
  const stdDev = Math.sqrt(results.reduce((sq, n) => sq + Math.pow(n - avg, 2), 0) / results.length);
  
  expect(avg).toBeLessThan(expectedLatency);
  expect(stdDev).toBeLessThan(acceptableVariation);
};
```

## 📚 Testing Best Practices

### 1. Test Organization
- Group related tests in describe blocks
- Use descriptive test names that explain expected behavior
- Organize tests by feature, not by test type
- Keep test files close to the code they test

### 2. Test Data Management
- Use factories for creating test data
- Implement proper cleanup in teardown hooks
- Use unique identifiers for parallel test execution
- Separate test data from production data

### 3. Async Testing Patterns
```typescript
// Proper async/await usage
test('should handle async operations', async () => {
  const result = await asyncOperation();
  expect(result).toBeDefined();
});

// Timeout handling
test('should timeout appropriately', async () => {
  jest.setTimeout(10000);
  await expect(longRunningOperation()).resolves.toBeDefined();
});

// Error handling
test('should handle errors gracefully', async () => {
  await expect(operationThatThrows()).rejects.toThrow('Expected error message');
});
```

### 4. Test Utilities
```typescript
// Create reusable test utilities
export const TestUtils = {
  createTestUser: (overrides = {}) => ({
    id: `test-user-${Date.now()}`,
    email: 'test@example.com',
    displayName: 'Test User',
    ...overrides
  }),

  waitFor: (condition: () => boolean | Promise<boolean>, timeout = 5000) => {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      const check = async () => {
        if (await condition()) {
          resolve(true);
        } else if (Date.now() - startTime > timeout) {
          reject(new Error('Timeout waiting for condition'));
        } else {
          setTimeout(check, 100);
        }
      };
      check();
    });
  }
};
```

---

**Maintained by**: Hike Planner Development Team  
**Last Updated**: Phase 1 Implementation  
**Next Review**: After Phase 2 completion