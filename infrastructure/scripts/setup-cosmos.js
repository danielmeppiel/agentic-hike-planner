#!/usr/bin/env node

/**
 * Azure Cosmos DB Setup Script
 * 
 * This script helps set up and test Azure Cosmos DB connectivity
 * for the Agentic Hike Planner application.
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

function createEnvironmentFile(environment = 'dev') {
  const envFile = path.join(__dirname, `../../backend/.env.${environment}`);
  const exampleFile = path.join(__dirname, '../../backend/.env.example');
  
  log(colors.blue, `📋 Creating environment file for ${environment}...`);
  
  // Read the example file
  if (!fs.existsSync(exampleFile)) {
    log(colors.red, `❌ .env.example file not found at ${exampleFile}`);
    return false;
  }
  
  const exampleContent = fs.readFileSync(exampleFile, 'utf8');
  
  // Add Azure-specific configuration template
  const envContent = exampleContent + `

# Azure Cosmos DB Configuration (Phase 1)
# Fill in these values after deploying Cosmos DB:
# AZURE_COSMOS_DB_ENDPOINT=https://cosmos-hike-planner-dev.documents.azure.com:443/
# AZURE_COSMOS_DB_KEY=your-cosmos-primary-key-here

# Instructions for obtaining these values:
# 1. Deploy Cosmos DB using: az cosmosdb create --name cosmos-hike-planner-dev --resource-group DataDemo
# 2. Get endpoint: az cosmosdb show --name cosmos-hike-planner-dev --resource-group DataDemo --query documentEndpoint
# 3. Get key: az cosmosdb keys list --name cosmos-hike-planner-dev --resource-group DataDemo --query primaryMasterKey
`;
  
  fs.writeFileSync(envFile, envContent);
  log(colors.green, `✅ Created ${envFile}`);
  
  return true;
}

function checkConfiguration() {
  log(colors.blue, '🔍 Checking current configuration...');
  
  // Check if we're in test mode or have real credentials
  try {
    require('dotenv').config({ path: path.join(__dirname, '../../backend/.env') });
    
    const endpoint = process.env.AZURE_COSMOS_DB_ENDPOINT;
    const key = process.env.AZURE_COSMOS_DB_KEY;
    
    if (endpoint && key) {
      log(colors.green, '✅ Azure Cosmos DB credentials found');
      return { hasCredentials: true, endpoint, key };
    } else {
      log(colors.yellow, '⚠️  No Azure Cosmos DB credentials found - using test mode');
      return { hasCredentials: false };
    }
  } catch (error) {
    log(colors.yellow, '⚠️  No .env file found - creating template');
    return { hasCredentials: false };
  }
}

async function testConnection(config) {
  if (!config.hasCredentials) {
    log(colors.yellow, '⚠️  Skipping connection test - no credentials available');
    return false;
  }
  
  log(colors.blue, '🔗 Testing Azure Cosmos DB connection...');
  
  try {
    // Import the database service
    const { DatabaseService } = require('../../backend/src/services/database');
    
    // Create a new instance for testing
    const dbService = new DatabaseService();
    
    // Test initialization
    await dbService.initialize();
    
    // Test health check
    const health = await dbService.healthCheck();
    
    if (health.status === 'healthy') {
      log(colors.green, `✅ Successfully connected to database: ${health.database}`);
      return true;
    } else {
      log(colors.red, `❌ Database health check failed: ${health.status}`);
      return false;
    }
  } catch (error) {
    log(colors.red, `❌ Connection test failed: ${error.message}`);
    return false;
  }
}

async function seedTestData() {
  log(colors.blue, '🌱 Seeding test data...');
  
  try {
    // Import the data seeder
    const { DataSeeder } = require('../../backend/src/services/dataSeeder');
    
    const seeder = new DataSeeder();
    await seeder.initialize();
    
    // Seed a small amount of test data
    const results = await seeder.seedAll({
      users: 5,
      trails: 10,
      trips: 3,
      recommendations: 2
    });
    
    log(colors.green, `✅ Test data seeded successfully:`);
    log(colors.green, `   • ${results.users} users`);
    log(colors.green, `   • ${results.trails} trails`);
    log(colors.green, `   • ${results.trips} trips`);
    log(colors.green, `   • ${results.recommendations} recommendations`);
    
    return true;
  } catch (error) {
    log(colors.red, `❌ Failed to seed test data: ${error.message}`);
    return false;
  }
}

function printInstructions() {
  log(colors.bold, '\n🎯 Azure Cosmos DB Setup Instructions:');
  log(colors.blue, '\n1. Deploy Azure Infrastructure:');
  log(colors.reset, '   az group create --name DataDemo --location eastus');
  log(colors.reset, '   az cosmosdb create --name cosmos-hike-planner-dev --resource-group DataDemo \\');
  log(colors.reset, '     --default-consistency-level Session --enable-automatic-failover false');
  
  log(colors.blue, '\n2. Get Connection Information:');
  log(colors.reset, '   ENDPOINT=$(az cosmosdb show --name cosmos-hike-planner-dev --resource-group DataDemo --query documentEndpoint -o tsv)');
  log(colors.reset, '   KEY=$(az cosmosdb keys list --name cosmos-hike-planner-dev --resource-group DataDemo --query primaryMasterKey -o tsv)');
  
  log(colors.blue, '\n3. Update Environment File:');
  log(colors.reset, '   echo "AZURE_COSMOS_DB_ENDPOINT=$ENDPOINT" >> backend/.env');
  log(colors.reset, '   echo "AZURE_COSMOS_DB_KEY=$KEY" >> backend/.env');
  
  log(colors.blue, '\n4. Test Connection:');
  log(colors.reset, '   cd backend && npm run dev');
  log(colors.reset, '   curl http://localhost:3001/health');
  
  log(colors.blue, '\n5. Seed Test Data:');
  log(colors.reset, '   node infrastructure/scripts/setup-cosmos.js --seed');
  
  log(colors.yellow, '\n💰 Cost Management:');
  log(colors.reset, '   • Cosmos DB in development mode: ~$5-10/day');
  log(colors.reset, '   • Clean up: az group delete --name DataDemo');
  log(colors.reset, '   • Monitor costs: https://portal.azure.com/#blade/Microsoft_Azure_CostManagement/Menu/overview');
}

async function main() {
  const args = process.argv.slice(2);
  const shouldSeed = args.includes('--seed');
  const environment = args.find(arg => arg.startsWith('--env='))?.split('=')[1] || 'dev';
  
  log(colors.bold, '🥾 Agentic Hike Planner - Azure Cosmos DB Setup');
  log(colors.blue, '================================================\n');
  
  // Create environment file
  createEnvironmentFile(environment);
  
  // Check current configuration
  const config = checkConfiguration();
  
  // Test connection if credentials available
  const connected = await testConnection(config);
  
  // Seed data if requested and connected
  if (shouldSeed && connected) {
    await seedTestData();
  }
  
  // Print setup instructions
  if (!config.hasCredentials) {
    printInstructions();
  }
  
  log(colors.green, '\n✅ Setup complete!');
  
  if (!config.hasCredentials) {
    log(colors.yellow, '\n⚠️  Follow the instructions above to complete Azure Cosmos DB setup.');
  }
}

// Run the script
if (require.main === module) {
  main().catch(error => {
    log(colors.red, `❌ Setup failed: ${error.message}`);
    process.exit(1);
  });
}

module.exports = { createEnvironmentFile, checkConfiguration, testConnection, seedTestData };