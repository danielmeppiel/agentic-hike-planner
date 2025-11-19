#!/bin/bash

# App Service Plan Cost Optimization Script
# This script downsizes an App Service Plan from Standard S3 to Basic B2 for cost savings

set -euo pipefail

# Default values
RESOURCE_GROUP=""
APP_SERVICE_PLAN_NAME=""
TARGET_SKU="B2"
DRY_RUN=false
SKIP_CONFIRMATION=false

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
App Service Plan Cost Optimization Script

This script downsizes an App Service Plan from Standard S3 to Basic B2,
providing ~$120/month in cost savings (80% reduction).

Usage: ./scripts/optimize-appservice-plan.sh [OPTIONS]

Options:
    -g, --resource-group       Resource group name [required]
    -n, --plan-name           App Service Plan name [required]
    -s, --target-sku          Target SKU [default: B2]
    -d, --dry-run             Show what would be done without making changes
    -y, --yes                 Skip confirmation prompt
    -h, --help                Show this help message

Examples:
    # Show what would be optimized (dry run)
    ./scripts/optimize-appservice-plan.sh -g rg-hike-planner-dev -n hike-planner-plan-dev-abc123 --dry-run

    # Optimize App Service Plan (with confirmation)
    ./scripts/optimize-appservice-plan.sh -g rg-hike-planner-dev -n hike-planner-plan-dev-abc123

    # Optimize without confirmation prompt
    ./scripts/optimize-appservice-plan.sh -g rg-hike-planner-dev -n hike-planner-plan-dev-abc123 -y

Cost Savings:
    Current:  Standard S3 - $150/month (4 cores, 7GB RAM)
    Target:   Basic B2     - $30/month  (2 cores, 3.5GB RAM)
    Savings:  $120/month   (80% reduction)

Downtime:
    Expected downtime: 2-3 minutes during the scaling operation

Risk Level: Low
    - B2 tier provides adequate resources for development workloads
    - Can easily scale back up if needed
    - Basic tier has fewer features than Standard (no auto-scaling, limited custom domains)

EOF
}

# Parse command line arguments
parse_args() {
    while [[ ${#} -gt 0 ]]; do
        case $1 in
            -g|--resource-group)
                RESOURCE_GROUP="$2"
                shift 2
                ;;
            -n|--plan-name)
                APP_SERVICE_PLAN_NAME="$2"
                shift 2
                ;;
            -s|--target-sku)
                TARGET_SKU="$2"
                shift 2
                ;;
            -d|--dry-run)
                DRY_RUN=true
                shift
                ;;
            -y|--yes)
                SKIP_CONFIRMATION=true
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

    if [[ -z "$APP_SERVICE_PLAN_NAME" ]]; then
        log_error "App Service Plan name is required. Use -n or --plan-name"
        exit 1
    fi

    if [[ ! "$TARGET_SKU" =~ ^(B1|B2|B3)$ ]]; then
        log_error "Target SKU must be one of: B1, B2, B3"
        exit 1
    fi
}

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."

    # Check if Azure CLI is installed
    if ! command -v az &> /dev/null; then
        log_error "Azure CLI is required but not installed. Please install it first."
        exit 1
    fi

    # Check if logged in to Azure
    if ! az account show &> /dev/null; then
        log_error "Not logged in to Azure. Please run 'az login' first."
        exit 1
    fi

    log_success "Prerequisites check passed"
}

# Get current App Service Plan details
get_current_plan_details() {
    log_info "Retrieving current App Service Plan details..."

    if ! az appservice plan show \
        --name "$APP_SERVICE_PLAN_NAME" \
        --resource-group "$RESOURCE_GROUP" \
        --output json > /tmp/app-service-plan.json 2>&1; then
        log_error "Failed to retrieve App Service Plan details. Please verify the resource group and plan name."
        exit 1
    fi

    local current_sku=$(jq -r '.sku.name' /tmp/app-service-plan.json)
    local current_tier=$(jq -r '.sku.tier' /tmp/app-service-plan.json)
    local current_capacity=$(jq -r '.sku.capacity' /tmp/app-service-plan.json)
    local current_size=$(jq -r '.sku.size' /tmp/app-service-plan.json)

    log_success "Current configuration:"
    log_info "  SKU: $current_sku"
    log_info "  Tier: $current_tier"
    log_info "  Capacity: $current_capacity"
    log_info "  Size: $current_size"

    # Check if already at target SKU
    if [[ "$current_sku" == "$TARGET_SKU" ]]; then
        log_warning "App Service Plan is already at target SKU: $TARGET_SKU"
        log_info "No optimization needed."
        exit 0
    fi

    rm -f /tmp/app-service-plan.json
}

# Show optimization details
show_optimization_details() {
    log_info ""
    log_info "=== Optimization Details ==="
    log_info ""
    log_info "Resource Group:      $RESOURCE_GROUP"
    log_info "App Service Plan:    $APP_SERVICE_PLAN_NAME"
    log_info "Target SKU:          $TARGET_SKU"
    log_info ""
    log_info "Cost Impact:"
    log_info "  Current (S3):      ~\$150/month"
    log_info "  Target (B2):       ~\$30/month"
    log_info "  Monthly Savings:   ~\$120 (80% reduction)"
    log_info ""
    log_info "Resource Changes:"
    log_info "  CPU Cores:         4 → 2"
    log_info "  Memory:            7GB → 3.5GB"
    log_info "  Auto-scaling:      Yes → No"
    log_info "  Staging slots:     5 → 0"
    log_info ""
    log_info "Risk Assessment:"
    log_info "  Risk Level:        Low"
    log_info "  Expected Downtime: 2-3 minutes"
    log_info "  Rollback:          Easy (can scale back up anytime)"
    log_info ""
}

# Perform the optimization
optimize_plan() {
    if [[ "$DRY_RUN" == true ]]; then
        log_info "[DRY RUN] Would execute the following command:"
        log_info "az appservice plan update \\"
        log_info "  --name $APP_SERVICE_PLAN_NAME \\"
        log_info "  --resource-group $RESOURCE_GROUP \\"
        log_info "  --sku $TARGET_SKU"
        log_success "[DRY RUN] Optimization simulation completed"
        return 0
    fi

    # Confirm with user unless -y flag is set
    if [[ "$SKIP_CONFIRMATION" == false ]]; then
        log_warning "This operation will:"
        log_warning "  1. Scale down the App Service Plan"
        log_warning "  2. Cause 2-3 minutes of downtime"
        log_warning "  3. Remove Standard tier features (auto-scaling, staging slots)"
        log_info ""
        read -p "Do you want to proceed? (yes/no): " confirm
        if [[ ! "$confirm" =~ ^[Yy][Ee][Ss]$ ]]; then
            log_info "Operation cancelled by user"
            exit 0
        fi
    fi

    log_info "Starting optimization..."

    if az appservice plan update \
        --name "$APP_SERVICE_PLAN_NAME" \
        --resource-group "$RESOURCE_GROUP" \
        --sku "$TARGET_SKU" \
        --output table; then
        log_success "✅ App Service Plan optimized successfully!"
        log_info ""
        log_info "Next steps:"
        log_info "  1. Wait 24-48 hours for cost changes to reflect in Azure Cost Management"
        log_info "  2. Monitor application performance to ensure adequate resources"
        log_info "  3. Update monitoring baselines for the new tier"
        log_info "  4. Document the optimization for future reference"
        log_info ""
        log_info "To verify the change:"
        log_info "  az appservice plan show \\"
        log_info "    --name $APP_SERVICE_PLAN_NAME \\"
        log_info "    --resource-group $RESOURCE_GROUP \\"
        log_info "    --query 'sku' --output table"
    else
        log_error "Failed to optimize App Service Plan"
        exit 1
    fi
}

# Main execution
main() {
    parse_args "$@"
    validate_inputs
    check_prerequisites
    get_current_plan_details
    show_optimization_details
    optimize_plan

    if [[ "$DRY_RUN" == false ]]; then
        log_success ""
        log_success "🎉 Cost optimization completed successfully!"
        log_success "Estimated monthly savings: \$120 (80% reduction)"
    fi
}

# Run main function if script is executed directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
