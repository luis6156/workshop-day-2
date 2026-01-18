# Terraform Infrastructure

Infrastructure as Code (IaC) for deploying the demo application to AWS EKS.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         AWS Account                          │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌───────────────────────────────────────────────────────┐  │
│  │                     VPC (10.0.0.0/16)                  │  │
│  ├───────────────────────────────────────────────────────┤  │
│  │                                                         │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐   │  │
│  │  │   Public    │  │   Public    │  │   Public    │   │  │
│  │  │  Subnet     │  │  Subnet     │  │  Subnet     │   │  │
│  │  │   AZ-1      │  │   AZ-2      │  │   AZ-3      │   │  │
│  │  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘   │  │
│  │         │                │                │           │  │
│  │    NAT Gateway      NAT Gateway      NAT Gateway      │  │
│  │         │                │                │           │  │
│  │  ┌──────▼──────┐  ┌──────▼──────┐  ┌──────▼──────┐   │  │
│  │  │   Private   │  │   Private   │  │   Private   │   │  │
│  │  │   Subnet    │  │   Subnet    │  │   Subnet    │   │  │
│  │  │   AZ-1      │  │   AZ-2      │  │   AZ-3      │   │  │
│  │  └─────────────┘  └─────────────┘  └─────────────┘   │  │
│  │         │                │                │           │  │
│  │         └────────────────┴────────────────┘           │  │
│  │                         │                             │  │
│  │                  ┌──────▼──────┐                      │  │
│  │                  │  EKS Cluster │                     │  │
│  │                  └──────┬──────┘                      │  │
│  │                         │                             │  │
│  │          ┌──────────────┼──────────────┐              │  │
│  │          │              │              │              │  │
│  │    ┌─────▼─────┐  ┌────▼─────┐  ┌────▼─────┐        │  │
│  │    │ Node Group│  │   Node   │  │   Node   │        │  │
│  │    │  General  │  │  Group   │  │  Group   │        │  │
│  │    │  (2-10)   │  │Monitor(1)│  │  (Auto)  │        │  │
│  │    └───────────┘  └──────────┘  └──────────┘        │  │
│  │                                                       │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                               │
│  ┌────────────────────────────────────────────┐             │
│  │          ElastiCache Redis                  │             │
│  │          (cache.t3.micro)                   │             │
│  └────────────────────────────────────────────┘             │
│                                                               │
│  ┌────────────────────────────────────────────┐             │
│  │          KMS Keys (EKS, EBS)                │             │
│  └────────────────────────────────────────────┘             │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

## Prerequisites

### 1. Install Terraform

```bash
# macOS
brew tap hashicorp/tap
brew install hashicorp/tap/terraform

# Verify installation
terraform version
```

### 2. Install AWS CLI

```bash
# macOS
brew install awscli

# Configure AWS credentials
aws configure
```

### 3. Install kubectl

```bash
# macOS
brew install kubectl

# Verify installation
kubectl version --client
```

### 4. Install Helm

```bash
# macOS
brew install helm
```

## Quick Start

### 1. Initialize Terraform

```bash
cd terraform
terraform init
```

### 2. Configure Variables

```bash
# Copy example variables
cp terraform.tfvars.example terraform.tfvars

# Edit variables
vim terraform.tfvars
```

### 3. Plan Infrastructure

```bash
# Preview changes
terraform plan

# Save plan to file
terraform plan -out=tfplan
```

### 4. Apply Infrastructure

```bash
# Apply the plan
terraform apply tfplan

# Or apply directly (with confirmation)
terraform apply
```

This will create:
- VPC with public and private subnets across 3 AZs
- EKS cluster with managed node groups
- ElastiCache Redis cluster
- Security groups and IAM roles
- KMS keys for encryption
- Helm releases (ALB controller, metrics-server, NGINX ingress, etc.)

### 5. Configure kubectl

```bash
# Get the command from Terraform output
aws eks update-kubeconfig --region us-west-2 --name demo-app-dev

# Verify connection
kubectl cluster-info
kubectl get nodes
```

### 6. Deploy Application

```bash
# Navigate to k8s directory
cd ../k8s

# Deploy application
kubectl apply -f .

# Check deployments
kubectl get all -n demo-app
```

## Terraform Resources

### Core Resources

- **VPC**: Custom VPC with public/private subnets
- **EKS Cluster**: Managed Kubernetes cluster
- **Node Groups**: Auto-scaling worker nodes
- **ElastiCache**: Redis for caching
- **Security Groups**: Network security
- **IAM Roles**: RBAC and IRSA
- **KMS Keys**: Encryption

### Helm Charts

- **AWS Load Balancer Controller**: AWS ALB/NLB integration
- **Metrics Server**: Resource metrics
- **NGINX Ingress**: Ingress controller
- **cert-manager**: TLS certificate management
- **Prometheus Stack**: (Optional) Monitoring

## Configuration

### Variables

Key variables in `variables.tf`:

| Variable | Description | Default |
|----------|-------------|---------|
| `aws_region` | AWS region | us-west-2 |
| `environment` | Environment name | dev |
| `cluster_version` | Kubernetes version | 1.28 |
| `node_instance_type` | EC2 instance type | t3.medium |
| `node_desired_capacity` | Desired nodes | 3 |
| `enable_monitoring` | Enable monitoring | true |

### Environments

Create environment-specific configurations:

```bash
# Development
terraform workspace new dev
terraform workspace select dev
terraform apply -var-file="dev.tfvars"

# Production
terraform workspace new prod
terraform workspace select prod
terraform apply -var-file="prod.tfvars"
```

## Outputs

After applying, Terraform provides useful outputs:

```bash
# View all outputs
terraform output

# Specific output
terraform output cluster_endpoint
terraform output redis_endpoint

# Configure kubectl command
terraform output -raw configure_kubectl
```

## Cost Estimation

Estimated monthly costs (us-west-2, dev environment):

| Resource | Cost/Month |
|----------|------------|
| EKS Cluster | $73 |
| EC2 t3.medium x3 | ~$90 |
| NAT Gateway x1 | ~$32 |
| ElastiCache t3.micro | ~$12 |
| EBS Volumes | ~$10 |
| Load Balancers | ~$16 |
| **Total** | **~$233** |

Production costs will be higher due to:
- Multiple NAT Gateways
- Larger instances
- More nodes
- Additional storage
- Data transfer

## Scaling

### Horizontal Pod Autoscaling

```bash
# Check HPA
kubectl get hpa -n demo-app

# Scale manually
kubectl scale deployment backend --replicas=5 -n demo-app
```

### Cluster Autoscaling

The node groups are configured for auto-scaling:
- Min: 2 nodes
- Max: 10 nodes
- Desired: 3 nodes

### Modify Scaling Limits

```hcl
# In terraform.tfvars
node_min_capacity = 5
node_max_capacity = 20
```

```bash
terraform apply
```

## Monitoring

### CloudWatch

```bash
# View logs
aws logs tail /aws/eks/demo-app-dev/cluster --follow

# View metrics
aws cloudwatch get-metric-statistics \
  --namespace AWS/EKS \
  --metric-name cluster_failed_node_count \
  --dimensions Name=ClusterName,Value=demo-app-dev \
  --start-time 2024-01-01T00:00:00Z \
  --end-time 2024-01-02T00:00:00Z \
  --period 3600 \
  --statistics Average
```

### Kubernetes Dashboard

```bash
# Install dashboard
kubectl apply -f https://raw.githubusercontent.com/kubernetes/dashboard/v2.7.0/aio/deploy/recommended.yaml

# Create admin user
kubectl apply -f - <<EOF
apiVersion: v1
kind: ServiceAccount
metadata:
  name: admin-user
  namespace: kubernetes-dashboard
---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: admin-user
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: ClusterRole
  name: cluster-admin
subjects:
- kind: ServiceAccount
  name: admin-user
  namespace: kubernetes-dashboard
EOF

# Get token
kubectl -n kubernetes-dashboard create token admin-user

# Start proxy
kubectl proxy

# Access dashboard
open http://localhost:8001/api/v1/namespaces/kubernetes-dashboard/services/https:kubernetes-dashboard:/proxy/
```

## Maintenance

### Cluster Upgrade

```hcl
# Update cluster_version in variables
cluster_version = "1.29"
```

```bash
terraform plan
terraform apply
```

### Node Group Updates

Updates are handled via rolling deployments automatically.

### Backup and Restore

```bash
# Backup
velero install \
  --provider aws \
  --bucket demo-app-backups \
  --backup-location-config region=us-west-2

# Create backup
velero backup create demo-backup

# Restore
velero restore create --from-backup demo-backup
```

## Troubleshooting

### EKS Connection Issues

```bash
# Verify AWS credentials
aws sts get-caller-identity

# Update kubeconfig
aws eks update-kubeconfig --region us-west-2 --name demo-app-dev

# Test connection
kubectl get svc
```

### Node Not Ready

```bash
# Describe node
kubectl describe node <node-name>

# Check node logs
kubectl logs -n kube-system -l k8s-app=aws-node
```

### Terraform State Issues

```bash
# Refresh state
terraform refresh

# Import existing resource
terraform import aws_eks_cluster.this demo-app-dev

# Remove from state
terraform state rm aws_eks_cluster.this
```

## Cleanup

### Destroy Infrastructure

```bash
# Delete Kubernetes resources first
kubectl delete -f ../k8s/ -n demo-app

# Destroy Terraform resources
terraform destroy

# Confirm with 'yes'
```

**Warning**: This will delete all resources and data!

### Manual Cleanup (if needed)

```bash
# Delete load balancers created by Kubernetes
aws elb describe-load-balancers --query 'LoadBalancerDescriptions[?VPCId==`<vpc-id>`].LoadBalancerName' --output text | xargs -n1 aws elb delete-load-balancer --load-balancer-name

# Delete security groups
aws ec2 describe-security-groups --filters "Name=vpc-id,Values=<vpc-id>" --query 'SecurityGroups[?GroupName!=`default`].GroupId' --output text | xargs -n1 aws ec2 delete-security-group --group-id
```

## Security Best Practices

1. **Use Private Subnets**: Nodes run in private subnets
2. **Enable Encryption**: KMS encryption for EKS secrets and EBS volumes
3. **IAM Roles**: Use IRSA for pod-level permissions
4. **Security Groups**: Minimal required ports
5. **Network Policies**: Implement Kubernetes network policies
6. **Secrets Management**: Use AWS Secrets Manager or External Secrets
7. **Image Scanning**: Scan container images for vulnerabilities
8. **Pod Security**: Enable Pod Security Standards
9. **Audit Logging**: Enable EKS control plane logging
10. **MFA**: Require MFA for AWS access

## Production Checklist

- [ ] Enable multi-AZ NAT Gateways
- [ ] Configure backup strategy
- [ ] Set up monitoring and alerting
- [ ] Enable GuardDuty for threat detection
- [ ] Configure AWS Config for compliance
- [ ] Set up CloudTrail for audit logging
- [ ] Enable VPC Flow Logs
- [ ] Configure AWS WAF for public endpoints
- [ ] Set up disaster recovery plan
- [ ] Document runbooks
- [ ] Configure auto-scaling policies
- [ ] Set up CI/CD pipeline
- [ ] Enable container insights
- [ ] Configure log retention policies
- [ ] Set up budget alerts

## Support

For issues or questions:
1. Check AWS EKS documentation
2. Review Terraform AWS provider docs
3. Check CloudWatch logs
4. Review security group rules
5. Verify IAM permissions

## License

MIT
