variable "environment" {
  description = "The environment name (dev, staging, prod)"
  type        = string
  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "Environment must be one of: dev, staging, prod."
  }
}

variable "location" {
  description = "The Azure region for resources"
  type        = string
  default     = "eastus"
}

variable "app_name" {
  description = "The application name prefix"
  type        = string
  default     = "hike-planner"
}

# Cosmos DB configuration
variable "enable_cosmos_db_free_tier" {
  description = "Enable free tier for Cosmos DB (only one per subscription)"
  type        = bool
  default     = false
}

variable "cosmos_db_throughput_mode" {
  description = "Cosmos DB throughput mode"
  type        = string
  default     = "provisioned"
  validation {
    condition     = contains(["provisioned", "serverless"], var.cosmos_db_throughput_mode)
    error_message = "Throughput mode must be either 'provisioned' or 'serverless'."
  }
}

variable "cosmos_db_min_throughput" {
  description = "Minimum throughput for provisioned mode"
  type        = number
  default     = 1000
}

variable "cosmos_db_max_throughput" {
  description = "Maximum throughput for autoscale"
  type        = number
  default     = 4000
}

variable "tags" {
  description = "Common tags for all resources"
  type        = map(string)
  default = {
    Application = "HikePlanner"
    CostCenter  = "Demo"
    Project     = "Agentic Hike Planner"
    Phase       = "5"
  }
}

# Log Analytics configuration
variable "log_retention_days" {
  description = "Log Analytics retention in days (INTENTIONALLY INEFFICIENT: 730 days)"
  type        = number
  default     = 730
}

variable "daily_log_quota_gb" {
  description = "Daily log quota in GB (INTENTIONALLY INEFFICIENT: 5GB/day)"
  type        = number
  default     = 5
}

# Phase 5 feature flags
variable "enable_phase5_services" {
  description = "Enable Phase 5 services (Application Gateway, Premium Functions, CDN, etc.)"
  type        = bool
  default     = true
}

variable "enable_application_gateway" {
  description = "Enable Application Gateway (INTENTIONALLY INEFFICIENT)"
  type        = bool
  default     = true
}

variable "enable_premium_functions" {
  description = "Enable Premium Functions EP1 (INTENTIONALLY INEFFICIENT)"
  type        = bool
  default     = true
}

variable "enable_cdn" {
  description = "Enable Azure CDN Premium (INTENTIONALLY INEFFICIENT)"
  type        = bool
  default     = true
}

variable "enable_load_testing" {
  description = "Enable Load Testing continuous execution (INTENTIONALLY INEFFICIENT)"
  type        = bool
  default     = true
}

variable "enable_key_vault_premium" {
  description = "Enable Key Vault Premium with HSM (INTENTIONALLY INEFFICIENT)"
  type        = bool
  default     = true
}

# Application Gateway configuration
variable "app_gateway_min_capacity" {
  description = "Minimum capacity for Application Gateway (INTENTIONALLY INEFFICIENT: 2)"
  type        = number
  default     = 2
}

variable "app_gateway_max_capacity" {
  description = "Maximum capacity for Application Gateway"
  type        = number
  default     = 5
}

# Premium Functions configuration
variable "functions_min_instances" {
  description = "Minimum always-ready instances for Premium Functions (INTENTIONALLY INEFFICIENT: 2)"
  type        = number
  default     = 2
}

variable "functions_max_scale" {
  description = "Maximum scale for Premium Functions"
  type        = number
  default     = 20
}