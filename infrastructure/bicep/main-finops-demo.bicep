targetScope = 'resourceGroup'

@description('The environment name (dev, staging, prod)')
@allowed(['dev', 'staging', 'prod'])
param environment string

@description('The location for all resources')
param location string = resourceGroup().location

@description('The application name prefix')
param appName string = 'hike-planner'

@description('Enable free tier for Cosmos DB (only one per subscription)')
param enableCosmosDbFreeTier bool = false

@description('Cosmos DB throughput mode')
@allowed(['provisioned', 'serverless'])
param cosmosDbThroughputMode string = 'provisioned'

@description('Email address for budget alerts')
param budgetAlertEmail string = 'demo@example.com'

// Generate unique names based on environment (Key Vault names must be 3-24 chars)
var uniqueSuffix = take(uniqueString(resourceGroup().id), 6)
var resourceNames = {
  cosmosDbAccount: '${appName}-cosmos-${environment}-${uniqueSuffix}'
  keyVault: 'hkv-${environment}-${uniqueSuffix}'  // Shortened for 24-char limit
  containerAppsEnvironment: '${appName}-cae-${environment}-${uniqueSuffix}'
  containerApp: '${appName}-api-${environment}-${uniqueSuffix}'
  storageAccount1: 'st${environment}1${uniqueSuffix}' // Multiple storage accounts for demo
  storageAccount2: 'st${environment}2${uniqueSuffix}'
  storageAccount3: 'st${environment}3${uniqueSuffix}'
  redis: '${appName}-redis-${environment}-${uniqueSuffix}'
  budget: '${appName}-budget-${environment}'
}

// Cosmos DB Module - Intentionally inefficient for FinOps demo
module cosmosDb 'modules/cosmos-db.bicep' = {
  name: 'cosmosDb-deployment'
  params: {
    cosmosDbAccountName: resourceNames.cosmosDbAccount
    location: location
    environment: environment
    enableFreeTier: enableCosmosDbFreeTier
    throughputMode: cosmosDbThroughputMode
    // High throughput configuration for FinOps demo - INTENTIONALLY INEFFICIENT
    minThroughput: 1000  // 1,000 RU/s provisioned when 400 would suffice
    maxThroughput: 4000  // High autoscale ceiling
  }
}

// Key Vault for storing secrets - Standard tier when Basic would suffice
resource keyVault 'Microsoft.KeyVault/vaults@2023-07-01' = {
  name: resourceNames.keyVault
  location: location
  properties: {
    sku: {
      family: 'A'
      name: 'standard' // Standard tier - INTENTIONALLY INEFFICIENT for demo
    }
    tenantId: subscription().tenantId
    enabledForDeployment: true
    enabledForTemplateDeployment: true
    enabledForDiskEncryption: false
    enableRbacAuthorization: true
    enableSoftDelete: true
    softDeleteRetentionInDays: environment == 'prod' ? 90 : 90 // Long retention even for dev - INTENTIONALLY INEFFICIENT
    publicNetworkAccess: 'Enabled'
    networkAcls: {
      defaultAction: 'Allow'
      bypass: 'AzureServices'
    }
  }
  tags: {
    Environment: environment
    Application: 'HikePlanner'
    CostCenter: 'Demo'
    CostOptimization: 'Inefficient-Demo'
    ServiceTier: 'Security'
  }
}

// Store Cosmos DB primary key in Key Vault
resource cosmosDbPrimaryKeySecret 'Microsoft.KeyVault/vaults/secrets@2023-07-01' = {
  parent: keyVault
  name: 'cosmos-db-primary-key'
  properties: {
    value: cosmosDb.outputs.cosmosDbPrimaryKey
    contentType: 'text/plain'
  }
}

// Store Cosmos DB endpoint in Key Vault
resource cosmosDbEndpointSecret 'Microsoft.KeyVault/vaults/secrets@2023-07-01' = {
  parent: keyVault
  name: 'cosmos-db-endpoint'
  properties: {
    value: cosmosDb.outputs.cosmosDbEndpoint
    contentType: 'text/plain'
  }
}

// Multiple redundant storage accounts - INTENTIONALLY INEFFICIENT for FinOps demo
resource storageAccount1 'Microsoft.Storage/storageAccounts@2023-05-01' = {
  name: resourceNames.storageAccount1
  location: location
  sku: {
    name: 'Standard_LRS' // Standard instead of Basic - INTENTIONALLY INEFFICIENT
  }
  kind: 'StorageV2'
  properties: {
    accessTier: 'Hot' // Hot tier for all data - INTENTIONALLY INEFFICIENT
    allowBlobPublicAccess: false
    allowSharedKeyAccess: true
    encryption: {
      services: {
        blob: {
          enabled: true
        }
        file: {
          enabled: true
        }
      }
      keySource: 'Microsoft.Storage'
    }
    networkAcls: {
      defaultAction: 'Allow'
    }
  }
  tags: {
    Environment: environment
    Application: 'HikePlanner'
    CostCenter: 'Demo'
    CostOptimization: 'Inefficient-Demo'
    ServiceTier: 'Storage'
    Purpose: 'Redundant-1'
  }
}

resource storageAccount2 'Microsoft.Storage/storageAccounts@2023-05-01' = {
  name: resourceNames.storageAccount2
  location: location
  sku: {
    name: 'Standard_LRS'
  }
  kind: 'StorageV2'
  properties: {
    accessTier: 'Hot' // Hot tier for all data - INTENTIONALLY INEFFICIENT
    allowBlobPublicAccess: false
    allowSharedKeyAccess: true
    encryption: {
      services: {
        blob: {
          enabled: true
        }
        file: {
          enabled: true
        }
      }
      keySource: 'Microsoft.Storage'
    }
    networkAcls: {
      defaultAction: 'Allow'
    }
  }
  tags: {
    Environment: environment
    Application: 'HikePlanner'
    CostCenter: 'Demo'
    CostOptimization: 'Inefficient-Demo'
    ServiceTier: 'Storage'
    Purpose: 'Redundant-2'
  }
}

resource storageAccount3 'Microsoft.Storage/storageAccounts@2023-05-01' = {
  name: resourceNames.storageAccount3
  location: location
  sku: {
    name: 'Standard_LRS'
  }
  kind: 'StorageV2'
  properties: {
    accessTier: 'Hot' // Hot tier for all data - INTENTIONALLY INEFFICIENT
    allowBlobPublicAccess: false
    allowSharedKeyAccess: true
    encryption: {
      services: {
        blob: {
          enabled: true
        }
        file: {
          enabled: true
        }
      }
      keySource: 'Microsoft.Storage'
    }
    networkAcls: {
      defaultAction: 'Allow'
    }
  }
  tags: {
    Environment: environment
    Application: 'HikePlanner'
    CostCenter: 'Demo'
    CostOptimization: 'Inefficient-Demo'
    ServiceTier: 'Storage'
    Purpose: 'Redundant-3'
  }
}

// Redis Cache - Unnecessary when using in-memory caching - INTENTIONALLY INEFFICIENT
resource redisCache 'Microsoft.Cache/redis@2024-11-01' = {
  name: resourceNames.redis
  location: location
  properties: {
    sku: {
      name: 'Basic'
      family: 'C'
      capacity: 1 // C1 Basic tier - unnecessary for demo app
    }
    enableNonSslPort: false
    minimumTlsVersion: '1.2'
    publicNetworkAccess: 'Enabled'
    redisConfiguration: {
      'maxmemory-reserved': '30'
      'maxfragmentationmemory-reserved': '30'
    }
  }
  tags: {
    Environment: environment
    Application: 'HikePlanner'
    CostCenter: 'Demo'
    CostOptimization: 'Inefficient-Demo'
    ServiceTier: 'Cache'
    Purpose: 'Redundant-Cache'
  }
}

// Container Apps Module - Backend API with intentionally inefficient configuration for FinOps demo
module containerApps 'modules/container-apps.bicep' = {
  name: 'containerApps-deployment'
  params: {
    containerAppsEnvironmentName: resourceNames.containerAppsEnvironment
    containerAppName: resourceNames.containerApp
    location: location
    environment: environment
    keyVaultName: keyVault.name
    cosmosDbEndpoint: cosmosDb.outputs.cosmosDbEndpoint
    cosmosDbDatabaseName: cosmosDb.outputs.databaseName
  }
  dependsOn: [
    cosmosDbPrimaryKeySecret
    cosmosDbEndpointSecret
  ]
}

// Budget Alerts Module - Cost monitoring and protection
module budgetAlerts 'modules/budget-alerts.bicep' = {
  name: 'budgetAlerts-deployment'
  params: {
    budgetName: resourceNames.budget
    environment: environment
    alertEmail: budgetAlertEmail
  }
}

// Outputs for easy reference
output resourceNames object = resourceNames
output cosmosDbEndpoint string = cosmosDb.outputs.cosmosDbEndpoint
output cosmosDbAccountName string = cosmosDb.outputs.cosmosDbAccountName
output cosmosDbDatabaseName string = cosmosDb.outputs.databaseName
@secure()
output cosmosDbPrimaryKey string = cosmosDb.outputs.cosmosDbPrimaryKey
@secure()
output cosmosDbConnectionString string = cosmosDb.outputs.cosmosDbConnectionString
output keyVaultName string = keyVault.name

// Container Apps outputs
output containerAppsEnvironmentName string = containerApps.outputs.containerAppsEnvironmentName
output containerAppName string = containerApps.outputs.containerAppName
output containerAppUrl string = 'https://${containerApps.outputs.containerAppFqdn}'
output containerAppPrincipalId string = containerApps.outputs.containerAppPrincipalId
output costOptimizationSummary object = containerApps.outputs.costOptimizationSummary

// Storage outputs
output storageAccount1Name string = storageAccount1.name
output storageAccount2Name string = storageAccount2.name
output storageAccount3Name string = storageAccount3.name

// Redis output
output redisCacheName string = redisCache.name

// Budget and cost monitoring outputs
output budgetName string = budgetAlerts.outputs.budgetName
output budgetSummary object = budgetAlerts.outputs.budgetSummary

// FinOps Demo Summary
output fiNOpsDemoSummary object = {
  description: 'Intentionally inefficient infrastructure for FinOps cost optimization demonstration'
  totalMonthlyInefficiencies: {
    dev: {
      cosmosDb: 60      // 1000 RU/s provisioned vs 400 serverless
      containerApps: 450 // Dedicated D4 with always-on replicas vs consumption
      storage: 45       // 3 storage accounts in hot tier vs 1 with lifecycle
      redis: 45         // Unnecessary Redis cache
      keyVault: 15      // Standard vs Basic tier
      logAnalytics: 250 // 50GB daily quota vs free tier
      total: 865
    }
    optimized: {
      cosmosDb: 25      // Serverless
      containerApps: 50 // Consumption plan with scale-to-zero
      storage: 15       // Single account with lifecycle policies
      redis: 0          // Remove unnecessary cache
      keyVault: 5       // Basic tier
      logAnalytics: 5   // Free tier with basic retention
      total: 100
    }
    potentialSavings: 765
    savingsPercentage: 88
  }
  optimizationOpportunities: [
    'Switch Cosmos DB from provisioned (1000 RU/s) to serverless mode'
    'Replace Container Apps dedicated D4 profile with consumption plan'
    'Consolidate 3 storage accounts into 1 with lifecycle policies'
    'Remove unnecessary Redis cache (use in-memory caching instead)'
    'Downgrade Key Vault from Standard to Basic tier'
    'Reduce Log Analytics daily quota from 50GB to free tier'
    'Implement scale-to-zero for Container Apps'
    'Use Cool/Archive storage tiers for infrequently accessed data'
    'Schedule non-production environments to run only during business hours'
  ]
}
