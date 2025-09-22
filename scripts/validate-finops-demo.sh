#!/bin/bash

# Azure Hike Planner FinOps Demo Validation Script
# This script validates the intentionally inefficient Bicep template for cost optimization demonstration

set -euo pipefail

# Default values
ENVIRONMENT="dev"
RESOURCE_GROUP=""
VERBOSE=false

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
    cat << EOF
Azure Hike Planner FinOps Demo Validation Script

This script validates the intentionally inefficient infrastructure template
designed for cost optimization demonstrations.

Usage: $0 [OPTIONS]

Options:
    -e, --environment    Environment name (dev/staging/prod) [default: dev]
    -g, --resource-group Resource group name for validation [required]
    -v, --verbose        Enable verbose output [default: false]
    -h, --help           Show this help message

Examples:
    # Validate FinOps demo template
    $0 --resource-group rg-hike-planner-dev

    # Validate with verbose output
    $0 --resource-group rg-hike-planner-dev --verbose

EOF
}

# Parse command line arguments
parse_args() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            -e|--environment)
                ENVIRONMENT="$2"
                shift 2
                ;;
            -g|--resource-group)
                RESOURCE_GROUP="$2"
                shift 2
                ;;
            -v|--verbose)
                VERBOSE=true
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
    if [[ ! "$ENVIRONMENT" =~ ^(dev|staging|prod)$ ]]; then
        log_error "Environment must be one of: dev, staging, prod"
        exit 1
    fi

    if [[ -z "$RESOURCE_GROUP" ]]; then
        log_error "Resource group is required for validation"
        show_help
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

    # Check if resource group exists
    if ! az group show --name "$RESOURCE_GROUP" &> /dev/null; then
        log_error "Resource group '$RESOURCE_GROUP' not found. Please create it first."
        exit 1
    fi

    log_success "Prerequisites check passed"
}

# Validate FinOps demo template
validate_finops_demo() {
    local script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
    local bicep_dir="$script_dir/../infrastructure/bicep"
    local validation_failed=false
    
    log_info "Validating FinOps Demo Bicep template..."
    
    # Validate main FinOps demo template
    local main_template="$bicep_dir/main-finops-demo.bicep"
    local parameters_file="$bicep_dir/parameters/${ENVIRONMENT}-finops-demo.json"
    
    if [[ ! -f "$main_template" ]]; then
        log_error "FinOps demo template not found: $main_template"
        return 1
    fi
    
    if [[ ! -f "$parameters_file" ]]; then
        log_error "Parameters file not found: $parameters_file"
        return 1
    fi
    
    log_info "Validating main-finops-demo.bicep with $ENVIRONMENT parameters..."
    
    # Bicep build validation
    if az bicep build --file "$main_template" --outfile "/tmp/main-finops-demo.json" &> /dev/null; then
        log_success "Bicep build validation passed"
    else
        log_error "Bicep build validation failed"
        if [[ "$VERBOSE" == true ]]; then
            az bicep build --file "$main_template" --outfile "/tmp/main-finops-demo.json"
        fi
        validation_failed=true
    fi
    
    # Template syntax validation
    if az deployment group validate \
        --resource-group "$RESOURCE_GROUP" \
        --template-file "$main_template" \
        --parameters "@$parameters_file" \
        --only-show-errors &> /dev/null; then
        log_success "FinOps demo template validation passed"
    else
        log_error "FinOps demo template validation failed"
        if [[ "$VERBOSE" == true ]]; then
            az deployment group validate \
                --resource-group "$RESOURCE_GROUP" \
                --template-file "$main_template" \
                --parameters "@$parameters_file"
        fi
        validation_failed=true
    fi
    
    # Validate Container Apps module
    local container_apps_module="$bicep_dir/modules/container-apps.bicep"
    
    if [[ -f "$container_apps_module" ]]; then
        log_info "Validating container-apps.bicep module..."
        
        if az bicep build --file "$container_apps_module" --outfile "/tmp/container-apps.json" &> /dev/null; then
            log_success "Container Apps module validation passed"
        else
            log_error "Container Apps module validation failed"
            if [[ "$VERBOSE" == true ]]; then
                az bicep build --file "$container_apps_module" --outfile "/tmp/container-apps.json"
            fi
            validation_failed=true
        fi
    fi
    
    # Clean up temporary files
    rm -f /tmp/main-finops-demo.json /tmp/container-apps.json
    
    if [[ "$validation_failed" == true ]]; then
        return 1
    fi
    
    return 0
}

# Display cost optimization summary
show_cost_summary() {
    log_info ""
    log_info "=== FinOps Demo Cost Optimization Summary ==="
    log_info ""
    log_info "Intentionally Inefficient Configuration (Monthly Costs):"
    log_info "  📊 Cosmos DB (Provisioned 1000 RU/s):     \$60"
    log_info "  🚀 Container Apps (Dedicated D4):         \$450"
    log_info "  💾 Storage Accounts (3x Hot tier):        \$45"
    log_info "  🗄️  Redis Cache (Unnecessary):             \$45"
    log_info "  🔐 Key Vault (Standard tier):             \$15"
    log_info "  📈 Log Analytics (50GB daily quota):      \$250"
    log_info "  ➕ Total Inefficient:                     \$865"
    log_info ""
    log_info "Optimized Configuration (Monthly Costs):"
    log_info "  📊 Cosmos DB (Serverless):                \$25"
    log_info "  🚀 Container Apps (Consumption):          \$50"
    log_info "  💾 Storage Account (1x with lifecycle):   \$15"
    log_info "  🗄️  Redis Cache (Removed):                \$0"
    log_info "  🔐 Key Vault (Basic tier):                \$5"
    log_info "  📈 Log Analytics (Free tier):             \$5"
    log_info "  ➕ Total Optimized:                       \$100"
    log_info ""
    log_success "💰 Potential Monthly Savings: \$765 (88% reduction)"
    log_info ""
    log_info "Top Optimization Opportunities:"
    log_info "  1. Switch to Container Apps Consumption plan"
    log_info "  2. Use Cosmos DB serverless mode"
    log_info "  3. Consolidate storage accounts"
    log_info "  4. Remove unnecessary Redis cache"
    log_info "  5. Reduce Log Analytics quota"
    log_info ""
}

# Main validation function
validate() {
    log_info "Starting FinOps Demo template validation:"
    log_info "  Environment: $ENVIRONMENT"
    log_info "  Resource Group: $RESOURCE_GROUP"
    log_info "  Verbose: $VERBOSE"
    log_info ""
    
    check_prerequisites
    
    local validation_passed=true
    
    # Validate FinOps demo template
    if ! validate_finops_demo; then
        validation_passed=false
    fi
    
    if [[ "$validation_passed" == true ]]; then
        log_success "🎉 FinOps Demo template validation passed successfully!"
        show_cost_summary
        log_info "Template is ready for deployment to demonstrate cost optimization opportunities."
        exit 0
    else
        log_error "❌ Validation failed!"
        log_error "Please fix the issues above before deploying."
        exit 1
    fi
}

# Main script execution
main() {
    parse_args "$@"
    validate_inputs
    validate
}

# Run main function if script is executed directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi