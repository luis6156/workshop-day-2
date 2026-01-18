variable "do_token" {
  description = "DigitalOcean API token"
  type        = string
  sensitive   = true
}

variable "region" {
  description = "DigitalOcean region"
  type        = string
  default     = "nyc1"
}

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
  default     = "dev"
}

variable "project_name" {
  description = "Project name used for resource naming"
  type        = string
  default     = "demo-app"
}

variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.10.0.0/16"
}

variable "kubernetes_version" {
  description = "Kubernetes version"
  type        = string
  default     = "1.28.2-do.0"
}

variable "node_size" {
  description = "Droplet size for worker nodes"
  type        = string
  default     = "s-2vcpu-4gb"
}

variable "node_min_count" {
  description = "Minimum number of worker nodes"
  type        = number
  default     = 2
}

variable "node_max_count" {
  description = "Maximum number of worker nodes"
  type        = number
  default     = 5
}

variable "auto_upgrade" {
  description = "Enable automatic Kubernetes version upgrades"
  type        = bool
  default     = false
}

variable "registry_tier" {
  description = "Container registry tier (starter, basic, professional)"
  type        = string
  default     = "basic"
}

variable "enable_managed_db" {
  description = "Enable managed PostgreSQL database"
  type        = bool
  default     = true
}

variable "db_size" {
  description = "Database cluster size"
  type        = string
  default     = "db-s-2vcpu-4gb"
}

variable "db_node_count" {
  description = "Number of database nodes (1 or 2)"
  type        = number
  default     = 1
}

variable "enable_managed_redis" {
  description = "Enable managed Redis"
  type        = bool
  default     = true
}

variable "redis_size" {
  description = "Redis cluster size"
  type        = string
  default     = "db-s-1vcpu-1gb"
}

variable "create_load_balancer" {
  description = "Create a dedicated load balancer"
  type        = bool
  default     = false
}

variable "ssl_certificate_name" {
  description = "Name of SSL certificate for load balancer"
  type        = string
  default     = ""
}

variable "create_backup_bucket" {
  description = "Create Spaces bucket for backups"
  type        = bool
  default     = false
}

variable "backup_retention_days" {
  description = "Number of days to retain backups"
  type        = number
  default     = 30
}

variable "enable_monitoring" {
  description = "Enable monitoring alerts"
  type        = bool
  default     = true
}

variable "alert_email" {
  description = "Email for monitoring alerts"
  type        = string
  default     = "ops@example.com"
}
