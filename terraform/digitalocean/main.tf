terraform {
  required_version = ">= 1.0"

  required_providers {
    digitalocean = {
      source  = "digitalocean/digitalocean"
      version = "~> 2.34"
    }
  }

  # Backend configuration for state management
  # backend "s3" {
  #   # DigitalOcean Spaces (S3-compatible)
  #   endpoint                    = "nyc3.digitaloceanspaces.com"
  #   region                      = "us-east-1"  # Dummy region for Spaces
  #   bucket                      = "your-terraform-state"
  #   key                         = "demo-app/terraform.tfstate"
  #   skip_credentials_validation = true
  #   skip_metadata_api_check     = true
  # }
}

provider "digitalocean" {
  token = var.do_token
}

# Local variables
locals {
  cluster_name = "${var.project_name}-${var.environment}"
  
  common_tags = [
    "project:${var.project_name}",
    "environment:${var.environment}",
    "managed-by:terraform"
  ]
}

# VPC
resource "digitalocean_vpc" "main" {
  name     = "${local.cluster_name}-vpc"
  region   = var.region
  ip_range = var.vpc_cidr
}

# Container Registry
resource "digitalocean_container_registry" "main" {
  name                   = replace(local.cluster_name, "-", "")
  subscription_tier_slug = var.registry_tier
  region                 = var.region
}

# Kubernetes Cluster (DOKS)
resource "digitalocean_kubernetes_cluster" "main" {
  name    = local.cluster_name
  region  = var.region
  version = var.kubernetes_version
  vpc_uuid = digitalocean_vpc.main.id

  # Auto-upgrade
  auto_upgrade = var.auto_upgrade
  surge_upgrade = true

  # Maintenance window
  maintenance_policy {
    start_time = "04:00"
    day        = "sunday"
  }

  # Node pool
  node_pool {
    name       = "worker-pool"
    size       = var.node_size
    auto_scale = true
    min_nodes  = var.node_min_count
    max_nodes  = var.node_max_count
    tags       = local.common_tags

    labels = {
      service  = "demo-app"
      priority = "high"
    }
  }

  tags = local.common_tags
}

# Managed PostgreSQL Database
resource "digitalocean_database_cluster" "postgres" {
  count = var.enable_managed_db ? 1 : 0

  name       = "${local.cluster_name}-postgres"
  engine     = "pg"
  version    = "16"
  size       = var.db_size
  region     = var.region
  node_count = var.db_node_count
  
  private_network_uuid = digitalocean_vpc.main.id

  maintenance_window {
    day  = "sunday"
    hour = "04:00:00"
  }

  tags = local.common_tags
}

# Database
resource "digitalocean_database_db" "demo_app" {
  count      = var.enable_managed_db ? 1 : 0
  cluster_id = digitalocean_database_cluster.postgres[0].id
  name       = "demo_app"
}

# Database User
resource "digitalocean_database_user" "app_user" {
  count      = var.enable_managed_db ? 1 : 0
  cluster_id = digitalocean_database_cluster.postgres[0].id
  name       = "demo_app_user"
}

# Managed Redis
resource "digitalocean_database_cluster" "redis" {
  count = var.enable_managed_redis ? 1 : 0

  name       = "${local.cluster_name}-redis"
  engine     = "redis"
  version    = "7"
  size       = var.redis_size
  region     = var.region
  node_count = 1
  
  private_network_uuid = digitalocean_vpc.main.id

  maintenance_window {
    day  = "sunday"
    hour = "05:00:00"
  }

  tags = local.common_tags
}

# Firewall for DOKS
resource "digitalocean_firewall" "k8s" {
  name = "${local.cluster_name}-k8s-firewall"
  
  tags = digitalocean_kubernetes_cluster.main.node_pool[0].tags

  # Inbound rules
  inbound_rule {
    protocol         = "tcp"
    port_range       = "80"
    source_addresses = ["0.0.0.0/0", "::/0"]
  }

  inbound_rule {
    protocol         = "tcp"
    port_range       = "443"
    source_addresses = ["0.0.0.0/0", "::/0"]
  }

  inbound_rule {
    protocol         = "tcp"
    port_range       = "1-65535"
    source_tags      = local.common_tags
  }

  # Outbound rules
  outbound_rule {
    protocol              = "tcp"
    port_range            = "1-65535"
    destination_addresses = ["0.0.0.0/0", "::/0"]
  }

  outbound_rule {
    protocol              = "udp"
    port_range            = "1-65535"
    destination_addresses = ["0.0.0.0/0", "::/0"]
  }

  outbound_rule {
    protocol              = "icmp"
    destination_addresses = ["0.0.0.0/0", "::/0"]
  }
}

# Load Balancer for Ingress (optional - K8s can create automatically)
resource "digitalocean_loadbalancer" "main" {
  count = var.create_load_balancer ? 1 : 0

  name   = "${local.cluster_name}-lb"
  region = var.region
  vpc_uuid = digitalocean_vpc.main.id

  forwarding_rule {
    entry_port     = 80
    entry_protocol = "http"

    target_port     = 80
    target_protocol = "http"
  }

  forwarding_rule {
    entry_port     = 443
    entry_protocol = "https"

    target_port     = 80
    target_protocol = "http"

    certificate_name = var.ssl_certificate_name != "" ? var.ssl_certificate_name : null
  }

  healthcheck {
    port     = 80
    protocol = "http"
    path     = "/health"
  }

  droplet_tag = digitalocean_kubernetes_cluster.main.node_pool[0].tags[0]
}

# Spaces bucket for backups (optional)
resource "digitalocean_spaces_bucket" "backups" {
  count = var.create_backup_bucket ? 1 : 0

  name   = "${replace(local.cluster_name, "-", "")}-backups"
  region = var.region
  acl    = "private"

  versioning {
    enabled = true
  }

  lifecycle_rule {
    id      = "delete-old-backups"
    enabled = true

    expiration {
      days = var.backup_retention_days
    }
  }
}

# Monitoring Alerts
resource "digitalocean_monitor_alert" "high_cpu" {
  count = var.enable_monitoring ? 1 : 0

  alerts {
    email = [var.alert_email]
  }

  window      = "5m"
  type        = "v1/insights/droplet/cpu"
  compare     = "GreaterThan"
  value       = 80
  enabled     = true
  entities    = []
  tags        = local.common_tags
  description = "Alert when CPU usage exceeds 80%"
}

resource "digitalocean_monitor_alert" "high_memory" {
  count = var.enable_monitoring ? 1 : 0

  alerts {
    email = [var.alert_email]
  }

  window      = "5m"
  type        = "v1/insights/droplet/memory_utilization_percent"
  compare     = "GreaterThan"
  value       = 85
  enabled     = true
  entities    = []
  tags        = local.common_tags
  description = "Alert when memory usage exceeds 85%"
}
