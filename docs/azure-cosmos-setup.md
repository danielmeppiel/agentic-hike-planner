# Azure Cosmos DB Setup Guide

This guide walks through setting up Azure Cosmos DB for the Agentic Hike Planner application (Phase 1 implementation).

## 🎯 Overview

Phase 1 establishes the foundational connection between the application and Azure Cosmos DB, moving from development/mock data to actual cloud resources.

## ✅ Prerequisites

- Azure subscription with Cosmos DB creation permissions
- Azure CLI installed and configured (`az --version`)
- Node.js 18+ installed
- Backend application dependencies installed (`npm install`)

## 🚀 Quick Setup (Automated)

### Option 1: Using the Setup Script

```bash
# Navigate to the project root
cd agentic-hike-planner

# Run the automated setup script
node infrastructure/scripts/setup-cosmos.js

# Follow the printed instructions to deploy Azure resources
```

### Option 2: Using the Deployment Script

```bash
# Navigate to infrastructure
cd infrastructure/scripts

# Deploy with existing resource group
./deploy.sh --environment dev --resource-group DataDemo

# Deploy with new resource group
./deploy.sh --environment dev --resource-group rg-hike-planner-dev
```

## 🔧 Manual Setup (Step by Step)

### Step 1: Azure Authentication

```bash
# Login to Azure
az login

# Set your subscription (if you have multiple)
az account set --subscription "your-subscription-name"

# Verify login
az account show
```

### Step 2: Create Resource Group (Optional)

```bash
# Create a new resource group
az group create --name rg-hike-planner-dev --location eastus

# Or use existing resource group (recommended for development)
# DataDemo resource group already exists in the subscription
```

### Step 3: Deploy Cosmos DB

```bash
# Deploy Cosmos DB account
az cosmosdb create \
  --name cosmos-hike-planner-dev \
  --resource-group DataDemo \
  --default-consistency-level Session \
  --enable-automatic-failover false \
  --locations regionName=eastus \
  --kind GlobalDocumentDB \
  --capabilities EnableServerless

# This will take 5-10 minutes to complete
```

### Step 4: Create Database and Containers

You can either use the Bicep template or create manually:

#### Option A: Using Bicep Template

```bash
# Deploy using infrastructure as code
az deployment group create \
  --resource-group DataDemo \
  --template-file infrastructure/bicep/cosmos.bicep \
  --parameters environment=dev
```

#### Option B: Manual Creation

```bash
# Create database
az cosmosdb sql database create \
  --account-name cosmos-hike-planner-dev \
  --resource-group DataDemo \
  --name HikePlannerDB

# Create containers
az cosmosdb sql container create \
  --account-name cosmos-hike-planner-dev \
  --resource-group DataDemo \
  --database-name HikePlannerDB \
  --name users \
  --partition-key-path "/partitionKey"

az cosmosdb sql container create \
  --account-name cosmos-hike-planner-dev \
  --resource-group DataDemo \
  --database-name HikePlannerDB \
  --name trips \
  --partition-key-path "/partitionKey"

az cosmosdb sql container create \
  --account-name cosmos-hike-planner-dev \
  --resource-group DataDemo \
  --database-name HikePlannerDB \
  --name trails \
  --partition-key-path "/partitionKey"

az cosmosdb sql container create \
  --account-name cosmos-hike-planner-dev \
  --resource-group DataDemo \
  --database-name HikePlannerDB \
  --name recommendations \
  --partition-key-path "/partitionKey"
```

### Step 5: Get Connection Information

```bash
# Get the endpoint
ENDPOINT=$(az cosmosdb show \
  --name cosmos-hike-planner-dev \
  --resource-group DataDemo \
  --query documentEndpoint \
  --output tsv)

# Get the primary key
KEY=$(az cosmosdb keys list \
  --name cosmos-hike-planner-dev \
  --resource-group DataDemo \
  --query primaryMasterKey \
  --output tsv)

# Display the values
echo "Endpoint: $ENDPOINT"
echo "Key: $KEY"
```

### Step 6: Configure Environment

```bash
# Create .env file in backend directory
cd backend
cp .env.example .env

# Add Azure Cosmos DB configuration
echo "AZURE_COSMOS_DB_ENDPOINT=$ENDPOINT" >> .env
echo "AZURE_COSMOS_DB_KEY=$KEY" >> .env
```

### Step 7: Test Connection

```bash
# Test the database connection
npm run dev

# In another terminal, test the health endpoint
curl http://localhost:3001/health

# Expected response:
# {"status":"healthy","database":"HikePlannerDB","timestamp":"..."}
```

### Step 8: Seed Test Data

```bash
# Run the setup script with seeding
node ../infrastructure/scripts/setup-cosmos.js --seed

# Or manually seed data using the database CLI
npx ts-node db-cli.ts seed --users 10 --trails 20 --trips 5
```

## 🧪 Testing & Validation

### Database Connection Test

```bash
# Test database integration
npx ts-node test-db-integration.ts

# Expected output should show successful connection and operations
```

### API Endpoint Tests

```bash
# Test all API endpoints
curl http://localhost:3001/health
curl http://localhost:3001/api/users
curl http://localhost:3001/api/trails
curl http://localhost:3001/api/trips

# All should return JSON responses without errors
```

### Performance Baseline

Monitor the following metrics:
- Response times (target: < 200ms)
- RU consumption (aim for < 100 RU/s for development)
- Connection stability (no timeouts)

## 🛠️ Troubleshooting

### Common Issues

#### 1. Azure CLI Authentication

**Problem**: `ERROR: Please run 'az login' to setup account`

**Solution**:
```bash
az login
az account set --subscription "your-subscription-id"
```

#### 2. Resource Already Exists

**Problem**: `Cosmos DB account name already exists`

**Solution**:
```bash
# Use a different name or check existing account
az cosmosdb list --query "[].name"
```

#### 3. Insufficient Permissions

**Problem**: `Authorization failed` or `Access denied`

**Solution**:
- Ensure you have Contributor or Cosmos DB Operator role
- Check with Azure administrator for proper permissions

#### 4. Connection Timeouts

**Problem**: Application can't connect to Cosmos DB

**Solution**:
```bash
# Verify endpoint and key are correct
az cosmosdb show --name cosmos-hike-planner-dev --resource-group DataDemo

# Check network connectivity
curl -I $AZURE_COSMOS_DB_ENDPOINT

# Verify environment variables are loaded
node -e "require('dotenv').config(); console.log(process.env.AZURE_COSMOS_DB_ENDPOINT)"
```

#### 5. Container Not Found

**Problem**: `Container 'users' not found`

**Solution**:
```bash
# List existing containers
az cosmosdb sql container list \
  --account-name cosmos-hike-planner-dev \
  --resource-group DataDemo \
  --database-name HikePlannerDB

# Recreate missing containers using Bicep template
az deployment group create \
  --resource-group DataDemo \
  --template-file infrastructure/bicep/cosmos.bicep \
  --parameters environment=dev
```

### Diagnostic Commands

```bash
# Check Azure CLI configuration
az account show
az cosmosdb list

# Test environment configuration
cd backend
node -e "
  require('dotenv').config();
  console.log('Endpoint:', process.env.AZURE_COSMOS_DB_ENDPOINT);
  console.log('Key length:', process.env.AZURE_COSMOS_DB_KEY?.length);
"

# Test database service directly
node -e "
  const { databaseService } = require('./src/services/database');
  databaseService.healthCheck().then(h => console.log('Health:', h));
"
```

## 💰 Cost Management

### Development Environment Costs

- **Cosmos DB Serverless**: ~$0.25 per million RU consumed
- **Typical development usage**: ~$5-10/day
- **Storage**: ~$0.25/GB/month

### Cost Optimization Tips

1. **Use Serverless Mode**: Enabled by default in our templates
2. **Monitor RU Consumption**: Check Azure Portal regularly
3. **Clean Up Development Data**: Remove test data when not needed
4. **Use Autoscale**: For predictable workloads
5. **Set up Budget Alerts**: Get notified at spending thresholds

### Budget Setup

```bash
# Create a budget alert for $50/month
az consumption budget create \
  --resource-group DataDemo \
  --budget-name "hike-planner-dev-budget" \
  --amount 50 \
  --time-grain Monthly \
  --time-period-start-date $(date +%Y-%m-01) \
  --time-period-end-date $(date -d "$(date +%Y-%m-01) +1 month -1 day" +%Y-%m-%d)
```

### Cleanup Commands

```bash
# Remove all resources (be careful!)
az group delete --name DataDemo --yes --no-wait

# Remove just Cosmos DB account
az cosmosdb delete --name cosmos-hike-planner-dev --resource-group DataDemo --yes
```

## 📊 Success Criteria

### Technical Requirements ✅

- [x] Application connects to Azure Cosmos DB without errors
- [x] All CRUD operations work correctly across all entities
- [x] Test data can be seeded and retrieved consistently
- [x] No authentication or connection timeouts
- [x] Performance baseline established (response times < 200ms)

### Documentation Requirements ✅

- [x] Environment setup guide created
- [x] Connection troubleshooting documented
- [x] Data seeding procedures documented
- [x] Performance baseline metrics available

## 🔗 Next Steps

After completing Phase 1:

1. **Monitor Performance**: Track RU consumption and response times
2. **Implement Caching**: Add Redis cache for frequently accessed data
3. **Add Authentication**: Integrate Azure AD B2C
4. **Enable AI Features**: Connect Azure AI Foundry
5. **Production Setup**: Create staging and production environments

## 📞 Support

- **Documentation**: [docs/](../docs/)
- **Issues**: Create GitHub issue with `azure` and `database` labels
- **Azure Support**: Use Azure Portal support tickets for Azure-specific issues

---

**Phase 1 Complete! 🎉**

Your application is now connected to Azure Cosmos DB and ready for development and testing.