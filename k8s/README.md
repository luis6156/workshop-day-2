# Kubernetes Manifests

Production-ready Kubernetes manifests for deploying the demo application.

## Architecture

```
┌──────────────────────────────────────────────────────────┐
│                     Kubernetes Cluster                    │
├──────────────────────────────────────────────────────────┤
│                                                            │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐      │
│  │  Frontend   │  │   Backend   │  │    Redis    │      │
│  │ (Nginx)     │  │ (Node.js)   │  │   (Cache)   │      │
│  │ Replicas: 2 │  │ Replicas: 3 │  │ Replicas: 1 │      │
│  └─────────────┘  └─────────────┘  └─────────────┘      │
│         │                 │                 │             │
│         └─────────────────┴─────────────────┘             │
│                           │                               │
│  ┌────────────────────────┴───────────────────────────┐  │
│  │            LGTM Observability Stack                 │  │
│  ├──────────────────────────────────────────────────────┤
│  │  Prometheus  │  Loki  │  Tempo  │  Mimir  │ Grafana │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                            │
└──────────────────────────────────────────────────────────┘
```

## Files

- `namespace.yaml` - Namespace definition
- `redis-deployment.yaml` - Redis cache deployment and service
- `backend-deployment.yaml` - Backend API with HPA
- `frontend-deployment.yaml` - Frontend deployment
- `monitoring-stack.yaml` - Complete LGTM stack
- `configmaps.yaml` - Configuration for all services
- `secrets.yaml` - Secrets (Grafana password)
- `ingress.yaml` - Ingress rules for routing

## Prerequisites

```bash
# Install kubectl
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/darwin/amd64/kubectl"

# Or use Homebrew on macOS
brew install kubectl

# Verify installation
kubectl version --client
```

## Deployment Options

### Option 1: Local Kubernetes (Minikube/Kind)

```bash
# Install Minikube
brew install minikube

# Start cluster
minikube start --cpus=4 --memory=8192

# Enable ingress
minikube addons enable ingress

# Enable metrics server
minikube addons enable metrics-server

# Build images in Minikube
eval $(minikube docker-env)
cd backend && docker build -t demo-backend:latest .
cd ../frontend && docker build -t demo-frontend:latest .
```

### Option 2: Cloud Kubernetes (EKS, GKE, AKS)

See the Terraform configurations in `../terraform/` directory.

## Quick Deploy

```bash
# Create namespace
kubectl apply -f namespace.yaml

# Deploy ConfigMaps and Secrets
kubectl apply -f configmaps.yaml
kubectl apply -f secrets.yaml

# Deploy Redis
kubectl apply -f redis-deployment.yaml

# Deploy monitoring stack
kubectl apply -f monitoring-stack.yaml

# Deploy application
kubectl apply -f backend-deployment.yaml
kubectl apply -f frontend-deployment.yaml

# Deploy ingress
kubectl apply -f ingress.yaml

# Or deploy everything at once
kubectl apply -f .
```

## Verify Deployment

```bash
# Check namespace
kubectl get namespace demo-app

# Check all resources
kubectl get all -n demo-app

# Check pods
kubectl get pods -n demo-app

# Check services
kubectl get svc -n demo-app

# Check ingress
kubectl get ingress -n demo-app

# Check HPA
kubectl get hpa -n demo-app

# View logs
kubectl logs -f deployment/backend -n demo-app
kubectl logs -f deployment/frontend -n demo-app
```

## Access Services

### Using Port Forwarding

```bash
# Frontend
kubectl port-forward svc/frontend 3000:80 -n demo-app

# Backend
kubectl port-forward svc/backend 3001:3001 -n demo-app

# Grafana
kubectl port-forward svc/grafana 3002:3000 -n demo-app

# Prometheus
kubectl port-forward svc/prometheus 9090:9090 -n demo-app

# Redis (for debugging)
kubectl port-forward svc/redis 6379:6379 -n demo-app
```

### Using Ingress (Minikube)

```bash
# Get Minikube IP
minikube ip

# Add to /etc/hosts
echo "$(minikube ip) demo.local grafana.demo.local" | sudo tee -a /etc/hosts

# Access services
open http://demo.local
open http://grafana.demo.local
```

### Using LoadBalancer (Cloud)

```bash
# Get external IPs
kubectl get svc -n demo-app

# Access via external IPs
curl http://<FRONTEND_EXTERNAL_IP>
curl http://<BACKEND_EXTERNAL_IP>/api/health
open http://<GRAFANA_EXTERNAL_IP>
```

## Scaling

### Manual Scaling

```bash
# Scale backend
kubectl scale deployment backend --replicas=5 -n demo-app

# Scale frontend
kubectl scale deployment frontend --replicas=3 -n demo-app
```

### Auto-scaling (HPA)

The backend has HPA configured:
- Min replicas: 3
- Max replicas: 10
- CPU target: 70%
- Memory target: 80%

```bash
# Watch HPA
kubectl get hpa -n demo-app -w

# Generate load to test HPA
kubectl run -it --rm load-generator --image=busybox --restart=Never -n demo-app -- /bin/sh -c "while sleep 0.01; do wget -q -O- http://backend:3001/api/health; done"
```

## Monitoring

### View Metrics

```bash
# Pod metrics
kubectl top pods -n demo-app

# Node metrics
kubectl top nodes
```

### Access Grafana

```bash
kubectl port-forward svc/grafana 3002:3000 -n demo-app
```

Then open http://localhost:3002
- Username: `admin`
- Password: `admin` (change in `secrets.yaml`)

## Troubleshooting

### Pod not starting

```bash
# Describe pod
kubectl describe pod <pod-name> -n demo-app

# View logs
kubectl logs <pod-name> -n demo-app

# View previous logs (if crashed)
kubectl logs <pod-name> -n demo-app --previous
```

### Service not accessible

```bash
# Check endpoints
kubectl get endpoints -n demo-app

# Test from within cluster
kubectl run -it --rm debug --image=curlimages/curl --restart=Never -n demo-app -- curl http://backend:3001/api/health
```

### Storage issues

```bash
# Check PVCs
kubectl get pvc -n demo-app

# Describe PVC
kubectl describe pvc <pvc-name> -n demo-app
```

## Updates and Rollbacks

### Rolling Update

```bash
# Update image
kubectl set image deployment/backend backend=demo-backend:v2 -n demo-app

# Watch rollout
kubectl rollout status deployment/backend -n demo-app
```

### Rollback

```bash
# View rollout history
kubectl rollout history deployment/backend -n demo-app

# Rollback to previous version
kubectl rollout undo deployment/backend -n demo-app

# Rollback to specific revision
kubectl rollout undo deployment/backend --to-revision=2 -n demo-app
```

## Cleanup

```bash
# Delete all resources
kubectl delete -f .

# Delete namespace (removes everything)
kubectl delete namespace demo-app

# Stop Minikube (if using)
minikube stop
minikube delete
```

## Resource Requirements

### Minimum Cluster Resources

- **CPU**: 4 cores
- **Memory**: 8 GB RAM
- **Storage**: 50 GB

### Production Recommendations

- **CPU**: 8+ cores
- **Memory**: 16+ GB RAM
- **Storage**: 100+ GB SSD
- **Nodes**: 3+ nodes for high availability

## Security Considerations

1. **Change default passwords** in `secrets.yaml`
2. **Enable RBAC** for service accounts
3. **Use NetworkPolicies** to restrict traffic
4. **Enable Pod Security Standards**
5. **Use secrets management** (Sealed Secrets, External Secrets)
6. **Enable TLS** for ingress
7. **Scan images** for vulnerabilities
8. **Set resource limits** on all containers

## Production Checklist

- [ ] Change default passwords
- [ ] Configure proper resource limits
- [ ] Set up persistent storage (StorageClass)
- [ ] Configure backup strategy
- [ ] Set up monitoring alerts
- [ ] Enable pod disruption budgets
- [ ] Configure network policies
- [ ] Set up log aggregation
- [ ] Enable pod security policies
- [ ] Configure horizontal pod autoscaling
- [ ] Set up ingress with TLS
- [ ] Configure health checks
- [ ] Set up CI/CD pipeline
- [ ] Document runbooks

## License

MIT
