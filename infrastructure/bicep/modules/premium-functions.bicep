@description('The name of the Function App')
param functionAppName string

@description('The location for the Function App')
param location string = resourceGroup().location

@description('The environment (dev, staging, prod)')
param environment string

@description('The name of the Storage Account for Functions')
param storageAccountName string

@description('Application Insights instrumentation key')
param appInsightsInstrumentationKey string = ''

@description('Application Insights connection string')
param appInsightsConnectionString string = ''

@description('Cosmos DB endpoint for data access')
param cosmosDbEndpoint string = ''

@description('Key Vault name for secrets')
param keyVaultName string = ''

// Storage Account for Functions
resource storageAccount 'Microsoft.Storage/storageAccounts@2023-05-01' = {
  name: storageAccountName
  location: location
  sku: {
    name: 'Standard_LRS'
  }
  kind: 'StorageV2'
  properties: {
    accessTier: 'Hot'
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
    minimumTlsVersion: 'TLS1_2'
    networkAcls: {
      defaultAction: 'Allow'
    }
    supportsHttpsTrafficOnly: true
  }
  tags: {
    Environment: environment
    Application: 'HikePlanner'
    CostCenter: 'Demo'
    CostOptimization: 'Inefficient-Demo'
    ServiceTier: 'Functions'
    Purpose: 'Functions-Storage'
  }
}

// Premium App Service Plan for Functions - INTENTIONALLY INEFFICIENT
// EP1 Premium plan when Consumption plan would suffice
resource hostingPlan 'Microsoft.Web/serverfarms@2023-12-01' = {
  name: '${functionAppName}-plan'
  location: location
  sku: {
    name: 'EP1'  // INTENTIONALLY INEFFICIENT - Premium Elastic Plan
    tier: 'ElasticPremium'
    size: 'EP1'
    family: 'EP'
    capacity: 1
  }
  kind: 'elastic'
  properties: {
    elasticScaleEnabled: true
    maximumElasticWorkerCount: 20
    perSiteScaling: false
    reserved: true  // Linux
    zoneRedundant: false
  }
  tags: {
    Environment: environment
    Application: 'HikePlanner'
    CostCenter: 'Demo'
    CostOptimization: 'Inefficient-Demo'
    ServiceTier: 'Functions'
    Purpose: 'Premium-When-Consumption-Suffices'
    MonthlyCost: '$145'
    OptimizationPotential: 'Switch to Consumption plan - $5/month'
  }
}

// Function App with Premium Plan - INTENTIONALLY INEFFICIENT
resource functionApp 'Microsoft.Web/sites@2023-12-01' = {
  name: functionAppName
  location: location
  kind: 'functionapp,linux'
  identity: {
    type: 'SystemAssigned'
  }
  properties: {
    serverFarmId: hostingPlan.id
    httpsOnly: true
    publicNetworkAccess: 'Enabled'
    siteConfig: {
      linuxFxVersion: 'NODE|18'
      alwaysOn: true  // INTENTIONALLY INEFFICIENT - Always on for premium
      http20Enabled: true
      minTlsVersion: '1.2'
      ftpsState: 'Disabled'
      functionAppScaleLimit: 20
      minimumElasticInstanceCount: 2  // INTENTIONALLY INEFFICIENT - 2 always-ready instances
      appSettings: [
        {
          name: 'AzureWebJobsStorage'
          value: 'DefaultEndpointsProtocol=https;AccountName=${storageAccount.name};EndpointSuffix=${az.environment().suffixes.storage};AccountKey=${storageAccount.listKeys().keys[0].value}'
        }
        {
          name: 'WEBSITE_CONTENTAZUREFILECONNECTIONSTRING'
          value: 'DefaultEndpointsProtocol=https;AccountName=${storageAccount.name};EndpointSuffix=${az.environment().suffixes.storage};AccountKey=${storageAccount.listKeys().keys[0].value}'
        }
        {
          name: 'WEBSITE_CONTENTSHARE'
          value: toLower(functionAppName)
        }
        {
          name: 'FUNCTIONS_EXTENSION_VERSION'
          value: '~4'
        }
        {
          name: 'FUNCTIONS_WORKER_RUNTIME'
          value: 'node'
        }
        {
          name: 'WEBSITE_NODE_DEFAULT_VERSION'
          value: '~18'
        }
        {
          name: 'APPINSIGHTS_INSTRUMENTATIONKEY'
          value: appInsightsInstrumentationKey
        }
        {
          name: 'APPLICATIONINSIGHTS_CONNECTION_STRING'
          value: appInsightsConnectionString
        }
        {
          name: 'AZURE_COSMOS_DB_ENDPOINT'
          value: cosmosDbEndpoint
        }
        {
          name: 'AZURE_KEY_VAULT_NAME'
          value: keyVaultName
        }
        {
          name: 'NODE_ENV'
          value: environment == 'prod' ? 'production' : 'development'
        }
      ]
    }
  }
  tags: {
    Environment: environment
    Application: 'HikePlanner'
    CostCenter: 'Demo'
    CostOptimization: 'Inefficient-Demo'
    ServiceTier: 'Functions'
    Purpose: 'AI-Processing'
    MonthlyCost: '$145'
    OptimizationPotential: 'Switch to Consumption - $5/month'
  }
}

@description('The resource ID of the Function App')
output functionAppId string = functionApp.id

@description('The name of the Function App')
output functionAppName string = functionApp.name

@description('The default hostname of the Function App')
output functionAppHostname string = functionApp.properties.defaultHostName

@description('The URL of the Function App')
output functionAppUrl string = 'https://${functionApp.properties.defaultHostName}'

@description('The principal ID of the Function App managed identity')
output functionAppPrincipalId string = functionApp.identity.principalId

@description('The hosting plan ID')
output hostingPlanId string = hostingPlan.id

@description('Cost optimization summary for Premium Functions')
output costOptimizationSummary object = {
  currentCost: 145
  optimizedCost: 5
  savings: 140
  savingsPercentage: 97
  recommendation: 'Switch from EP1 Premium to Consumption plan'
  inefficiencies: [
    'EP1 Premium plan for light workload'
    '2 always-ready instances when scale-to-zero would work'
    'AlwaysOn enabled - prevents cold start savings'
    'Premium features not utilized'
  ]
}
