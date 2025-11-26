@description('The name of the B2C tenant (without .onmicrosoft.com)')
param b2cTenantName string

@description('The location for the B2C tenant (only limited regions supported)')
@allowed(['United States', 'Europe', 'Asia Pacific', 'Australia', 'Japan'])
param location string = 'United States'

@description('The environment (dev, staging, prod)')
param environment string

@description('The display name for the B2C tenant')
param displayName string = 'Hike Planner B2C'

@description('Country code for the B2C tenant')
param countryCode string = 'US'

// Azure AD B2C Tenant - Premium P1 tier - INTENTIONALLY INEFFICIENT
// Free tier supports up to 50,000 MAU which is more than enough for demo
resource b2cTenant 'Microsoft.AzureActiveDirectory/b2cDirectories@2021-04-01' = {
  name: '${b2cTenantName}.onmicrosoft.com'
  location: location
  sku: {
    name: 'PremiumP1'  // INTENTIONALLY INEFFICIENT - Free tier would suffice
    tier: 'A0'
  }
  properties: {
    createTenantProperties: {
      displayName: displayName
      countryCode: countryCode
    }
  }
  tags: {
    Environment: environment
    Application: 'HikePlanner'
    CostCenter: 'Demo'
    CostOptimization: 'Inefficient-Demo'
    ServiceTier: 'Identity'
    Purpose: 'Premium-When-Free-Suffices'
    MonthlyCost: '$30'
    OptimizationPotential: 'Free tier - $0/month (50,000 MAU included)'
  }
}

@description('The resource ID of the B2C tenant')
output b2cTenantId string = b2cTenant.id

@description('The name of the B2C tenant')
output b2cTenantName string = b2cTenant.name

@description('The domain name of the B2C tenant')
output b2cDomainName string = '${b2cTenantName}.onmicrosoft.com'

@description('B2C User Flow configurations (to be configured in the B2C portal)')
output userFlowConfigurations object = {
  signUpSignIn: {
    name: 'B2C_1_susi'
    type: 'signUpOrSignIn'
    identityProviders: [
      'Local'
      'Google'
      'Microsoft'
    ]
    userAttributes: [
      'Email'
      'Given Name'
      'Surname'
      'Job Title'
      'Country/Region'
    ]
    applicationClaims: [
      'Email'
      'Given Name'
      'Surname'
      'Object ID'
      'Identity Provider'
    ]
    tokenLifetime: {
      accessToken: 60  // minutes
      refreshToken: 14  // days
      idToken: 60  // minutes
    }
  }
  passwordReset: {
    name: 'B2C_1_password_reset'
    type: 'passwordReset'
    applicationClaims: [
      'Email'
      'Object ID'
    ]
  }
  profileEdit: {
    name: 'B2C_1_profile_edit'
    type: 'profileEditing'
    userAttributes: [
      'Given Name'
      'Surname'
      'Job Title'
      'Country/Region'
      'City'
      'Display Name'
    ]
  }
}

@description('Cost optimization summary for Azure AD B2C')
output costOptimizationSummary object = {
  currentCost: 30
  optimizedCost: 0
  savings: 30
  savingsPercentage: 100
  recommendation: 'Switch from Premium P1 to Free tier'
  configuration: {
    currentTier: 'Premium P1'
    recommendedTier: 'Free'
    currentMAU: 1000
    freeMAULimit: 50000
    premiumFeatures: [
      'Conditional Access'
      'Identity Protection'
      'MFA customization'
    ]
    actuallyUsedFeatures: [
      'Basic sign-up/sign-in'
      'Password reset'
      'Profile editing'
    ]
  }
  inefficiencies: [
    'Premium P1 tier when Free tier supports 50,000 MAU'
    'Paying for Conditional Access not being used'
    'Identity Protection features unused in demo'
    'Advanced MFA customization not utilized'
    'Premium-only reporting not needed for demo'
  ]
}
