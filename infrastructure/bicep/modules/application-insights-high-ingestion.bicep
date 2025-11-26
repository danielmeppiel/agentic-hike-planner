@description('The name of the Application Insights resource')
param appInsightsName string

@description('The location for the Application Insights resource')
param location string = resourceGroup().location

@description('The environment (dev, staging, prod)')
param environment string

@description('Log Analytics Workspace ID')
param logAnalyticsWorkspaceId string = ''

@description('Daily data cap in GB - INTENTIONALLY HIGH')
param dailyCapGb int = 5

@description('Data retention in days - INTENTIONALLY HIGH')
param retentionDays int = 730

// Log Analytics Workspace if not provided - INTENTIONALLY INEFFICIENT
resource logAnalyticsWorkspace 'Microsoft.OperationalInsights/workspaces@2023-09-01' = if (logAnalyticsWorkspaceId == '') {
  name: '${appInsightsName}-logs'
  location: location
  properties: {
    sku: {
      name: 'PerGB2018'  // Pay-per-GB instead of free tier - INTENTIONALLY INEFFICIENT
    }
    retentionInDays: retentionDays  // 730 days retention - INTENTIONALLY INEFFICIENT
    workspaceCapping: {
      dailyQuotaGb: dailyCapGb  // 5GB/day - INTENTIONALLY INEFFICIENT
    }
    publicNetworkAccessForIngestion: 'Enabled'
    publicNetworkAccessForQuery: 'Enabled'
    features: {
      enableDataExport: true  // Extra feature not needed
      immediatePurgeDataOn30Days: false  // Keep data longer
    }
  }
  tags: {
    Environment: environment
    Application: 'HikePlanner'
    CostCenter: 'Demo'
    CostOptimization: 'Inefficient-Demo'
    ServiceTier: 'Monitoring'
    Purpose: 'High-Ingestion-Logs'
    MonthlyCost: '$100'
    OptimizationPotential: 'Reduce daily cap to 1GB - $15/month'
  }
}

// Application Insights with high ingestion - INTENTIONALLY INEFFICIENT
resource appInsights 'Microsoft.Insights/components@2020-02-02' = {
  name: appInsightsName
  location: location
  kind: 'web'
  properties: {
    Application_Type: 'web'
    WorkspaceResourceId: logAnalyticsWorkspaceId != '' ? logAnalyticsWorkspaceId : logAnalyticsWorkspace.id
    IngestionMode: 'LogAnalytics'
    publicNetworkAccessForIngestion: 'Enabled'
    publicNetworkAccessForQuery: 'Enabled'
    RetentionInDays: retentionDays  // 730 days - INTENTIONALLY INEFFICIENT
    SamplingPercentage: 100  // No sampling - capture everything - INTENTIONALLY INEFFICIENT
    DisableIpMasking: false
    DisableLocalAuth: false
    Flow_Type: 'Bluefield'
    Request_Source: 'rest'
  }
  tags: {
    Environment: environment
    Application: 'HikePlanner'
    CostCenter: 'Demo'
    CostOptimization: 'Inefficient-Demo'
    ServiceTier: 'Monitoring'
    Purpose: 'High-Ingestion-Telemetry'
    DailyIngestion: '5GB'
    MonthlyCost: '$120'
    OptimizationPotential: '1GB/day with 90 days retention - $15/month'
  }
}

// Action Group for alerting - Multiple channels - INTENTIONALLY INEFFICIENT
// NOTE: The email addresses and phone numbers are placeholders for demo purposes.
// Replace with actual values when deploying to a real environment.
// Having multiple redundant alert channels is part of the intentional inefficiency.
resource actionGroup 'Microsoft.Insights/actionGroups@2023-01-01' = {
  name: '${appInsightsName}-alerts'
  location: 'Global'
  properties: {
    groupShortName: 'HikeAlerts'
    enabled: true
    emailReceivers: [
      {
        name: 'PrimaryEmail'
        emailAddress: 'primary@example.com'
        useCommonAlertSchema: true
      }
      {
        name: 'SecondaryEmail'
        emailAddress: 'secondary@example.com'
        useCommonAlertSchema: true
      }
      {
        name: 'TertiaryEmail'
        emailAddress: 'tertiary@example.com'
        useCommonAlertSchema: true
      }
    ]
    smsReceivers: [
      {
        name: 'SMSAlert'
        countryCode: '1'
        phoneNumber: '5555555555'
      }
    ]
  }
  tags: {
    Environment: environment
    Application: 'HikePlanner'
    CostCenter: 'Demo'
    CostOptimization: 'Inefficient-Demo'
    ServiceTier: 'Monitoring'
  }
}

// Metric Alert for response time - INTENTIONALLY NOISY
resource responseTimeAlert 'Microsoft.Insights/metricAlerts@2018-03-01' = {
  name: '${appInsightsName}-response-time-alert'
  location: 'Global'
  properties: {
    description: 'Alert when response time exceeds threshold - INTENTIONALLY NOISY'
    severity: 2
    enabled: true
    scopes: [
      appInsights.id
    ]
    evaluationFrequency: 'PT1M'  // Every minute - INTENTIONALLY FREQUENT
    windowSize: 'PT5M'
    criteria: {
      'odata.type': 'Microsoft.Azure.Monitor.SingleResourceMultipleMetricCriteria'
      allOf: [
        {
          name: 'ResponseTime'
          metricName: 'requests/duration'
          metricNamespace: 'microsoft.insights/components'
          operator: 'GreaterThan'
          threshold: 100  // 100ms threshold - INTENTIONALLY SENSITIVE
          timeAggregation: 'Average'
          criterionType: 'StaticThresholdCriterion'
        }
      ]
    }
    actions: [
      {
        actionGroupId: actionGroup.id
      }
    ]
  }
  tags: {
    Environment: environment
    Application: 'HikePlanner'
    CostCenter: 'Demo'
    CostOptimization: 'Inefficient-Demo'
  }
}

// Metric Alert for exceptions - INTENTIONALLY NOISY
resource exceptionsAlert 'Microsoft.Insights/metricAlerts@2018-03-01' = {
  name: '${appInsightsName}-exceptions-alert'
  location: 'Global'
  properties: {
    description: 'Alert on any exception - INTENTIONALLY NOISY'
    severity: 2
    enabled: true
    scopes: [
      appInsights.id
    ]
    evaluationFrequency: 'PT1M'
    windowSize: 'PT5M'
    criteria: {
      'odata.type': 'Microsoft.Azure.Monitor.SingleResourceMultipleMetricCriteria'
      allOf: [
        {
          name: 'Exceptions'
          metricName: 'exceptions/count'
          metricNamespace: 'microsoft.insights/components'
          operator: 'GreaterThan'
          threshold: 0  // Any exception - INTENTIONALLY SENSITIVE
          timeAggregation: 'Total'
          criterionType: 'StaticThresholdCriterion'
        }
      ]
    }
    actions: [
      {
        actionGroupId: actionGroup.id
      }
    ]
  }
  tags: {
    Environment: environment
    Application: 'HikePlanner'
    CostCenter: 'Demo'
    CostOptimization: 'Inefficient-Demo'
  }
}

// Availability test - Multiple locations - INTENTIONALLY EXPENSIVE
// NOTE: The URL 'placeholder.azurewebsites.net' should be replaced with the
// actual application endpoint when deployed. This placeholder ensures the
// module validates correctly during development.
resource availabilityTest 'Microsoft.Insights/webtests@2022-06-15' = {
  name: '${appInsightsName}-availability'
  location: location
  kind: 'ping'
  properties: {
    Name: 'API Availability Test'
    Description: 'Availability test from multiple locations - INTENTIONALLY EXPENSIVE (10 locations when 3-5 would suffice)'
    Enabled: true
    Frequency: 300  // Every 5 minutes from each location
    Timeout: 120
    Kind: 'ping'
    RetryEnabled: true
    Locations: [
      { Id: 'us-ca-sjc-azr' }
      { Id: 'us-tx-sn1-azr' }
      { Id: 'us-il-ch1-azr' }
      { Id: 'us-va-ash-azr' }
      { Id: 'us-fl-mia-edge' }
      { Id: 'emea-gb-db3-azr' }
      { Id: 'emea-nl-ams-azr' }
      { Id: 'emea-fr-pra-edge' }
      { Id: 'apac-jp-kaw-edge' }
      { Id: 'apac-sg-sin-azr' }
    ]
    Configuration: {
      WebTest: '''
        <WebTest Name="APIAvailability" Id="ABD48585-0831-40CB-9069-682EA6BB3583" Enabled="True" CssProjectStructure="" CssIteration="" Timeout="120" WorkItemIds="" xmlns="http://microsoft.com/schemas/VisualStudio/TeamTest/2010" Description="" CredentialUserName="" CredentialPassword="" PreAuthenticate="True" Proxy="default" StopOnError="False" RecordedResultFile="" ResultsLocale="">
          <Items>
            <Request Method="GET" Guid="a5f10126-e4cd-570d-961c-cea43999a200" Version="1.1" Url="https://placeholder.azurewebsites.net/health" ThinkTime="0" Timeout="120" ParseDependentRequests="False" FollowRedirects="True" RecordResult="True" Cache="False" ResponseTimeGoal="0" Encoding="utf-8" ExpectedHttpStatusCode="200" ExpectedResponseUrl="" ReportingName="" IgnoreHttpStatusCode="False" />
          </Items>
        </WebTest>
      '''
    }
    SyntheticMonitorId: '${appInsightsName}-availability'
  }
  tags: {
    'hidden-link:${appInsights.id}': 'Resource'
    Environment: environment
    Application: 'HikePlanner'
    CostCenter: 'Demo'
    CostOptimization: 'Inefficient-Demo'
  }
}

@description('The resource ID of Application Insights')
output appInsightsId string = appInsights.id

@description('The name of Application Insights')
output appInsightsName string = appInsights.name

@description('The instrumentation key')
output instrumentationKey string = appInsights.properties.InstrumentationKey

@description('The connection string')
output connectionString string = appInsights.properties.ConnectionString

@description('The Log Analytics Workspace ID')
output logAnalyticsWorkspaceId string = logAnalyticsWorkspaceId != '' ? logAnalyticsWorkspaceId : logAnalyticsWorkspace.id

@description('Cost optimization summary for Application Insights')
output costOptimizationSummary object = {
  currentCost: 120
  optimizedCost: 15
  savings: 105
  savingsPercentage: 88
  recommendation: 'Reduce daily ingestion to 1GB and retention to 90 days'
  configuration: {
    currentDailyIngestion: '5GB'
    recommendedDailyIngestion: '1GB'
    currentRetention: '730 days'
    recommendedRetention: '90 days'
    currentSampling: '100%'
    recommendedSampling: '25-50%'
  }
  inefficiencies: [
    '5GB/day data ingestion (5x recommended)'
    '730 days retention (8x recommended)'
    '100% sampling rate (no sampling)'
    'Multiple redundant alerts'
    '10 availability test locations (3-5 would suffice)'
    'Multiple alert recipients'
  ]
}
