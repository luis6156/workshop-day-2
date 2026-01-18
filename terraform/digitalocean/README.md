# DigitalOcean Terraform Configuration

Deploy the demo application to DigitalOcean with:
- DOKS (DigitalOcean Kubernetes)
- Managed PostgreSQL Database
- Managed Redis
- Container Registry
- VPC and Networking
- Load Balancer
- Monitoring & Alerts

## Prerequisites

1. **DigitalOcean Account** with API token
2. **doctl CLI** installed
3. **Terraform** installed
4. **kubectl** installed

```bash
# Install doctl
brew install doctl  # macOS
snap install doctl  # Linux

# Authenticate
doctl auth init
```

## Quick Start

### Step 1: Configure Variables

```bash
cp terraform.tfvars.example terraform.tfvars
vim terraform.tfvars

# Add your DO API token
do_token = "dop_v1_xxxxxxxxxxxx"
```

### Step 2: Initialize Terraform

```bash
terraform init
```

### Step 3: Plan

```bash
terraform plan
```

### Step 4: Apply

```bash
terraform apply
```

This creates:
- DOKS cluster (2-5 nodes)
- Managed PostgreSQL (2vcpu, 4gb)
- Managed Redis (1vcpu, 1gb)
- Container Registry
- VPC with private networking
- Firewall rules
- Monitoring alerts

**Time**: ~10 minutes  
**Cost**: ~$117/month

### Step 5: Configure kubectl

```bash
# Get kubeconfig
doctl kubernetes cluster kubeconfig save demo-app-production

# Verify
kubectl get nodes
```

### Step 6: Get Database Credentials

```bash
# PostgreSQL
terraform output postgres_uri

# Redis
terraform output redis_uri

# Or use doctl
doctl databases list
```

### Step 7: Deploy Application

```bash
# Create K8s secrets with managed database credentials
kubectl create namespace demo-app

kubectl create secret generic postgres-secret \
  --from-literal=username=$(terraform output -raw postgres_user) \
  --from-literal=password=$(terraform output -raw postgres_password) \
  --from-literal=host=$(terraform output -raw postgres_host) \
  --from-literal=database=$(terraform output -raw postgres_database) \
  -n demo-app

kubectl create secret generic redis-secret \
  --from-literal=host=$(terraform output -raw redis_host) \
  --from-literal=password=$(terraform output -raw redis_password) \
  -n demo-app

# Push images to DO registry
doctl registry login

# Tag and push
docker tag demo-backend:latest registry.digitalocean.com/your-registry/backend:latest
docker push registry.digitalocean.com/your-registry/backend:latest

# Deploy
kubectl apply -f ../../k8s/
```

## Cost Breakdown

| Resource | Monthly Cost |
|----------|--------------|
| DOKS (2x s-2vcpu-4gb) | $48 |
| PostgreSQL (db-s-2vcpu-4gb) | $30 |
| Redis (db-s-1vcpu-1gb) | $15 |
| Container Registry (Basic) | $20 |
| Load Balancer (if created) | $12 |
| **Total** | **~$117/month** |

Production setup (larger nodes, HA database):
- DOKS (3x s-4vcpu-8gb): $144
- PostgreSQL HA (2 nodes): $60
- Redis (db-s-2vcpu-4gb): $30
- **Total**: ~$250/month

## Cleanup

```bash
# Destroy all resources
terraform destroy

# Confirm with 'yes'
```

## Using with ArgoCD

After deploying infrastructure:

```bash
# Install ArgoCD
kubectl apply -f ../../argocd/install.sh

# Create ArgoCD application
kubectl apply -f ../../argocd/applications/demo-app.yaml
```

## DigitalOcean Regions

Available regions:
- `nyc1`, `nyc3` - New York
- `sfo3` - San Francisco
- `lon1` - London
- `fra1` - Frankfurt
- `ams3` - Amsterdam
- `sgp1` - Singapore
- `tor1` - Toronto
- `blr1` - Bangalore

## Resources Created

```
VPC (10.10.0.0/16)
├── DOKS Cluster
│   ├── Node Pool (auto-scaling 2-5 nodes)
│   └── Worker Nodes (s-2vcpu-4gb)
├── Managed PostgreSQL
│   ├── Primary Node
│   └── Database: demo_app
├── Managed Redis
│   └── Single Node
└── Container Registry
    └── Docker image storage
```

## Monitoring

Access monitoring through:
1. **DigitalOcean Dashboard**: Graphs and alerts
2. **Grafana** (deployed with app): Custom dashboards
3. **Email Alerts**: Configured in variables

```bash
# View alerts
doctl monitoring alert list

# View metrics
doctl monitoring droplet bandwidth <droplet-id>
```

## Troubleshooting

### Cluster creation fails
```bash
# Check quota
doctl account get

# Check region availability
doctl kubernetes options regions
```

### Database connection issues
```bash
# Verify database is in same VPC
doctl databases list

# Test connection
kubectl run -it --rm debug --image=postgres:16 --restart=Never -- bash
psql "$(terraform output -raw postgres_uri)"
```

## Advanced

### Enable HA PostgreSQL
```hcl
db_node_count = 2  # In terraform.tfvars
```

### Add more node pools
```hcl
# In main.tf, add additional node_pool blocks
node_pool {
  name       = "high-memory-pool"
  size       = "s-4vcpu-8gb"
  auto_scale = true
  min_nodes  = 1
  max_nodes  = 3
}
```

### Use Spaces for backups
```hcl
create_backup_bucket = true
backup_retention_days = 30
```

## License

MIT
