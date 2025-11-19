# App Service Plan Cost Optimization Guide

## Overview

This guide demonstrates how to optimize Azure App Service Plan costs by right-sizing from an over-provisioned Standard S3 tier to a more appropriate Basic B2 tier, achieving **$120/month in savings** (80% reduction).

## 💰 Cost Impact Summary

| Configuration | Monthly Cost | Cores | RAM | Auto-scaling | Staging Slots |
|--------------|--------------|-------|-----|--------------|---------------|
| **Current (S3)** | $150 | 4 | 7GB | ✅ Yes | 5 |
| **Optimized (B2)** | $30 | 2 | 3.5GB | ❌ Manual | 0 |
| **Savings** | **$120** | -2 | -3.5GB | Feature reduction | Feature reduction |
| **% Reduction** | **80%** | -50% | -50% | - | - |

## 🎯 Use Case

This optimization is ideal for:
- **Development environments** with light API load
- **Non-production workloads** that don't require auto-scaling
- **Simple APIs** that don't need staging slots
- **Small-scale applications** with predictable load patterns

## 📋 Prerequisites

- Azure CLI installed and configured
- Access to the Azure subscription
- Appropriate permissions to modify App Service Plans
- Basic understanding of Azure App Service tiers

## 🚀 Quick Start

### Step 1: Deploy Inefficient Configuration (Demo)

Deploy an intentionally over-provisioned App Service Plan for demonstration:

```bash
# Deploy to staging environment (recommended for testing)
./scripts/deploy-appservice-demo.sh \
  --environment staging \
  --resource-group rg-hike-planner-staging
```

This creates:
- **App Service Plan**: Standard S3 (4 cores, 7GB RAM) - $150/month
- **App Service**: Node.js API placeholder
- **Budget Alerts**: Cost monitoring

### Step 2: Verify Current Configuration

Check the current App Service Plan SKU:

```bash
# Replace with your actual plan name and resource group
az appservice plan show \
  --name hike-planner-plan-staging-abc123 \
  --resource-group rg-hike-planner-staging \
  --query "sku" --output table
```

Expected output:
```
Name    Tier        Size    Family    Capacity
------  ----------  ------  --------  ----------
S3      Standard    S3      S         1
```

### Step 3: Run Cost Optimization

Execute the optimization script to downsize the plan:

```bash
# With confirmation prompt
./scripts/optimize-appservice-plan.sh \
  --resource-group rg-hike-planner-staging \
  --plan-name hike-planner-plan-staging-abc123

# Or without confirmation (automated)
./scripts/optimize-appservice-plan.sh \
  --resource-group rg-hike-planner-staging \
  --plan-name hike-planner-plan-staging-abc123 \
  --yes
```

### Step 4: Validate Optimization

Verify the SKU has changed to B2:

```bash
az appservice plan show \
  --name hike-planner-plan-staging-abc123 \
  --resource-group rg-hike-planner-staging \
  --query "sku" --output table
```

Expected output:
```
Name    Tier      Size    Family    Capacity
------  --------  ------  --------  ----------
B2      Basic     B2      B         1
```

## 🧪 Automated Testing

Run the complete end-to-end test workflow:

```bash
# Run full test with cleanup
./scripts/test-appservice-optimization.sh \
  --environment staging \
  --resource-group rg-hike-planner-test \
  --cleanup
```

This test validates:
1. ✅ Deployment of inefficient configuration (S3)
2. ✅ Verification of deployment
3. ✅ Optimization to B2
4. ✅ Validation of optimization
5. ✅ Optional cleanup

## 📊 Detailed Cost Analysis

### Monthly Cost Breakdown

| Component | S3 Cost | B2 Cost | Savings |
|-----------|---------|---------|---------|
| Base Plan | $150 | $30 | $120 |
| **Total** | **$150** | **$30** | **$120** |

### Annual Impact

- **Annual Savings**: $1,440
- **3-Year Savings**: $4,320
- **ROI**: Immediate (sub-minute implementation)

## ⚠️ Risk Assessment

### Risk Level: **LOW**

| Factor | Assessment |
|--------|------------|
| **Downtime** | 2-3 minutes during scaling |
| **Performance Impact** | Minimal for dev/staging workloads |
| **Rollback Complexity** | Easy - can scale back up anytime |
| **Data Loss Risk** | None |
| **Service Impact** | Limited to brief restart |

### Considerations

**✅ Safe to proceed if:**
- Application is in development/staging environment
- Current CPU/Memory utilization is <50%
- No auto-scaling requirements
- No staging slots in use
- Acceptable to have 2-3 minutes downtime

**⚠️ Proceed with caution if:**
- Production environment with high availability requirements
- Application frequently needs auto-scaling
- Using staging slots for blue/green deployments
- Zero-downtime requirement

**🛑 Do NOT proceed if:**
- Production critical application with SLA
- Application regularly uses >80% CPU/Memory
- Requires more than 2 cores for performance
- Active staging slot deployments in progress

## 🔄 Rollback Procedure

If you need to revert the optimization:

```bash
# Scale back up to S3
az appservice plan update \
  --name hike-planner-plan-staging-abc123 \
  --resource-group rg-hike-planner-staging \
  --sku S3
```

**Rollback Time**: 2-3 minutes  
**Data Impact**: None  
**Downtime**: Brief restart during scaling

## 📈 Monitoring After Optimization

### Key Metrics to Monitor

1. **CPU Utilization**
   ```bash
   az monitor metrics list \
     --resource /subscriptions/{sub}/resourceGroups/{rg}/providers/Microsoft.Web/serverfarms/{plan} \
     --metric CpuPercentage \
     --start-time 2024-01-01T00:00:00Z \
     --end-time 2024-01-02T00:00:00Z
   ```

2. **Memory Utilization**
   ```bash
   az monitor metrics list \
     --resource /subscriptions/{sub}/resourceGroups/{rg}/providers/Microsoft.Web/serverfarms/{plan} \
     --metric MemoryPercentage \
     --start-time 2024-01-01T00:00:00Z \
     --end-time 2024-01-02T00:00:00Z
   ```

3. **HTTP Response Times**
   - Monitor average response time
   - Check for increased latency
   - Verify no timeout errors

### Acceptable Thresholds (B2 Tier)

- **CPU**: Should remain <70% under normal load
- **Memory**: Should remain <75% under normal load
- **Response Time**: Should not increase by >20%

If metrics exceed these thresholds, consider:
- Optimizing application code
- Scaling to B3 tier (4 cores, 7GB, $60/month)
- Reviewing for memory leaks or inefficient queries

## 🔧 Advanced Configuration

### Dry Run Mode

Test the optimization without making changes:

```bash
./scripts/optimize-appservice-plan.sh \
  --resource-group rg-hike-planner-staging \
  --plan-name hike-planner-plan-staging-abc123 \
  --dry-run
```

### Custom Target SKU

Optimize to a different Basic tier:

```bash
# Scale to B1 (1 core, 1.75GB, $15/month) - maximum savings
./scripts/optimize-appservice-plan.sh \
  --resource-group rg-hike-planner-staging \
  --plan-name hike-planner-plan-staging-abc123 \
  --target-sku B1

# Scale to B3 (4 cores, 7GB, $60/month) - balanced option
./scripts/optimize-appservice-plan.sh \
  --resource-group rg-hike-planner-staging \
  --plan-name hike-planner-plan-staging-abc123 \
  --target-sku B3
```

## 📋 Validation Checklist

After optimization, verify:

- [ ] App Service Plan SKU is B2 (or target tier)
- [ ] All App Services are running
- [ ] Application responds to HTTP requests
- [ ] No error logs in Application Insights
- [ ] CPU/Memory metrics are within acceptable ranges
- [ ] Cost reduction appears in Azure Cost Management (24-48 hours)
- [ ] Monitoring baselines updated for new tier
- [ ] Documentation updated with new configuration

## 🎓 Learning Resources

### Azure App Service Tiers

- **Free**: Development/testing only, no SLA
- **Shared**: Low-cost shared infrastructure
- **Basic (B1-B3)**: Dedicated compute, manual scaling
- **Standard (S1-S3)**: Auto-scaling, staging slots
- **Premium (P1v2-P3v2)**: Enhanced performance, more features

### Cost Optimization Best Practices

1. **Right-size for workload**: Match tier to actual requirements
2. **Use non-production tiers**: Don't pay for prod features in dev/staging
3. **Implement auto-shutdown**: Stop non-prod resources after hours
4. **Monitor regularly**: Review metrics monthly for optimization opportunities
5. **Leverage reserved instances**: 1-3 year commitments for predictable workloads

## 🆘 Troubleshooting

### Issue: Optimization fails with "Plan is already at target SKU"

**Solution**: Check current SKU and adjust target tier:
```bash
az appservice plan show --name {plan} --resource-group {rg} --query "sku.name"
```

### Issue: Application performance degrades after optimization

**Solution**: Monitor metrics and consider intermediate tier:
```bash
# Scale to B3 for better balance
az appservice plan update --name {plan} --resource-group {rg} --sku B3
```

### Issue: Cost reduction doesn't appear in Cost Management

**Solution**: Wait 24-48 hours for billing data to refresh, then check:
```bash
az consumption usage list --start-date 2024-01-01 --end-date 2024-01-31
```

## 📞 Support

For issues or questions:
- **Documentation**: [Azure App Service Pricing](https://azure.microsoft.com/pricing/details/app-service/)
- **GitHub Issues**: Report bugs or feature requests
- **Azure Support**: For Azure-specific issues

---

**Remember**: This optimization demonstrates an 80% cost reduction with minimal risk, making it an excellent candidate for immediate implementation in non-production environments.

**Happy Optimizing! 💰**
