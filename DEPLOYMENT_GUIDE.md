# Complete Deployment Guide

## 🚀 How to Run This Application

This guide covers three deployment options:
1. **Local Development** (Docker Compose) - Easiest, recommended for demos
2. **Kubernetes** (Minikube/Kind or Cloud) - Production-like environment
3. **AWS Cloud** (EKS + RDS + MSK) - Full production deployment

---

## Option 1: Local Development with Docker Compose ⭐ RECOMMENDED

This is the **easiest and fastest** way to run the complete stack locally.

### Prerequisites
- Docker Desktop (or Docker + Docker Compose)
- 8GB RAM minimum, 16GB recommended
- 20GB free disk space

### Step 1: Clone and Navigate

```bash
cd /Users/fmicu/Desktop/workshop-day2
```

### Step 2: Start All Services

```bash
# Start everything (PostgreSQL, Redis, Kafka, Backend, Frontend, Batch Processor, LGTM Stack)
docker-compose up -d

# This will start 15+ containers:
# - Frontend (React app)
# - Backend (Node.js API)
# - Batch Processor (Background worker)
# - PostgreSQL (Database)
# - Redis (Cache)
# - Kafka + Zookeeper (Message queue)
# - Kafka UI (Management interface)
# - Grafana, Loki, Tempo, Mimir, Prometheus (Observability)
```

### Step 3: Wait for Services to Start

```bash
# Watch logs (Ctrl+C to exit)
docker-compose logs -f

# Or check specific service
docker-compose logs -f backend

# Check all services are healthy (wait ~60 seconds)
docker-compose ps
```

### Step 4: Access the Application

Open your browser to:

| Service | URL | Credentials |
|---------|-----|-------------|
| **Frontend** | http://localhost:3000 | - |
| **Backend API** | http://localhost:3001 | - |
| **Grafana** | http://localhost:3002 | admin / admin |
| **Kafka UI** | http://localhost:8080 | - |
| **Prometheus** | http://localhost:9090 | - |

### Step 5: Test the Application

#### Create a Notification via API
```bash
curl -X POST http://localhost:3001/api/notifications \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Hello from the demo!",
    "type": "info"
  }'
```

#### Test WebSocket
Open http://localhost:3000 and:
1. Go to "WebSocket Demo" section
2. You'll see the connection establish
3. Create notifications - they appear in real-time!

#### Test SSE (Server-Sent Events)
1. Go to "Server-Sent Events" section
2. Click "Connect"
3. Create notifications in another tab
4. Watch them stream in real-time

#### View in Kafka UI
1. Open http://localhost:8080
2. Go to "Topics"
3. See `notifications`, `events`, `batch-jobs` topics
4. View messages flowing through Kafka

#### View Metrics in Grafana
1. Open http://localhost:3002 (admin/admin)
2. Go to Dashboards → Browse
3. Open "Demo Application Dashboard"
4. See real-time metrics, logs, and traces

### Step 6: View Logs

```bash
# All logs
docker-compose logs -f

# Backend only
docker-compose logs -f backend

# Batch processor
docker-compose logs -f batch-processor

# Database
docker-compose logs -f postgres

# Kafka
docker-compose logs -f kafka
```

### Step 7: Check Database

```bash
# Connect to PostgreSQL
docker-compose exec postgres psql -U postgres -d demo_app

# Run queries
\dt  # List tables
SELECT * FROM notifications LIMIT 10;
SELECT * FROM events LIMIT 10;
SELECT * FROM batch_jobs;
\q   # Quit
```

### Step 8: Check Redis

```bash
# Connect to Redis
docker-compose exec redis redis-cli

# Commands
KEYS *
GET notifications:recent
LLEN notifications:list
```

### Step 9: Monitor Batch Jobs

```bash
# Watch batch processor logs
docker-compose logs -f batch-processor

# You'll see:
# - Kafka consumer processing notifications
# - Scheduled jobs running (daily cleanup, etc.)
# - Batch processing of pending notifications
```

### Stop the Application

```bash
# Stop all services
docker-compose down

# Stop and remove volumes (clean slate)
docker-compose down -v

# Stop and remove everything including images
docker-compose down -v --rmi all
```

---

## Option 2: Kubernetes Deployment

### Prerequisites
- kubectl installed
- Minikube or Kind (local) OR cloud Kubernetes cluster
- 4 CPU cores, 8GB RAM for Minikube

### Option 2A: Local Kubernetes with Minikube

#### Step 1: Install Minikube

```bash
# macOS
brew install minikube

# Start Minikube with sufficient resources
minikube start --cpus=4 --memory=8192 --disk-size=50g
```

#### Step 2: Enable Add-ons

```bash
# Enable ingress
minikube addons enable ingress

# Enable metrics server
minikube addons enable metrics-server
```

#### Step 3: Build Images in Minikube

```bash
# Use Minikube's Docker daemon
eval $(minikube docker-env)

# Build backend image
cd backend
docker build -t demo-backend:latest .

# Build frontend image
cd ../frontend
docker build -t demo-frontend:latest .

# Build batch processor image
cd ../batch-processor
docker build -t demo-batch-processor:latest .

cd ..
```

#### Step 4: Deploy to Kubernetes

```bash
# Deploy everything
kubectl apply -f k8s/

# This deploys:
# - Namespace
# - PostgreSQL StatefulSet
# - Redis Deployment
# - Kafka Cluster (Zookeeper + 3 Kafka brokers)
# - Backend Deployment (with HPA)
# - Frontend Deployment
# - Batch Processor Deployment
# - Monitoring Stack (Grafana, Prometheus, Loki, Tempo, Mimir)
```

#### Step 5: Wait for Pods to Start

```bash
# Watch pods starting
kubectl get pods -n demo-app -w

# Check status
kubectl get all -n demo-app

# Wait until all pods are Running (can take 2-5 minutes)
```

#### Step 6: Access Services

```bash
# Port forward frontend
kubectl port-forward svc/frontend 3000:80 -n demo-app

# In another terminal, port forward backend
kubectl port-forward svc/backend 3001:3001 -n demo-app

# In another terminal, port forward Grafana
kubectl port-forward svc/grafana 3002:3000 -n demo-app

# Now access:
# Frontend: http://localhost:3000
# Backend: http://localhost:3001
# Grafana: http://localhost:3002
```

#### Step 7: Scale the Application

```bash
# Scale backend
kubectl scale deployment backend --replicas=5 -n demo-app

# Scale batch processor
kubectl scale deployment batch-processor --replicas=3 -n demo-app

# Watch HPA auto-scaling
kubectl get hpa -n demo-app -w
```

#### Step 8: View Logs

```bash
# Backend logs
kubectl logs -f deployment/backend -n demo-app

# Batch processor logs
kubectl logs -f deployment/batch-processor -n demo-app

# PostgreSQL logs
kubectl logs -f statefulset/postgres -n demo-app

# Kafka logs
kubectl logs -f statefulset/kafka -n demo-app
```

#### Step 9: Cleanup

```bash
# Delete all resources
kubectl delete -f k8s/

# Or delete namespace (removes everything)
kubectl delete namespace demo-app

# Stop Minikube
minikube stop
minikube delete
```

### Option 2B: Cloud Kubernetes (EKS/GKE/AKS)

If you have a cloud Kubernetes cluster:

```bash
# Configure kubectl to your cluster
# For AWS EKS:
aws eks update-kubeconfig --region us-west-2 --name your-cluster

# Build and push images to container registry
docker build -t your-registry/demo-backend:latest ./backend
docker push your-registry/demo-backend:latest

docker build -t your-registry/demo-frontend:latest ./frontend
docker push your-registry/demo-frontend:latest

docker build -t your-registry/demo-batch-processor:latest ./batch-processor
docker push your-registry/demo-batch-processor:latest

# Update image references in k8s/*.yaml files

# Deploy
kubectl apply -f k8s/
```

---

## Option 3: Full AWS Production Deployment with Terraform

This deploys a complete production environment on AWS with:
- EKS Cluster
- RDS PostgreSQL (managed database)
- ElastiCache Redis
- MSK (Managed Kafka)
- Full networking and security

### Prerequisites
- AWS Account with appropriate permissions
- AWS CLI configured (`aws configure`)
- Terraform installed
- kubectl installed
- ~$300-500/month AWS costs

### Step 1: Configure AWS Credentials

```bash
aws configure
# Enter your AWS Access Key ID
# Enter your AWS Secret Access Key
# Enter your default region (e.g., us-west-2)
```

### Step 2: Configure Terraform Variables

```bash
cd terraform

# Copy example variables
cp terraform.tfvars.example terraform.tfvars

# Edit terraform.tfvars
vim terraform.tfvars
```

Example `terraform.tfvars`:
```hcl
aws_region = "us-west-2"
environment = "prod"
project_name = "demo-app"

# Enable managed services
enable_rds = true
enable_msk = true

# Cluster configuration
cluster_version = "1.28"
node_instance_type = "t3.large"
node_desired_capacity = 3
node_min_capacity = 2
node_max_capacity = 10

# Database
db_instance_class = "db.t3.medium"

# Kafka
msk_instance_type = "kafka.m5.large"
msk_ebs_volume_size = 100

# Monitoring
enable_monitoring = true
enable_logging = true
```

### Step 3: Initialize Terraform

```bash
terraform init
```

### Step 4: Review the Plan

```bash
# See what will be created
terraform plan

# Save plan to file
terraform plan -out=tfplan
```

This will create:
- VPC with public/private subnets across 3 AZs
- EKS cluster with managed node groups
- RDS PostgreSQL Multi-AZ
- ElastiCache Redis
- MSK Kafka cluster (3 brokers)
- Security groups, IAM roles, KMS keys
- Load balancers, NAT gateways
- CloudWatch alarms and monitoring

### Step 5: Apply Infrastructure

```bash
# Apply the plan (takes 20-30 minutes)
terraform apply tfplan

# Or apply directly with confirmation
terraform apply
```

### Step 6: Configure kubectl

```bash
# Get kubeconfig from Terraform output
aws eks update-kubeconfig --region us-west-2 --name demo-app-prod

# Verify connection
kubectl cluster-info
kubectl get nodes
```

### Step 7: Build and Push Images

```bash
# Login to ECR
aws ecr get-login-password --region us-west-2 | docker login --username AWS --password-stdin YOUR_ACCOUNT_ID.dkr.ecr.us-west-2.amazonaws.com

# Create ECR repositories
aws ecr create-repository --repository-name demo-backend
aws ecr create-repository --repository-name demo-frontend
aws ecr create-repository --repository-name demo-batch-processor

# Build and push images
docker build -t YOUR_ACCOUNT_ID.dkr.ecr.us-west-2.amazonaws.com/demo-backend:latest ./backend
docker push YOUR_ACCOUNT_ID.dkr.ecr.us-west-2.amazonaws.com/demo-backend:latest

docker build -t YOUR_ACCOUNT_ID.dkr.ecr.us-west-2.amazonaws.com/demo-frontend:latest ./frontend
docker push YOUR_ACCOUNT_ID.dkr.ecr.us-west-2.amazonaws.com/demo-frontend:latest

docker build -t YOUR_ACCOUNT_ID.dkr.ecr.us-west-2.amazonaws.com/demo-batch-processor:latest ./batch-processor
docker push YOUR_ACCOUNT_ID.dkr.ecr.us-west-2.amazonaws.com/demo-batch-processor:latest
```

### Step 8: Update Kubernetes Manifests

Update image references in `k8s/*.yaml` files to use your ECR images.

### Step 9: Create Database Secret

```bash
# Get RDS credentials from Terraform outputs
terraform output -json

# Create Kubernetes secret with RDS credentials
kubectl create secret generic postgres-secret \
  --from-literal=username=postgres \
  --from-literal=password=YOUR_RDS_PASSWORD \
  --from-literal=database=demo_app \
  -n demo-app
```

### Step 10: Deploy Application

```bash
# Deploy all Kubernetes resources
kubectl apply -f k8s/

# Watch pods starting
kubectl get pods -n demo-app -w
```

### Step 11: Access Application

```bash
# Get LoadBalancer URLs
kubectl get svc -n demo-app

# Frontend LoadBalancer
kubectl get svc frontend -n demo-app -o jsonpath='{.status.loadBalancer.ingress[0].hostname}'

# Backend LoadBalancer
kubectl get svc backend -n demo-app -o jsonpath='{.status.loadBalancer.ingress[0].hostname}'

# Grafana LoadBalancer
kubectl get svc grafana -n demo-app -o jsonpath='{.status.loadBalancer.ingress[0].hostname}'
```

Access via the LoadBalancer URLs (may take a few minutes for DNS to propagate).

### Step 12: Monitor Costs

```bash
# Estimated monthly costs:
# - EKS Control Plane: $73
# - EC2 Nodes (3x t3.large): ~$190
# - RDS (db.t3.medium Multi-AZ): ~$140
# - MSK (3x kafka.m5.large): ~$600
# - ElastiCache Redis: ~$50
# - NAT Gateways: ~$100
# - Load Balancers: ~$50
# - Data transfer: ~$50
# Total: ~$1,200/month

# Set up billing alerts in AWS Console!
```

### Cleanup (IMPORTANT!)

```bash
# Delete Kubernetes resources first (removes LoadBalancers)
kubectl delete -f k8s/

# Wait for LoadBalancers to be deleted (check AWS Console)

# Destroy Terraform infrastructure
cd terraform
terraform destroy

# Confirm with 'yes'
```

---

## 🔍 Verification & Testing

### Health Checks

```bash
# Backend health
curl http://localhost:3001/api/health

# Response should be:
# {
#   "status": "ok",
#   "timestamp": "2026-01-18T...",
#   "uptime": 123.45,
#   "redis": "connected"
# }
```

### Create Test Data

```bash
# Create 10 test notifications
for i in {1..10}; do
  curl -X POST http://localhost:3001/api/notifications \
    -H "Content-Type: application/json" \
    -d "{\"message\":\"Test notification $i\",\"type\":\"info\"}"
  sleep 1
done
```

### View Kafka Messages

1. Open Kafka UI: http://localhost:8080
2. Go to "Topics"
3. Click on "notifications" topic
4. See messages tab - you'll see all notification events

### View Database Records

```bash
# Connect to database
docker-compose exec postgres psql -U postgres -d demo_app

# Query notifications
SELECT id, message, type, status, "createdAt" FROM notifications ORDER BY "createdAt" DESC LIMIT 10;

# Query events (event sourcing)
SELECT id, "eventType", "aggregateType", "createdAt" FROM events ORDER BY "createdAt" DESC LIMIT 10;

# Query batch jobs
SELECT id, type, status, "processedCount", "createdAt" FROM batch_jobs ORDER BY "createdAt" DESC;
```

### View Metrics

1. Open Grafana: http://localhost:3002
2. Go to Explore
3. Select "Prometheus" datasource
4. Run queries:
   - `rate(http_requests_total[5m])` - Request rate
   - `http_request_duration_seconds` - Latency
   - `websocket_connections_total` - WebSocket connections
   - `kafka_messages_processed_total` - Kafka throughput

### View Logs

1. In Grafana, go to Explore
2. Select "Loki" datasource
3. Run LogQL queries:
   - `{service="backend"}` - All backend logs
   - `{service="backend"} |= "notification"` - Notification-related logs
   - `{service="batch-processor"}` - Batch processor logs

### View Traces

1. In Grafana, go to Explore
2. Select "Tempo" datasource
3. Search by service name or trace ID
4. Click on a trace to see the full request flow

---

## 🎯 What You're Showcasing

### 1. Event-Driven Architecture
- Kafka topics for async communication
- Event sourcing with complete audit trail
- Dead letter queue for failed messages

### 2. Batch Processing
- BullMQ job queues
- Scheduled jobs (daily cleanup, reports)
- Parallel processing with workers

### 3. Database Patterns
- PostgreSQL with TypeORM
- Migrations and schema management
- CQRS (separate read/write models)

### 4. Caching Strategy
- Multi-level caching (Redis)
- Cache-aside pattern
- Cache invalidation

### 5. Real-time Communication
- WebSocket bidirectional
- SSE for streaming
- Redis pub/sub

### 6. Full Observability (LGTM)
- **L**oki - Centralized logs
- **G**rafana - Visualization
- **T**empo - Distributed tracing
- **M**imir - Long-term metrics

### 7. Container Orchestration
- Docker multi-stage builds
- Docker Compose for local dev
- Kubernetes for production

### 8. Infrastructure as Code
- Terraform for AWS
- Managed services (RDS, MSK, ElastiCache)
- Security and monitoring

---

## 📊 Demo Flow

For presentations, follow this flow:

1. **Start with Docker Compose** (5 min)
   - Show all services starting
   - Open frontend, create notifications
   - Show real-time WebSocket updates

2. **Show Event-Driven Flow** (5 min)
   - Open Kafka UI, show topics
   - Create notification, watch it flow through Kafka
   - Show batch processor logs processing events

3. **Show Database** (3 min)
   - Query notifications table
   - Show events table (event sourcing)
   - Show batch_jobs table

4. **Show Observability** (7 min)
   - Grafana dashboard with real-time metrics
   - Loki logs with queries
   - Tempo traces showing request flow
   - Explain LGTM stack

5. **Show Kubernetes** (5 min)
   - `kubectl get pods` - show pods
   - `kubectl get hpa` - show auto-scaling
   - Scale deployment in real-time

6. **Show Terraform** (5 min)
   - Review terraform files
   - Show AWS resources that would be created
   - Explain infrastructure automation

Total: ~30 minutes for complete demo

---

## 🆘 Troubleshooting

### Services Won't Start

```bash
# Check Docker daemon
docker ps

# Check disk space
df -h

# Restart Docker Desktop

# Clean up old containers
docker system prune -a
```

### Port Already in Use

```bash
# Find process using port 3001
lsof -i :3001

# Kill process
kill -9 <PID>

# Or change port in docker-compose.yml
```

### Database Migration Fails

```bash
# Connect to database and drop/recreate
docker-compose exec postgres psql -U postgres
DROP DATABASE demo_app;
CREATE DATABASE demo_app;
\q

# Restart backend
docker-compose restart backend
```

### Kafka Won't Start

```bash
# Kafka needs time to initialize
# Wait 60 seconds after starting

# Check Zookeeper is running first
docker-compose logs zookeeper

# Then check Kafka
docker-compose logs kafka
```

### Out of Memory

```bash
# Increase Docker Desktop memory to 8GB minimum

# Or reduce services by commenting out in docker-compose.yml:
# - Mimir
# - Tempo
# - Some monitoring services
```

---

## 📖 Additional Resources

- [Architecture Documentation](./ARCHITECTURE.md)
- [Backend README](./backend/README.md)
- [Frontend README](./frontend/README.md)
- [Kubernetes Guide](./k8s/README.md)
- [Terraform Guide](./terraform/README.md)
- [Monitoring Guide](./monitoring/README.md)
- [Contributing Guide](./CONTRIBUTING.md)

---

## 🎉 Success!

You now have a fully functional cloud-native application showcasing:
- ✅ Event-driven architecture with Kafka
- ✅ Batch processing with BullMQ
- ✅ PostgreSQL database with TypeORM
- ✅ Redis caching
- ✅ WebSocket & SSE real-time features
- ✅ Full LGTM observability stack
- ✅ Docker & Kubernetes ready
- ✅ Terraform AWS infrastructure

Enjoy your demo! 🚀
