#!/bin/bash

# App Service Plan Cost Optimization Demo Deployment Script
# This script deploys an intentionally inefficient App Service Plan (S3) for demonstration purposes

set -euo pipefail

# Default values
ENVIRONMENT="staging"
LOCATION="westus2"
APP_NAME="hike-planner"
RESOURCE_GROUP=""
SUBSCRIPTION_ID=""
DRY_RUN=false

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
App Service Plan Cost Optimization Demo Deployment Script

This script deploys an intentionally inefficient App Service Plan (Standard S3)
to demonstrate cost optimization opportunities.

Usage: ./scripts/deploy-appservice-demo.sh [OPTIONS]

Options:
    -e, --environment    Environment name (dev/staging/prod) [default: staging]
    -l, --location       Azure region [default: westus2]
    -a, --app-name       Application name prefix [default: hike-planner]
    -g, --resource-group Resource group name [required]
    -s, --subscription   Azure subscription ID [optional]
    -d, --dry-run        Validate templates without deploying [default: false]
    -h, --help           Show this help message

Environment Variables:
    BUDGET_ALERT_EMAIL   Email address for budget alerts [optional]

Examples:
    # Deploy to staging environment (recommended for testing)
    ./scripts/deploy-appservice-demo.sh --environment staging --resource-group rg-hike-planner-staging

    # Deploy to dev environment
    ./scripts/deploy-appservice-demo.sh --environment dev --resource-group rg-hike-planner-dev

    # Validate templates only
    ./scripts/deploy-appservice-demo.sh --environment staging --resource-group rg-hike-planner-staging --dry-run

Demo Purpose:
    This deployment creates:
    - App Service Plan: Standard S3 ($150/month) - INTENTIONALLY INEFFICIENT
    - App Service: Basic Node.js API
    - Budget Alerts: Cost monitoring

    After deployment, you can demonstrate cost optimization by:
    1. Analyzing the inefficient configuration
    2. Running: scripts/optimize-appservice-plan.sh
    3. Showing $120/month savings (80% reduction)

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
            -l|--location)
                LOCATION="$2"
                shift 2
                ;;
            -a|--app-name)
                APP_NAME="$2"
                shift 2
                ;;
            -g|--resource-group)
                RESOURCE_GROUP="$2"
                shift 2
                ;;
            -s|--subscription)
                SUBSCRIPTION_ID="$2"
                shift 2
                ;;
            -d|--dry-run)
                DRY_RUN=true
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

# Set Azure subscription
set_subscription() {
    if [[ -n "$SUBSCRIPTION_ID" ]]; then
        log_info "Setting Azure subscription to: $SUBSCRIPTION_ID"
        az account set --subscription "$SUBSCRIPTION_ID"
    fi
    
    local current_subscription=$(az account show --query name -o tsv)
    log_info "Using Azure subscription: $current_subscription"
}

# Create resource group if it doesn't exist
create_resource_group() {
    log_info "Checking resource group: $RESOURCE_GROUP"
    
    if ! az group show --name "$RESOURCE_GROUP" &> /dev/null; then
        log_info "Creating resource group: $RESOURCE_GROUP"
        az group create --name "$RESOURCE_GROUP" --location "$LOCATION" --tags \
            Environment="$ENVIRONMENT" \
            Application="HikePlanner" \
            CostCenter="Demo" \
            Purpose="CostOptimizationDemo"
        log_success "Resource group created successfully"
    else
        log_info "Resource group already exists"
    fi
}

# Deploy using Bicep
deploy_bicep() {
    local script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
    local bicep_dir="$script_dir/../infrastructure/bicep"
    
    local template_file="$bicep_dir/demo-appservice-inefficient.bicep"
    local parameters_file="$bicep_dir/parameters/${ENVIRONMENT}-appservice-demo.json"
    
    log_info "Deploying App Service Plan demo infrastructure using Bicep..."
    
    # Check if template files exist
    if [[ ! -f "$template_file" ]]; then
        log_error "Bicep template not found: $template_file"
        exit 1
    fi
    
    if [[ ! -f "$parameters_file" ]]; then
        log_error "Parameters file not found: $parameters_file"
        exit 1
    fi
    
    # Create deployment name with timestamp
    local deployment_name="appservice-demo-${ENVIRONMENT}-$(date +%Y%m%d-%H%M%S)"
    
    # Prepare deployment command
    local deploy_cmd="az deployment group"
    
    if [[ "$DRY_RUN" == true ]]; then
        deploy_cmd="$deploy_cmd validate"
        log_info "Validating Bicep template..."
    else
        deploy_cmd="$deploy_cmd create"
        log_info "Deploying Bicep template..."
    fi
    
    # Add common parameters
    deploy_cmd="$deploy_cmd --resource-group $RESOURCE_GROUP"
    deploy_cmd="$deploy_cmd --name $deployment_name"
    deploy_cmd="$deploy_cmd --template-file $template_file"
    deploy_cmd="$deploy_cmd --parameters @$parameters_file"
    
    # Override budget alert email if environment variable is set
    if [[ -n "${BUDGET_ALERT_EMAIL:-}" ]]; then
        deploy_cmd="$deploy_cmd --parameters budgetAlertEmail='$BUDGET_ALERT_EMAIL'"
        log_info "Using budget alert email from environment variable"
    fi
    
    # Execute deployment
    if eval "$deploy_cmd"; then
        if [[ "$DRY_RUN" == true ]]; then
            log_success "Bicep template validation completed successfully"
        else
            log_success "Bicep deployment completed successfully"
            
            # Show deployment outputs
            log_info ""
            log_info "Deployment outputs:"
            az deployment group show --resource-group "$RESOURCE_GROUP" --name "$deployment_name" --query properties.outputs --output json | jq .
            
            # Get App Service Plan name for optimization script
            local app_service_plan_name=$(az deployment group show --resource-group "$RESOURCE_GROUP" --name "$deployment_name" --query 'properties.outputs.appServicePlanName.value' -o tsv)
            
            log_info ""
            log_success "=== Demo Infrastructure Deployed ==="
            log_info ""
            log_info "Inefficient Configuration (Current):"
            log_info "  ✓ App Service Plan: Standard S3 ($150/month)"
            log_info "  ✓ App Service: Node.js API"
            log_info "  ✓ Budget Alerts: Enabled"
            log_info ""
            log_info "Next Steps for Cost Optimization Demo:"
            log_info ""
            log_info "1. Verify the deployed resources:"
            log_info "   az appservice plan show \\"
            log_info "     --name $app_service_plan_name \\"
            log_info "     --resource-group $RESOURCE_GROUP \\"
            log_info "     --query 'sku' --output table"
            log_info ""
            log_info "2. Run cost optimization:"
            log_info "   ./scripts/optimize-appservice-plan.sh \\"
            log_info "     --resource-group $RESOURCE_GROUP \\"
            log_info "     --plan-name $app_service_plan_name"
            log_info ""
            log_info "3. Expected savings: \$120/month (80% reduction)"
            log_info ""
            log_warning "⚠️  This is an INTENTIONALLY INEFFICIENT configuration for demo purposes"
            log_warning "    Remember to run the optimization script or delete resources after testing"
            log_info ""
        fi
    else
        log_error "Bicep deployment failed"
        exit 1
    fi
}

# Main deployment function
deploy() {
    log_info "Starting App Service Plan cost optimization demo deployment:"
    log_info "  Environment: $ENVIRONMENT"
    log_info "  Location: $LOCATION"
    log_info "  App Name: $APP_NAME"
    log_info "  Resource Group: $RESOURCE_GROUP"
    log_info "  Dry Run: $DRY_RUN"
    log_info ""
    
    check_prerequisites
    set_subscription
    create_resource_group
    deploy_bicep
}

# Main script execution
main() {
    parse_args "$@"
    validate_inputs
    deploy
}

# Run main function if script is executed directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
