output "cluster_id" {
  description = "DOKS cluster ID"
  value       = digitalocean_kubernetes_cluster.main.id
}

output "cluster_name" {
  description = "Kubernetes cluster name"
  value       = digitalocean_kubernetes_cluster.main.name
}

output "cluster_endpoint" {
  description = "Kubernetes cluster endpoint"
  value       = digitalocean_kubernetes_cluster.main.endpoint
}

output "cluster_ipv4" {
  description = "Kubernetes cluster IPv4 address"
  value       = digitalocean_kubernetes_cluster.main.ipv4_address
}

output "kubeconfig" {
  description = "Kubernetes config file contents"
  value       = digitalocean_kubernetes_cluster.main.kube_config[0].raw_config
  sensitive   = true
}

output "vpc_id" {
  description = "VPC ID"
  value       = digitalocean_vpc.main.id
}

output "registry_endpoint" {
  description = "Container registry endpoint"
  value       = digitalocean_container_registry.main.endpoint
}

output "registry_server_url" {
  description = "Container registry server URL"
  value       = digitalocean_container_registry.main.server_url
}

output "postgres_host" {
  description = "PostgreSQL host"
  value       = var.enable_managed_db ? digitalocean_database_cluster.postgres[0].host : "N/A"
}

output "postgres_port" {
  description = "PostgreSQL port"
  value       = var.enable_managed_db ? digitalocean_database_cluster.postgres[0].port : "N/A"
}

output "postgres_database" {
  description = "PostgreSQL database name"
  value       = var.enable_managed_db ? digitalocean_database_db.demo_app[0].name : "N/A"
}

output "postgres_user" {
  description = "PostgreSQL user"
  value       = var.enable_managed_db ? digitalocean_database_user.app_user[0].name : "N/A"
}

output "postgres_password" {
  description = "PostgreSQL password"
  value       = var.enable_managed_db ? digitalocean_database_user.app_user[0].password : "N/A"
  sensitive   = true
}

output "postgres_uri" {
  description = "PostgreSQL connection URI"
  value       = var.enable_managed_db ? digitalocean_database_cluster.postgres[0].private_uri : "N/A"
  sensitive   = true
}

output "redis_host" {
  description = "Redis host"
  value       = var.enable_managed_redis ? digitalocean_database_cluster.redis[0].host : "N/A"
}

output "redis_port" {
  description = "Redis port"
  value       = var.enable_managed_redis ? digitalocean_database_cluster.redis[0].port : "N/A"
}

output "redis_password" {
  description = "Redis password"
  value       = var.enable_managed_redis ? digitalocean_database_cluster.redis[0].password : "N/A"
  sensitive   = true
}

output "redis_uri" {
  description = "Redis connection URI"
  value       = var.enable_managed_redis ? digitalocean_database_cluster.redis[0].private_uri : "N/A"
  sensitive   = true
}

output "load_balancer_ip" {
  description = "Load Balancer IP address"
  value       = var.create_load_balancer ? digitalocean_loadbalancer.main[0].ip : "N/A"
}

output "configure_kubectl" {
  description = "Command to configure kubectl"
  value       = "doctl kubernetes cluster kubeconfig save ${digitalocean_kubernetes_cluster.main.name}"
}

output "estimated_monthly_cost" {
  description = "Estimated monthly cost in USD"
  value = format("$%.2f", (
    # DOKS cluster
    (var.node_min_count * 24) +
    # PostgreSQL
    (var.enable_managed_db ? (var.db_node_count == 2 ? 60 : 30) : 0) +
    # Redis
    (var.enable_managed_redis ? 15 : 0) +
    # Container Registry
    (var.registry_tier == "basic" ? 20 : 0) +
    # Load Balancer
    (var.create_load_balancer ? 12 : 0)
  ))
}
