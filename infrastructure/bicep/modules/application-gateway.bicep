@description('The name of the Application Gateway')
param applicationGatewayName string

@description('The location for the Application Gateway')
param location string = resourceGroup().location

@description('The environment (dev, staging, prod)')
param environment string

@description('Backend app service FQDN')
param backendFqdn string

@description('The subnet ID for Application Gateway')
param subnetId string = ''

// Public IP for Application Gateway
resource publicIP 'Microsoft.Network/publicIPAddresses@2023-11-01' = {
  name: '${applicationGatewayName}-pip'
  location: location
  sku: {
    name: 'Standard'
    tier: 'Regional'
  }
  properties: {
    publicIPAllocationMethod: 'Static'
    publicIPAddressVersion: 'IPv4'
    dnsSettings: {
      domainNameLabel: toLower('${applicationGatewayName}-${uniqueString(resourceGroup().id)}')
    }
  }
  tags: {
    Environment: environment
    Application: 'HikePlanner'
    CostCenter: 'Demo'
    CostOptimization: 'Inefficient-Demo'
    ServiceTier: 'Network'
    Purpose: 'Unnecessary-LoadBalancer'
  }
}

// Virtual Network for Application Gateway (if not provided)
resource vnet 'Microsoft.Network/virtualNetworks@2023-11-01' = if (subnetId == '') {
  name: '${applicationGatewayName}-vnet'
  location: location
  properties: {
    addressSpace: {
      addressPrefixes: [
        '10.0.0.0/16'
      ]
    }
    subnets: [
      {
        name: 'agw-subnet'
        properties: {
          addressPrefix: '10.0.1.0/24'
          privateEndpointNetworkPolicies: 'Disabled'
          privateLinkServiceNetworkPolicies: 'Disabled'
        }
      }
      {
        name: 'backend-subnet'
        properties: {
          addressPrefix: '10.0.2.0/24'
          privateEndpointNetworkPolicies: 'Disabled'
          privateLinkServiceNetworkPolicies: 'Disabled'
        }
      }
    ]
  }
  tags: {
    Environment: environment
    Application: 'HikePlanner'
    CostCenter: 'Demo'
    CostOptimization: 'Inefficient-Demo'
    ServiceTier: 'Network'
  }
}

// Application Gateway - Standard v2 - INTENTIONALLY INEFFICIENT
// A single-backend application doesn't need a load balancer
resource applicationGateway 'Microsoft.Network/applicationGateways@2023-11-01' = {
  name: applicationGatewayName
  location: location
  properties: {
    sku: {
      name: 'Standard_v2'  // INTENTIONALLY INEFFICIENT - Standard v2 when not needed
      tier: 'Standard_v2'
    }
    autoscaleConfiguration: {
      minCapacity: 2  // INTENTIONALLY INEFFICIENT - Always 2 instances minimum
      maxCapacity: 5  // High max capacity
    }
    gatewayIPConfigurations: [
      {
        name: 'appGatewayIpConfig'
        properties: {
          subnet: {
            id: subnetId != '' ? subnetId : vnet.properties.subnets[0].id
          }
        }
      }
    ]
    frontendIPConfigurations: [
      {
        name: 'appGwPublicFrontendIp'
        properties: {
          publicIPAddress: {
            id: publicIP.id
          }
        }
      }
    ]
    frontendPorts: [
      {
        name: 'port_80'
        properties: {
          port: 80
        }
      }
      {
        name: 'port_443'
        properties: {
          port: 443
        }
      }
    ]
    backendAddressPools: [
      {
        name: 'app-service-backend'
        properties: {
          backendAddresses: [
            {
              fqdn: backendFqdn
            }
          ]
        }
      }
    ]
    backendHttpSettingsCollection: [
      {
        name: 'https-settings'
        properties: {
          port: 443
          protocol: 'Https'
          cookieBasedAffinity: 'Disabled'
          pickHostNameFromBackendAddress: true
          requestTimeout: 30
          probe: {
            id: resourceId('Microsoft.Network/applicationGateways/probes', applicationGatewayName, 'health-probe')
          }
        }
      }
    ]
    httpListeners: [
      {
        name: 'http-listener'
        properties: {
          frontendIPConfiguration: {
            id: resourceId('Microsoft.Network/applicationGateways/frontendIPConfigurations', applicationGatewayName, 'appGwPublicFrontendIp')
          }
          frontendPort: {
            id: resourceId('Microsoft.Network/applicationGateways/frontendPorts', applicationGatewayName, 'port_80')
          }
          protocol: 'Http'
        }
      }
    ]
    requestRoutingRules: [
      {
        name: 'http-rule'
        properties: {
          priority: 100
          ruleType: 'Basic'
          httpListener: {
            id: resourceId('Microsoft.Network/applicationGateways/httpListeners', applicationGatewayName, 'http-listener')
          }
          backendAddressPool: {
            id: resourceId('Microsoft.Network/applicationGateways/backendAddressPools', applicationGatewayName, 'app-service-backend')
          }
          backendHttpSettings: {
            id: resourceId('Microsoft.Network/applicationGateways/backendHttpSettingsCollection', applicationGatewayName, 'https-settings')
          }
        }
      }
    ]
    probes: [
      {
        name: 'health-probe'
        properties: {
          protocol: 'Https'
          pickHostNameFromBackendHttpSettings: true
          path: '/health'
          interval: 30
          timeout: 30
          unhealthyThreshold: 3
        }
      }
    ]
    enableHttp2: true
  }
  tags: {
    Environment: environment
    Application: 'HikePlanner'
    CostCenter: 'Demo'
    CostOptimization: 'Inefficient-Demo'
    ServiceTier: 'Network'
    Purpose: 'Unnecessary-LoadBalancer'
    MonthlyCost: '$50'
    OptimizationPotential: 'Remove completely - direct routing is free'
  }
}

@description('The resource ID of the Application Gateway')
output applicationGatewayId string = applicationGateway.id

@description('The name of the Application Gateway')
output applicationGatewayName string = applicationGateway.name

@description('The public IP address of the Application Gateway')
output publicIpAddress string = publicIP.properties.ipAddress

@description('The FQDN of the Application Gateway')
output fqdn string = publicIP.properties.dnsSettings.fqdn

@description('The VNet ID (if created)')
output vnetId string = subnetId == '' ? vnet.id : ''

@description('Cost optimization summary for Application Gateway')
output costOptimizationSummary object = {
  currentCost: 50
  optimizedCost: 0
  savings: 50
  savingsPercentage: 100
  recommendation: 'Remove Application Gateway - direct routing from Static Web App to backend is free'
  inefficiencies: [
    'Standard_v2 SKU for single backend application'
    'Minimum 2 instances always running'
    'No SSL offload needed - backend supports HTTPS'
    'Load balancing unnecessary for single-instance app'
  ]
}
