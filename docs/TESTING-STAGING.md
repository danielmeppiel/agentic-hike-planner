# Staging Environment Testing Guide

## App Service Plan Cost Optimization Testing

This document describes the staging environment testing procedure for the App Service Plan cost optimization (S3 → B2).

## Prerequisites

Before testing in staging, ensure you have:

1. **Azure CLI installed and authenticated**
   ```bash
   az --version
   az login
   az account show
   ```

2. **Appropriate Azure permissions**
   - Contributor or Owner role on the staging resource group
   - Permission to create and modify App Service Plans

3. **Azure subscription with budget alerts configured**
   - Prevent unexpected costs during testing

## Testing Procedure

### Phase 1: Deploy Inefficient Configuration

1. **Create or use existing staging resource group**
   ```bash
   RESOURCE_GROUP="rg-hike-planner-staging"
   LOCATION="westus2"
   
   # Create if it doesn't exist
   az group create --name $RESOURCE_GROUP --location $LOCATION
   ```

2. **Deploy the inefficient App Service Plan (S3)**
   ```bash
   ./scripts/deploy-appservice-demo.sh \
     --environment staging \
     --resource-group $RESOURCE_GROUP
   ```

3. **Verify deployment**
   ```bash
   # Get the App Service Plan name from deployment output
   APP_SERVICE_PLAN=$(az resource list \
     --resource-group $RESOURCE_GROUP \
     --resource-type "Microsoft.Web/serverfarms" \
     --query "[0].name" -o tsv)
   
   echo "App Service Plan: $APP_SERVICE_PLAN"
   
   # Verify SKU is S3
   az appservice plan show \
     --name $APP_SERVICE_PLAN \
     --resource-group $RESOURCE_GROUP \
     --query "sku" --output table
   ```

   **Expected Output:**
   ```
   Name    Tier        Size    Family    Capacity
   ------  ----------  ------  --------  ----------
   S3      Standard    S3      S         1
   ```

4. **Check baseline metrics** (optional - wait 5-10 minutes for metrics)
   ```bash
   # Check if App Service is responding
   APP_SERVICE=$(az resource list \
     --resource-group $RESOURCE_GROUP \
     --resource-type "Microsoft.Web/sites" \
     --query "[0].name" -o tsv)
   
   APP_URL=$(az webapp show \
     --name $APP_SERVICE \
     --resource-group $RESOURCE_GROUP \
     --query "defaultHostName" -o tsv)
   
   echo "App Service URL: https://$APP_URL"
   curl -I https://$APP_URL
   ```

### Phase 2: Run Optimization

1. **Execute the optimization script**
   ```bash
   ./scripts/optimize-appservice-plan.sh \
     --resource-group $RESOURCE_GROUP \
     --plan-name $APP_SERVICE_PLAN \
     --target-sku B2
   ```

2. **Expected behavior during optimization:**
   - Script displays configuration summary
   - Confirmation prompt (unless --yes flag used)
   - 2-3 minutes downtime during scaling
   - Success message with validation steps

3. **Monitor the optimization** (in a separate terminal)
   ```bash
   # Watch the App Service Plan status
   watch -n 5 "az appservice plan show \
     --name $APP_SERVICE_PLAN \
     --resource-group $RESOURCE_GROUP \
     --query '{name:name, sku:sku.name, state:status}' -o table"
   ```

### Phase 3: Validate Optimization

1. **Verify SKU change**
   ```bash
   az appservice plan show \
     --name $APP_SERVICE_PLAN \
     --resource-group $RESOURCE_GROUP \
     --query "sku" --output table
   ```

   **Expected Output:**
   ```
   Name    Tier      Size    Family    Capacity
   ------  --------  ------  --------  ----------
   B2      Basic     B2      B         1
   ```

2. **Verify App Service is running**
   ```bash
   az webapp show \
     --name $APP_SERVICE \
     --resource-group $RESOURCE_GROUP \
     --query "state" -o tsv
   ```

   **Expected Output:** `Running`

3. **Test application functionality**
   ```bash
   # Check if the app is responding
   curl -I https://$APP_URL
   
   # Expected: HTTP 200 or 404 (depending on deployment status)
   # Should NOT be connection refused or timeout
   ```

4. **Verify cost tags are present**
   ```bash
   az appservice plan show \
     --name $APP_SERVICE_PLAN \
     --resource-group $RESOURCE_GROUP \
     --query "tags" -o json
   ```

   **Expected tags:**
   ```json
   {
     "Application": "HikePlanner",
     "CostCenter": "Demo",
     "CostOptimization": "Inefficient-Demo",
     "Environment": "staging",
     "OptimalSku": "B2",
     "WastageReason": "Standard-S3-vs-Basic-B2"
   }
   ```

### Phase 4: Performance Validation

1. **Monitor CPU and Memory (wait 10-15 minutes for metrics)**
   ```bash
   # CPU metrics
   az monitor metrics list \
     --resource $(az appservice plan show \
       --name $APP_SERVICE_PLAN \
       --resource-group $RESOURCE_GROUP \
       --query id -o tsv) \
     --metric CpuPercentage \
     --start-time $(date -u -d '15 minutes ago' +%Y-%m-%dT%H:%M:%SZ) \
     --interval PT1M \
     --query "value[].{time:timestamp,cpu:average}" -o table
   ```

2. **Check for any errors**
   ```bash
   # Check App Service logs
   az webapp log tail \
     --name $APP_SERVICE \
     --resource-group $RESOURCE_GROUP
   ```

### Phase 5: Cost Verification

1. **Check current day costs** (may take 24 hours to reflect)
   ```bash
   az consumption usage list \
     --start-date $(date -u +%Y-%m-%d) \
     --end-date $(date -u +%Y-%m-%d)
   ```

2. **Verify budget alerts are working**
   ```bash
   az consumption budget list \
     --resource-group $RESOURCE_GROUP
   ```

### Phase 6: Cleanup (Optional)

If testing is complete and you want to remove resources:

```bash
# Delete the entire resource group
az group delete \
  --name $RESOURCE_GROUP \
  --yes \
  --no-wait

# Or just delete the App Service and Plan
az webapp delete --name $APP_SERVICE --resource-group $RESOURCE_GROUP
az appservice plan delete --name $APP_SERVICE_PLAN --resource-group $RESOURCE_GROUP --yes
```

## Automated Testing

For automated end-to-end testing, use the test script:

```bash
# Run full test with cleanup
./scripts/test-appservice-optimization.sh \
  --environment staging \
  --resource-group rg-hike-planner-test-$(date +%s) \
  --cleanup
```

This script automates all phases and validates:
- ✅ Deployment succeeds
- ✅ Initial SKU is S3
- ✅ Optimization succeeds
- ✅ Final SKU is B2
- ✅ App Service remains running

## Success Criteria

The staging test is considered successful if:

| Criteria | Expected Result | Status |
|----------|----------------|---------|
| **Deployment** | S3 plan deploys without errors | ⬜ |
| **Initial SKU** | Verified as Standard S3 | ⬜ |
| **Optimization** | Completes in 2-5 minutes | ⬜ |
| **Final SKU** | Verified as Basic B2 | ⬜ |
| **Downtime** | 2-3 minutes (acceptable) | ⬜ |
| **App Service State** | Remains "Running" after optimization | ⬜ |
| **HTTP Response** | Application responds to requests | ⬜ |
| **No Errors** | No deployment or runtime errors | ⬜ |
| **Cost Tags** | Proper tags applied | ⬜ |
| **Cost Reduction** | Shows up in Cost Management (24-48h) | ⬜ |

## Troubleshooting

### Issue: Deployment fails with quota error

**Solution:** Check subscription quotas
```bash
az vm list-usage --location westus2 --output table
```

### Issue: Optimization takes longer than 5 minutes

**Solution:** Check App Service Plan status
```bash
az appservice plan show \
  --name $APP_SERVICE_PLAN \
  --resource-group $RESOURCE_GROUP \
  --query "{name:name,status:status,sku:sku.name}"
```

### Issue: App Service doesn't respond after optimization

**Solution:** Restart the App Service
```bash
az webapp restart \
  --name $APP_SERVICE \
  --resource-group $RESOURCE_GROUP
```

### Issue: Can't see cost changes in Cost Management

**Solution:** 
- Wait 24-48 hours for billing data to refresh
- Check the specific date range in Azure Portal > Cost Management
- Use Azure Cost Management API for programmatic access

## Test Results Template

Document your test results here:

```
Test Date: YYYY-MM-DD
Tester: [Name]
Environment: staging
Resource Group: [rg-name]

Phase 1 - Deployment:
  [ ] S3 plan deployed successfully
  [ ] Tags applied correctly
  [ ] App Service created

Phase 2 - Optimization:
  [ ] Script executed without errors
  [ ] Downtime: [X] minutes
  [ ] Optimization completed

Phase 3 - Validation:
  [ ] SKU changed to B2
  [ ] App Service running
  [ ] HTTP responses working

Phase 4 - Performance:
  [ ] CPU usage: [X]%
  [ ] Memory usage: [X]%
  [ ] No performance degradation

Phase 5 - Cost:
  [ ] Budget alerts configured
  [ ] Cost tracking enabled

Overall Result: PASS / FAIL
Notes: [Any observations or issues]
```

## Next Steps After Successful Testing

1. ✅ Document test results
2. ✅ Update PR with test outcomes
3. ✅ Request code review
4. ✅ Plan production rollout (if applicable)
5. ✅ Share findings with team

---

**Remember:** Always test in staging before production, and keep resources running only as long as needed to avoid unnecessary costs!
