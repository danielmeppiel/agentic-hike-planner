# Phase 1-2 Deployment Guide: Azure Cosmos DB, App Service & Cost Monitoring

This guide covers **Phase 1** and **Phase 2** of the Azure Cost Optimization Demo Infrastructure implementation. These phases establish the foundational database infrastructure and App Service platform with intentionally inefficient configuration for cost optimization demonstration, as defined in [Issue #21](https://github.com/danielmeppiel/agentic-hike-planner/issues/21) and [Issue #22](https://github.com/danielmeppiel/agentic-hike-planner/issues/22).

## 🎯 Phase 1-2 Scope & Objectives

**Phase 1-2** establishes the foundational infrastructure with intentionally inefficient configuration for cost optimization demonstration.

### ✅ What's Included in Phase 1-2
- **Azure Cosmos DB** with intentionally inefficient provisioned throughput (1,000 RU/s)
- **Azure Key Vault** for secure secret storage  
- **App Service Plan** (Standard S3 - over-provisioned for demo)
- **App Service** (Node.js backend with Azure integrations)
- **Budget Alerts** (Multi-tier cost monitoring: 50%, 80%, 100%)
- **Infrastructure as Code** templates (Bicep & Terraform)
- **Deployment automation** scripts
- **Integration testing** framework for Azure resources
- **Performance benchmarking** utilities
- **Cost monitoring and protection** mechanisms

### ❌ What's NOT in Phase 1-2
- Application Gateway (Phase 3+) 
- Multiple Storage Accounts (Phase 4+)
- Azure Functions Premium Plans (Phase 5+)
- Static Web Apps (Phase 6+)
- CDN and Redis Cache (Phase 7+)

> **Important**: This follows the phased approach defined in [demo.md](docs/demo.md) and [architecture-inefficient.md](docs/architecture-inefficient.md). Each subsequent phase will add specific inefficient infrastructure components.

## 🏗️ Phase 1-2 Architecture

The Phase 1-2 infrastructure includes:

- **Azure Cosmos DB** (Provisioned 1,000 RU/s) - Intentionally inefficient configuration for cost optimization demo
- **Azure Key Vault** - Secure storage for Cosmos DB secrets and connection strings
- **App Service Plan** (Standard S3) - Intentionally over-provisioned for cost demo
- **App Service** (Node.js backend) - Backend API with Cosmos DB and Key Vault integration
- **Budget Alerts** - Multi-tier cost monitoring with email notifications

### Intentionally Inefficient Configuration

As per [demo.md](docs/demo.md), Phase 1-2 implements the following inefficiencies for cost optimization demonstration:

**Development Environment (Optimized)**:
| Resource | Configuration | Status | Monthly Cost Impact |
|----------|---------------|--------|-------------------|
| **Cosmos DB** | Serverless mode | ✅ Optimized | ~$0-20/month |
| **Key Vault** | Standard tier | Basic operations for demo purposes | ~$5/month |
| **App Service Plan** | Standard S3 tier | Should use Basic B2 for this workload | ~$150/month |
| **Total** | | | **~$155-175/month** |

**Staging/Production Environments (Still Over-provisioned for Demo)**:
| Resource | Configuration | Inefficiency | Monthly Cost Impact |
|----------|---------------|--------------|-------------------|
| **Cosmos DB** | 1,000 RU/s provisioned | Should use serverless for this workload | ~$60/month |
| **Key Vault** | Standard tier | Basic operations for demo purposes | ~$5/month |
| **App Service Plan** | Standard S3 tier | Should use Basic B2 for this workload | ~$150/month |
| **Total** | | | **~$215/month** |

**Optimization Potential**: 67% cost reduction by switching to serverless Cosmos DB (~$25/month) and Basic B2 App Service Plan (~$30/month) = **~$85/month total**

## 🔧 Prerequisites

### Required Tools

1. **Azure CLI** (version 2.50.0 or later)
   ```bash
   # Install Azure CLI
   curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash
   
   # Verify installation
   az --version
   ```

2. **Azure Subscription**
   - Active Azure subscription with sufficient permissions
   - Contributor or Owner role on the subscription or resource group

3. **For Terraform deployment (optional)**
   ```bash
   # Install Terraform
   wget -O- https://apt.releases.hashicorp.com/gpg | sudo gpg --dearmor -o /usr/share/keyrings/hashicorp-archive-keyring.gpg
   echo "deb [signed-by=/usr/share/keyrings/hashicorp-archive-keyring.gpg] https://apt.releases.hashicorp.com apt main" | sudo tee /etc/apt/sources.list.d/hashicorp.list
   sudo apt update && sudo apt install terraform
   
   # Verify installation
   terraform --version
   ```

### Azure Authentication

```bash
# Login to Azure
az login

# Set your subscription (if you have multiple)
az account set --subscription "your-subscription-id"

# Verify current subscription
az account show
```

## 🚀 Deployment Options

### Option 1: Bicep Deployment (Recommended)

#### 1. Validate Templates

```bash
# Validate all templates
./scripts/validate.sh --environment dev --type bicep

# Validate with specific resource group
./scripts/validate.sh --environment dev --resource-group rg-hike-planner-dev --type bicep
```

#### 2. Deploy Infrastructure

```bash
# Create resource group and deploy (development environment)
./scripts/deploy.sh \
  --environment dev \
  --resource-group rg-hike-planner-dev \
  --location eastus \
  --free-tier

# Deploy to staging
./scripts/deploy.sh \
  --environment staging \
  --resource-group rg-hike-planner-staging \
  --location eastus

# Deploy to production
./scripts/deploy.sh \
  --environment prod \
  --resource-group rg-hike-planner-prod \
  --location eastus
```

#### 3. Verify Deployment

```bash
# Check deployment status
az deployment group list --resource-group rg-hike-planner-dev

# Get deployment outputs
az deployment group show \
  --resource-group rg-hike-planner-dev \
  --name hike-planner-dev-YYYYMMDD-HHMMSS \
  --query properties.outputs
```

### Option 2: Terraform Deployment

#### 1. Validate Configuration

```bash
# Validate Terraform templates
./scripts/validate.sh --environment dev --type terraform
```

#### 2. Deploy Infrastructure

```bash
# Deploy using Terraform
./scripts/deploy.sh \
  --environment dev \
  --resource-group rg-hike-planner-dev \
  --method terraform \
  --location eastus
```

#### 3. View Terraform State

```bash
cd infrastructure/terraform
terraform output
```

## 🔧 Configuration

### Environment Variables

After deployment, update your application with the following environment variables:

```bash
# Get Cosmos DB endpoint
COSMOS_ENDPOINT=$(az cosmosdb show --name <cosmos-account-name> --resource-group <resource-group> --query documentEndpoint -o tsv)

# Get Key Vault URI
KEYVAULT_URI=$(az keyvault show --name <keyvault-name> --resource-group <resource-group> --query properties.vaultUri -o tsv)

# Get Storage Account name
STORAGE_NAME=$(az storage account list --resource-group <resource-group> --query '[0].name' -o tsv)
```

### Application Settings

The deployment automatically configures the following for your App Service:

```json
{
  "NODE_ENV": "production",
  "AZURE_COSMOS_DB_ENDPOINT": "<cosmos-endpoint>",
  "AZURE_COSMOS_DB_DATABASE": "<cosmos-database-name>", 
  "AZURE_COSMOS_DB_KEY": "@Microsoft.KeyVault(SecretUri=<keyvault-secret-uri>)",
  "WEBSITE_NODE_DEFAULT_VERSION": "~18",
  "SCM_DO_BUILD_DURING_DEPLOYMENT": "true"
}
```

### Budget Alerts Configuration

Phase 2 includes multi-tier budget monitoring:

- **50% threshold**: Monitor alert - Email notification for cost awareness
- **80% threshold**: Investigate alert - Time to review resource usage  
- **100% threshold**: Emergency alert - Immediate action required

Default budget amounts by environment:
- **Development**: $25/month
- **Staging**: $50/month 
- **Production**: $100/month

Configure the alert email in parameter files:
```json
{
  "budgetAlertEmail": {
    "value": "your-email@domain.com"
  }
}
```

## 📊 Cost Management

### Environment Costs (Estimated Monthly - Phase 1-2)

| Environment | Cosmos DB | App Service Plan | Key Vault | Budget Alerts | Total |
|-------------|-----------|------------------|-----------|---------------|-------|
| **Development** | $0-20 (serverless) | $150 (S3) | $5 | $0 | **~$155-175** |
| **Staging** | $60 (1000 RU/s) | $150 (S3) | $5 | $0 | **~$215** |  
| **Production** | $60 (1000 RU/s) | $150 (S3) | $5 | $0 | **~$215** |

### Optimization Opportunities (For Demo)

| Resource | Current | Optimal | Savings |
|----------|---------|---------|---------|
| **Cosmos DB** | 1000 RU/s Provisioned | Serverless | ~$35/month |
| **App Service Plan** | Standard S3 | Basic B2 | ~$120/month |
| **Total Potential Savings** | | | **~$155/month (72%)** |

### Cost Protection Features

1. **Budget Alerts**: Multi-tier monitoring (50%, 80%, 100% thresholds)
2. **Email Notifications**: Automatic alerts when costs exceed thresholds  
3. **Enhanced Tagging**: Resource cost attribution and optimization tracking
4. **Emergency Procedures**: Documented cleanup processes for cost overruns

### Cost Optimization Tips

1. **Right-size App Service**: Standard S3 → Basic B2 for most workloads
2. **Serverless Cosmos DB**: Switch from provisioned to serverless for variable workloads
3. **Environment Scheduling**: Shut down non-prod environments outside business hours
4. **Resource Monitoring**: Use budget alerts to catch cost spikes early
5. **Tagging Strategy**: Implement consistent tagging for cost attribution

## 🧪 Testing the Deployment

### 1. Health Check

```bash
# Get App Service URL
APP_URL=$(az webapp show --name <app-service-name> --resource-group <resource-group> --query defaultHostName -o tsv)

# Test health endpoint
curl https://$APP_URL/health
```

### 2. Database Connectivity

```bash
# Run integration tests
cd tests/integration/azure
npm test -- --testPathPattern=cosmos-db.test.ts
```

### 3. Performance Benchmarks

```bash
# Run performance tests
cd tests/performance
npx ts-node cosmos-db-benchmark.ts
```

## 🔐 Security Configuration

### 1. Key Vault Access

```bash
# Grant additional users access to Key Vault
az keyvault set-policy \
  --name <keyvault-name> \
  --upn user@domain.com \
  --secret-permissions get list
```

### 2. Cosmos DB Security

```bash
# Enable IP firewall (production)
az cosmosdb update \
  --name <cosmos-account-name> \
  --resource-group <resource-group> \
  --ip-range-filter "0.0.0.0/0"  # Replace with your IP ranges
```

### 3. App Service Security

```bash
# Configure custom domain and SSL
az webapp config hostname add \
  --webapp-name <app-service-name> \
  --resource-group <resource-group> \
  --hostname your-domain.com
```

## 🔄 CI/CD Integration

### GitHub Actions Setup

1. **Service Principal Creation**
   ```bash
   az ad sp create-for-rbac --name "hike-planner-deploy" \
     --role contributor \
     --scopes /subscriptions/<subscription-id>/resourceGroups/<resource-group> \
     --sdk-auth
   ```

2. **GitHub Secrets**
   Add the following secrets to your GitHub repository:
   - `AZURE_CREDENTIALS` - Service principal JSON
   - `AZURE_SUBSCRIPTION_ID` - Your subscription ID
   - `AZURE_RESOURCE_GROUP` - Target resource group

3. **Workflow Example**
   ```yaml
   name: Deploy to Azure
   on:
     push:
       branches: [main]
   
   jobs:
     deploy:
       runs-on: ubuntu-latest
       steps:
       - uses: actions/checkout@v3
       - uses: azure/login@v1
         with:
           creds: ${{ secrets.AZURE_CREDENTIALS }}
       - name: Deploy Infrastructure
         run: |
           ./scripts/deploy.sh \
             --environment prod \
             --resource-group ${{ secrets.AZURE_RESOURCE_GROUP }}
   ```

## 🛠️ Troubleshooting

### Common Issues

#### 1. Cosmos DB Free Tier Limit
**Error**: `Free tier account already exists`
**Solution**: Only one free tier Cosmos DB per subscription. Use `--free-tier false` for additional deployments.

#### 2. Resource Name Conflicts
**Error**: `Storage account name not available`
**Solution**: Resource names are globally unique. The deployment script adds random suffixes to avoid conflicts.

#### 3. Key Vault Access Denied
**Error**: `Access denied to Key Vault`
**Solution**: Ensure proper permissions and wait for RBAC propagation (up to 10 minutes).

#### 4. App Service Startup Issues
**Error**: `Application failed to start`
**Solution**: Check Application Insights logs and ensure environment variables are correctly configured.

### Diagnostic Commands

```bash
# Check resource group resources
az resource list --resource-group <resource-group> --output table

# Check Cosmos DB status
az cosmosdb show --name <cosmos-account> --resource-group <resource-group>

# Check App Service logs
az webapp log tail --name <app-service> --resource-group <resource-group>

# Check Key Vault access policies
az keyvault show --name <keyvault> --resource-group <resource-group> --query properties.accessPolicies
```

### Cleanup and Teardown

```bash
# Remove all resources
./scripts/teardown.sh \
  --environment dev \
  --resource-group rg-hike-planner-dev

# Force removal without confirmation
./scripts/teardown.sh \
  --environment dev \
  --resource-group rg-hike-planner-dev \
  --force
```

## 📞 Support

### Getting Help

1. **Azure Documentation**: [Azure Cosmos DB Documentation](https://docs.microsoft.com/azure/cosmos-db/)
2. **GitHub Issues**: Create an issue in the repository for application-specific problems
3. **Azure Support**: Use Azure Support portal for infrastructure issues

### Monitoring and Alerts

1. **Application Insights Dashboard**: Monitor application performance
2. **Azure Monitor**: Set up custom alerts for resource usage
3. **Cost Management**: Monitor spending and set budget alerts

## 📚 Additional Resources

- [Azure Cosmos DB Best Practices](https://docs.microsoft.com/azure/cosmos-db/best-practices)
- [App Service Deployment Best Practices](https://docs.microsoft.com/azure/app-service/deploy-best-practices)
- [Azure Key Vault Security](https://docs.microsoft.com/azure/key-vault/general/security-overview)
- [Infrastructure as Code with Bicep](https://docs.microsoft.com/azure/azure-resource-manager/bicep/)

---

**Last Updated**: Phase 1 Implementation  
**Version**: 1.0.0  
**Maintained by**: Hike Planner Development Team