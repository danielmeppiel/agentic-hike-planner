@description('The name of the Key Vault')
param keyVaultName string

@description('The location for the Key Vault')
param location string = resourceGroup().location

@description('The environment (dev, staging, prod)')
param environment string

@description('Enable HSM-protected keys')
param enableHsm bool = true

// Key Vault Premium with HSM - INTENTIONALLY INEFFICIENT
// Standard tier would suffice for a demo application
resource keyVault 'Microsoft.KeyVault/vaults@2023-07-01' = {
  name: keyVaultName
  location: location
  properties: {
    sku: {
      family: 'A'
      name: 'premium'  // INTENTIONALLY INEFFICIENT - Premium tier when Standard suffices
    }
    tenantId: subscription().tenantId
    enabledForDeployment: true
    enabledForTemplateDeployment: true
    enabledForDiskEncryption: true  // Extra capability not needed
    enableRbacAuthorization: true
    enableSoftDelete: true
    softDeleteRetentionInDays: 90  // Long retention for all environments - INTENTIONALLY INEFFICIENT
    enablePurgeProtection: true  // Extra protection for demo - INTENTIONALLY INEFFICIENT
    publicNetworkAccess: 'Enabled'
    networkAcls: {
      defaultAction: 'Allow'
      bypass: 'AzureServices'
      ipRules: []
      virtualNetworkRules: []
    }
  }
  tags: {
    Environment: environment
    Application: 'HikePlanner'
    CostCenter: 'Demo'
    CostOptimization: 'Inefficient-Demo'
    ServiceTier: 'Security'
    Purpose: 'Premium-When-Standard-Suffices'
    MonthlyCost: '$15'
    OptimizationPotential: 'Standard tier - $5/month'
  }
}

// HSM-Protected Key for demo - INTENTIONALLY INEFFICIENT
resource hsmKey 'Microsoft.KeyVault/vaults/keys@2023-07-01' = if (enableHsm) {
  parent: keyVault
  name: 'hsm-demo-key'
  properties: {
    kty: 'RSA-HSM'  // HSM-protected key - INTENTIONALLY INEFFICIENT
    keySize: 4096  // Large key size - INTENTIONALLY INEFFICIENT
    keyOps: [
      'encrypt'
      'decrypt'
      'sign'
      'verify'
      'wrapKey'
      'unwrapKey'
    ]
    attributes: {
      enabled: true
      exportable: false
    }
    rotationPolicy: {
      lifetimeActions: [
        {
          trigger: {
            timeAfterCreate: 'P30D'  // Rotate every 30 days - INTENTIONALLY FREQUENT
          }
          action: {
            type: 'rotate'
          }
        }
        {
          trigger: {
            timeBeforeExpiry: 'P30D'
          }
          action: {
            type: 'notify'
          }
        }
      ]
      attributes: {
        expiryTime: 'P90D'  // Expire after 90 days - INTENTIONALLY SHORT
      }
    }
  }
  tags: {
    Environment: environment
    Application: 'HikePlanner'
    CostCenter: 'Demo'
    Purpose: 'HSM-Demo'
  }
}

// Multiple secrets stored - generates operations cost
// NOTE: These placeholder values should be replaced with actual secret values
// when deployed. The main-finops-demo.bicep template overrides these with
// actual resource connection strings. These placeholders ensure the module
// can be validated and deployed independently for testing purposes.
resource cosmosDbKeySecret 'Microsoft.KeyVault/vaults/secrets@2023-07-01' = {
  parent: keyVault
  name: 'cosmos-db-primary-key'
  properties: {
    value: 'placeholder-cosmos-key'
    contentType: 'text/plain'
    attributes: {
      enabled: true
    }
  }
}

resource cosmosDbEndpointSecret 'Microsoft.KeyVault/vaults/secrets@2023-07-01' = {
  parent: keyVault
  name: 'cosmos-db-endpoint'
  properties: {
    value: 'placeholder-cosmos-endpoint'
    contentType: 'text/plain'
    attributes: {
      enabled: true
    }
  }
}

resource sqlConnectionStringSecret 'Microsoft.KeyVault/vaults/secrets@2023-07-01' = {
  parent: keyVault
  name: 'sql-connection-string'
  properties: {
    value: 'placeholder-sql-connection'
    contentType: 'text/plain'
    attributes: {
      enabled: true
    }
  }
}

resource redisConnectionStringSecret 'Microsoft.KeyVault/vaults/secrets@2023-07-01' = {
  parent: keyVault
  name: 'redis-connection-string'
  properties: {
    value: 'placeholder-redis-connection'
    contentType: 'text/plain'
    attributes: {
      enabled: true
    }
  }
}

resource storageAccountKeySecret 'Microsoft.KeyVault/vaults/secrets@2023-07-01' = {
  parent: keyVault
  name: 'storage-account-key'
  properties: {
    value: 'placeholder-storage-key'
    contentType: 'text/plain'
    attributes: {
      enabled: true
    }
  }
}

resource appInsightsKeySecret 'Microsoft.KeyVault/vaults/secrets@2023-07-01' = {
  parent: keyVault
  name: 'app-insights-instrumentation-key'
  properties: {
    value: 'placeholder-appinsights-key'
    contentType: 'text/plain'
    attributes: {
      enabled: true
    }
  }
}

resource b2cClientSecretSecret 'Microsoft.KeyVault/vaults/secrets@2023-07-01' = {
  parent: keyVault
  name: 'b2c-client-secret'
  properties: {
    value: 'placeholder-b2c-secret'
    contentType: 'text/plain'
    attributes: {
      enabled: true
    }
  }
}

resource apiKeySecret 'Microsoft.KeyVault/vaults/secrets@2023-07-01' = {
  parent: keyVault
  name: 'api-key'
  properties: {
    value: 'placeholder-api-key'
    contentType: 'text/plain'
    attributes: {
      enabled: true
    }
  }
}

@description('The resource ID of the Key Vault')
output keyVaultId string = keyVault.id

@description('The name of the Key Vault')
output keyVaultName string = keyVault.name

@description('The URI of the Key Vault')
output keyVaultUri string = keyVault.properties.vaultUri

@description('Cost optimization summary for Key Vault Premium')
output costOptimizationSummary object = {
  currentCost: 15
  optimizedCost: 5
  savings: 10
  savingsPercentage: 67
  recommendation: 'Switch from Premium to Standard tier'
  configuration: {
    currentTier: 'Premium'
    recommendedTier: 'Standard'
    hsmKeys: enableHsm ? 'Enabled' : 'Disabled'
    recommendedHsm: 'Disabled for demo'
    keyRotation: '30 days'
    recommendedRotation: '365 days'
  }
  inefficiencies: [
    'Premium tier when Standard would suffice'
    'HSM-protected keys for demo (expensive)'
    'Frequent key rotation (30 days)'
    'Purge protection enabled for demo environment'
    'Multiple secrets with high operation frequency'
    'Disk encryption capability enabled (not used)'
  ]
}
