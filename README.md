# Cloud Native Demo Application

A comprehensive demo application showcasing modern cloud-native technologies and observability practices.

## 🚀 Features

- **Real-time Notifications**: WebSocket support using Socket.io
- **Server-Sent Events (SSE)**: Streaming updates to clients
- **Redis Caching**: High-performance caching layer
- **LGTM Stack**: Full observability with Loki, Grafana, Tempo, and Mimir
- **Docker**: Containerized application
- **Kubernetes**: Production-ready orchestration
- **Terraform**: Infrastructure as Code

## 📋 Architecture

### Event-Driven & Batch Processing Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                          CLIENT LAYER                                │
├─────────────────────────────────────────────────────────────────────┤
│                        Frontend (React)                              │
│                  WebSocket | SSE | REST API                          │
└────────────────────────────┬────────────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────────────┐
│                       APPLICATION LAYER                              │
├─────────────────────────────────────────────────────────────────────┤
│                      Backend API (Node.js)                           │
│  ┌──────────────┬────────────────┬─────────────┬──────────────┐    │
│  │ REST API     │  WebSocket     │    SSE      │  Metrics     │    │
│  └──────────────┴────────────────┴─────────────┴──────────────┘    │
│                             │                                        │
│                  ┌──────────┼──────────┐                            │
│                  ▼          ▼          ▼                            │
│         ┌────────────┬─────────┬─────────────┐                     │
│         │ PostgreSQL │  Redis  │   Kafka     │                     │
│         │   (Main)   │ (Cache) │ (Events)    │                     │
│         └────────────┴─────────┴─────────────┘                     │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             │ Kafka Topics
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    EVENT & BATCH PROCESSING                          │
├─────────────────────────────────────────────────────────────────────┤
│                   Batch Processor Service                            │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                                                               │  │
│  │  Event-Driven:          Batch Processing:                    │  │
│  │  • Kafka Consumer       • BullMQ Workers                     │  │
│  │  • Notification Queue   • Scheduled Jobs                     │  │
│  │  • Event Sourcing       • Data Cleanup                       │  │
│  │  • Dead Letter Queue    • Report Generation                  │  │
│  │                         • User Sync                          │  │
│  └──────────────────────────────────────────────────────────────┘  │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      OBSERVABILITY (LGTM)                            │
├─────────────────────────────────────────────────────────────────────┤
│  Loki (Logs) | Grafana (Dashboards) | Tempo (Traces) | Mimir (Metrics) │
└─────────────────────────────────────────────────────────────────────┘
```

### Data Flow Patterns

**1. Event-Driven Flow (Real-time)**
```
User Action → Backend API → PostgreSQL (Write)
                          ↓
                    Publish to Kafka
                          ↓
              Batch Processor (Consumer)
                          ↓
              Process & Update Status
                          ↓
              WebSocket Broadcast
```

**2. Batch Processing Flow (Scheduled)**
```
Cron Schedule → BullMQ Queue → Batch Worker
                                     ↓
                            Query PostgreSQL
                                     ↓
                            Process in Batches
                                     ↓
                            Update Database
                                     ↓
                            Publish Events
```

**3. Cache Strategy**
```
Request → Check Redis Cache
           ↓         ↓
         Hit       Miss
           ↓         ↓
        Return   Query PostgreSQL
                     ↓
                 Cache Result
                     ↓
                   Return
```

## 🛠️ Tech Stack

### Application Layer
- **Backend**: Node.js 18+, TypeScript, Express
- **Frontend**: React 18, TypeScript, Vite
- **WebSocket**: Socket.io (real-time bidirectional)
- **SSE**: Native Server-Sent Events (streaming)

### Data Layer
- **Database**: PostgreSQL 16 (primary data store)
- **ORM**: TypeORM (entities, migrations, queries)
- **Cache**: Redis 7 (caching & pub/sub)
- **Message Queue**: Apache Kafka (event streaming)
- **Job Queue**: BullMQ (batch processing)

### Event-Driven Architecture
- **Event Sourcing**: PostgreSQL events table
- **Message Broker**: Kafka with multiple topics
- **Batch Processing**: Dedicated processor service
- **Queue Workers**: BullMQ with Redis backend

### Observability (LGTM Stack)
- **Metrics**: Prometheus + Mimir (long-term storage)
- **Logs**: Loki + Promtail (aggregation)
- **Traces**: Tempo (OpenTelemetry distributed tracing)
- **Dashboards**: Grafana (visualization)

### Infrastructure
- **Containers**: Docker, Docker Compose
- **Orchestration**: Kubernetes (EKS-ready)
- **IaC**: Terraform (AWS EKS, RDS, MSK)
- **CI/CD Ready**: GitHub Actions compatible

## 📦 Project Structure

```
.
├── backend/          # Backend API service
├── frontend/         # React frontend
├── docker/           # Dockerfiles
├── k8s/             # Kubernetes manifests
├── terraform/       # Terraform configurations
├── monitoring/      # LGTM stack configs
└── docker-compose.yml
```

## 🚦 Getting Started

### Prerequisites

- Docker & Docker Compose
- Node.js 18+
- kubectl (for Kubernetes deployment)
- Terraform (for cloud infrastructure)

### Quick Start with Docker Compose

```bash
# Start all services (includes PostgreSQL, Redis, Kafka, monitoring)
docker-compose up -d

# Wait for services to be healthy (~30 seconds)
docker-compose ps

# Access the application
Frontend:        http://localhost:3000
Backend API:     http://localhost:3001
Grafana:         http://localhost:3002 (admin/admin)
Kafka UI:        http://localhost:8080
Prometheus:      http://localhost:9090

# View logs
docker-compose logs -f backend
docker-compose logs -f batch-processor

# Create a test notification
curl -X POST http://localhost:3001/api/notifications \
  -H "Content-Type: application/json" \
  -d '{"message":"Test notification","type":"info"}'
```

### Running Locally

```bash
# Backend
cd backend
npm install
npm run dev

# Frontend
cd frontend
npm install
npm start
```

### Deploy to Kubernetes

```bash
# Apply manifests
kubectl apply -f k8s/

# Check status
kubectl get pods
```

### Infrastructure with Terraform

```bash
cd terraform
terraform init
terraform plan
terraform apply
```

## 📊 Observability

### Metrics (Mimir/Prometheus)
- Request rate, latency, error rate
- Redis cache hit/miss ratio
- WebSocket connection count
- System metrics (CPU, memory)

### Logs (Loki)
- Structured JSON logs
- Request/response logging
- Error tracking

### Traces (Tempo)
- Distributed tracing
- Request flow visualization
- Performance bottleneck identification

### Dashboards (Grafana)
- Real-time metrics visualization
- Log exploration
- Trace analysis

## 🔌 API Endpoints

### REST API
- `GET /api/health` - Health check
- `GET /api/notifications` - Get notifications (cached)
- `POST /api/notifications` - Create notification
- `GET /api/sse/notifications` - SSE stream

### WebSocket
- `ws://localhost:3001` - Real-time notifications

## 📝 Environment Variables

```env
PORT=3001
REDIS_URL=redis://localhost:6379
NODE_ENV=production
LOKI_URL=http://loki:3100
TEMPO_URL=http://tempo:4318
```

## 🧪 Testing

```bash
# Backend tests
cd backend
npm test

# Load test WebSockets
npm run load-test
```

## 📖 Documentation

- [Backend README](./backend/README.md)
- [Frontend README](./frontend/README.md)
- [Kubernetes Guide](./k8s/README.md)
- [Terraform Guide](./terraform/README.md)

## 🤝 Contributing

This is a demo project for educational purposes.

## 📄 License

MIT
