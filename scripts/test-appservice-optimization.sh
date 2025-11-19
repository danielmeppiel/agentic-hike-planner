#!/bin/bash

# App Service Plan Cost Optimization Test Script
# This script tests the deployment and optimization workflow

set -euo pipefail

# Default values
ENVIRONMENT="staging"
RESOURCE_GROUP=""
CLEANUP=false

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Help function
show_help() {
    cat << 'EOF'
App Service Plan Cost Optimization Test Script

This script validates the end-to-end workflow:
1. Deploys inefficient App Service Plan (S3)
2. Verifies the deployment
3. Runs optimization to B2
4. Validates the optimization
5. Optionally cleans up resources

Usage: ./scripts/test-appservice-optimization.sh [OPTIONS]

Options:
    -e, --environment    Environment name (dev/staging/prod) [default: staging]
    -g, --resource-group Resource group name [required]
    -c, --cleanup        Delete resources after test [default: false]
    -h, --help           Show this help message

Examples:
    # Run full test in staging
    ./scripts/test-appservice-optimization.sh --environment staging --resource-group rg-hike-planner-test

    # Run test with cleanup
    ./scripts/test-appservice-optimization.sh --environment staging --resource-group rg-hike-planner-test --cleanup

EOF
}

# Parse command line arguments
parse_args() {
    while [[ ${#} -gt 0 ]]; do
        case $1 in
            -e|--environment)
                ENVIRONMENT="$2"
                shift 2
                ;;
            -g|--resource-group)
                RESOURCE_GROUP="$2"
                shift 2
                ;;
            -c|--cleanup)
                CLEANUP=true
                shift
                ;;
            -h|--help)
                show_help
                exit 0
                ;;
            *)
                log_error "Unknown option: $1"
                show_help
                exit 1
                ;;
        esac
    done
}

# Validate inputs
validate_inputs() {
    if [[ -z "$RESOURCE_GROUP" ]]; then
        log_error "Resource group name is required. Use -g or --resource-group"
        exit 1
    fi

    if [[ ! "$ENVIRONMENT" =~ ^(dev|staging|prod)$ ]]; then
        log_error "Environment must be one of: dev, staging, prod"
        exit 1
    fi
}

# Test Phase 1: Deploy inefficient configuration
test_deployment() {
    log_info ""
    log_info "=== Phase 1: Testing Deployment ==="
    log_info ""

    local script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
    
    log_info "Deploying inefficient App Service Plan (S3)..."
    
    if "$script_dir/deploy-appservice-demo.sh" \
        --environment "$ENVIRONMENT" \
        --resource-group "$RESOURCE_GROUP"; then
        log_success "✅ Deployment test passed"
    else
        log_error "❌ Deployment test failed"
        return 1
    fi
}

# Test Phase 2: Verify deployment
test_verification() {
    log_info ""
    log_info "=== Phase 2: Verifying Deployment ==="
    log_info ""

    # Get App Service Plan name
    local app_service_plan_name=$(az resource list \
        --resource-group "$RESOURCE_GROUP" \
        --resource-type "Microsoft.Web/serverfarms" \
        --query "[0].name" -o tsv)

    if [[ -z "$app_service_plan_name" ]]; then
        log_error "❌ App Service Plan not found"
        return 1
    fi

    log_info "Found App Service Plan: $app_service_plan_name"

    # Verify SKU is S3
    local current_sku=$(az appservice plan show \
        --name "$app_service_plan_name" \
        --resource-group "$RESOURCE_GROUP" \
        --query "sku.name" -o tsv)

    if [[ "$current_sku" == "S3" ]]; then
        log_success "✅ Verification passed: SKU is S3 (inefficient configuration)"
    else
        log_error "❌ Verification failed: Expected S3, got $current_sku"
        return 1
    fi

    # Store for next phase
    echo "$app_service_plan_name" > /tmp/test-app-service-plan-name.txt
}

# Test Phase 3: Run optimization
test_optimization() {
    log_info ""
    log_info "=== Phase 3: Testing Optimization ==="
    log_info ""

    local app_service_plan_name=$(cat /tmp/test-app-service-plan-name.txt)
    local script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

    log_info "Optimizing App Service Plan from S3 to B2..."

    if "$script_dir/optimize-appservice-plan.sh" \
        --resource-group "$RESOURCE_GROUP" \
        --plan-name "$app_service_plan_name" \
        --yes; then
        log_success "✅ Optimization test passed"
    else
        log_error "❌ Optimization test failed"
        return 1
    fi
}

# Test Phase 4: Validate optimization
test_validation() {
    log_info ""
    log_info "=== Phase 4: Validating Optimization ==="
    log_info ""

    local app_service_plan_name=$(cat /tmp/test-app-service-plan-name.txt)

    # Verify SKU is now B2
    local current_sku=$(az appservice plan show \
        --name "$app_service_plan_name" \
        --resource-group "$RESOURCE_GROUP" \
        --query "sku.name" -o tsv)

    if [[ "$current_sku" == "B2" ]]; then
        log_success "✅ Validation passed: SKU is B2 (optimized configuration)"
    else
        log_error "❌ Validation failed: Expected B2, got $current_sku"
        return 1
    fi

    # Verify App Service is still running
    local app_service_name=$(az resource list \
        --resource-group "$RESOURCE_GROUP" \
        --resource-type "Microsoft.Web/sites" \
        --query "[0].name" -o tsv)

    if [[ -n "$app_service_name" ]]; then
        local app_service_state=$(az webapp show \
            --name "$app_service_name" \
            --resource-group "$RESOURCE_GROUP" \
            --query "state" -o tsv)

        if [[ "$app_service_state" == "Running" ]]; then
            log_success "✅ App Service is running correctly after optimization"
        else
            log_warning "⚠️  App Service state: $app_service_state (may be normal if no code deployed)"
        fi
    fi

    rm -f /tmp/test-app-service-plan-name.txt
}

# Cleanup resources
cleanup_resources() {
    if [[ "$CLEANUP" == false ]]; then
        log_info ""
        log_info "Skipping cleanup (use --cleanup to delete resources)"
        return 0
    fi

    log_info ""
    log_info "=== Phase 5: Cleanup ==="
    log_info ""

    log_warning "Deleting resource group: $RESOURCE_GROUP"
    
    if az group delete \
        --name "$RESOURCE_GROUP" \
        --yes \
        --no-wait; then
        log_success "✅ Cleanup initiated (deletion in progress)"
    else
        log_error "❌ Cleanup failed"
        return 1
    fi
}

# Show test summary
show_summary() {
    log_info ""
    log_info "=== Test Summary ==="
    log_info ""
    log_success "✅ All tests passed successfully!"
    log_info ""
    log_info "Validated Workflow:"
    log_info "  1. ✓ Deployed inefficient App Service Plan (S3 - \$150/month)"
    log_info "  2. ✓ Verified deployment configuration"
    log_info "  3. ✓ Optimized to Basic B2 (\$30/month)"
    log_info "  4. ✓ Validated optimization"
    log_info ""
    log_info "Cost Impact:"
    log_info "  Monthly Savings: \$120 (80% reduction)"
    log_info "  Risk Level: Low"
    log_info "  Implementation Effort: 1 day"
    log_info ""
    
    if [[ "$CLEANUP" == false ]]; then
        log_warning "⚠️  Test resources are still running in: $RESOURCE_GROUP"
        log_info "To clean up manually:"
        log_info "  az group delete --name $RESOURCE_GROUP --yes"
    fi
}

# Main test execution
main() {
    parse_args "$@"
    validate_inputs

    log_info "Starting App Service Plan Cost Optimization Tests"
    log_info "  Environment: $ENVIRONMENT"
    log_info "  Resource Group: $RESOURCE_GROUP"
    log_info "  Cleanup: $CLEANUP"

    local test_failed=false

    # Run all test phases
    if ! test_deployment; then test_failed=true; fi
    if ! test_verification; then test_failed=true; fi
    if ! test_optimization; then test_failed=true; fi
    if ! test_validation; then test_failed=true; fi
    
    if [[ "$test_failed" == true ]]; then
        log_error ""
        log_error "❌ Some tests failed. See errors above."
        exit 1
    fi

    show_summary
    cleanup_resources

    exit 0
}

# Run main function if script is executed directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
