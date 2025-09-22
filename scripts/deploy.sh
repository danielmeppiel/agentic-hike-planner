#!/bin/bash

# Azure Hike Planner Deployment Script
# This script deploys the Azure infrastructure using Bicep templates

set -euo pipefail

# Default values
ENVIRONMENT="dev"
LOCATION="eastus"
APP_NAME="hike-planner"
RESOURCE_GROUP=""
SUBSCRIPTION_ID=""
DEPLOYMENT_METHOD="bicep"
TEMPLATE_TYPE="standard"
DRY_RUN=false
ENABLE_FREE_TIER=false

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
Azure Hike Planner Deployment Script

Usage: $0 [OPTIONS]

Options:
    -e, --environment    Environment name (dev/staging/prod) [default: dev]
    -l, --location       Azure region [default: eastus]
    -a, --app-name       Application name prefix [default: hike-planner]
    -g, --resource-group Resource group name [required]
    -s, --subscription   Azure subscription ID [optional]
    -m, --method         Deployment method (bicep/terraform) [default: bicep]
    -t, --template       Template type (standard/finops-demo/minimal) [default: standard]
    -f, --free-tier      Enable Cosmos DB free tier [default: false]
    -d, --dry-run        Validate templates without deploying [default: false]
    -h, --help           Show this help message

Environment Variables:
    BUDGET_ALERT_EMAIL   Email address for budget alerts [optional]
                        If not set, will use value from parameter file

Examples:
    # Deploy to dev environment
    $0 --environment dev --resource-group rg-hike-planner-dev

    # Deploy to production with specific settings
    $0 --environment prod --resource-group rg-hike-planner-prod --location westus2

    # Validate templates only
    $0 --environment dev --resource-group rg-hike-planner-dev --dry-run

    # Deploy using Terraform
    $0 --environment dev --resource-group rg-hike-planner-dev --method terraform

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
            -m|--method)
                DEPLOYMENT_METHOD="$2"
                shift 2
                ;;
            -t|--template)
                TEMPLATE_TYPE="$2"
                shift 2
                ;;
            -f|--free-tier)
                ENABLE_FREE_TIER=true
                shift
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

    if [[ ! "$DEPLOYMENT_METHOD" =~ ^(bicep|terraform)$ ]]; then
        log_error "Deployment method must be one of: bicep, terraform"
        exit 1
    fi

    if [[ ! "$TEMPLATE_TYPE" =~ ^(standard|finops-demo|minimal)$ ]]; then
        log_error "Template type must be one of: standard, finops-demo, minimal"
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

    # Check if Terraform is installed (if using Terraform)
    if [[ "$DEPLOYMENT_METHOD" == "terraform" ]]; then
        if ! command -v terraform &> /dev/null; then
            log_error "Terraform is required but not installed. Please install it first."
            exit 1
        fi
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
            CostCenter="Demo"
        log_success "Resource group created successfully"
    else
        log_info "Resource group already exists"
    fi
}

# Deploy using Bicep
deploy_bicep() {
    local script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
    local bicep_dir="$script_dir/../infrastructure/bicep"
    
    # Select template file based on template type
    local template_file
    local parameters_file
    case "$TEMPLATE_TYPE" in
        "finops-demo")
            template_file="$bicep_dir/main-finops-demo.bicep"
            parameters_file="$bicep_dir/parameters/${ENVIRONMENT}-finops-demo.json"
            ;;
        "minimal")
            template_file="$bicep_dir/main-minimal.bicep"
            parameters_file="$bicep_dir/parameters/${ENVIRONMENT}.json"
            ;;
        "standard")
            template_file="$bicep_dir/main.bicep"
            parameters_file="$bicep_dir/parameters/${ENVIRONMENT}.json"
            ;;
    esac
    
    log_info "Deploying infrastructure using Bicep..."
    
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
    local deployment_name="hike-planner-${ENVIRONMENT}-$(date +%Y%m%d-%H%M%S)"
    
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
    
    # Override parameters if specified
    if [[ "$ENABLE_FREE_TIER" == true ]]; then
        deploy_cmd="$deploy_cmd --parameters enableCosmosDbFreeTier=true"
    fi
    
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
            log_info "Deployment outputs:"
            az deployment group show --resource-group "$RESOURCE_GROUP" --name "$deployment_name" --query properties.outputs
        fi
    else
        log_error "Bicep deployment failed"
        exit 1
    fi
}

# Deploy using Terraform
deploy_terraform() {
    local script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
    local terraform_dir="$script_dir/../infrastructure/terraform"
    
    log_info "Deploying infrastructure using Terraform..."
    
    # Change to Terraform directory
    cd "$terraform_dir"
    
    # Initialize Terraform
    log_info "Initializing Terraform..."
    terraform init
    
    # Create Terraform variables file
    local vars_file="terraform.tfvars"
    cat > "$vars_file" << EOF
environment = "$ENVIRONMENT"
location = "$LOCATION"
app_name = "$APP_NAME"
enable_cosmos_db_free_tier = $ENABLE_FREE_TIER
EOF
    
    # Plan or apply
    if [[ "$DRY_RUN" == true ]]; then
        log_info "Creating Terraform plan..."
        terraform plan -var-file="$vars_file"
        log_success "Terraform plan completed successfully"
    else
        log_info "Applying Terraform configuration..."
        terraform apply -var-file="$vars_file" -auto-approve
        
        if [[ $? -eq 0 ]]; then
            log_success "Terraform deployment completed successfully"
            
            # Show outputs
            log_info "Deployment outputs:"
            terraform output
        else
            log_error "Terraform deployment failed"
            exit 1
        fi
    fi
    
    # Clean up
    rm -f "$vars_file"
}

# Main deployment function
deploy() {
    log_info "Starting deployment with the following configuration:"
    log_info "  Environment: $ENVIRONMENT"
    log_info "  Location: $LOCATION"
    log_info "  App Name: $APP_NAME"
    log_info "  Resource Group: $RESOURCE_GROUP"
    log_info "  Deployment Method: $DEPLOYMENT_METHOD"
    log_info "  Template Type: $TEMPLATE_TYPE"
    log_info "  Free Tier: $ENABLE_FREE_TIER"
    log_info "  Dry Run: $DRY_RUN"
    
    check_prerequisites
    set_subscription
    create_resource_group
    
    if [[ "$DEPLOYMENT_METHOD" == "bicep" ]]; then
        deploy_bicep
    else
        deploy_terraform
    fi
    
    if [[ "$DRY_RUN" == false ]]; then
        log_success "Deployment completed successfully!"
        log_info ""
        log_info "Next steps:"
        if [[ "$TEMPLATE_TYPE" == "finops-demo" ]]; then
            log_info "1. Review the intentionally inefficient configuration for cost optimization opportunities"
            log_info "2. Use the deployed infrastructure to demonstrate FinOps analysis"
            log_info "3. Deploy your application code to the created Container Apps"
            log_info "4. Run cost optimization analysis tools"
        else
            log_info "1. Update your application's environment variables with the deployed resource information"
            log_info "2. Deploy your application code to the created infrastructure"
            log_info "3. Configure your frontend application"
            log_info "4. Test the deployed infrastructure"
        fi
    fi
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