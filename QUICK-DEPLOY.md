# Quick Deployment Guide

## 🎯 Deployment Options

The Agentic Hike Planner provides three deployment templates to meet different needs:

### 1. FinOps Demo Template (Recommended for Cost Optimization)
**Purpose**: Intentionally inefficient infrastructure for FinOps demonstrations
**Template**: `main-finops-demo.bicep`
**Monthly Cost**: ~$865 (inefficient) → ~$100 (optimized) = **88% savings potential**

**Resources**: Cosmos DB (1000 RU/s), Container Apps (D4 dedicated), 3x Storage Accounts, Redis Cache, Log Analytics (50GB quota)

```bash
# Validate FinOps demo template
./scripts/validate-finops-demo.sh --resource-group rg-hike-planner-dev --verbose

# Deploy FinOps demo infrastructure
./scripts/deploy.sh \
  --environment dev \
  --resource-group rg-hike-planner-dev \
  --template finops-demo
```

### 2. Minimal Template (Cost-Effective Testing)
**Purpose**: Basic infrastructure for development and testing
**Template**: `main-minimal.bicep`
**Monthly Cost**: ~$100

**Resources**: Cosmos DB (serverless), Key Vault, Budget Alerts

```bash
# Deploy minimal infrastructure
./scripts/deploy.sh \
  --environment dev \
  --resource-group rg-hike-planner-dev \
  --template minimal \
  --free-tier
```

### 3. Standard Template (Production-Ready)
**Purpose**: Production-ready infrastructure with Container Apps
**Template**: `main.bicep`
**Monthly Cost**: ~$200

**Resources**: Cosmos DB, Container Apps, Key Vault, Budget Alerts

```bash
# Deploy standard infrastructure
./scripts/deploy.sh \
  --environment dev \
  --resource-group rg-hike-planner-dev \
  --template standard
```

## 🚀 Quick Start Commands

### Prerequisites
```bash
# Login to Azure
az login

# Set subscription (if multiple)
az account set --subscription "your-subscription-id"

# Create resource group
az group create --name rg-hike-planner-dev --location eastus
```

### Deploy FinOps Demo (Recommended)
```bash
# 1. Validate template
./scripts/validate-finops-demo.sh --resource-group rg-hike-planner-dev

# 2. Deploy infrastructure (dry-run first)
./scripts/deploy.sh \
  --environment dev \
  --resource-group rg-hike-planner-dev \
  --template finops-demo \
  --dry-run

# 3. Deploy infrastructure (actual deployment)
./scripts/deploy.sh \
  --environment dev \
  --resource-group rg-hike-planner-dev \
  --template finops-demo

# 4. View cost optimization summary
az deployment group show \
  --resource-group rg-hike-planner-dev \
  --name hike-planner-dev-* \
  --query properties.outputs.fiNOpsDemoSummary.value
```

### Clean Up Resources
```bash
# Remove all resources
./scripts/teardown.sh \
  --environment dev \
  --resource-group rg-hike-planner-dev \
  --force
```

## 📊 Template Comparison

| Aspect | FinOps Demo | Minimal | Standard |
|--------|-------------|---------|----------|
| **Purpose** | Cost optimization demo | Basic testing | Production-ready |
| **Monthly Cost** | $865 (intentionally inefficient) | $100 | $200 |
| **Optimization Potential** | 88% savings ($765) | Optimized | Balanced |
| **Resources** | 10+ services | 3 services | 5 services |
| **Complexity** | High (intentional) | Low | Medium |
| **Use Case** | FinOps training | Development | Production |

## 🎓 Learning Objectives

### FinOps Demo Template
- Demonstrates 9 common Azure cost inefficiencies
- Shows realistic optimization opportunities
- Provides quantified savings potential
- Includes detailed cost analysis outputs
- Perfect for FinOps training and workshops

### Key Optimization Lessons
1. **Container Apps**: Dedicated → Consumption plans
2. **Cosmos DB**: Provisioned → Serverless mode
3. **Storage**: Multiple accounts → Single with lifecycle policies
4. **Monitoring**: Expensive Log Analytics → Free tier
5. **Caching**: Redundant Redis → Remove unnecessary resources

## 🔧 Troubleshooting

### Common Issues
- **App Service Quota**: Use Container Apps templates instead
- **Cosmos DB Free Tier**: Only one per subscription
- **Resource Names**: Global uniqueness handled by scripts
- **Permissions**: Ensure Contributor role on subscription/RG

### Get Help
```bash
# View script help
./scripts/deploy.sh --help
./scripts/validate-finops-demo.sh --help
./scripts/teardown.sh --help

# Check deployment status
az deployment group list --resource-group rg-hike-planner-dev
```

---

**Choose your deployment template based on your goals:**
- 🎯 **FinOps Demo**: Learn cost optimization
- ⚡ **Minimal**: Quick testing
- 🏗️ **Standard**: Production deployment