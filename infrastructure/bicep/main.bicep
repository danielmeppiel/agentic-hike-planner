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
  appServicePlan: '${appName}-plan-${environment}-${uniqueSuffix}'
  appService: '${appName}-api-${environment}-${uniqueSuffix}'
  budget: '${appName}-budget-${environment}'
}

// Cosmos DB Module
module cosmosDb 'modules/cosmos-db.bicep' = {
  name: 'cosmosDb-deployment'
  params: {
    cosmosDbAccountName: resourceNames.cosmosDbAccount
    location: location
    environment: environment
    enableFreeTier: enableCosmosDbFreeTier
    throughputMode: cosmosDbThroughputMode
    // High throughput configuration for production workloads
    minThroughput: 1000  // 1,000 RU/s provisioned
    maxThroughput: 4000
  }
}

// Key Vault for storing secrets
resource keyVault 'Microsoft.KeyVault/vaults@2023-07-01' = {
  name: resourceNames.keyVault
  location: location
  properties: {
    sku: {
      family: 'A'
      name: 'standard'
    }
    tenantId: subscription().tenantId
    enabledForDeployment: true
    enabledForTemplateDeployment: true
    enabledForDiskEncryption: false
    enableRbacAuthorization: true
    enableSoftDelete: true
    softDeleteRetentionInDays: environment == 'prod' ? 90 : 7
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
    CostOptimization: 'Standard'
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

// App Service Plan Module
module appServicePlan 'modules/app-service-plan.bicep' = {
  name: 'appServicePlan-deployment'
  params: {
    appServicePlanName: resourceNames.appServicePlan
    location: location
    environment: environment
    skuName: 'B2'  // Basic tier optimized for development workloads
    skuCapacity: 1
  }
}

// App Service Module - Backend API
module appService 'modules/app-service.bicep' = {
  name: 'appService-deployment'
  params: {
    appServiceName: resourceNames.appService
    location: location
    environment: environment
    appServicePlanId: appServicePlan.outputs.appServicePlanId
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

// App Service outputs
output appServicePlanName string = appServicePlan.outputs.appServicePlanName
output appServicePlanSku object = appServicePlan.outputs.appServicePlanSku
output appServiceName string = appService.outputs.appServiceName
output appServiceUrl string = 'https://${appService.outputs.appServiceDefaultHostname}'
output appServicePrincipalId string = appService.outputs.appServicePrincipalId

// Budget and cost monitoring outputs
output budgetName string = budgetAlerts.outputs.budgetName
output budgetSummary object = budgetAlerts.outputs.budgetSummary
