# Scripts Directory

This directory contains automation scripts for deploying, managing, and optimizing Azure infrastructure for the Agentic Hike Planner application.

## 📂 Script Categories

### Deployment Scripts

#### `deploy.sh`
Main deployment script for the application infrastructure.
- Supports Bicep and Terraform deployment methods
- Configurable for dev/staging/prod environments
- Includes dry-run validation mode

**Usage:**
```bash
./scripts/deploy.sh --environment dev --resource-group rg-hike-planner-dev
```

#### `deploy-appservice-demo.sh` ⭐ NEW
Deploys an intentionally inefficient App Service Plan (S3) for cost optimization demonstrations.
- Creates Standard S3 tier ($150/month)
- Includes budget alerts
- Designed for FinOps demos

**Usage:**
```bash
./scripts/deploy-appservice-demo.sh \
  --environment staging \
  --resource-group rg-hike-planner-staging
```

**See:** [Cost Optimization Guide](../docs/cost-optimization-appservice.md)

### Optimization Scripts

#### `optimize-appservice-plan.sh` ⭐ NEW
Optimizes App Service Plan from Standard S3 to Basic B2 for cost savings.
- **Savings:** $120/month (80% reduction)
- **Risk Level:** Low
- **Downtime:** 2-3 minutes

**Usage:**
```bash
./scripts/optimize-appservice-plan.sh \
  --resource-group rg-hike-planner-staging \
  --plan-name hike-planner-plan-staging-abc123
```

**Features:**
- Dry-run mode for safe testing
- Interactive confirmation (can be skipped with --yes)
- Detailed before/after cost analysis
- Automated validation

**See:** [Cost Optimization Guide](../docs/cost-optimization-appservice.md)

### Testing Scripts

#### `test-appservice-optimization.sh` ⭐ NEW
End-to-end automated testing for App Service Plan cost optimization.
- Deploys inefficient configuration (S3)
- Runs optimization (S3 → B2)
- Validates results
- Optional cleanup

**Usage:**
```bash
./scripts/test-appservice-optimization.sh \
  --environment staging \
  --resource-group rg-hike-planner-test \
  --cleanup
```

**Test Coverage:**
1. ✅ Deployment verification
2. ✅ Initial configuration check (S3)
3. ✅ Optimization execution
4. ✅ Final configuration validation (B2)
5. ✅ App Service health check

### Validation Scripts

#### `validate.sh`
Validates Bicep and Terraform templates before deployment.

**Usage:**
```bash
./scripts/validate.sh
```

#### `validate-finops-demo.sh`
Validates the FinOps demonstration templates and configuration.

**Usage:**
```bash
./scripts/validate-finops-demo.sh \
  --resource-group rg-hike-planner-dev \
  --environment dev
```

### Management Scripts

#### `teardown.sh`
Safely deletes Azure resources and cleans up the environment.

**Usage:**
```bash
./scripts/teardown.sh --resource-group rg-hike-planner-dev
```

#### `deploy_phase1.sh`
Deploys infrastructure in phases for controlled rollout.

## 🚀 Quick Start Examples

### Cost Optimization Demo Workflow

Complete workflow for demonstrating cost optimization:

```bash
# 1. Deploy inefficient configuration
./scripts/deploy-appservice-demo.sh \
  --environment staging \
  --resource-group rg-hike-planner-staging

# 2. Get the App Service Plan name from output
APP_PLAN_NAME="hike-planner-plan-staging-abc123"

# 3. Run optimization with dry-run first
./scripts/optimize-appservice-plan.sh \
  --resource-group rg-hike-planner-staging \
  --plan-name $APP_PLAN_NAME \
  --dry-run

# 4. Execute actual optimization
./scripts/optimize-appservice-plan.sh \
  --resource-group rg-hike-planner-staging \
  --plan-name $APP_PLAN_NAME \
  --yes

# 5. Verify the results
az appservice plan show \
  --name $APP_PLAN_NAME \
  --resource-group rg-hike-planner-staging \
  --query "sku" --output table
```

### Automated Testing

Run complete automated test with cleanup:

```bash
./scripts/test-appservice-optimization.sh \
  --environment staging \
  --resource-group rg-hike-planner-test-$(date +%s) \
  --cleanup
```

## 📋 Common Options

Most scripts support these common options:

| Option | Short | Description |
|--------|-------|-------------|
| `--environment` | `-e` | Environment (dev/staging/prod) |
| `--resource-group` | `-g` | Azure resource group name |
| `--location` | `-l` | Azure region (default: westus2) |
| `--dry-run` | `-d` | Validate without making changes |
| `--help` | `-h` | Show help message |

## 🔐 Prerequisites

Before running any scripts:

1. **Azure CLI**
   ```bash
   az --version
   az login
   ```

2. **Appropriate Permissions**
   - Contributor or Owner role on resource group
   - Permission to create/modify resources

3. **Environment Variables** (optional)
   ```bash
   export BUDGET_ALERT_EMAIL="your-email@example.com"
   export AZURE_SUBSCRIPTION_ID="your-subscription-id"
   ```

## 📊 Cost Optimization Matrix

| Script | Purpose | Monthly Impact | Time | Risk |
|--------|---------|---------------|------|------|
| `deploy-appservice-demo.sh` | Deploy inefficient (S3) | +$150 | 5 min | Low |
| `optimize-appservice-plan.sh` | Optimize to B2 | -$120 | 3 min | Low |
| `test-appservice-optimization.sh` | Full test cycle | Net: -$120 | 10 min | Low |

## 🎯 Use Cases

### Scenario 1: FinOps Demo
Demonstrate cost optimization opportunities to stakeholders.

**Steps:**
1. Deploy inefficient infrastructure
2. Show high costs in Azure Portal
3. Run optimization script
4. Show cost reduction

### Scenario 2: Development Environment Optimization
Reduce costs in non-production environments.

**Steps:**
1. Deploy staging with optimization script
2. Monitor performance metrics
3. Apply to other non-prod environments if successful

### Scenario 3: Automated CI/CD Testing
Integrate cost optimization into CI/CD pipeline.

**Steps:**
1. Add test script to GitHub Actions
2. Validate before production deployment
3. Ensure cost-efficient defaults

## 🛠️ Script Development Guidelines

When creating new scripts:

1. **Follow naming conventions**
   - Use kebab-case: `my-new-script.sh`
   - Prefix with category: `deploy-`, `optimize-`, `test-`, `validate-`

2. **Include help message**
   ```bash
   show_help() {
       cat << 'EOF'
   Script Name and Description
   
   Usage: ./scripts/my-script.sh [OPTIONS]
   ...
   EOF
   }
   ```

3. **Use strict mode**
   ```bash
   set -euo pipefail
   ```

4. **Add logging functions**
   ```bash
   log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
   log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
   log_error() { echo -e "${RED}[ERROR]${NC} $1"; }
   ```

5. **Make executable**
   ```bash
   chmod +x scripts/my-script.sh
   ```

## 📚 Documentation

For detailed documentation:

- **Cost Optimization:** [docs/cost-optimization-appservice.md](../docs/cost-optimization-appservice.md)
- **Deployment Guide:** [README-deployment.md](../README-deployment.md)
- **Demo Guide:** [docs/demo.md](../docs/demo.md)
- **Staging Testing:** [docs/TESTING-STAGING.md](../docs/TESTING-STAGING.md)

## 🐛 Troubleshooting

### Common Issues

**Issue:** Script fails with "command not found"
```bash
# Solution: Make script executable
chmod +x scripts/script-name.sh
```

**Issue:** Azure CLI not authenticated
```bash
# Solution: Login to Azure
az login
az account show
```

**Issue:** Permission denied errors
```bash
# Solution: Check Azure RBAC permissions
az role assignment list --assignee $(az account show --query user.name -o tsv)
```

**Issue:** Unbound variable errors
```bash
# Solution: Check required parameters
./scripts/script-name.sh --help
```

## 📞 Support

For issues with scripts:
1. Check the script's `--help` output
2. Review the relevant documentation
3. Open an issue on GitHub
4. Check Azure CLI logs: `az account get-access-token`

---

**Happy Scripting! 🚀**
