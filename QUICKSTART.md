# Quick Start Guide

Get the demo application up and running in minutes!

## 🚀 Three Ways to Run

### 1. Docker Compose (Easiest)

**Prerequisites**: Docker & Docker Compose

```bash
# Start everything
docker-compose up -d

# Access the application
open http://localhost:3000      # Frontend
open http://localhost:3001      # Backend API
open http://localhost:3002      # Grafana (admin/admin)
```

That's it! All services including the LGTM stack are running.

### 2. Local Development

**Prerequisites**: Node.js 18+, Redis

```bash
# Install dependencies
make install
# or
cd backend && npm install
cd ../frontend && npm install

# Start Redis (in separate terminal)
redis-server

# Start backend (in separate terminal)
cd backend
npm run dev

# Start frontend (in separate terminal)
cd frontend
npm run dev

# Access
open http://localhost:3000
```

### 3. Kubernetes (Production-like)

**Prerequisites**: kubectl, Minikube/Kind or cloud Kubernetes

```bash
# Start Minikube (if using local)
minikube start --cpus=4 --memory=8192

# Build images (if local)
eval $(minikube docker-env)
cd backend && docker build -t demo-backend:latest .
cd ../frontend && docker build -t demo-frontend:latest .

# Deploy
kubectl apply -f k8s/

# Access via port-forward
kubectl port-forward svc/frontend 3000:80 -n demo-app
kubectl port-forward svc/backend 3001:3001 -n demo-app
kubectl port-forward svc/grafana 3002:3000 -n demo-app
```

## 📋 What You Get

### Application Features

✅ **Real-time WebSocket** - Bidirectional communication
```bash
# Test WebSocket
wscat -c ws://localhost:3001
```

✅ **Server-Sent Events** - Streaming updates
```bash
# Test SSE
curl -N http://localhost:3001/api/sse/notifications
```

✅ **Redis Caching** - High-performance cache
```bash
# Create notification (cached)
curl -X POST http://localhost:3001/api/notifications \
  -H "Content-Type: application/json" \
  -d '{"message":"Hello World","type":"info"}'

# Get notifications (from cache)
curl http://localhost:3001/api/notifications
```

✅ **REST API** - Full CRUD operations
```bash
# Health check
curl http://localhost:3001/api/health
```

### Observability (LGTM Stack)

✅ **Grafana** - Visualization at http://localhost:3002
- Login: admin/admin
- Pre-configured dashboards
- All datasources connected

✅ **Loki** - Logs at http://localhost:3100
```bash
# View logs in Grafana
# Go to Explore → Select Loki → Query: {service="backend"}
```

✅ **Tempo** - Traces at http://localhost:3200
```bash
# Traces automatically captured via OpenTelemetry
# View in Grafana → Explore → Select Tempo
```

✅ **Mimir/Prometheus** - Metrics at http://localhost:9090
```bash
# View metrics
curl http://localhost:3001/metrics

# Query in Grafana or Prometheus UI
# rate(http_requests_total[5m])
```

## 🧪 Test the Application

### 1. Create a Notification

```bash
curl -X POST http://localhost:3001/api/notifications \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Test notification",
    "type": "info",
    "metadata": {"source": "quickstart"}
  }'
```

### 2. Watch WebSocket Updates

Open the frontend at http://localhost:3000:
1. Go to "WebSocket Demo" section
2. You'll see real-time notifications appear
3. Send a message and get instant response

### 3. Watch SSE Stream

In the frontend:
1. Go to "Server-Sent Events" section
2. Click "Connect"
3. Create notifications in another tab
4. Watch them stream in real-time

### 4. View Metrics

```bash
# Get metrics
curl http://localhost:3001/metrics | grep http_requests_total

# Or view in Grafana
open http://localhost:3002
# Navigate to Dashboards → Demo Application Dashboard
```

### 5. View Logs

```bash
# Docker Compose
docker-compose logs -f backend

# Kubernetes
kubectl logs -f deployment/backend -n demo-app

# Or in Grafana Loki
# Explore → Loki → {service="backend"} |= "notification"
```

### 6. View Traces

In Grafana:
1. Go to Explore
2. Select "Tempo" datasource
3. Search by service name: "demo-backend"
4. Click on a trace to see the full flow

## 📊 View Observability

### Metrics Dashboard

1. Open Grafana: http://localhost:3002
2. Login: admin/admin
3. Go to Dashboards → Browse
4. Open "Demo Application Dashboard"

You'll see:
- HTTP request rate and latency
- WebSocket connection count
- Redis cache hit/miss ratio
- System metrics (CPU, memory)

### Log Exploration

1. In Grafana, go to Explore
2. Select "Loki" datasource
3. Try these queries:
```logql
# All backend logs
{service="backend"}

# Error logs only
{service="backend"} |= "error"

# Notification-related logs
{service="backend"} |= "notification"

# Error rate
rate({service="backend"} |= "error"[5m])
```

### Trace Analysis

1. In Grafana, go to Explore
2. Select "Tempo" datasource
3. Search for traces
4. Click trace ID to see:
   - Request flow
   - Service dependencies
   - Performance bottlenecks
   - Error details

## 🛠️ Common Commands

### Using Make

```bash
# Show all available commands
make help

# Start services
make up

# Stop services
make down

# View logs
make logs

# Create test notification
make create-notification

# Check health
make health-check

# View metrics
make metrics

# Clean up
make clean
```

### Docker Compose

```bash
# Start
docker-compose up -d

# Stop
docker-compose down

# Logs
docker-compose logs -f [service]

# Restart
docker-compose restart [service]

# Rebuild
docker-compose build [service]

# Status
docker-compose ps
```

### Kubernetes

```bash
# Deploy
kubectl apply -f k8s/

# Status
kubectl get all -n demo-app

# Logs
kubectl logs -f deployment/backend -n demo-app

# Port forward
kubectl port-forward svc/frontend 3000:80 -n demo-app

# Scale
kubectl scale deployment backend --replicas=5 -n demo-app

# Delete
kubectl delete -f k8s/
```

## 🔍 Troubleshooting

### Services not starting

```bash
# Check logs
docker-compose logs

# Check ports
lsof -i :3000  # Frontend
lsof -i :3001  # Backend
lsof -i :6379  # Redis
```

### Connection refused

```bash
# Check if services are running
docker-compose ps

# Restart services
make restart

# Check health
make health-check
```

### No metrics in Grafana

1. Check Prometheus is scraping:
   - Open http://localhost:9090/targets
   - Verify backend target is UP

2. Check metrics endpoint:
   ```bash
   curl http://localhost:3001/metrics
   ```

3. Restart Prometheus:
   ```bash
   docker-compose restart prometheus
   ```

### Logs not appearing in Loki

1. Check Promtail is running:
   ```bash
   docker-compose logs promtail
   ```

2. Verify Loki is ready:
   ```bash
   curl http://localhost:3100/ready
   ```

3. Check backend is logging:
   ```bash
   docker-compose logs backend | grep -i loki
   ```

## 🚦 Next Steps

### 1. Explore the Code

```bash
# Backend structure
backend/
├── src/
│   ├── services/      # Business logic
│   ├── routes/        # API endpoints
│   ├── utils/         # Metrics, logging, tracing
│   └── middleware/    # Express middleware

# Frontend structure
frontend/
├── src/
│   ├── components/    # React components
│   ├── App.tsx        # Main application
│   └── main.tsx       # Entry point
```

### 2. Customize

- Modify notification types in `backend/src/services/notification.service.ts`
- Add new API endpoints in `backend/src/routes/api.routes.ts`
- Create new dashboards in Grafana
- Add custom metrics in `backend/src/utils/metrics.ts`

### 3. Deploy to Production

```bash
# Using Terraform
cd terraform
terraform init
terraform plan
terraform apply

# Access the cluster
aws eks update-kubeconfig --region us-west-2 --name demo-app-dev

# Deploy application
kubectl apply -f ../k8s/
```

### 4. Monitor and Scale

```bash
# Watch HPA
kubectl get hpa -n demo-app -w

# View metrics
kubectl top pods -n demo-app

# Scale manually
kubectl scale deployment backend --replicas=5 -n demo-app
```

## 📚 Learn More

- [Backend README](./backend/README.md) - API documentation
- [Frontend README](./frontend/README.md) - Frontend guide
- [Kubernetes Guide](./k8s/README.md) - K8s deployment
- [Terraform Guide](./terraform/README.md) - Infrastructure
- [Monitoring Guide](./monitoring/README.md) - Observability
- [Contributing Guide](./CONTRIBUTING.md) - Development

## 💡 Tips

1. **Start with Docker Compose** - Easiest way to see everything working
2. **Use Makefile commands** - Simplifies common tasks
3. **Check Grafana first** - Best place to see all metrics/logs/traces
4. **Use port-forwarding** - Access K8s services locally
5. **Enable monitoring** - Always valuable for debugging

## 🎯 Key URLs

| Service | URL | Credentials |
|---------|-----|-------------|
| Frontend | http://localhost:3000 | - |
| Backend | http://localhost:3001 | - |
| Grafana | http://localhost:3002 | admin/admin |
| Prometheus | http://localhost:9090 | - |
| Loki | http://localhost:3100 | - |
| Tempo | http://localhost:3200 | - |

## 🤝 Need Help?

1. Check the logs: `make logs`
2. Review health: `make health-check`
3. See documentation in README.md
4. Check CONTRIBUTING.md for development setup

## 🎉 You're Ready!

The application is now running with:
- ✅ Real-time WebSocket communication
- ✅ Server-Sent Events streaming
- ✅ Redis caching
- ✅ Full observability with LGTM stack
- ✅ Docker containerization
- ✅ Kubernetes orchestration ready
- ✅ Terraform infrastructure ready

Enjoy exploring cloud-native technologies! 🚀
