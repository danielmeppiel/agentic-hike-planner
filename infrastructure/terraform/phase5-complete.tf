# ============================================================================
# PHASE 5: COMPLETE INEFFICIENT INFRASTRUCTURE IMPLEMENTATION
# ============================================================================
# This file contains all Phase 5 resources for the FinOps cost optimization demo
# All resources are INTENTIONALLY INEFFICIENT to demonstrate optimization opportunities
#
# NOTE: This file is designed to be used together with main_full.tf which provides
# the base resources (azurerm_linux_web_app.main, azurerm_cosmosdb_account.main, etc.)
# ============================================================================

# ============================================================================
# APPLICATION GATEWAY - INTENTIONALLY INEFFICIENT
# Single backend app doesn't need a load balancer - direct routing would be free
# Monthly cost: ~$50
# ============================================================================

# Virtual Network for Application Gateway
resource "azurerm_virtual_network" "phase5" {
  count               = var.enable_phase5_services && var.enable_application_gateway ? 1 : 0
  name                = "${var.app_name}-vnet-${var.environment}"
  location            = var.location
  resource_group_name = data.azurerm_resource_group.main.name
  address_space       = ["10.0.0.0/16"]

  tags = merge(local.common_tags, {
    CostOptimization = "Inefficient-Demo"
    Purpose          = "Unnecessary-Network"
  })
}

resource "azurerm_subnet" "agw" {
  count                = var.enable_phase5_services && var.enable_application_gateway ? 1 : 0
  name                 = "agw-subnet"
  resource_group_name  = data.azurerm_resource_group.main.name
  virtual_network_name = azurerm_virtual_network.phase5[0].name
  address_prefixes     = ["10.0.1.0/24"]
}

resource "azurerm_public_ip" "agw" {
  count               = var.enable_phase5_services && var.enable_application_gateway ? 1 : 0
  name                = "${var.app_name}-agw-pip-${var.environment}"
  location            = var.location
  resource_group_name = data.azurerm_resource_group.main.name
  allocation_method   = "Static"
  sku                 = "Standard"

  tags = merge(local.common_tags, {
    CostOptimization = "Inefficient-Demo"
    Purpose          = "Unnecessary-LoadBalancer"
    MonthlyCost      = "$5"
  })
}

resource "azurerm_application_gateway" "main" {
  count               = var.enable_phase5_services && var.enable_application_gateway ? 1 : 0
  name                = "${var.app_name}-agw-${var.environment}"
  location            = var.location
  resource_group_name = data.azurerm_resource_group.main.name

  sku {
    name     = "Standard_v2" # INTENTIONALLY INEFFICIENT
    tier     = "Standard_v2"
    capacity = var.app_gateway_min_capacity
  }

  gateway_ip_configuration {
    name      = "appGatewayIpConfig"
    subnet_id = azurerm_subnet.agw[0].id
  }

  frontend_port {
    name = "http-port"
    port = 80
  }

  frontend_port {
    name = "https-port"
    port = 443
  }

  frontend_ip_configuration {
    name                 = "appGwPublicFrontendIp"
    public_ip_address_id = azurerm_public_ip.agw[0].id
  }

  backend_address_pool {
    name  = "app-service-backend"
    fqdns = [azurerm_linux_web_app.main.default_hostname]
  }

  backend_http_settings {
    name                                = "https-settings"
    cookie_based_affinity               = "Disabled"
    port                                = 443
    protocol                            = "Https"
    request_timeout                     = 30
    pick_host_name_from_backend_address = true

    probe_name = "health-probe"
  }

  http_listener {
    name                           = "http-listener"
    frontend_ip_configuration_name = "appGwPublicFrontendIp"
    frontend_port_name             = "http-port"
    protocol                       = "Http"
  }

  request_routing_rule {
    name                       = "http-rule"
    priority                   = 100
    rule_type                  = "Basic"
    http_listener_name         = "http-listener"
    backend_address_pool_name  = "app-service-backend"
    backend_http_settings_name = "https-settings"
  }

  probe {
    name                                      = "health-probe"
    protocol                                  = "Https"
    path                                      = "/health"
    interval                                  = 30
    timeout                                   = 30
    unhealthy_threshold                       = 3
    pick_host_name_from_backend_http_settings = true
  }

  tags = merge(local.common_tags, {
    CostOptimization       = "Inefficient-Demo"
    Purpose                = "Unnecessary-LoadBalancer"
    MonthlyCost            = "$50"
    OptimizationPotential  = "Remove completely"
  })
}

# ============================================================================
# PREMIUM FUNCTIONS (EP1) - INTENTIONALLY INEFFICIENT
# Consumption plan would cost <$5/month vs $145/month for EP1
# Monthly cost: ~$145
# ============================================================================

resource "azurerm_storage_account" "functions" {
  count                    = var.enable_phase5_services && var.enable_premium_functions ? 1 : 0
  name                     = "stfunc${var.environment}${local.resource_suffix}"
  resource_group_name      = data.azurerm_resource_group.main.name
  location                 = var.location
  account_tier             = "Standard"
  account_replication_type = "LRS"
  account_kind             = "StorageV2"
  access_tier              = "Hot"

  min_tls_version           = "TLS1_2"
  https_traffic_only_enabled = true

  tags = merge(local.common_tags, {
    CostOptimization = "Inefficient-Demo"
    Purpose          = "Functions-Storage"
  })
}

resource "azurerm_service_plan" "functions" {
  count               = var.enable_phase5_services && var.enable_premium_functions ? 1 : 0
  name                = "${var.app_name}-func-plan-${var.environment}"
  location            = var.location
  resource_group_name = data.azurerm_resource_group.main.name
  os_type             = "Linux"
  sku_name            = "EP1" # INTENTIONALLY INEFFICIENT - Premium Elastic Plan

  tags = merge(local.common_tags, {
    CostOptimization       = "Inefficient-Demo"
    Purpose                = "Premium-When-Consumption-Suffices"
    MonthlyCost            = "$145"
    OptimizationPotential  = "Switch to Consumption - $5/month"
  })
}

resource "azurerm_linux_function_app" "main" {
  count               = var.enable_phase5_services && var.enable_premium_functions ? 1 : 0
  name                = "${var.app_name}-func-${var.environment}"
  location            = var.location
  resource_group_name = data.azurerm_resource_group.main.name
  service_plan_id     = azurerm_service_plan.functions[0].id

  storage_account_name       = azurerm_storage_account.functions[0].name
  storage_account_access_key = azurerm_storage_account.functions[0].primary_access_key

  identity {
    type = "SystemAssigned"
  }

  site_config {
    always_on = true # INTENTIONALLY INEFFICIENT

    application_stack {
      node_version = "18"
    }

    app_scale_limit = var.functions_max_scale
  }

  app_settings = {
    "FUNCTIONS_WORKER_RUNTIME"           = "node"
    "WEBSITE_NODE_DEFAULT_VERSION"       = "~18"
    "AZURE_COSMOS_DB_ENDPOINT"           = azurerm_cosmosdb_account.main.endpoint
    "APPLICATIONINSIGHTS_CONNECTION_STRING" = var.enable_phase5_services ? azurerm_application_insights.phase5[0].connection_string : ""
  }

  tags = merge(local.common_tags, {
    CostOptimization       = "Inefficient-Demo"
    Purpose                = "AI-Processing"
    MonthlyCost            = "$145"
    OptimizationPotential  = "Switch to Consumption - $5/month"
  })
}

# ============================================================================
# AZURE CDN PREMIUM - INTENTIONALLY INEFFICIENT
# Static Web App has built-in CDN, this is completely unnecessary
# Monthly cost: ~$20
# ============================================================================

resource "azurerm_cdn_frontdoor_profile" "main" {
  count               = var.enable_phase5_services && var.enable_cdn ? 1 : 0
  name                = "${var.app_name}-cdn-${var.environment}"
  resource_group_name = data.azurerm_resource_group.main.name
  sku_name            = "Premium_AzureFrontDoor" # INTENTIONALLY INEFFICIENT

  tags = merge(local.common_tags, {
    CostOptimization       = "Inefficient-Demo"
    Purpose                = "Unnecessary-CDN"
    MonthlyCost            = "$20"
    OptimizationPotential  = "Remove - SWA has built-in CDN"
  })
}

resource "azurerm_cdn_frontdoor_endpoint" "main" {
  count                    = var.enable_phase5_services && var.enable_cdn ? 1 : 0
  name                     = "${var.app_name}-endpoint-${var.environment}"
  cdn_frontdoor_profile_id = azurerm_cdn_frontdoor_profile.main[0].id
  enabled                  = true

  tags = merge(local.common_tags, {
    CostOptimization = "Inefficient-Demo"
  })
}

resource "azurerm_cdn_frontdoor_origin_group" "main" {
  count                    = var.enable_phase5_services && var.enable_cdn ? 1 : 0
  name                     = "default-origin-group"
  cdn_frontdoor_profile_id = azurerm_cdn_frontdoor_profile.main[0].id
  session_affinity_enabled = false

  load_balancing {
    sample_size                        = 4
    successful_samples_required        = 3
    additional_latency_in_milliseconds = 50
  }

  health_probe {
    path                = "/"
    request_type        = "HEAD"
    protocol            = "Https"
    interval_in_seconds = 100
  }
}

resource "azurerm_cdn_frontdoor_origin" "main" {
  count                         = var.enable_phase5_services && var.enable_cdn ? 1 : 0
  name                          = "webapp-origin"
  cdn_frontdoor_origin_group_id = azurerm_cdn_frontdoor_origin_group.main[0].id
  enabled                       = true

  certificate_name_check_enabled = true
  host_name                      = azurerm_linux_web_app.main.default_hostname
  origin_host_header             = azurerm_linux_web_app.main.default_hostname
  http_port                      = 80
  https_port                     = 443
  priority                       = 1
  weight                         = 1000
}

resource "azurerm_cdn_frontdoor_route" "main" {
  count                         = var.enable_phase5_services && var.enable_cdn ? 1 : 0
  name                          = "default-route"
  cdn_frontdoor_endpoint_id     = azurerm_cdn_frontdoor_endpoint.main[0].id
  cdn_frontdoor_origin_group_id = azurerm_cdn_frontdoor_origin_group.main[0].id
  cdn_frontdoor_origin_ids      = [azurerm_cdn_frontdoor_origin.main[0].id]
  enabled                       = true

  forwarding_protocol    = "HttpsOnly"
  https_redirect_enabled = true
  patterns_to_match      = ["/*"]
  supported_protocols    = ["Http", "Https"]
}

# ============================================================================
# LOAD TESTING - INTENTIONALLY INEFFICIENT
# Continuous execution when on-demand would suffice
# Monthly cost: ~$25
# ============================================================================

resource "azurerm_load_test" "main" {
  count               = var.enable_phase5_services && var.enable_load_testing ? 1 : 0
  name                = "${var.app_name}-lt-${var.environment}"
  location            = var.location
  resource_group_name = data.azurerm_resource_group.main.name

  identity {
    type = "SystemAssigned"
  }

  tags = merge(local.common_tags, {
    CostOptimization       = "Inefficient-Demo"
    Purpose                = "Continuous-LoadTesting"
    MonthlyCost            = "$25"
    OptimizationPotential  = "On-demand testing - $3/month"
  })
}

# ============================================================================
# APPLICATION INSIGHTS HIGH INGESTION - INTENTIONALLY INEFFICIENT
# 5GB/day ingestion with 730 days retention when 1GB/90 days would suffice
# Monthly cost: ~$120
# ============================================================================

resource "azurerm_log_analytics_workspace" "phase5" {
  count               = var.enable_phase5_services ? 1 : 0
  name                = "${var.app_name}-logs-phase5-${var.environment}"
  location            = var.location
  resource_group_name = data.azurerm_resource_group.main.name
  sku                 = "PerGB2018" # INTENTIONALLY INEFFICIENT
  retention_in_days   = var.log_retention_days
  daily_quota_gb      = var.daily_log_quota_gb

  tags = merge(local.common_tags, {
    CostOptimization       = "Inefficient-Demo"
    Purpose                = "High-Ingestion-Logs"
    MonthlyCost            = "$100"
    OptimizationPotential  = "Reduce daily cap to 1GB - $15/month"
  })
}

resource "azurerm_application_insights" "phase5" {
  count               = var.enable_phase5_services ? 1 : 0
  name                = "${var.app_name}-ai-phase5-${var.environment}"
  location            = var.location
  resource_group_name = data.azurerm_resource_group.main.name
  workspace_id        = azurerm_log_analytics_workspace.phase5[0].id
  application_type    = "web"
  retention_in_days   = var.log_retention_days
  sampling_percentage = 100 # INTENTIONALLY INEFFICIENT - no sampling

  tags = merge(local.common_tags, {
    CostOptimization       = "Inefficient-Demo"
    Purpose                = "High-Ingestion-Telemetry"
    DailyIngestion         = "5GB"
    MonthlyCost            = "$120"
    OptimizationPotential  = "1GB/day with 90 days retention - $15/month"
  })
}

# ============================================================================
# KEY VAULT PREMIUM - INTENTIONALLY INEFFICIENT
# Standard tier would suffice for a demo application
# Monthly cost: ~$15
# ============================================================================

resource "azurerm_key_vault" "premium" {
  count                       = var.enable_phase5_services && var.enable_key_vault_premium ? 1 : 0
  name                        = "${var.app_name}-kvp-${var.environment}-${local.resource_suffix}"
  location                    = var.location
  resource_group_name         = data.azurerm_resource_group.main.name
  tenant_id                   = data.azurerm_client_config.current.tenant_id
  sku_name                    = "premium" # INTENTIONALLY INEFFICIENT
  enabled_for_disk_encryption = true       # INTENTIONALLY INEFFICIENT
  purge_protection_enabled    = true       # INTENTIONALLY INEFFICIENT for demo
  soft_delete_retention_days  = 90         # INTENTIONALLY INEFFICIENT

  enable_rbac_authorization = true

  network_acls {
    default_action = "Allow"
    bypass         = "AzureServices"
  }

  tags = merge(local.common_tags, {
    CostOptimization       = "Inefficient-Demo"
    Purpose                = "Premium-When-Standard-Suffices"
    MonthlyCost            = "$15"
    OptimizationPotential  = "Standard tier - $5/month"
  })
}

# HSM-Protected Key - INTENTIONALLY INEFFICIENT
resource "azurerm_key_vault_key" "hsm" {
  count        = var.enable_phase5_services && var.enable_key_vault_premium ? 1 : 0
  name         = "hsm-demo-key"
  key_vault_id = azurerm_key_vault.premium[0].id
  key_type     = "RSA-HSM" # INTENTIONALLY INEFFICIENT
  key_size     = 4096       # INTENTIONALLY INEFFICIENT

  key_opts = [
    "decrypt",
    "encrypt",
    "sign",
    "verify",
    "wrapKey",
    "unwrapKey",
  ]

  rotation_policy {
    automatic {
      time_after_creation = "P30D" # INTENTIONALLY FREQUENT rotation
    }
    expire_after         = "P90D"
    notify_before_expiry = "P30D"
  }

  depends_on = [
    azurerm_role_assignment.kv_premium_admin
  ]

  tags = {
    Environment      = var.environment
    Application      = "HikePlanner"
    CostOptimization = "Inefficient-Demo"
    Purpose          = "HSM-Demo"
  }
}

resource "azurerm_role_assignment" "kv_premium_admin" {
  count                = var.enable_phase5_services && var.enable_key_vault_premium ? 1 : 0
  scope                = azurerm_key_vault.premium[0].id
  role_definition_name = "Key Vault Administrator"
  principal_id         = data.azurerm_client_config.current.object_id
}

# ============================================================================
# PHASE 5 OUTPUTS
# ============================================================================

output "phase5_deployment_summary" {
  description = "Phase 5 Complete Inefficient Infrastructure Summary"
  value = {
    phase                   = "5 - Complete Inefficient Infrastructure"
    environment             = var.environment
    services_deployed       = var.enable_phase5_services
    estimated_monthly_cost  = "$990-1020"
    optimized_monthly_cost  = "$118"
    potential_savings       = "88%"
    
    application_gateway = {
      deployed = var.enable_phase5_services && var.enable_application_gateway
      name     = var.enable_phase5_services && var.enable_application_gateway ? azurerm_application_gateway.main[0].name : "Not deployed"
      cost     = "$50/month"
      optimization = "Remove completely - direct routing is free"
    }
    
    premium_functions = {
      deployed = var.enable_phase5_services && var.enable_premium_functions
      name     = var.enable_phase5_services && var.enable_premium_functions ? azurerm_linux_function_app.main[0].name : "Not deployed"
      cost     = "$145/month"
      optimization = "Switch to Consumption plan - $5/month"
    }
    
    cdn = {
      deployed = var.enable_phase5_services && var.enable_cdn
      name     = var.enable_phase5_services && var.enable_cdn ? azurerm_cdn_frontdoor_profile.main[0].name : "Not deployed"
      cost     = "$20/month"
      optimization = "Remove - Static Web Apps has built-in CDN"
    }
    
    load_testing = {
      deployed = var.enable_phase5_services && var.enable_load_testing
      name     = var.enable_phase5_services && var.enable_load_testing ? azurerm_load_test.main[0].name : "Not deployed"
      cost     = "$25/month"
      optimization = "On-demand testing - $3/month"
    }
    
    app_insights = {
      deployed = var.enable_phase5_services
      name     = var.enable_phase5_services ? azurerm_application_insights.phase5[0].name : "Not deployed"
      cost     = "$120/month"
      optimization = "Reduce ingestion to 1GB/day, 90 days retention - $15/month"
    }
    
    key_vault_premium = {
      deployed = var.enable_phase5_services && var.enable_key_vault_premium
      name     = var.enable_phase5_services && var.enable_key_vault_premium ? azurerm_key_vault.premium[0].name : "Not deployed"
      cost     = "$15/month"
      optimization = "Standard tier - $5/month"
    }
  }
}

output "phase5_app_insights_connection_string" {
  description = "Application Insights connection string (Phase 5)"
  value       = var.enable_phase5_services ? azurerm_application_insights.phase5[0].connection_string : ""
  sensitive   = true
}

output "phase5_cdn_endpoint" {
  description = "CDN endpoint hostname (Phase 5)"
  value       = var.enable_phase5_services && var.enable_cdn ? azurerm_cdn_frontdoor_endpoint.main[0].host_name : ""
}

output "phase5_function_app_hostname" {
  description = "Premium Function App hostname (Phase 5)"
  value       = var.enable_phase5_services && var.enable_premium_functions ? azurerm_linux_function_app.main[0].default_hostname : ""
}

output "phase5_application_gateway_ip" {
  description = "Application Gateway public IP (Phase 5)"
  value       = var.enable_phase5_services && var.enable_application_gateway ? azurerm_public_ip.agw[0].ip_address : ""
}

output "phase5_key_vault_premium_uri" {
  description = "Key Vault Premium URI (Phase 5)"
  value       = var.enable_phase5_services && var.enable_key_vault_premium ? azurerm_key_vault.premium[0].vault_uri : ""
}
