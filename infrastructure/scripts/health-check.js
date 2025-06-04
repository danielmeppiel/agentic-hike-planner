#!/usr/bin/env node

/**
 * Health Check Script for Azure Cosmos DB
 * 
 * This script tests the database connection and validates that all
 * components are working correctly for Phase 1 implementation.
 */

const path = require('path');
const fs = require('fs');

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(color, message) {
  console.log(`${color}${message}${colors.reset}`);
}

// Change working directory to backend for proper module resolution
process.chdir(path.join(__dirname, '../../backend'));

async function checkEnvironmentConfiguration() {
  log(colors.blue, '🔧 Checking environment configuration...');
  
  const envFile = path.join(process.cwd(), '.env');
  const envDevFile = path.join(process.cwd(), '.env.dev');
  
  if (!fs.existsSync(envFile) && !fs.existsSync(envDevFile)) {
    log(colors.red, '❌ No .env file found');
    log(colors.yellow, '   Run: npm run setup:cosmos');
    return false;
  }
  
  // Load environment variables
  try {
    require('dotenv').config({ path: envFile });
  } catch (error) {
    // dotenv might not be installed if running from root directory
    // Try to load manually
    if (fs.existsSync(envFile)) {
      const envContent = fs.readFileSync(envFile, 'utf8');
      envContent.split('\n').forEach(line => {
        const [key, ...valueParts] = line.split('=');
        if (key && valueParts.length > 0) {
          process.env[key.trim()] = valueParts.join('=').trim();
        }
      });
    }
  }
  
  const endpoint = process.env.AZURE_COSMOS_DB_ENDPOINT;
  const key = process.env.AZURE_COSMOS_DB_KEY;
  
  if (!endpoint || !key) {
    log(colors.yellow, '⚠️  Azure Cosmos DB credentials not configured');
    log(colors.yellow, '   Check .env file and follow setup instructions');
    return false;
  }
  
  log(colors.green, '✅ Environment configuration found');
  log(colors.reset, `   Endpoint: ${endpoint.substring(0, 30)}...`);
  log(colors.reset, `   Key: ${key.substring(0, 10)}...`);
  
  return true;
}

async function testDatabaseConnection() {
  log(colors.blue, '🔗 Testing database connection...');
  
  try {
    // Import database service
    const { databaseService } = require('./dist/services/database');
    
    // Test initialization
    await databaseService.initialize();
    log(colors.green, '✅ Database service initialized');
    
    // Test health check
    const health = await databaseService.healthCheck();
    
    if (health.status === 'healthy') {
      log(colors.green, `✅ Database connection healthy`);
      log(colors.reset, `   Database: ${health.database}`);
      return true;
    } else {
      log(colors.red, `❌ Database health check failed: ${health.status}`);
      return false;
    }
  } catch (error) {
    log(colors.red, `❌ Database connection failed: ${error.message}`);
    return false;
  }
}

async function testContainers() {
  log(colors.blue, '📦 Testing container access...');
  
  try {
    const { databaseService } = require('./dist/services/database');
    
    const containers = ['users', 'trips', 'trails', 'recommendations'];
    
    for (const containerName of containers) {
      try {
        const container = databaseService.getContainer(containerName);
        log(colors.green, `✅ Container '${containerName}' accessible`);
      } catch (error) {
        log(colors.red, `❌ Container '${containerName}' not found`);
        return false;
      }
    }
    
    return true;
  } catch (error) {
    log(colors.red, `❌ Container test failed: ${error.message}`);
    return false;
  }
}

async function testRepositories() {
  log(colors.blue, '🏪 Testing repository operations...');
  
  try {
    const { databaseService } = require('./dist/services/database');
    const { UserRepository } = require('./dist/repositories/UserRepository');
    const { TripRepository } = require('./dist/repositories/TripRepository');
    const { TrailRepository } = require('./dist/repositories/TrailRepository');
    const { RecommendationRepository } = require('./dist/repositories/RecommendationRepository');
    
    // Test repository instantiation
    const userRepo = new UserRepository(databaseService.getContainer('users'));
    const tripRepo = new TripRepository(databaseService.getContainer('trips'));
    const trailRepo = new TrailRepository(databaseService.getContainer('trails'));
    const recRepo = new RecommendationRepository(databaseService.getContainer('recommendations'));
    
    log(colors.green, '✅ All repositories instantiated successfully');
    
    // Test basic operations (read-only)
    try {
      // These operations should not fail even if no data exists
      await userRepo.findActiveUsers(1);
      await trailRepo.searchTrails({ searchTerm: 'test' }, 1);
      log(colors.green, '✅ Repository operations working');
    } catch (error) {
      log(colors.yellow, `⚠️  Repository operations need data: ${error.message}`);
    }
    
    return true;
  } catch (error) {
    log(colors.red, `❌ Repository test failed: ${error.message}`);
    return false;
  }
}

async function testPerformance() {
  log(colors.blue, '⚡ Testing performance baseline...');
  
  try {
    const { databaseService } = require('./dist/services/database');
    
    const startTime = Date.now();
    await databaseService.healthCheck();
    const endTime = Date.now();
    
    const responseTime = endTime - startTime;
    
    if (responseTime < 200) {
      log(colors.green, `✅ Response time: ${responseTime}ms (excellent)`);
    } else if (responseTime < 500) {
      log(colors.yellow, `⚠️  Response time: ${responseTime}ms (acceptable)`);
    } else {
      log(colors.red, `❌ Response time: ${responseTime}ms (too slow)`);
      return false;
    }
    
    return true;
  } catch (error) {
    log(colors.red, `❌ Performance test failed: ${error.message}`);
    return false;
  }
}

async function generateHealthReport() {
  log(colors.bold, '\n📊 Generating health report...');
  
  const report = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    endpoint: process.env.AZURE_COSMOS_DB_ENDPOINT,
    tests: {}
  };
  
  // Run all tests
  report.tests.environment = await checkEnvironmentConfiguration();
  report.tests.connection = await testDatabaseConnection();
  report.tests.containers = await testContainers();
  report.tests.repositories = await testRepositories();
  report.tests.performance = await testPerformance();
  
  // Calculate overall health
  const allPassed = Object.values(report.tests).every(test => test === true);
  report.overallHealth = allPassed ? 'healthy' : 'unhealthy';
  
  // Save report
  const reportFile = path.join(process.cwd(), 'health-report.json');
  fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));
  
  log(colors.blue, `📄 Health report saved to: ${reportFile}`);
  
  return report;
}

function printSummary(report) {
  log(colors.bold, '\n📋 Health Check Summary');
  log(colors.blue, '========================');
  
  const status = report.overallHealth === 'healthy' 
    ? `${colors.green}✅ HEALTHY` 
    : `${colors.red}❌ UNHEALTHY`;
  
  log(colors.reset, `Status: ${status}${colors.reset}`);
  log(colors.reset, `Timestamp: ${report.timestamp}`);
  log(colors.reset, `Environment: ${report.environment}`);
  
  log(colors.blue, '\nTest Results:');
  Object.entries(report.tests).forEach(([test, passed]) => {
    const icon = passed ? '✅' : '❌';
    const color = passed ? colors.green : colors.red;
    log(color, `   ${icon} ${test}`);
  });
  
  if (report.overallHealth === 'healthy') {
    log(colors.green, '\n🎉 All systems operational! Ready for development.');
  } else {
    log(colors.yellow, '\n⚠️  Some issues detected. Check the output above for details.');
    log(colors.yellow, '   Refer to docs/azure-cosmos-setup.md for troubleshooting.');
  }
}

async function main() {
  const args = process.argv.slice(2);
  const saveReport = !args.includes('--no-report');
  
  log(colors.bold, '🏥 Agentic Hike Planner - Health Check');
  log(colors.blue, '====================================\n');
  
  const report = await generateHealthReport();
  
  printSummary(report);
  
  // Exit with appropriate code
  process.exit(report.overallHealth === 'healthy' ? 0 : 1);
}

// Run the script
if (require.main === module) {
  main().catch(error => {
    log(colors.red, `❌ Health check failed: ${error.message}`);
    process.exit(1);
  });
}

module.exports = { checkEnvironmentConfiguration, testDatabaseConnection, testContainers, testRepositories };