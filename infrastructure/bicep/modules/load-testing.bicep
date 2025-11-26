@description('The name of the Load Testing resource')
param loadTestingName string

@description('The location for the Load Testing resource')
param location string = resourceGroup().location

@description('The environment (dev, staging, prod)')
param environment string

@description('The target URL for load testing')
param targetUrl string

// Load Testing Resource - INTENTIONALLY INEFFICIENT
// Continuous execution when on-demand would suffice
resource loadTesting 'Microsoft.LoadTestService/loadTests@2022-12-01' = {
  name: loadTestingName
  location: location
  identity: {
    type: 'SystemAssigned'
  }
  properties: {
    description: 'Load testing for Hike Planner API - INTENTIONALLY INEFFICIENT: Continuous execution'
  }
  tags: {
    Environment: environment
    Application: 'HikePlanner'
    CostCenter: 'Demo'
    CostOptimization: 'Inefficient-Demo'
    ServiceTier: 'Testing'
    Purpose: 'Continuous-LoadTesting'
    MonthlyCost: '$25'
    OptimizationPotential: 'On-demand testing - $3/month'
  }
}

@description('The resource ID of the Load Testing service')
output loadTestingId string = loadTesting.id

@description('The name of the Load Testing service')
output loadTestingName string = loadTesting.name

@description('The principal ID of the Load Testing managed identity')
output loadTestingPrincipalId string = loadTesting.identity.principalId

@description('Cost optimization summary for Load Testing')
output costOptimizationSummary object = {
  currentCost: 25
  optimizedCost: 3
  savings: 22
  savingsPercentage: 88
  recommendation: 'Switch from continuous to on-demand load testing'
  testConfiguration: {
    currentMode: 'continuous'
    recommendedMode: 'on-demand'
    virtualUsers: 100
    scheduledExecutions: 'every_hour'
    recommendedSchedule: 'weekly_or_before_release'
  }
  inefficiencies: [
    'Continuous 24/7 load testing execution'
    '100 virtual users for demo app'
    'High execution frequency (hourly)'
    'Premium tier when basic would suffice'
  ]
}
