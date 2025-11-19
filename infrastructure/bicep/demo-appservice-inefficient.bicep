targetScope = 'resourceGroup'

@description('The environment name (dev, staging, prod)')
@allowed(['dev', 'staging', 'prod'])
param environment string

@description('The location for all resources')
param location string = resourceGroup().location

@description('The application name prefix')
param appName string = 'hike-planner'

@description('Email address for budget alerts')
param budgetAlertEmail string = 'demo@example.com'

// Generate unique names based on environment
var uniqueSuffix = take(uniqueString(resourceGroup().id), 6)
var resourceNames = {
  appServicePlan: '${appName}-plan-${environment}-${uniqueSuffix}'
  appService: '${appName}-api-${environment}-${uniqueSuffix}'
  budget: '${appName}-budget-${environment}'
}

// App Service Plan Module - INTENTIONALLY INEFFICIENT (Standard S3)
module appServicePlan 'modules/app-service-plan.bicep' = {
  name: 'appServicePlan-deployment'
  params: {
    appServicePlanName: resourceNames.appServicePlan
    location: location
    environment: environment
    skuName: 'S3'  // INTENTIONALLY INEFFICIENT: Standard S3 (4 cores, 7GB RAM) - $150/month
    skuCapacity: 1
  }
}

// App Service - Backend API (Simplified for demo - no Cosmos DB or Key Vault)
resource appService 'Microsoft.Web/sites@2023-01-01' = {
  name: resourceNames.appService
  location: location
  kind: 'app'
  properties: {
    serverFarmId: appServicePlan.outputs.appServicePlanId
    httpsOnly: true
    redundancyMode: 'None'
    publicNetworkAccess: 'Enabled'
    siteConfig: {
      nodeVersion: '~18'
      alwaysOn: true
      ftpsState: 'FtpsOnly'
      minTlsVersion: '1.2'
      http20Enabled: true
      appSettings: [
        {
          name: 'NODE_ENV'
          value: environment == 'prod' ? 'production' : 'development'
        }
        {
          name: 'WEBSITE_NODE_DEFAULT_VERSION'
          value: '~18'
        }
      ]
    }
    clientAffinityEnabled: false
  }
  tags: {
    Environment: environment
    Application: 'HikePlanner'
    CostCenter: 'Demo'
    ServiceTier: 'Backend'
    CostOptimization: 'Inefficient-Demo'
    OptimalSku: 'B2'
    WastageReason: 'Standard-S3-vs-Basic-B2'
  }
  identity: {
    type: 'SystemAssigned'
  }
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
output appServicePlanName string = appServicePlan.outputs.appServicePlanName
output appServicePlanId string = appServicePlan.outputs.appServicePlanId
output appServicePlanSku object = appServicePlan.outputs.appServicePlanSku
output appServiceName string = appService.name
output appServiceDefaultHostname string = appService.properties.defaultHostName
output appServicePrincipalId string = appService.identity.principalId
output budgetName string = budgetAlerts.outputs.budgetName

// Cost Optimization Summary
output costOptimizationSummary object = {
  description: 'Intentionally inefficient App Service Plan for cost optimization demonstration'
  currentConfiguration: {
    sku: 'Standard S3'
    cores: 4
    ram: '7GB'
    monthlyCost: 150
    features: [
      'Auto-scaling'
      'Custom domains with SSL'
      'Staging slots'
      'Daily backups'
    ]
  }
  recommendedConfiguration: {
    sku: 'Basic B2'
    cores: 2
    ram: '3.5GB'
    monthlyCost: 30
    features: [
      'Custom domains with SSL'
      'Basic scaling (manual)'
    ]
  }
  optimization: {
    monthlySavings: 120
    percentReduction: 80
    riskLevel: 'Low'
    implementationEffort: '1 day'
    downtime: '2-3 minutes'
  }
  validationSteps: [
    'Test in staging environment first'
    'Verify no performance degradation for API responses'
    'Confirm cost reduction in Azure Cost Management after 24-48 hours'
    'Update monitoring baselines for the new tier'
    'Validate all App Service features still work correctly'
  ]
  cliCommand: 'az appservice plan update --name ${resourceNames.appServicePlan} --resource-group ${resourceGroup().name} --sku B2'
  tags: {
    CostOptimization: 'Inefficient-Demo'
    OptimalSku: 'B2'
    WastageReason: 'Standard-S3-vs-Basic-B2'
  }
}
