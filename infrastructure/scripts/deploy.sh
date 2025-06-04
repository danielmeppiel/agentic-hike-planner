#!/bin/bash

# Deployment script for Agentic Hike Planner infrastructure
# Usage: ./deploy.sh --environment dev --resource-group DataDemo

set -e

# Default values
ENVIRONMENT="dev"
RESOURCE_GROUP=""
LOCATION="eastus"

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --environment)
      ENVIRONMENT="$2"
      shift 2
      ;;
    --resource-group)
      RESOURCE_GROUP="$2"
      shift 2
      ;;
    --location)
      LOCATION="$2"
      shift 2
      ;;
    --help)
      echo "Usage: $0 --environment <env> --resource-group <rg> [--location <location>]"
      echo ""
      echo "Options:"
      echo "  --environment     Environment name (dev, staging, prod)"
      echo "  --resource-group  Azure resource group name"
      echo "  --location        Azure region (default: eastus)"
      echo "  --help           Show this help message"
      exit 0
      ;;
    *)
      echo "Unknown option $1"
      exit 1
      ;;
  esac
done

# Validate required parameters
if [[ -z "$RESOURCE_GROUP" ]]; then
  echo "Error: Resource group is required. Use --resource-group parameter."
  exit 1
fi

echo "🚀 Deploying Agentic Hike Planner infrastructure..."
echo "   Environment: $ENVIRONMENT"
echo "   Resource Group: $RESOURCE_GROUP"
echo "   Location: $LOCATION"
echo ""

# Check if Azure CLI is logged in
if ! az account show &> /dev/null; then
  echo "❌ Azure CLI is not logged in. Please run 'az login' first."
  exit 1
fi

# Check if resource group exists, create if it doesn't
if ! az group show --name "$RESOURCE_GROUP" &> /dev/null; then
  echo "📁 Creating resource group: $RESOURCE_GROUP"
  az group create --name "$RESOURCE_GROUP" --location "$LOCATION"
else
  echo "📁 Using existing resource group: $RESOURCE_GROUP"
fi

# Deploy Cosmos DB infrastructure
echo "🗄️  Deploying Cosmos DB infrastructure..."

DEPLOYMENT_NAME="cosmos-deployment-$(date +%Y%m%d-%H%M%S)"

az deployment group create \
  --name "$DEPLOYMENT_NAME" \
  --resource-group "$RESOURCE_GROUP" \
  --template-file "$(dirname "$0")/../bicep/cosmos.bicep" \
  --parameters environment="$ENVIRONMENT" location="$LOCATION"

# Get deployment outputs
echo "📝 Getting deployment outputs..."

COSMOS_ACCOUNT_NAME=$(az deployment group show \
  --name "$DEPLOYMENT_NAME" \
  --resource-group "$RESOURCE_GROUP" \
  --query "properties.outputs.cosmosAccountName.value" \
  --output tsv)

COSMOS_ENDPOINT=$(az deployment group show \
  --name "$DEPLOYMENT_NAME" \
  --resource-group "$RESOURCE_GROUP" \
  --query "properties.outputs.cosmosEndpoint.value" \
  --output tsv)

DATABASE_NAME=$(az deployment group show \
  --name "$DEPLOYMENT_NAME" \
  --resource-group "$RESOURCE_GROUP" \
  --query "properties.outputs.databaseName.value" \
  --output tsv)

# Get Cosmos DB primary key
echo "🔑 Retrieving Cosmos DB connection information..."

COSMOS_KEY=$(az cosmosdb keys list \
  --name "$COSMOS_ACCOUNT_NAME" \
  --resource-group "$RESOURCE_GROUP" \
  --type keys \
  --query "primaryMasterKey" \
  --output tsv)

# Create environment file
ENV_FILE="$(dirname "$0")/../../backend/.env.${ENVIRONMENT}"

echo "📋 Creating environment file: $ENV_FILE"

cat > "$ENV_FILE" << EOF
# Server Configuration
NODE_ENV=$ENVIRONMENT
PORT=3001
API_VERSION=1.0.0

# CORS Configuration
CORS_ORIGIN=http://localhost:3000

# Azure Configuration
AZURE_COSMOS_DB_ENDPOINT=$COSMOS_ENDPOINT
AZURE_COSMOS_DB_KEY=$COSMOS_KEY
AZURE_AD_B2C_TENANT_ID=
AZURE_AD_B2C_CLIENT_ID=
AZURE_AI_FOUNDRY_ENDPOINT=
AZURE_AI_FOUNDRY_KEY=
AZURE_STORAGE_ACCOUNT_NAME=
AZURE_STORAGE_ACCOUNT_KEY=

# Build Information
GIT_COMMIT=\$(git rev-parse HEAD)
EOF

echo ""
echo "✅ Deployment completed successfully!"
echo ""
echo "📊 Infrastructure Summary:"
echo "   • Resource Group: $RESOURCE_GROUP"
echo "   • Cosmos DB Account: $COSMOS_ACCOUNT_NAME"
echo "   • Database: $DATABASE_NAME"
echo "   • Endpoint: $COSMOS_ENDPOINT"
echo ""
echo "🔧 Next Steps:"
echo "   1. Copy $ENV_FILE to .env for local development"
echo "   2. Run 'npm run dev' in the backend directory"
echo "   3. Test the application with 'npm run test'"
echo ""
echo "💰 Cost Management:"
echo "   • Cosmos DB is configured in serverless mode for cost efficiency"
echo "   • Monitor usage in Azure Portal"
echo "   • Clean up resources when not needed: az group delete --name $RESOURCE_GROUP"
echo ""