output "cluster_id" {
  description = "EKS cluster ID"
  value       = module.eks.cluster_id
}

output "cluster_endpoint" {
  description = "Endpoint for EKS control plane"
  value       = module.eks.cluster_endpoint
}

output "cluster_name" {
  description = "Kubernetes cluster name"
  value       = module.eks.cluster_name
}

output "cluster_security_group_id" {
  description = "Security group ID attached to the EKS cluster"
  value       = module.eks.cluster_security_group_id
}

output "region" {
  description = "AWS region"
  value       = var.aws_region
}

output "vpc_id" {
  description = "VPC ID"
  value       = module.vpc.vpc_id
}

output "private_subnets" {
  description = "Private subnet IDs"
  value       = module.vpc.private_subnets
}

output "public_subnets" {
  description = "Public subnet IDs"
  value       = module.vpc.public_subnets
}

output "configure_kubectl" {
  description = "Command to configure kubectl"
  value       = "aws eks update-kubeconfig --region ${var.aws_region} --name ${module.eks.cluster_name}"
}

output "redis_endpoint" {
  description = "ElastiCache Redis endpoint"
  value       = aws_elasticache_cluster.redis.cache_nodes[0].address
}

output "redis_port" {
  description = "ElastiCache Redis port"
  value       = aws_elasticache_cluster.redis.cache_nodes[0].port
}

output "rds_endpoint" {
  description = "RDS PostgreSQL endpoint"
  value       = var.enable_rds ? aws_db_instance.postgres[0].endpoint : "Not enabled"
}

output "rds_address" {
  description = "RDS PostgreSQL address"
  value       = var.enable_rds ? aws_db_instance.postgres[0].address : "Not enabled"
}

output "rds_database_name" {
  description = "RDS database name"
  value       = var.enable_rds ? aws_db_instance.postgres[0].db_name : "Not enabled"
}

output "msk_bootstrap_brokers" {
  description = "MSK Kafka bootstrap brokers"
  value       = var.enable_msk ? aws_msk_cluster.this[0].bootstrap_brokers : "Not enabled"
}

output "msk_bootstrap_brokers_tls" {
  description = "MSK Kafka bootstrap brokers (TLS)"
  value       = var.enable_msk ? aws_msk_cluster.this[0].bootstrap_brokers_tls : "Not enabled"
}

output "msk_zookeeper_connect_string" {
  description = "MSK Zookeeper connection string"
  value       = var.enable_msk ? aws_msk_cluster.this[0].zookeeper_connect_string : "Not enabled"
}
