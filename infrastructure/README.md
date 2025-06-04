# Infrastructure as Code

This directory contains the Infrastructure as Code (IaC) templates for deploying the Agentic Hike Planner application to Azure.

## Directory Structure

```
infrastructure/
├── bicep/                 # Azure Bicep templates
│   ├── main.bicep        # Main deployment template
│   ├── cosmos.bicep      # Cosmos DB configuration
│   └── parameters.json   # Environment parameters
├── scripts/              # Deployment scripts
│   └── deploy.sh         # Automated deployment script
└── README.md             # This file
```

## Deployment

### Prerequisites

- Azure CLI installed and configured
- Appropriate Azure subscription permissions
- Resource group created

### Quick Deployment

```bash
# Deploy to development environment
./scripts/deploy.sh --environment dev --resource-group DataDemo
```

### Manual Deployment

```bash
# Create resource group (if needed)
az group create --name rg-hike-planner-dev --location eastus

# Deploy infrastructure
az deployment group create \
  --resource-group rg-hike-planner-dev \
  --template-file bicep/main.bicep \
  --parameters @bicep/parameters.dev.json
```

## Environments

- **dev**: Development environment with minimal resources
- **staging**: Staging environment for testing
- **prod**: Production environment with high availability

## Cost Optimization

The infrastructure is designed with cost optimization in mind:
- Minimal provisioning for development
- Autoscaling enabled where appropriate
- Resource consolidation to reduce overhead