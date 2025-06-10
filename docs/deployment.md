# Deployment Guide and Workflow Documentation

This document provides comprehensive guidance on deploying the Agentic Hike Planner application across different environments using Azure services and Infrastructure as Code.

## 🎯 Deployment Philosophy

Our deployment strategy emphasizes **speed and simplicity** while maintaining production-grade reliability. We implement a phased approach that gradually adds infrastructure complexity as the application evolves, following the principle of building simple, scalable foundations first.

### Core Principles
- **Environment Parity**: Consistent configuration across dev, staging, and production
- **Infrastructure as Code**: All resources defined in version-controlled templates
- **Automated Deployment**: CI/CD pipelines handle deployments with minimal manual intervention
- **Cost Optimization**: Right-sized resources for each environment with optimization opportunities
- **Security First**: Secrets managed via Azure Key Vault, least-privilege access patterns

## 🏗️ Architecture Overview

The application follows a multi-tier Azure architecture with phase-based component introduction:

### Phase 1: Core Data and Identity Foundation
- **Azure Cosmos DB**: User data and trip information storage
- **Azure Key Vault**: Secure secret management
- **Azure App Service**: Backend API hosting (basic tier)
- **Infrastructure as Code**: Bicep and Terraform templates

### Phase 2+: Enhanced Services (Future)
- **Azure Static Web Apps**: Frontend hosting
- **Azure Application Gateway**: Load balancing and SSL termination
- **Azure Storage Account**: Blob storage for images and documents
- **Azure Functions**: Serverless compute for background tasks
- **Azure CDN**: Content delivery optimization
- **Azure Redis Cache**: Session and data caching

## 🌍 Environment Strategy

### Development Environment
- **Purpose**: Local development and feature testing
- **Scale**: Minimal resource allocation
- **Data**: Mock data and test datasets
- **Cost**: Free tier where possible

### Staging Environment  
- **Purpose**: Pre-production testing and validation
- **Scale**: Production-like sizing
- **Data**: Sanitized production data or realistic test data
- **Cost**: Optimized for testing needs

### Production Environment
- **Purpose**: Live application serving end users
- **Scale**: Right-sized for current load with auto-scaling
- **Data**: Live user data with full backup strategy
- **Cost**: Optimized for performance and reliability

## 🚀 Local Development Setup

### Prerequisites

**Required Software**:
```bash
# Node.js 18+ 
node --version # Should be 18+

# Azure CLI
az --version

# Git
git --version

# Docker (optional, for local services)
docker --version
```

**Azure Access**:
```bash
# Login to Azure
az login

# Set default subscription
az account set --subscription "your-subscription-id"

# Verify access
az account show
```

### Repository Setup

**1. Clone and Install Dependencies**:
```bash
# Clone repository
git clone https://github.com/danielmeppiel/agentic-hike-planner.git
cd agentic-hike-planner

# Install root dependencies
npm install

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install

# Return to root
cd ..
```

**2. Environment Configuration**:
```bash
# Copy environment templates
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# Edit backend/.env with your development settings
nano backend/.env
```

**Sample Development Configuration** (`backend/.env`):
```env
# Environment
NODE_ENV=development
PORT=3001

# Azure Cosmos DB (Development)
AZURE_COSMOS_DB_ENDPOINT=https://your-dev-cosmos.documents.azure.com:443/
AZURE_COSMOS_DB_KEY=your-dev-cosmos-key
AZURE_COSMOS_DB_DATABASE_NAME=HikePlannerDB

# Azure Key Vault (Development)
AZURE_KEY_VAULT_URL=https://your-dev-keyvault.vault.azure.net/

# Azure Storage (Development)
AZURE_STORAGE_CONNECTION_STRING=DefaultEndpointsProtocol=https;AccountName=yourdevstorage;AccountKey=...

# Application Insights (Development)
APPLICATIONINSIGHTS_CONNECTION_STRING=InstrumentationKey=your-dev-insights-key;...

# Security
JWT_SECRET=your-jwt-secret-key
CORS_ORIGIN=http://localhost:3000

# Feature Flags
ENABLE_AI_FEATURES=true
ENABLE_PERFORMANCE_LOGGING=true
```

### Local Development Commands

**Start Development Servers**:
```bash
# Start backend server (runs on http://localhost:3001)
cd backend
npm run dev

# In new terminal, start frontend (runs on http://localhost:3000)
cd frontend
npm run dev

# Optional: Start all services with concurrently
npm run dev:all
```

**Development Verification**:
```bash
# Test backend health endpoint
curl http://localhost:3001/health

# Test database connectivity
cd backend
npm run test:db-connection

# Run development test suite
npm run test:dev
```

## 🏭 Infrastructure as Code (IaC)

### Bicep Deployment (Recommended)

**Template Structure**:
```
infrastructure/bicep/
├── main.bicep              # Main deployment template
├── modules/
│   ├── cosmos-db.bicep     # Cosmos DB configuration
│   ├── key-vault.bicep     # Key Vault setup
│   ├── app-service.bicep   # App Service configuration
│   └── monitoring.bicep    # Application Insights
├── parameters/
│   ├── dev.parameters.json # Development environment
│   ├── staging.parameters.json # Staging environment
│   └── prod.parameters.json # Production environment
└── scripts/
    ├── deploy.sh           # Deployment automation
    └── validate.sh         # Template validation
```

**Deployment Commands**:

**1. Validate Templates**:
```bash
# Validate development environment
./scripts/validate.sh --environment dev --type bicep

# Validate with specific resource group
./scripts/validate.sh \
  --environment dev \
  --resource-group rg-hike-planner-dev \
  --type bicep
```

**2. Deploy Infrastructure**:
```bash
# Deploy development environment
./scripts/deploy.sh \
  --environment dev \
  --resource-group rg-hike-planner-dev \
  --location eastus \
  --free-tier

# Deploy staging environment
./scripts/deploy.sh \
  --environment staging \
  --resource-group rg-hike-planner-staging \
  --location eastus

# Deploy production environment
./scripts/deploy.sh \
  --environment prod \
  --resource-group rg-hike-planner-prod \
  --location eastus
```

**3. Verify Deployment**:
```bash
# Check resource group status
az group show --name rg-hike-planner-dev

# List deployed resources
az resource list --resource-group rg-hike-planner-dev --output table

# Check Cosmos DB status
az cosmosdb show --name cosmos-hike-planner-dev --resource-group rg-hike-planner-dev
```

**Sample main.bicep**:
```bicep
@description('Environment name (dev, staging, prod)')
param environment string

@description('Azure region for deployment')
param location string = resourceGroup().location

@description('Application name prefix')
param appName string = 'hike-planner'

// Variables
var resourcePrefix = '${appName}-${environment}'
var cosmosDbAccountName = 'cosmos-${resourcePrefix}'
var keyVaultName = 'kv-${resourcePrefix}-${uniqueString(resourceGroup().id)}'
var appServicePlanName = 'asp-${resourcePrefix}'
var appServiceName = 'app-${resourcePrefix}'

// Cosmos DB Module
module cosmosDb 'modules/cosmos-db.bicep' = {
  name: 'cosmosDb'
  params: {
    accountName: cosmosDbAccountName
    location: location
    environment: environment
  }
}

// Key Vault Module
module keyVault 'modules/key-vault.bicep' = {
  name: 'keyVault'
  params: {
    keyVaultName: keyVaultName
    location: location
    environment: environment
  }
}

// App Service Module
module appService 'modules/app-service.bicep' = {
  name: 'appService'
  params: {
    appServicePlanName: appServicePlanName
    appServiceName: appServiceName
    location: location
    environment: environment
    cosmosDbEndpoint: cosmosDb.outputs.endpoint
    keyVaultUrl: keyVault.outputs.vaultUri
  }
}

// Outputs
output cosmosDbEndpoint string = cosmosDb.outputs.endpoint
output keyVaultUrl string = keyVault.outputs.vaultUri
output appServiceUrl string = appService.outputs.defaultHostName
```

### Terraform Deployment (Alternative)

**Template Structure**:
```
infrastructure/terraform/
├── main.tf                 # Main Terraform configuration
├── variables.tf           # Input variables
├── outputs.tf             # Output values
├── terraform.tfvars.example # Variable template
├── environments/
│   ├── dev.tfvars         # Development variables
│   ├── staging.tfvars     # Staging variables
│   └── prod.tfvars        # Production variables
└── modules/
    ├── cosmos-db/         # Cosmos DB module
    ├── key-vault/         # Key Vault module
    └── app-service/       # App Service module
```

**Deployment Commands**:

**1. Initialize Terraform**:
```bash
cd infrastructure/terraform

# Initialize Terraform
terraform init

# Validate configuration
terraform validate
```

**2. Plan and Deploy**:
```bash
# Plan development deployment
terraform plan -var-file="environments/dev.tfvars" -out=dev.tfplan

# Apply development deployment
terraform apply dev.tfplan

# View deployment outputs
terraform output
```

**3. Alternative Script-Based Deployment**:
```bash
# Deploy using deployment script
./scripts/deploy.sh \
  --environment dev \
  --resource-group rg-hike-planner-dev \
  --method terraform \
  --location eastus
```

## 🔄 CI/CD Pipeline Configuration

### GitHub Actions Workflows

**Workflow Structure**:
```
.github/workflows/
├── ci.yml                 # Continuous integration
├── deploy-dev.yml         # Development deployment
├── deploy-staging.yml     # Staging deployment
├── deploy-prod.yml        # Production deployment
├── infrastructure.yml     # Infrastructure updates
└── security-scan.yml     # Security scanning
```

### 1. Continuous Integration Workflow

**File**: `.github/workflows/ci.yml`
```yaml
name: Continuous Integration

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    
    strategy:
      matrix:
        node-version: [18, 20]
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Setup Node.js ${{ matrix.node-version }}
        uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}
          cache: 'npm'
      
      - name: Install dependencies
        run: |
          npm ci
          cd backend && npm ci
          cd ../frontend && npm ci
      
      - name: Run linting
        run: |
          cd backend && npm run lint
          cd ../frontend && npm run lint
      
      - name: Run unit tests
        run: npm run test:unit
      
      - name: Run type checking
        run: |
          cd backend && npm run type-check
          cd ../frontend && npm run type-check
      
      - name: Build applications
        run: |
          cd backend && npm run build
          cd ../frontend && npm run build
      
      - name: Upload build artifacts
        uses: actions/upload-artifact@v4
        with:
          name: build-artifacts-${{ matrix.node-version }}
          path: |
            backend/dist/
            frontend/dist/

  security-scan:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Run security audit
        run: |
          npm audit --audit-level moderate
          cd backend && npm audit --audit-level moderate
          cd ../frontend && npm audit --audit-level moderate
      
      - name: Run CodeQL analysis
        uses: github/codeql-action/analyze@v3
        with:
          languages: typescript
```

### 2. Infrastructure Deployment Workflow

**File**: `.github/workflows/infrastructure.yml`
```yaml
name: Infrastructure Deployment

on:
  push:
    branches: [main]
    paths: ['infrastructure/**']
  workflow_dispatch:
    inputs:
      environment:
        description: 'Environment to deploy'
        required: true
        default: 'dev'
        type: choice
        options:
        - dev
        - staging
        - prod

jobs:
  validate-infrastructure:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Azure Login
        uses: azure/login@v2
        with:
          client-id: ${{ secrets.AZURE_CLIENT_ID }}
          tenant-id: ${{ secrets.AZURE_TENANT_ID }}
          subscription-id: ${{ secrets.AZURE_SUBSCRIPTION_ID }}
      
      - name: Validate Bicep templates
        run: |
          ./scripts/validate.sh \
            --environment ${{ github.event.inputs.environment || 'dev' }} \
            --type bicep
  
  deploy-infrastructure:
    needs: validate-infrastructure
    runs-on: ubuntu-latest
    environment: ${{ github.event.inputs.environment || 'dev' }}
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Azure Login
        uses: azure/login@v2
        with:
          client-id: ${{ secrets.AZURE_CLIENT_ID }}
          tenant-id: ${{ secrets.AZURE_TENANT_ID }}
          subscription-id: ${{ secrets.AZURE_SUBSCRIPTION_ID }}
      
      - name: Deploy infrastructure
        run: |
          ./scripts/deploy.sh \
            --environment ${{ github.event.inputs.environment || 'dev' }} \
            --resource-group ${{ secrets.AZURE_RESOURCE_GROUP }} \
            --location ${{ secrets.AZURE_LOCATION }}
      
      - name: Update deployment status
        run: |
          echo "Infrastructure deployed successfully to ${{ github.event.inputs.environment || 'dev' }}"
```

### 3. Application Deployment Workflow

**File**: `.github/workflows/deploy-staging.yml`
```yaml
name: Deploy to Staging

on:
  push:
    branches: [develop]
  workflow_dispatch:

jobs:
  deploy:
    runs-on: ubuntu-latest
    environment: staging
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install and build
        run: |
          npm ci
          cd backend && npm ci && npm run build
          cd ../frontend && npm ci && npm run build
      
      - name: Azure Login
        uses: azure/login@v2
        with:
          client-id: ${{ secrets.AZURE_CLIENT_ID }}
          tenant-id: ${{ secrets.AZURE_TENANT_ID }}
          subscription-id: ${{ secrets.AZURE_SUBSCRIPTION_ID }}
      
      - name: Deploy to App Service
        uses: azure/webapps-deploy@v3
        with:
          app-name: ${{ secrets.AZURE_APP_SERVICE_NAME }}
          package: backend/dist
      
      - name: Deploy frontend to Static Web Apps
        uses: Azure/static-web-apps-deploy@v1
        with:
          azure_static_web_apps_api_token: ${{ secrets.AZURE_STATIC_WEB_APPS_API_TOKEN }}
          repo_token: ${{ secrets.GITHUB_TOKEN }}
          action: 'upload'
          app_location: 'frontend'
          output_location: 'dist'
      
      - name: Run integration tests
        env:
          AZURE_COSMOS_DB_ENDPOINT: ${{ secrets.STAGING_COSMOS_DB_ENDPOINT }}
          AZURE_COSMOS_DB_KEY: ${{ secrets.STAGING_COSMOS_DB_KEY }}
        run: npm run test:integration
      
      - name: Run health checks
        run: |
          sleep 30 # Wait for deployment to complete
          ./scripts/health-check.sh --environment staging
```

### GitHub Secrets Configuration

**Required Secrets by Environment**:

**Repository Secrets (Global)**:
```
AZURE_CLIENT_ID=your-service-principal-client-id
AZURE_TENANT_ID=your-azure-tenant-id
AZURE_SUBSCRIPTION_ID=your-azure-subscription-id
```

**Environment-Specific Secrets**:

**Development Environment**:
```
AZURE_RESOURCE_GROUP=rg-hike-planner-dev
AZURE_LOCATION=eastus
DEV_COSMOS_DB_ENDPOINT=https://cosmos-hike-planner-dev.documents.azure.com:443/
DEV_COSMOS_DB_KEY=your-dev-cosmos-key
DEV_APP_SERVICE_NAME=app-hike-planner-dev
```

**Staging Environment**:
```
AZURE_RESOURCE_GROUP=rg-hike-planner-staging
AZURE_LOCATION=eastus
STAGING_COSMOS_DB_ENDPOINT=https://cosmos-hike-planner-staging.documents.azure.com:443/
STAGING_COSMOS_DB_KEY=your-staging-cosmos-key
STAGING_APP_SERVICE_NAME=app-hike-planner-staging
AZURE_STATIC_WEB_APPS_API_TOKEN=your-staging-swa-token
```

**Production Environment**:
```
AZURE_RESOURCE_GROUP=rg-hike-planner-prod
AZURE_LOCATION=eastus
PROD_COSMOS_DB_ENDPOINT=https://cosmos-hike-planner-prod.documents.azure.com:443/
PROD_COSMOS_DB_KEY=your-prod-cosmos-key
PROD_APP_SERVICE_NAME=app-hike-planner-prod
AZURE_STATIC_WEB_APPS_API_TOKEN=your-prod-swa-token
```

### Service Principal Setup

**Create Service Principal for CI/CD**:
```bash
# Create service principal with contributor role
az ad sp create-for-rbac \
  --name "hike-planner-deploy" \
  --role "Contributor" \
  --scopes /subscriptions/<subscription-id>/resourceGroups/<resource-group> \
  --sdk-auth

# Output format for GitHub secrets:
{
  "clientId": "your-client-id",
  "clientSecret": "your-client-secret",
  "subscriptionId": "your-subscription-id",
  "tenantId": "your-tenant-id"
}
```

**Assign Additional Permissions**:
```bash
# Key Vault access for secrets management
az keyvault set-policy \
  --name kv-hike-planner-prod \
  --spn <service-principal-client-id> \
  --secret-permissions get list set

# Storage account access for static website deployment
az role assignment create \
  --assignee <service-principal-client-id> \
  --role "Storage Blob Data Contributor" \
  --scope /subscriptions/<subscription-id>/resourceGroups/<resource-group>/providers/Microsoft.Storage/storageAccounts/<storage-account>
```

## 🔧 Environment Configuration Management

### Environment-Specific Settings

**Development Environment** (`dev.parameters.json`):
```json
{
  "$schema": "https://schema.management.azure.com/schemas/2019-04-01/deploymentParameters.json#",
  "contentVersion": "1.0.0.0",
  "parameters": {
    "environment": {
      "value": "dev"
    },
    "location": {
      "value": "eastus"
    },
    "cosmosDbThroughput": {
      "value": 400
    },
    "appServicePlanSku": {
      "value": "F1"
    },
    "enableFreeTier": {
      "value": true
    },
    "enableDiagnostics": {
      "value": true
    }
  }
}
```

**Staging Environment** (`staging.parameters.json`):
```json
{
  "$schema": "https://schema.management.azure.com/schemas/2019-04-01/deploymentParameters.json#",
  "contentVersion": "1.0.0.0",
  "parameters": {
    "environment": {
      "value": "staging"
    },
    "location": {
      "value": "eastus"
    },
    "cosmosDbThroughput": {
      "value": 1000
    },
    "appServicePlanSku": {
      "value": "S1"
    },
    "enableFreeTier": {
      "value": false
    },
    "enableDiagnostics": {
      "value": true
    },
    "enableBackup": {
      "value": true
    }
  }
}
```

**Production Environment** (`prod.parameters.json`):
```json
{
  "$schema": "https://schema.management.azure.com/schemas/2019-04-01/deploymentParameters.json#",
  "contentVersion": "1.0.0.0",
  "parameters": {
    "environment": {
      "value": "prod"
    },
    "location": {
      "value": "eastus"
    },
    "cosmosDbThroughput": {
      "value": 2000
    },
    "appServicePlanSku": {
      "value": "P1V3"
    },
    "enableFreeTier": {
      "value": false
    },
    "enableDiagnostics": {
      "value": true
    },
    "enableBackup": {
      "value": true
    },
    "enableAutoScale": {
      "value": true
    },
    "enableMultiRegion": {
      "value": false
    }
  }
}
```

### Application Configuration

**Environment Variables Management**:

**Development** (`.env.dev`):
```env
NODE_ENV=development
LOG_LEVEL=debug
AZURE_COSMOS_DB_DATABASE_NAME=HikePlannerDB-Dev
ENABLE_DETAILED_ERRORS=true
CORS_ORIGIN=http://localhost:3000,http://localhost:3001
RATE_LIMIT_ENABLED=false
```

**Staging** (App Service Configuration):
```env
NODE_ENV=staging
LOG_LEVEL=info
AZURE_COSMOS_DB_DATABASE_NAME=HikePlannerDB-Staging
ENABLE_DETAILED_ERRORS=true
CORS_ORIGIN=https://staging.hikeplanner.com
RATE_LIMIT_ENABLED=true
RATE_LIMIT_MAX=1000
```

**Production** (App Service Configuration):
```env
NODE_ENV=production
LOG_LEVEL=warn
AZURE_COSMOS_DB_DATABASE_NAME=HikePlannerDB
ENABLE_DETAILED_ERRORS=false
CORS_ORIGIN=https://hikeplanner.com
RATE_LIMIT_ENABLED=true
RATE_LIMIT_MAX=500
ENABLE_MONITORING=true
```

## 🧪 Deployment Testing and Verification

### Health Check Scripts

**Create Health Check Script** (`scripts/health-check.sh`):
```bash
#!/bin/bash

ENVIRONMENT=${1:-dev}
BASE_URL=""
EXPECTED_STATUS=200
TIMEOUT=30

# Set base URL based on environment
case $ENVIRONMENT in
  "dev")
    BASE_URL="https://app-hike-planner-dev.azurewebsites.net"
    ;;
  "staging")
    BASE_URL="https://app-hike-planner-staging.azurewebsites.net"
    ;;
  "prod")
    BASE_URL="https://app-hike-planner-prod.azurewebsites.net"
    ;;
  *)
    echo "Unknown environment: $ENVIRONMENT"
    exit 1
    ;;
esac

echo "🔍 Running health checks for $ENVIRONMENT environment..."
echo "🌐 Base URL: $BASE_URL"

# Health endpoint check
echo "📋 Checking health endpoint..."
HEALTH_RESPONSE=$(curl -s -w "%{http_code}" -o /tmp/health_response.json --max-time $TIMEOUT "$BASE_URL/health")
HEALTH_STATUS=${HEALTH_RESPONSE: -3}

if [ "$HEALTH_STATUS" = "$EXPECTED_STATUS" ]; then
  echo "✅ Health endpoint: OK ($HEALTH_STATUS)"
  cat /tmp/health_response.json | jq '.'
else
  echo "❌ Health endpoint: FAILED ($HEALTH_STATUS)"
  cat /tmp/health_response.json
  exit 1
fi

# Database connectivity check
echo "📋 Checking database connectivity..."
DB_RESPONSE=$(curl -s -w "%{http_code}" -o /tmp/db_response.json --max-time $TIMEOUT "$BASE_URL/api/health/database")
DB_STATUS=${DB_RESPONSE: -3}

if [ "$DB_STATUS" = "$EXPECTED_STATUS" ]; then
  echo "✅ Database connectivity: OK ($DB_STATUS)"
  cat /tmp/db_response.json | jq '.'
else
  echo "❌ Database connectivity: FAILED ($DB_STATUS)"
  cat /tmp/db_response.json
  exit 1
fi

# API endpoints check
echo "📋 Checking critical API endpoints..."
API_ENDPOINTS=(
  "/api/users/profile"
  "/api/trips"
  "/api/trails/search"
)

for endpoint in "${API_ENDPOINTS[@]}"; do
  echo "  Testing $endpoint..."
  ENDPOINT_RESPONSE=$(curl -s -w "%{http_code}" -o /tmp/endpoint_response.json --max-time $TIMEOUT "$BASE_URL$endpoint")
  ENDPOINT_STATUS=${ENDPOINT_RESPONSE: -3}
  
  if [ "$ENDPOINT_STATUS" = "200" ] || [ "$ENDPOINT_STATUS" = "401" ]; then
    echo "    ✅ $endpoint: OK ($ENDPOINT_STATUS)"
  else
    echo "    ❌ $endpoint: FAILED ($ENDPOINT_STATUS)"
    cat /tmp/endpoint_response.json
    exit 1
  fi
done

echo "🎉 All health checks passed for $ENVIRONMENT environment!"
```

### Deployment Verification Commands

**1. Infrastructure Verification**:
```bash
# Verify resource group deployment
az deployment group show \
  --resource-group rg-hike-planner-prod \
  --name main-deployment \
  --query "properties.provisioningState"

# Check all resources in resource group
az resource list \
  --resource-group rg-hike-planner-prod \
  --output table

# Verify Cosmos DB account
az cosmosdb show \
  --name cosmos-hike-planner-prod \
  --resource-group rg-hike-planner-prod \
  --query "provisioningState"
```

**2. Application Verification**:
```bash
# Get App Service URL
APP_URL=$(az webapp show \
  --name app-hike-planner-prod \
  --resource-group rg-hike-planner-prod \
  --query defaultHostName -o tsv)

echo "Application URL: https://$APP_URL"

# Test health endpoint
curl "https://$APP_URL/health"

# Test API endpoints
curl "https://$APP_URL/api/health/database"
```

**3. Database Verification**:
```bash
# Run integration tests against deployed environment
cd backend
AZURE_COSMOS_DB_ENDPOINT="https://cosmos-hike-planner-prod.documents.azure.com:443/" \
AZURE_COSMOS_DB_KEY="$(az cosmosdb keys list --name cosmos-hike-planner-prod --resource-group rg-hike-planner-prod --query primaryMasterKey -o tsv)" \
npm run test:integration

# Run performance benchmarks
npm run test:performance
```

### Post-Deployment Monitoring

**Application Insights Queries**:
```kusto
// Check deployment success
requests
| where timestamp > ago(1h)
| where cloud_RoleName == "hike-planner-backend"
| summarize RequestCount = count(), FailureRate = countif(success == false) * 100.0 / count() by bin(timestamp, 5m)
| render timechart

// Monitor database performance
dependencies
| where timestamp > ago(1h)
| where type == "Azure DocumentDB"
| summarize avg(duration), max(duration), count() by bin(timestamp, 5m)
| render timechart
```

**Cost Monitoring**:
```bash
# Check current month's cost for resource group
az consumption usage list \
  --scope "/subscriptions/{subscription-id}/resourceGroups/rg-hike-planner-prod" \
  --start-date $(date -d "$(date +%Y-%m-01)" +%Y-%m-%d) \
  --end-date $(date +%Y-%m-%d)
```

## 🚨 Rollback Procedures

### Application Rollback

**1. App Service Slot Swapping** (Production):
```bash
# Swap back to previous slot
az webapp deployment slot swap \
  --name app-hike-planner-prod \
  --resource-group rg-hike-planner-prod \
  --slot staging \
  --target-slot production

# Verify rollback
./scripts/health-check.sh prod
```

**2. Manual Application Rollback**:
```bash
# Get previous deployment
az webapp deployment list \
  --name app-hike-planner-prod \
  --resource-group rg-hike-planner-prod \
  --query "[1].id" -o tsv

# Redeploy previous version
az webapp deployment source config-zip \
  --name app-hike-planner-prod \
  --resource-group rg-hike-planner-prod \
  --src path/to/previous/deployment.zip
```

### Infrastructure Rollback

**1. Bicep Rollback**:
```bash
# Get previous deployment
PREVIOUS_DEPLOYMENT=$(az deployment group list \
  --resource-group rg-hike-planner-prod \
  --query "[1].name" -o tsv)

# Redeploy previous template
az deployment group create \
  --resource-group rg-hike-planner-prod \
  --template-file infrastructure/bicep/main.bicep \
  --parameters @infrastructure/bicep/parameters/prod.parameters.json \
  --name "rollback-$(date +%Y%m%d-%H%M%S)"
```

**2. Terraform Rollback**:
```bash
cd infrastructure/terraform

# Get previous state
terraform state pull > current-state.json

# Rollback to previous version
git checkout HEAD~1 -- main.tf
terraform plan -var-file="environments/prod.tfvars"
terraform apply -var-file="environments/prod.tfvars"
```

### Database Rollback

**Cosmos DB Container Restore**:
```bash
# List available backups
az cosmosdb restorable-database-account list \
  --location eastus \
  --query "[?accountName=='cosmos-hike-planner-prod']"

# Restore from backup (if continuous backup enabled)
az cosmosdb restore \
  --target-database-account-name cosmos-hike-planner-prod-restored \
  --resource-group rg-hike-planner-prod \
  --source-database-account-name cosmos-hike-planner-prod \
  --restore-timestamp "2024-01-15T10:00:00Z" \
  --location eastus
```

## 🛠️ Troubleshooting Common Deployment Issues

### Azure Authentication Failures

**Problem**: Deployment fails with authentication errors
**Symptoms**:
```
Error: The client 'xxx' with object id 'xxx' does not have authorization to perform action 'Microsoft.Resources/deployments/write'
```

**Solution**:
```bash
# Check current login status
az account show

# Re-login if needed
az login

# Verify service principal permissions
az role assignment list --assignee <service-principal-id>

# Add required permissions
az role assignment create \
  --assignee <service-principal-id> \
  --role "Contributor" \
  --scope /subscriptions/<subscription-id>
```

### Resource Provisioning Failures

**Problem**: Resources fail to provision
**Symptoms**:
```
Error: Resource 'cosmos-hike-planner-prod' already exists
Error: The specified name is not available
```

**Solutions**:

**Name Conflicts**:
```bash
# Check resource name availability
az cosmosdb check-name-exists --name cosmos-hike-planner-prod

# Use unique suffix
UNIQUE_SUFFIX=$(date +%s)
COSMOS_NAME="cosmos-hike-planner-prod-$UNIQUE_SUFFIX"
```

**Resource Limits**:
```bash
# Check subscription limits
az vm list-usage --location eastus

# Check resource group limits
az group show --name rg-hike-planner-prod --query properties.provisioningState
```

### Application Startup Failures

**Problem**: Application fails to start after deployment
**Symptoms**:
```
HTTP 500 errors
Application Insights shows startup exceptions
Health checks fail
```

**Diagnostic Steps**:
```bash
# Check App Service logs
az webapp log tail --name app-hike-planner-prod --resource-group rg-hike-planner-prod

# Check application settings
az webapp config appsettings list \
  --name app-hike-planner-prod \
  --resource-group rg-hike-planner-prod

# Verify environment variables
az webapp show \
  --name app-hike-planner-prod \
  --resource-group rg-hike-planner-prod \
  --query "siteConfig.appSettings"
```

**Common Fixes**:
```bash
# Update application settings
az webapp config appsettings set \
  --name app-hike-planner-prod \
  --resource-group rg-hike-planner-prod \
  --settings AZURE_COSMOS_DB_ENDPOINT="https://cosmos-hike-planner-prod.documents.azure.com:443/"

# Restart application
az webapp restart \
  --name app-hike-planner-prod \
  --resource-group rg-hike-planner-prod
```

### Database Connection Issues

**Problem**: Application cannot connect to Cosmos DB
**Symptoms**:
```
Cosmos DB authentication errors
Timeout exceptions
Network connectivity issues
```

**Diagnostic Commands**:
```bash
# Test Cosmos DB connectivity
az cosmosdb show \
  --name cosmos-hike-planner-prod \
  --resource-group rg-hike-planner-prod

# Check firewall rules
az cosmosdb firewall-rule list \
  --account-name cosmos-hike-planner-prod \
  --resource-group rg-hike-planner-prod

# Test from App Service
az webapp ssh \
  --name app-hike-planner-prod \
  --resource-group rg-hike-planner-prod
```

**Solutions**:
```bash
# Update firewall rules
az cosmosdb firewall-rule create \
  --account-name cosmos-hike-planner-prod \
  --resource-group rg-hike-planner-prod \
  --name "app-service-outbound" \
  --start-ip-address 0.0.0.0 \
  --end-ip-address 255.255.255.255

# Enable service endpoints
az cosmosdb network-rule add \
  --account-name cosmos-hike-planner-prod \
  --resource-group rg-hike-planner-prod \
  --subnet /subscriptions/{sub-id}/resourceGroups/{rg}/providers/Microsoft.Network/virtualNetworks/{vnet}/subnets/{subnet}
```

### Performance Issues

**Problem**: Application performance degradation after deployment
**Symptoms**:
```
High response times
Database throttling (HTTP 429)
Memory or CPU pressure
```

**Monitoring Commands**:
```bash
# Check App Service metrics
az monitor metrics list \
  --resource /subscriptions/{sub-id}/resourceGroups/rg-hike-planner-prod/providers/Microsoft.Web/sites/app-hike-planner-prod \
  --metric "CpuPercentage,MemoryPercentage,ResponseTime"

# Check Cosmos DB metrics
az monitor metrics list \
  --resource /subscriptions/{sub-id}/resourceGroups/rg-hike-planner-prod/providers/Microsoft.DocumentDB/databaseAccounts/cosmos-hike-planner-prod \
  --metric "TotalRequestUnits,ProvisionedThroughput"
```

**Performance Optimization**:
```bash
# Scale up App Service
az appservice plan update \
  --name asp-hike-planner-prod \
  --resource-group rg-hike-planner-prod \
  --sku P2V3

# Increase Cosmos DB throughput
az cosmosdb sql throughput update \
  --account-name cosmos-hike-planner-prod \
  --resource-group rg-hike-planner-prod \
  --database-name HikePlannerDB \
  --container-name Users \
  --throughput 1000
```

## 📊 Monitoring and Alerting

### Application Insights Configuration

**Custom Telemetry**:
```typescript
// backend/src/utils/telemetry.ts
import { TelemetryClient } from 'applicationinsights';

export class CustomTelemetry {
  private client: TelemetryClient;

  constructor() {
    this.client = new TelemetryClient();
  }

  trackDeployment(version: string, environment: string) {
    this.client.trackEvent({
      name: 'Deployment',
      properties: {
        version,
        environment,
        timestamp: new Date().toISOString()
      }
    });
  }

  trackDatabaseOperation(operation: string, duration: number, success: boolean) {
    this.client.trackDependency({
      target: 'CosmosDB',
      name: operation,
      data: operation,
      duration,
      success,
      dependencyTypeName: 'Azure DocumentDB'
    });
  }
}
```

**Alert Rules**:
```bash
# Create availability alert
az monitor scheduled-query create \
  --name "App Service Availability" \
  --resource-group rg-hike-planner-prod \
  --scopes /subscriptions/{sub-id}/resourceGroups/rg-hike-planner-prod/providers/Microsoft.Web/sites/app-hike-planner-prod \
  --condition "count 'requests | where success == false' > 10" \
  --evaluation-frequency PT5M \
  --window-size PT15M \
  --action-groups /subscriptions/{sub-id}/resourceGroups/rg-hike-planner-prod/providers/Microsoft.Insights/actionGroups/critical-alerts

# Create performance alert
az monitor scheduled-query create \
  --name "High Response Time" \
  --resource-group rg-hike-planner-prod \
  --scopes /subscriptions/{sub-id}/resourceGroups/rg-hike-planner-prod/providers/Microsoft.Web/sites/app-hike-planner-prod \
  --condition "avg 'requests | summarize avg(duration)' > 2000" \
  --evaluation-frequency PT5M \
  --window-size PT15M \
  --action-groups /subscriptions/{sub-id}/resourceGroups/rg-hike-planner-prod/providers/Microsoft.Insights/actionGroups/performance-alerts
```

### Cost Monitoring

**Budget Alerts**:
```bash
# Create budget for resource group
az consumption budget create \
  --resource-group rg-hike-planner-prod \
  --budget-name "monthly-budget" \
  --amount 100 \
  --time-grain Monthly \
  --start-date $(date +%Y-%m-01) \
  --end-date $(date -d "+1 year" +%Y-%m-01)
```

## 📈 Deployment Best Practices

### 1. Blue-Green Deployment Strategy

**Implementation with App Service Slots**:
```bash
# Create staging slot
az webapp deployment slot create \
  --name app-hike-planner-prod \
  --resource-group rg-hike-planner-prod \
  --slot staging

# Deploy to staging slot
az webapp deployment source config-zip \
  --name app-hike-planner-prod \
  --resource-group rg-hike-planner-prod \
  --src backend/dist.zip \
  --slot staging

# Test staging deployment
./scripts/health-check.sh staging

# Swap slots (blue-green deployment)
az webapp deployment slot swap \
  --name app-hike-planner-prod \
  --resource-group rg-hike-planner-prod \
  --slot staging \
  --target-slot production
```

### 2. Infrastructure Versioning

**Bicep Template Versioning**:
```bicep
@description('Template version for tracking deployments')
param templateVersion string = '1.0.0'

// Tag all resources with version
var commonTags = {
  Environment: environment
  TemplateVersion: templateVersion
  DeployedBy: 'GitHub Actions'
  DeployedAt: utcNow()
}

resource cosmosDb 'Microsoft.DocumentDB/databaseAccounts@2023-04-15' = {
  name: cosmosDbAccountName
  location: location
  tags: commonTags
  // ... rest of configuration
}
```

### 3. Security Best Practices

**Key Vault Integration**:
```bicep
// Store secrets in Key Vault
resource keyVault 'Microsoft.KeyVault/vaults@2023-02-01' = {
  name: keyVaultName
  location: location
  properties: {
    sku: {
      family: 'A'
      name: 'standard'
    }
    tenantId: tenant().tenantId
    accessPolicies: [
      {
        tenantId: tenant().tenantId
        objectId: appService.identity.principalId
        permissions: {
          secrets: ['get', 'list']
        }
      }
    ]
  }
}

// Reference secrets in App Service
resource appServiceSettings 'Microsoft.Web/sites/config@2023-01-01' = {
  parent: appService
  name: 'appsettings'
  properties: {
    AZURE_COSMOS_DB_KEY: '@Microsoft.KeyVault(SecretUri=${keyVault.properties.vaultUri}secrets/cosmos-db-key/)'
    NODE_ENV: environment
  }
}
```

### 4. Automated Testing in Pipeline

**Deployment Testing Stage**:
```yaml
- name: Post-Deployment Testing
  run: |
    # Wait for deployment to stabilize
    sleep 60
    
    # Run health checks
    ./scripts/health-check.sh ${{ env.ENVIRONMENT }}
    
    # Run smoke tests
    npm run test:smoke -- --environment ${{ env.ENVIRONMENT }}
    
    # Run performance tests
    npm run test:performance -- --baseline
    
    # Validate monitoring
    ./scripts/validate-monitoring.sh ${{ env.ENVIRONMENT }}
```

---

**Maintained by**: Hike Planner Development Team  
**Last Updated**: Phase 1 Implementation  
**Next Review**: After Phase 2 completion