# ElastiCache Redis for caching
resource "aws_elasticache_subnet_group" "redis" {
  name       = "${local.cluster_name}-redis"
  subnet_ids = module.vpc.private_subnets

  tags = merge(
    local.common_tags,
    {
      Name = "${local.cluster_name}-redis-subnet-group"
    }
  )
}

resource "aws_security_group" "redis" {
  name        = "${local.cluster_name}-redis"
  description = "Security group for ElastiCache Redis"
  vpc_id      = module.vpc.vpc_id

  ingress {
    description     = "Redis from EKS nodes"
    from_port       = 6379
    to_port         = 6379
    protocol        = "tcp"
    security_groups = [module.eks.node_security_group_id]
  }

  egress {
    description = "All outbound"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(
    local.common_tags,
    {
      Name = "${local.cluster_name}-redis-sg"
    }
  )
}

resource "aws_elasticache_cluster" "redis" {
  cluster_id           = "${var.project_name}-${var.environment}"
  engine               = "redis"
  node_type            = "cache.t3.micro"
  num_cache_nodes      = 1
  parameter_group_name = "default.redis7"
  engine_version       = "7.0"
  port                 = 6379

  subnet_group_name  = aws_elasticache_subnet_group.redis.name
  security_group_ids = [aws_security_group.redis.id]

  # Backup configuration
  snapshot_retention_limit = var.environment == "prod" ? 7 : 1
  snapshot_window          = "03:00-04:00"
  maintenance_window       = "sun:04:00-sun:05:00"

  # High availability (for production)
  # Uncomment for production multi-AZ
  # az_mode = "cross-az"
  # preferred_availability_zones = slice(data.aws_availability_zones.available.names, 0, 2)

  tags = merge(
    local.common_tags,
    {
      Name = "${local.cluster_name}-redis"
    }
  )
}

# CloudWatch alarms for Redis
resource "aws_cloudwatch_metric_alarm" "redis_cpu" {
  count = var.enable_monitoring ? 1 : 0

  alarm_name          = "${local.cluster_name}-redis-cpu"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/ElastiCache"
  period              = "300"
  statistic           = "Average"
  threshold           = "75"
  alarm_description   = "This metric monitors redis cpu utilization"

  dimensions = {
    CacheClusterId = aws_elasticache_cluster.redis.id
  }

  tags = local.common_tags
}

resource "aws_cloudwatch_metric_alarm" "redis_memory" {
  count = var.enable_monitoring ? 1 : 0

  alarm_name          = "${local.cluster_name}-redis-memory"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "FreeableMemory"
  namespace           = "AWS/ElastiCache"
  period              = "300"
  statistic           = "Average"
  threshold           = "100000000" # 100MB
  alarm_description   = "This metric monitors redis freeable memory"

  dimensions = {
    CacheClusterId = aws_elasticache_cluster.redis.id
  }

  tags = local.common_tags
}
