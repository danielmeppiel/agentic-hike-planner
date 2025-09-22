@description('The name of the Container Apps environment')
param containerAppsEnvironmentName string

@description('The name of the Container App')
param containerAppName string

@description('The location for the Container Apps')
param location string = resourceGroup().location

@description('The environment (dev, staging, prod)')
param environment string

@description('Key Vault name for storing secrets')
param keyVaultName string

@description('Cosmos DB endpoint')
param cosmosDbEndpoint string

@description('Cosmos DB database name')
param cosmosDbDatabaseName string

// Intentionally inefficient Log Analytics workspace for demo purposes
resource logAnalyticsWorkspace 'Microsoft.OperationalInsights/workspaces@2023-09-01' = {
  name: '${containerAppsEnvironmentName}-logs'
  location: location
  properties: {
    sku: {
      name: 'PerGB2018' // Pay-per-GB instead of free tier - INTENTIONALLY INEFFICIENT
    }
    retentionInDays: environment == 'prod' ? 730 : 180 // Very long retention - INTENTIONALLY INEFFICIENT
    workspaceCapping: {
      dailyQuotaGb: 50 // High daily quota for demo - INTENTIONALLY INEFFICIENT ($250+/month)
    }
    publicNetworkAccessForIngestion: 'Enabled'
    publicNetworkAccessForQuery: 'Enabled'
  }
  tags: {
    Environment: environment
    Application: 'HikePlanner'
    CostCenter: 'Demo'
    CostOptimization: 'Inefficient-Demo'
    ServiceTier: 'Monitoring'
  }
}

// Container Apps Environment with intentionally high resource allocation
resource containerAppsEnvironment 'Microsoft.App/managedEnvironments@2024-03-01' = {
  name: containerAppsEnvironmentName
  location: location
  properties: {
    appLogsConfiguration: {
      destination: 'log-analytics'
      logAnalyticsConfiguration: {
        customerId: logAnalyticsWorkspace.properties.customerId
        sharedKey: logAnalyticsWorkspace.listKeys().primarySharedKey
      }
    }
    zoneRedundant: environment == 'prod' // Zone redundancy even for dev - INTENTIONALLY INEFFICIENT
    infrastructureResourceGroup: '${containerAppsEnvironmentName}-infra-rg'
    workloadProfiles: [
      {
        name: 'Consumption'
        workloadProfileType: 'Consumption'
      }
      {
        // Dedicated profile - INTENTIONALLY INEFFICIENT for demo
        name: 'DedicatedD4'
        workloadProfileType: 'D4'
        minimumCount: environment == 'dev' ? 1 : (environment == 'staging' ? 2 : 3) // Always-on dedicated instances
        maximumCount: environment == 'dev' ? 3 : (environment == 'staging' ? 5 : 10)
      }
    ]
  }
  tags: {
    Environment: environment
    Application: 'HikePlanner'
    CostCenter: 'Demo'
    CostOptimization: 'Inefficient-Demo'
    ServiceTier: 'Compute'
  }
}

// Container App with intentionally oversized configuration
resource containerApp 'Microsoft.App/containerApps@2024-03-01' = {
  name: containerAppName
  location: location
  identity: {
    type: 'SystemAssigned'
  }
  properties: {
    managedEnvironmentId: containerAppsEnvironment.id
    workloadProfileName: 'DedicatedD4' // Using dedicated instead of consumption - INTENTIONALLY INEFFICIENT
    configuration: {
      activeRevisionsMode: 'Single'
      ingress: {
        external: true
        targetPort: 3000
        allowInsecure: false
        traffic: [
          {
            weight: 100
            latestRevision: true
          }
        ]
      }
      secrets: [
        {
          name: 'cosmos-db-key'
          keyVaultUrl: 'https://${keyVaultName}.${az.environment().suffixes.keyvaultDns}/secrets/cosmos-db-primary-key'
          identity: 'system'
        }
      ]
    }
    template: {
      containers: [
        {
          name: 'hike-planner-api'
          image: 'mcr.microsoft.com/azuredocs/containerapps-helloworld:latest' // Placeholder image
          resources: {
            // Intentionally oversized resources for demo
            cpu: json('2.0') // 2 vCPUs when 0.25 would suffice - INTENTIONALLY INEFFICIENT
            memory: '4Gi'     // 4GB when 0.5GB would suffice - INTENTIONALLY INEFFICIENT
          }
          env: [
            {
              name: 'NODE_ENV'
              value: environment == 'prod' ? 'production' : 'development'
            }
            {
              name: 'AZURE_COSMOS_DB_ENDPOINT'
              value: cosmosDbEndpoint
            }
            {
              name: 'AZURE_COSMOS_DB_DATABASE'
              value: cosmosDbDatabaseName
            }
            {
              name: 'AZURE_COSMOS_DB_KEY'
              secretRef: 'cosmos-db-key'
            }
            {
              name: 'PORT'
              value: '3000'
            }
          ]
        }
      ]
      scale: {
        minReplicas: environment == 'dev' ? 2 : (environment == 'staging' ? 3 : 5) // Always-on replicas - INTENTIONALLY INEFFICIENT
        maxReplicas: environment == 'dev' ? 10 : (environment == 'staging' ? 20 : 50) // High max replicas
        rules: [
          {
            name: 'http-scaling'
            http: {
              metadata: {
                concurrentRequests: '10' // Low concurrency threshold - forces more replicas - INTENTIONALLY INEFFICIENT
              }
            }
          }
        ]
      }
    }
  }
  tags: {
    Environment: environment
    Application: 'HikePlanner'
    CostCenter: 'Demo'
    CostOptimization: 'Inefficient-Demo'
    ServiceTier: 'Backend'
  }
}

// Grant Container App access to Key Vault
resource keyVaultAccessPolicy 'Microsoft.KeyVault/vaults/accessPolicies@2023-07-01' = {
  name: '${keyVaultName}/add'
  properties: {
    accessPolicies: [
      {
        tenantId: subscription().tenantId
        objectId: containerApp.identity.principalId
        permissions: {
          secrets: [
            'get'
            'list'
          ]
        }
      }
    ]
  }
}

@description('The FQDN of the Container App')
output containerAppFqdn string = containerApp.properties.configuration.ingress.fqdn

@description('The resource ID of the Container App')
output containerAppId string = containerApp.id

@description('The name of the Container App')
output containerAppName string = containerApp.name

@description('The principal ID of the Container App managed identity')
output containerAppPrincipalId string = containerApp.identity.principalId

@description('The resource ID of the Container Apps Environment')
output containerAppsEnvironmentId string = containerAppsEnvironment.id

@description('The name of the Container Apps Environment')
output containerAppsEnvironmentName string = containerAppsEnvironment.name

@description('The resource ID of the Log Analytics workspace')
output logAnalyticsWorkspaceId string = logAnalyticsWorkspace.id

@description('Container Apps cost optimization summary')
output costOptimizationSummary object = {
  inefficiencies: [
    'Dedicated D4 workload profile instead of Consumption'
    'Always-on minimum replicas (2-5) instead of scale-to-zero'
    'Oversized CPU (2.0 vCPU) and memory (4Gi) allocation'
    'Expensive Log Analytics with 50GB daily quota and long retention'
    'Low concurrency threshold forcing more replicas'
    'Zone redundancy in non-production environments'
  ]
  monthlyOptimizationPotential: {
    current: environment == 'dev' ? 450 : (environment == 'staging' ? 650 : 1200)
    optimized: environment == 'dev' ? 50 : (environment == 'staging' ? 75 : 150)
    savings: environment == 'dev' ? 400 : (environment == 'staging' ? 575 : 1050)
    savingsPercentage: environment == 'dev' ? 89 : (environment == 'staging' ? 88 : 88)
  }
}
