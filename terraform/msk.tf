# Amazon MSK (Managed Streaming for Apache Kafka)

resource "aws_cloudwatch_log_group" "msk" {
  count = var.enable_msk ? 1 : 0

  name              = "/aws/msk/${local.cluster_name}"
  retention_in_days = 7

  tags = local.common_tags
}

resource "aws_security_group" "msk" {
  count = var.enable_msk ? 1 : 0

  name        = "${local.cluster_name}-msk"
  description = "Security group for MSK cluster"
  vpc_id      = module.vpc.vpc_id

  ingress {
    description     = "Kafka from EKS nodes"
    from_port       = 9092
    to_port         = 9092
    protocol        = "tcp"
    security_groups = [module.eks.node_security_group_id]
  }

  ingress {
    description     = "Zookeeper from EKS nodes"
    from_port       = 2181
    to_port         = 2181
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
      Name = "${local.cluster_name}-msk-sg"
    }
  )
}

resource "aws_msk_configuration" "this" {
  count = var.enable_msk ? 1 : 0

  name              = "${local.cluster_name}-msk-config"
  kafka_versions    = ["3.5.1"]
  server_properties = <<PROPERTIES
auto.create.topics.enable=true
default.replication.factor=3
min.insync.replicas=2
num.io.threads=8
num.network.threads=5
num.partitions=3
num.replica.fetchers=2
replica.lag.time.max.ms=30000
socket.receive.buffer.bytes=102400
socket.request.max.bytes=104857600
socket.send.buffer.bytes=102400
unclean.leader.election.enable=true
zookeeper.session.timeout.ms=18000
log.retention.hours=168
PROPERTIES

  description = "MSK configuration for ${local.cluster_name}"
}

resource "aws_msk_cluster" "this" {
  count = var.enable_msk ? 1 : 0

  cluster_name           = local.cluster_name
  kafka_version          = "3.5.1"
  number_of_broker_nodes = 3

  broker_node_group_info {
    instance_type   = var.msk_instance_type
    client_subnets  = module.vpc.private_subnets
    security_groups = [aws_security_group.msk[0].id]

    storage_info {
      ebs_storage_info {
        volume_size            = var.msk_ebs_volume_size
        provisioned_throughput {
          enabled           = true
          volume_throughput = 250
        }
      }
    }

    connectivity_info {
      public_access {
        type = "DISABLED"
      }
    }
  }

  configuration_info {
    arn      = aws_msk_configuration.this[0].arn
    revision = aws_msk_configuration.this[0].latest_revision
  }

  encryption_info {
    encryption_at_rest_kms_key_arn = aws_kms_key.msk[0].arn
    
    encryption_in_transit {
      client_broker = "TLS"
      in_cluster    = true
    }
  }

  logging_info {
    broker_logs {
      cloudwatch_logs {
        enabled   = true
        log_group = aws_cloudwatch_log_group.msk[0].name
      }
    }
  }

  tags = merge(
    local.common_tags,
    {
      Name = "${local.cluster_name}-msk"
    }
  )
}

# KMS key for MSK encryption
resource "aws_kms_key" "msk" {
  count = var.enable_msk ? 1 : 0

  description             = "KMS key for MSK encryption"
  deletion_window_in_days = 7
  enable_key_rotation     = true

  tags = merge(
    local.common_tags,
    {
      Name = "${local.cluster_name}-msk-key"
    }
  )
}

resource "aws_kms_alias" "msk" {
  count = var.enable_msk ? 1 : 0

  name          = "alias/${local.cluster_name}-msk"
  target_key_id = aws_kms_key.msk[0].key_id
}

# CloudWatch alarms for MSK
resource "aws_cloudwatch_metric_alarm" "msk_cpu" {
  count = var.enable_msk && var.enable_monitoring ? 1 : 0

  alarm_name          = "${local.cluster_name}-msk-cpu"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CpuUser"
  namespace           = "AWS/Kafka"
  period              = "300"
  statistic           = "Average"
  threshold           = "80"
  alarm_description   = "This metric monitors MSK CPU utilization"

  dimensions = {
    "Cluster Name" = aws_msk_cluster.this[0].cluster_name
  }

  tags = local.common_tags
}

resource "aws_cloudwatch_metric_alarm" "msk_disk" {
  count = var.enable_msk && var.enable_monitoring ? 1 : 0

  alarm_name          = "${local.cluster_name}-msk-disk"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "KafkaDataLogsDiskUsed"
  namespace           = "AWS/Kafka"
  period              = "300"
  statistic           = "Average"
  threshold           = "80"
  alarm_description   = "This metric monitors MSK disk usage"

  dimensions = {
    "Cluster Name" = aws_msk_cluster.this[0].cluster_name
  }

  tags = local.common_tags
}
