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

@description('Enable Phase 5 services (Application Gateway, Premium Functions, CDN, etc.)')
param enablePhase5Services bool = true

@description('Backend FQDN for Application Gateway (optional, uses Container Apps FQDN if not provided)')
param backendFqdn string = ''

@description('Origin hostname for CDN (optional, uses Container Apps hostname if not provided)')
param cdnOriginHostname string = ''

// Generate unique names based on environment (Key Vault names must be 3-24 chars)
var uniqueSuffix = take(uniqueString(resourceGroup().id), 6)
var resourceNames = {
  cosmosDbAccount: '${appName}-cosmos-${environment}-${uniqueSuffix}'
  keyVault: 'hkv-${environment}-${uniqueSuffix}'  // Shortened for 24-char limit
  keyVaultPremium: 'hkvp-${environment}-${uniqueSuffix}'  // Premium Key Vault for Phase 5
  containerAppsEnvironment: '${appName}-cae-${environment}-${uniqueSuffix}'
  containerApp: '${appName}-api-${environment}-${uniqueSuffix}'
  storageAccount1: 'st${environment}1${uniqueSuffix}' // Multiple storage accounts for demo
  storageAccount2: 'st${environment}2${uniqueSuffix}'
  storageAccount3: 'st${environment}3${uniqueSuffix}'
  functionsStorage: 'stfunc${environment}${uniqueSuffix}'  // Storage for Functions
  redis: '${appName}-redis-${environment}-${uniqueSuffix}'
  budget: '${appName}-budget-${environment}'
  // Phase 5 resources
  applicationGateway: 'agw-${appName}-${environment}'
  premiumFunctions: 'func-${appName}-${environment}-${uniqueSuffix}'
  cdnProfile: 'cdn-${appName}-${environment}'
  loadTesting: 'lt-${appName}-${environment}'
  appInsights: 'ai-${appName}-${environment}'
  b2cTenant: 'hikeplannerb2c${environment}'
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

// ============================================================================
// PHASE 5: COMPLETE INEFFICIENT INFRASTRUCTURE IMPLEMENTATION
// ============================================================================

// Application Gateway Standard v2 - INTENTIONALLY INEFFICIENT
// Single backend app doesn't need a load balancer - direct routing would be free
module applicationGateway 'modules/application-gateway.bicep' = if (enablePhase5Services) {
  name: 'applicationGateway-deployment'
  params: {
    applicationGatewayName: resourceNames.applicationGateway
    location: location
    environment: environment
    backendFqdn: backendFqdn != '' ? backendFqdn : containerApps.outputs.containerAppFqdn
  }
  dependsOn: [
    containerApps
  ]
}

// Premium Functions Plan (EP1) - INTENTIONALLY INEFFICIENT
// Consumption plan would cost <$5/month vs $145/month for EP1
module premiumFunctions 'modules/premium-functions.bicep' = if (enablePhase5Services) {
  name: 'premiumFunctions-deployment'
  params: {
    functionAppName: resourceNames.premiumFunctions
    location: location
    environment: environment
    storageAccountName: resourceNames.functionsStorage
    appInsightsInstrumentationKey: enablePhase5Services ? appInsightsHighIngestion.outputs.instrumentationKey : ''
    appInsightsConnectionString: enablePhase5Services ? appInsightsHighIngestion.outputs.connectionString : ''
    cosmosDbEndpoint: cosmosDb.outputs.cosmosDbEndpoint
    keyVaultName: keyVault.name
  }
}

// Azure CDN Premium - INTENTIONALLY INEFFICIENT
// Static Web App has built-in CDN, this is completely unnecessary
module azureCdn 'modules/azure-cdn.bicep' = if (enablePhase5Services) {
  name: 'azureCdn-deployment'
  params: {
    cdnProfileName: resourceNames.cdnProfile
    location: 'global'
    environment: environment
    originHostname: cdnOriginHostname != '' ? cdnOriginHostname : containerApps.outputs.containerAppFqdn
  }
  dependsOn: [
    containerApps
  ]
}

// Load Testing Service - INTENTIONALLY INEFFICIENT
// Continuous execution when on-demand would suffice
module loadTesting 'modules/load-testing.bicep' = if (enablePhase5Services) {
  name: 'loadTesting-deployment'
  params: {
    loadTestingName: resourceNames.loadTesting
    location: location
    environment: environment
    targetUrl: 'https://${containerApps.outputs.containerAppFqdn}'
  }
  dependsOn: [
    containerApps
  ]
}

// Application Insights with High Ingestion - INTENTIONALLY INEFFICIENT
// 5GB/day ingestion with 730 days retention when 1GB/90 days would suffice
module appInsightsHighIngestion 'modules/application-insights-high-ingestion.bicep' = if (enablePhase5Services) {
  name: 'appInsightsHighIngestion-deployment'
  params: {
    appInsightsName: resourceNames.appInsights
    location: location
    environment: environment
    dailyCapGb: 5  // INTENTIONALLY INEFFICIENT - 5GB/day
    retentionDays: 730  // INTENTIONALLY INEFFICIENT - 2 years retention
  }
}

// Key Vault Premium with HSM - INTENTIONALLY INEFFICIENT
// Standard tier would suffice for a demo application
module keyVaultPremium 'modules/key-vault-premium.bicep' = if (enablePhase5Services) {
  name: 'keyVaultPremium-deployment'
  params: {
    keyVaultName: resourceNames.keyVaultPremium
    location: location
    environment: environment
    enableHsm: true  // HSM-protected keys - INTENTIONALLY INEFFICIENT
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

// Phase 5 outputs
output applicationGatewayName string = enablePhase5Services ? applicationGateway.outputs.applicationGatewayName : ''
output applicationGatewayFqdn string = enablePhase5Services ? applicationGateway.outputs.fqdn : ''
output premiumFunctionsName string = enablePhase5Services ? premiumFunctions.outputs.functionAppName : ''
output premiumFunctionsUrl string = enablePhase5Services ? premiumFunctions.outputs.functionAppUrl : ''
output cdnProfileName string = enablePhase5Services ? azureCdn.outputs.cdnProfileName : ''
output cdnEndpointUrl string = enablePhase5Services ? azureCdn.outputs.cdnEndpointUrl : ''
output loadTestingName string = enablePhase5Services ? loadTesting.outputs.loadTestingName : ''
output appInsightsName string = enablePhase5Services ? appInsightsHighIngestion.outputs.appInsightsName : ''
output appInsightsConnectionString string = enablePhase5Services ? appInsightsHighIngestion.outputs.connectionString : ''
output keyVaultPremiumName string = enablePhase5Services ? keyVaultPremium.outputs.keyVaultName : ''
output keyVaultPremiumUri string = enablePhase5Services ? keyVaultPremium.outputs.keyVaultUri : ''

// FinOps Demo Summary - Updated with Phase 5 services
output fiNOpsDemoSummary object = {
  description: 'Phase 5 Complete - Intentionally inefficient infrastructure for FinOps cost optimization demonstration'
  phase: 'Phase 5: Complete Inefficient Infrastructure Implementation'
  totalMonthlyInefficiencies: {
    dev: {
      // Database & Compute (Phases 1-4)
      cosmosDb: 60            // 1000 RU/s provisioned vs 400 serverless
      containerApps: 450      // Dedicated D4 with always-on replicas vs consumption
      storage: 60             // 3 storage accounts in hot tier vs 1 with lifecycle
      redis: 45               // Unnecessary Redis cache
      
      // Phase 5: Over-Provisioned Services
      applicationGateway: 50  // Unnecessary load balancer for single app
      premiumFunctions: 145   // EP1 Premium instead of Consumption
      azureCdn: 20            // Premium CDN when SWA has built-in CDN
      loadTesting: 25         // Continuous execution instead of on-demand
      
      // Phase 5: Monitoring & Security
      appInsights: 120        // 5GB/day ingestion, 730 days retention
      keyVaultPremium: 15     // Premium tier with HSM
      
      // Phase 5: Identity (placeholder - B2C requires manual setup)
      azureAdB2c: 30          // Premium P1 when Free tier suffices
      
      total: 1020             // Full inefficient infrastructure
    }
    optimized: {
      cosmosDb: 25            // Serverless
      containerApps: 50       // Consumption plan with scale-to-zero
      storage: 15             // Single account with lifecycle policies
      redis: 0                // Remove unnecessary cache
      applicationGateway: 0   // Remove - direct routing is free
      premiumFunctions: 5     // Consumption plan
      azureCdn: 0             // Remove - SWA has built-in CDN
      loadTesting: 3          // On-demand only
      appInsights: 15         // 1GB/day, 90 days retention
      keyVaultPremium: 5      // Standard tier
      azureAdB2c: 0           // Free tier (50,000 MAU included)
      total: 118
    }
    potentialSavings: 902
    savingsPercentage: 88
  }
  costBreakdownByCategory: {
    compute: {
      inefficient: 595        // Container Apps + Functions
      optimized: 55
      savings: 540
      savingsPercentage: 91
    }
    database: {
      inefficient: 60
      optimized: 25
      savings: 35
      savingsPercentage: 58
    }
    storage: {
      inefficient: 60
      optimized: 15
      savings: 45
      savingsPercentage: 75
    }
    network: {
      inefficient: 70         // App Gateway + CDN
      optimized: 0
      savings: 70
      savingsPercentage: 100
    }
    caching: {
      inefficient: 45
      optimized: 0
      savings: 45
      savingsPercentage: 100
    }
    monitoring: {
      inefficient: 145        // App Insights + Load Testing
      optimized: 18
      savings: 127
      savingsPercentage: 88
    }
    security: {
      inefficient: 45         // Key Vault Premium + B2C P1
      optimized: 5
      savings: 40
      savingsPercentage: 89
    }
  }
  optimizationOpportunities: [
    // Phase 1-4 optimizations
    'Switch Cosmos DB from provisioned (1000 RU/s) to serverless mode'
    'Replace Container Apps dedicated D4 profile with consumption plan'
    'Consolidate 3 storage accounts into 1 with lifecycle policies'
    'Remove unnecessary Redis cache (use in-memory caching instead)'
    'Implement scale-to-zero for Container Apps'
    'Use Cool/Archive storage tiers for infrequently accessed data'
    // Phase 5 optimizations
    'Remove Application Gateway - direct routing from SWA is free'
    'Switch Premium Functions EP1 to Consumption plan ($145 → $5/month)'
    'Remove CDN - Azure Static Web Apps has built-in global CDN'
    'Switch Load Testing from continuous to on-demand execution'
    'Reduce Application Insights ingestion from 5GB to 1GB/day'
    'Reduce Application Insights retention from 730 to 90 days'
    'Downgrade Key Vault from Premium to Standard tier'
    'Remove HSM-protected keys (not needed for demo)'
    'Switch Azure AD B2C from Premium P1 to Free tier'
    'Schedule non-production environments to run only during business hours'
  ]
  phase5ServicesDeployed: enablePhase5Services ? [
    'Application Gateway Standard v2 (~$50/month)'
    'Premium Functions EP1 (~$145/month)'
    'Azure CDN Premium with WAF (~$20/month)'
    'Load Testing Service (~$25/month)'
    'Application Insights High Ingestion (~$120/month)'
    'Key Vault Premium with HSM (~$15/month)'
    'Azure AD B2C Premium P1 (requires manual setup, ~$30/month)'
  ] : []
}
