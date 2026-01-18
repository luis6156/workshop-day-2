# RDS PostgreSQL for production database
resource "aws_db_subnet_group" "postgres" {
  name       = "${local.cluster_name}-postgres"
  subnet_ids = module.vpc.private_subnets

  tags = merge(
    local.common_tags,
    {
      Name = "${local.cluster_name}-postgres-subnet-group"
    }
  )
}

resource "aws_security_group" "rds" {
  name        = "${local.cluster_name}-rds"
  description = "Security group for RDS PostgreSQL"
  vpc_id      = module.vpc.vpc_id

  ingress {
    description     = "PostgreSQL from EKS nodes"
    from_port       = 5432
    to_port         = 5432
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
      Name = "${local.cluster_name}-rds-sg"
    }
  )
}

resource "aws_db_parameter_group" "postgres" {
  name   = "${local.cluster_name}-postgres16"
  family = "postgres16"

  parameter {
    name  = "log_connections"
    value = "1"
  }

  parameter {
    name  = "log_disconnections"
    value = "1"
  }

  parameter {
    name  = "log_duration"
    value = "1"
  }

  parameter {
    name  = "log_statement"
    value = "all"
  }

  tags = local.common_tags
}

resource "aws_db_instance" "postgres" {
  count = var.enable_rds ? 1 : 0

  identifier = "${local.cluster_name}-postgres"

  # Engine
  engine         = "postgres"
  engine_version = "16.1"
  instance_class = var.db_instance_class

  # Storage
  allocated_storage     = 20
  max_allocated_storage = 100
  storage_type          = "gp3"
  storage_encrypted     = true
  kms_key_id            = aws_kms_key.rds[0].arn

  # Database
  db_name  = "demo_app"
  username = "postgres"
  password = random_password.db_password[0].result
  port     = 5432

  # Network
  db_subnet_group_name   = aws_db_subnet_group.postgres.name
  vpc_security_group_ids = [aws_security_group.rds.id]
  publicly_accessible    = false

  # High Availability
  multi_az               = var.environment == "prod" ? true : false
  availability_zone      = var.environment == "prod" ? null : data.aws_availability_zones.available.names[0]

  # Backup
  backup_retention_period = var.environment == "prod" ? 7 : 3
  backup_window           = "03:00-04:00"
  maintenance_window      = "sun:04:00-sun:05:00"
  skip_final_snapshot     = var.environment != "prod"
  final_snapshot_identifier = var.environment == "prod" ? "${local.cluster_name}-final-snapshot-${formatdate("YYYY-MM-DD-hhmm", timestamp())}" : null

  # Parameters
  parameter_group_name = aws_db_parameter_group.postgres.name

  # Monitoring
  enabled_cloudwatch_logs_exports = ["postgresql", "upgrade"]
  monitoring_interval             = var.enable_monitoring ? 60 : 0
  monitoring_role_arn             = var.enable_monitoring ? aws_iam_role.rds_monitoring[0].arn : null

  # Performance Insights
  performance_insights_enabled    = var.enable_monitoring
  performance_insights_kms_key_id = var.enable_monitoring ? aws_kms_key.rds[0].arn : null
  performance_insights_retention_period = var.enable_monitoring ? 7 : null

  # Auto minor version upgrade
  auto_minor_version_upgrade = true

  # Deletion protection
  deletion_protection = var.environment == "prod"

  tags = merge(
    local.common_tags,
    {
      Name = "${local.cluster_name}-postgres"
    }
  )
}

# KMS key for RDS encryption
resource "aws_kms_key" "rds" {
  count = var.enable_rds ? 1 : 0

  description             = "KMS key for RDS encryption"
  deletion_window_in_days = 7
  enable_key_rotation     = true

  tags = merge(
    local.common_tags,
    {
      Name = "${local.cluster_name}-rds-key"
    }
  )
}

resource "aws_kms_alias" "rds" {
  count = var.enable_rds ? 1 : 0

  name          = "alias/${local.cluster_name}-rds"
  target_key_id = aws_kms_key.rds[0].key_id
}

# Random password for RDS
resource "random_password" "db_password" {
  count = var.enable_rds ? 1 : 0

  length  = 32
  special = true
}

# Store password in Secrets Manager
resource "aws_secretsmanager_secret" "db_password" {
  count = var.enable_rds ? 1 : 0

  name = "${local.cluster_name}-db-password"

  tags = local.common_tags
}

resource "aws_secretsmanager_secret_version" "db_password" {
  count = var.enable_rds ? 1 : 0

  secret_id = aws_secretsmanager_secret.db_password[0].id
  secret_string = jsonencode({
    username = aws_db_instance.postgres[0].username
    password = random_password.db_password[0].result
    engine   = "postgres"
    host     = aws_db_instance.postgres[0].address
    port     = aws_db_instance.postgres[0].port
    dbname   = aws_db_instance.postgres[0].db_name
  })
}

# IAM role for RDS monitoring
resource "aws_iam_role" "rds_monitoring" {
  count = var.enable_rds && var.enable_monitoring ? 1 : 0

  name = "${local.cluster_name}-rds-monitoring"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "monitoring.rds.amazonaws.com"
        }
      }
    ]
  })

  tags = local.common_tags
}

resource "aws_iam_role_policy_attachment" "rds_monitoring" {
  count = var.enable_rds && var.enable_monitoring ? 1 : 0

  role       = aws_iam_role.rds_monitoring[0].name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole"
}

# CloudWatch alarms for RDS
resource "aws_cloudwatch_metric_alarm" "rds_cpu" {
  count = var.enable_rds && var.enable_monitoring ? 1 : 0

  alarm_name          = "${local.cluster_name}-rds-cpu"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/RDS"
  period              = "300"
  statistic           = "Average"
  threshold           = "80"
  alarm_description   = "This metric monitors RDS CPU utilization"

  dimensions = {
    DBInstanceIdentifier = aws_db_instance.postgres[0].id
  }

  tags = local.common_tags
}

resource "aws_cloudwatch_metric_alarm" "rds_storage" {
  count = var.enable_rds && var.enable_monitoring ? 1 : 0

  alarm_name          = "${local.cluster_name}-rds-storage"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "FreeStorageSpace"
  namespace           = "AWS/RDS"
  period              = "300"
  statistic           = "Average"
  threshold           = "2000000000" # 2GB
  alarm_description   = "This metric monitors RDS free storage space"

  dimensions = {
    DBInstanceIdentifier = aws_db_instance.postgres[0].id
  }

  tags = local.common_tags
}
