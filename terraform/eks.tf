# EKS Cluster Module
module "eks" {
  source  = "terraform-aws-modules/eks/aws"
  version = "~> 19.0"

  cluster_name    = local.cluster_name
  cluster_version = var.cluster_version

  vpc_id     = module.vpc.vpc_id
  subnet_ids = module.vpc.private_subnets

  # Cluster access
  cluster_endpoint_public_access  = true
  cluster_endpoint_private_access = true

  # Encryption
  cluster_encryption_config = {
    resources        = ["secrets"]
    provider_key_arn = aws_kms_key.eks.arn
  }

  # Logging
  cluster_enabled_log_types = var.enable_logging ? [
    "api",
    "audit",
    "authenticator",
    "controllerManager",
    "scheduler"
  ] : []

  # Add-ons
  cluster_addons = {
    coredns = {
      most_recent = true
    }
    kube-proxy = {
      most_recent = true
    }
    vpc-cni = {
      most_recent = true
    }
    aws-ebs-csi-driver = {
      most_recent = true
    }
  }

  # Node groups
  eks_managed_node_groups = {
    general = {
      name = "${local.cluster_name}-general"

      instance_types = [var.node_instance_type]

      min_size     = var.node_min_capacity
      max_size     = var.node_max_capacity
      desired_size = var.node_desired_capacity

      # Disk
      block_device_mappings = {
        xvda = {
          device_name = "/dev/xvda"
          ebs = {
            volume_size           = 100
            volume_type           = "gp3"
            iops                  = 3000
            throughput            = 150
            encrypted             = true
            kms_key_id            = aws_kms_key.ebs.arn
            delete_on_termination = true
          }
        }
      }

      # IAM
      iam_role_additional_policies = {
        AmazonEBSCSIDriverPolicy = "arn:aws:iam::aws:policy/service-role/AmazonEBSCSIDriverPolicy"
      }

      # Labels
      labels = {
        Environment = var.environment
        NodeGroup   = "general"
      }

      # Taints (none for general node group)
      taints = []

      # Tags
      tags = local.common_tags
    }

    # Monitoring node group (optional, for dedicated monitoring workloads)
    monitoring = {
      name = "${local.cluster_name}-monitoring"

      instance_types = ["t3.large"]

      min_size     = 1
      max_size     = 3
      desired_size = 1

      labels = {
        Environment = var.environment
        NodeGroup   = "monitoring"
        Workload    = "observability"
      }

      taints = [
        {
          key    = "monitoring"
          value  = "true"
          effect = "NoSchedule"
        }
      ]

      tags = merge(
        local.common_tags,
        {
          Purpose = "monitoring"
        }
      )
    }
  }

  # Security group rules
  node_security_group_additional_rules = {
    ingress_self_all = {
      description = "Node to node all traffic"
      protocol    = "-1"
      from_port   = 0
      to_port     = 0
      type        = "ingress"
      self        = true
    }
    egress_all = {
      description = "Node all egress"
      protocol    = "-1"
      from_port   = 0
      to_port     = 0
      type        = "egress"
      cidr_blocks = ["0.0.0.0/0"]
    }
  }

  tags = local.common_tags
}

# KMS key for EKS
resource "aws_kms_key" "eks" {
  description             = "EKS Secret Encryption Key"
  deletion_window_in_days = 7
  enable_key_rotation     = true

  tags = merge(
    local.common_tags,
    {
      Name = "${local.cluster_name}-eks-key"
    }
  )
}

resource "aws_kms_alias" "eks" {
  name          = "alias/${local.cluster_name}-eks"
  target_key_id = aws_kms_key.eks.key_id
}

# KMS key for EBS
resource "aws_kms_key" "ebs" {
  description             = "EKS EBS Encryption Key"
  deletion_window_in_days = 7
  enable_key_rotation     = true

  tags = merge(
    local.common_tags,
    {
      Name = "${local.cluster_name}-ebs-key"
    }
  )
}

resource "aws_kms_alias" "ebs" {
  name          = "alias/${local.cluster_name}-ebs"
  target_key_id = aws_kms_key.ebs.key_id
}

# OIDC provider for IRSA (IAM Roles for Service Accounts)
data "tls_certificate" "cluster" {
  url = module.eks.cluster_oidc_issuer_url
}

resource "aws_iam_openid_connect_provider" "cluster" {
  client_id_list  = ["sts.amazonaws.com"]
  thumbprint_list = [data.tls_certificate.cluster.certificates[0].sha1_fingerprint]
  url             = module.eks.cluster_oidc_issuer_url

  tags = local.common_tags
}
