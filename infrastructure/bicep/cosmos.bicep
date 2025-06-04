@description('Environment name (e.g., dev, staging, prod)')
param environment string = 'dev'

@description('Location for all resources')
param location string = resourceGroup().location

@description('Cosmos DB account name')
param cosmosAccountName string = 'cosmos-hike-planner-${environment}'

@description('Cosmos DB database name')
param databaseName string = 'HikePlannerDB'

@description('Minimum throughput for autoscaling')
param minThroughput int = 400

@description('Maximum throughput for autoscaling')
param maxThroughput int = 1000

// Cosmos DB Account
resource cosmosAccount 'Microsoft.DocumentDB/databaseAccounts@2023-04-15' = {
  name: cosmosAccountName
  location: location
  kind: 'GlobalDocumentDB'
  properties: {
    consistencyPolicy: {
      defaultConsistencyLevel: 'Session'
    }
    locations: [
      {
        locationName: location
        failoverPriority: 0
        isZoneRedundant: false
      }
    ]
    databaseAccountOfferType: 'Standard'
    enableAutomaticFailover: false
    enableMultipleWriteLocations: false
    capabilities: [
      {
        name: 'EnableServerless'
      }
    ]
  }
}

// Database
resource database 'Microsoft.DocumentDB/databaseAccounts/sqlDatabases@2023-04-15' = {
  parent: cosmosAccount
  name: databaseName
  properties: {
    resource: {
      id: databaseName
    }
  }
}

// Users Container
resource usersContainer 'Microsoft.DocumentDB/databaseAccounts/sqlDatabases/containers@2023-04-15' = {
  parent: database
  name: 'users'
  properties: {
    resource: {
      id: 'users'
      partitionKey: {
        paths: ['/partitionKey']
        kind: 'Hash'
      }
      indexingPolicy: {
        includedPaths: [
          {
            path: '/email/?'
          }
          {
            path: '/fitnessLevel/?'
          }
          {
            path: '/location/region/?'
          }
          {
            path: '/createdAt/?'
          }
        ]
        excludedPaths: [
          {
            path: '/*'
          }
        ]
      }
    }
  }
}

// Trips Container
resource tripsContainer 'Microsoft.DocumentDB/databaseAccounts/sqlDatabases/containers@2023-04-15' = {
  parent: database
  name: 'trips'
  properties: {
    resource: {
      id: 'trips'
      partitionKey: {
        paths: ['/partitionKey']
        kind: 'Hash'
      }
      indexingPolicy: {
        includedPaths: [
          {
            path: '/userId/?'
          }
          {
            path: '/status/?'
          }
          {
            path: '/dates/startDate/?'
          }
          {
            path: '/dates/endDate/?'
          }
          {
            path: '/location/region/?'
          }
        ]
        excludedPaths: [
          {
            path: '/*'
          }
        ]
      }
    }
  }
}

// Trails Container
resource trailsContainer 'Microsoft.DocumentDB/databaseAccounts/sqlDatabases/containers@2023-04-15' = {
  parent: database
  name: 'trails'
  properties: {
    resource: {
      id: 'trails'
      partitionKey: {
        paths: ['/partitionKey']
        kind: 'Hash'
      }
      indexingPolicy: {
        includedPaths: [
          {
            path: '/location/region/?'
          }
          {
            path: '/difficulty/?'
          }
          {
            path: '/features/trailType/?'
          }
          {
            path: '/safety/riskLevel/?'
          }
          {
            path: '/isActive/?'
          }
        ]
        excludedPaths: [
          {
            path: '/*'
          }
        ]
      }
    }
  }
}

// Recommendations Container
resource recommendationsContainer 'Microsoft.DocumentDB/databaseAccounts/sqlDatabases/containers@2023-04-15' = {
  parent: database
  name: 'recommendations'
  properties: {
    resource: {
      id: 'recommendations'
      partitionKey: {
        paths: ['/partitionKey']
        kind: 'Hash'
      }
      indexingPolicy: {
        includedPaths: [
          {
            path: '/userId/?'
          }
          {
            path: '/tripId/?'
          }
          {
            path: '/createdAt/?'
          }
          {
            path: '/expiresAt/?'
          }
        ]
        excludedPaths: [
          {
            path: '/*'
          }
        ]
      }
    }
  }
}

// Outputs
output cosmosAccountName string = cosmosAccount.name
output cosmosEndpoint string = cosmosAccount.properties.documentEndpoint
output databaseName string = database.name
output resourceGroupName string = resourceGroup().name