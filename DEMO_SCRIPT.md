# 🎬 Complete Demo Script

**Duration**: 30-40 minutes  
**Audience**: Technical (developers, architects, DevOps)

This script demonstrates a complete cloud-native application with event-driven architecture, batch processing, and full observability.

---

## 🚀 Pre-Demo Setup (5 minutes before)

### Step 1: Start All Services

```bash
cd /Users/fmicu/Desktop/workshop-day2

# Start everything
docker-compose up -d

# Wait for services to be ready (~60 seconds)
echo "Waiting for services to start..."
sleep 60

# Check all services are running
docker-compose ps
```

### Step 2: Pre-load Some Data (Optional)

```bash
# Create initial notifications
for i in {1..5}; do
  curl -X POST http://localhost:3001/api/notifications \
    -H "Content-Type: application/json" \
    -d "{\"message\":\"Demo notification $i\",\"type\":\"info\"}" \
    -s > /dev/null
done

echo "✅ Pre-demo setup complete!"
```

### Step 3: Open Browser Tabs

Open these in separate tabs (you'll switch between them):

1. **Frontend**: http://localhost:3000
2. **Kafka UI**: http://localhost:8080
3. **Grafana**: http://localhost:3002 (login: admin/admin)
4. **This Terminal**: For running commands

---

## 📋 Demo Flow

---

## PART 1: Architecture Overview (3 minutes)

### What You Say:

> "I'm going to show you a production-ready cloud-native application that demonstrates modern architectural patterns. This isn't a toy app - it's production-grade with everything you'd need in a real system."

### Show Architecture Diagram

Open `ARCHITECTURE.md` and show the architecture diagram, or draw on whiteboard:

```
Frontend (React)
    ↓
Backend API (Node.js + TypeScript)
    ↓
├─→ PostgreSQL (persistent data)
├─→ Redis (caching)
├─→ Kafka (event streaming)
    ↓
Batch Processor (background jobs)
    ↓
LGTM Stack (observability)
```

### Key Points:
- ✅ **Event-Driven**: Kafka for async communication
- ✅ **Batch Processing**: Scheduled jobs and queues
- ✅ **Real-time**: WebSocket & SSE
- ✅ **Persistent**: PostgreSQL with TypeORM
- ✅ **Fast**: Redis caching
- ✅ **Observable**: Full LGTM stack
- ✅ **Production-Ready**: Docker, K8s, Terraform

---

## PART 2: Real-Time Features (5 minutes)

### Demo: WebSocket Communication

**Tab**: Frontend (http://localhost:3000)

#### What You Say:
> "Let's start with real-time features. This uses WebSocket for bidirectional communication - perfect for chat apps, live notifications, gaming, etc."

#### What You Do:

1. **Show WebSocket Section**
   - Point out the "WebSocket Demo" panel
   - Show connection status indicator (green = connected)
   - Show the messages area

2. **Send a Message**
   ```
   Type in input: "Hello from WebSocket!"
   Click "Send"
   ```
   - Point out: Message appears instantly
   - Show the timestamp
   - Click "Ping" button
   - Show "Pong" response

3. **Create a Notification** (open new terminal)
   ```bash
   curl -X POST http://localhost:3001/api/notifications \
     -H "Content-Type: application/json" \
     -d '{"message":"🚀 Real-time notification!","type":"success"}'
   ```
   - **Point out**: Notification appears instantly in WebSocket panel!

#### Key Points:
- ✅ Bidirectional communication
- ✅ Sub-millisecond latency
- ✅ Multiple clients stay in sync
- ✅ Built with Socket.io

---

### Demo: Server-Sent Events (SSE)

#### What You Say:
> "SSE is perfect for one-way streaming from server to client - like stock tickers, live scores, log streaming. It's simpler than WebSocket when you don't need bidirectional."

#### What You Do:

1. **Show SSE Section**
   - Click "Connect" button
   - Show connection established message

2. **Create Notifications** (in terminal)
   ```bash
   # Create multiple notifications rapidly
   for i in {1..3}; do
     curl -X POST http://localhost:3001/api/notifications \
       -H "Content-Type: application/json" \
       -d "{\"message\":\"SSE event $i\",\"type\":\"warning\"}"
     sleep 1
   done
   ```
   - **Watch**: Events stream in real-time to SSE panel!
   - Show auto-scrolling
   - Show event counter

#### Key Points:
- ✅ One-way streaming (server → client)
- ✅ Auto-reconnect on disconnect
- ✅ Built on HTTP (firewall-friendly)
- ✅ Perfect for event streams

---

## PART 3: Event-Driven Architecture (7 minutes)

### Demo: Kafka Message Flow

**Tab**: Kafka UI (http://localhost:8080)

#### What You Say:
> "Now let's see the event-driven architecture. When we create a notification, it doesn't just save to the database - it triggers a whole event flow through Kafka."

#### What You Do:

1. **Show Kafka Topics**
   - Click "Topics" in left menu
   - Show the topics:
     - `notifications` - Real-time notification events
     - `events` - Domain events (event sourcing)
     - `batch-jobs` - Batch processing triggers
     - `dead-letter-queue` - Failed messages

2. **Create a Notification**
   ```bash
   curl -X POST http://localhost:3001/api/notifications \
     -H "Content-Type: application/json" \
     -d '{"message":"Kafka demo notification","type":"info"}'
   ```

3. **View the Event in Kafka**
   - Click on "notifications" topic
   - Click "Messages" tab
   - Show the message that just appeared
   - Click on the message to see full JSON payload
   - Point out: timestamp, message content, metadata

4. **View Events Table** (in terminal)
   ```bash
   docker-compose exec postgres psql -U postgres -d demo_app -c \
     "SELECT id, \"eventType\", \"aggregateType\", \"createdAt\" FROM events ORDER BY \"createdAt\" DESC LIMIT 5;"
   ```
   - Show event sourcing in action
   - Every action is recorded as an event

#### Key Points:
- ✅ **Decoupled**: Services communicate via events
- ✅ **Scalable**: Add consumers without changing producers
- ✅ **Reliable**: Kafka guarantees message delivery
- ✅ **Auditable**: Every event is logged

---

### Demo: Batch Processor

#### What You Say:
> "The batch processor consumes events from Kafka and processes them asynchronously. It also runs scheduled jobs for things like cleanup, reports, and digests."

#### What You Do:

1. **Show Batch Processor Logs**
   ```bash
   docker-compose logs -f batch-processor | grep -i "processing\|notification\|batch"
   ```
   - Point out: Messages being consumed from Kafka
   - Show: Notification processing
   - Show: Status updates

2. **View Database Changes**
   ```bash
   docker-compose exec postgres psql -U postgres -d demo_app -c \
     "SELECT id, message, status, \"sentAt\", \"deliveredAt\" FROM notifications ORDER BY \"createdAt\" DESC LIMIT 5;"
   ```
   - Show notifications moving from `pending` → `sent` → `delivered`
   - Show timestamps being updated

3. **Show Batch Jobs**
   ```bash
   docker-compose exec postgres psql -U postgres -d demo_app -c \
     "SELECT id, type, status, \"processedCount\", \"createdAt\" FROM batch_jobs ORDER BY \"createdAt\" DESC LIMIT 3;"
   ```
   - Show scheduled jobs that have run

#### Key Points:
- ✅ **Async Processing**: Don't block API responses
- ✅ **Retry Logic**: Automatic retries with exponential backoff
- ✅ **Scheduled Jobs**: Daily cleanup, reports, digests
- ✅ **Queue-based**: BullMQ with Redis

---

## PART 4: Data Layer (5 minutes)

### Demo: PostgreSQL Database

#### What You Say:
> "PostgreSQL is our source of truth. We're using TypeORM which gives us type-safe queries, migrations, and a clean data model."

#### What You Do:

1. **Show Database Schema**
   ```bash
   docker-compose exec postgres psql -U postgres -d demo_app -c "\dt"
   ```
   - Show tables: `notifications`, `users`, `batch_jobs`, `events`

2. **Show Table Structure**
   ```bash
   docker-compose exec postgres psql -U postgres -d demo_app -c "\d notifications"
   ```
   - Point out: TypeScript types → Database columns
   - Show indexes for performance
   - Show foreign key relationships

3. **Query with Relations**
   ```bash
   docker-compose exec postgres psql -U postgres -d demo_app -c \
     "SELECT n.id, n.message, n.type, n.status, n.\"createdAt\" 
      FROM notifications n 
      ORDER BY n.\"createdAt\" DESC LIMIT 10;"
   ```

#### Key Points:
- ✅ **Type-Safe**: TypeORM with TypeScript
- ✅ **Migrations**: Version-controlled schema changes
- ✅ **Relations**: Proper foreign keys and joins
- ✅ **Indexes**: Optimized for performance

---

### Demo: Redis Caching

#### What You Say:
> "Redis gives us sub-millisecond response times. We use it for caching frequent queries and as a message bus for real-time features."

#### What You Do:

1. **Connect to Redis**
   ```bash
   docker-compose exec redis redis-cli
   ```

2. **Show Cache Keys**
   ```redis
   KEYS *
   ```
   - Show cached notification lists
   - Show BullMQ job queues

3. **Check a Cache Value**
   ```redis
   GET notifications:recent
   TTL notifications:recent
   ```
   - Show cached data
   - Show TTL (time-to-live)

4. **Exit Redis**
   ```redis
   EXIT
   ```

5. **Show Cache Performance**
   ```bash
   # First request (cache miss) - slow
   time curl -s http://localhost:3001/api/notifications > /dev/null
   
   # Second request (cache hit) - fast!
   time curl -s http://localhost:3001/api/notifications > /dev/null
   ```

#### Key Points:
- ✅ **Fast**: Sub-millisecond latency
- ✅ **Cache-Aside**: Automatic cache invalidation
- ✅ **Pub/Sub**: For WebSocket broadcasting
- ✅ **Job Queues**: BullMQ backend

---

## PART 5: Observability - LGTM Stack (8 minutes)

**Tab**: Grafana (http://localhost:3002)

#### What You Say:
> "This is the LGTM stack - the gold standard for cloud-native observability. Loki, Grafana, Tempo, Mimir. Every modern application needs this."

### Demo: Metrics (Mimir/Prometheus)

#### What You Do:

1. **Navigate to Explore**
   - Click "Explore" (compass icon)
   - Select "Prometheus" datasource

2. **Show Request Rate**
   ```promql
   rate(http_requests_total[5m])
   ```
   - Click "Run query"
   - Show the graph
   - Point out: requests per second by route

3. **Show Latency (P95)**
   ```promql
   histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))
   ```
   - Show 95th percentile latency
   - Point out: subsecond response times

4. **Show Cache Hit Rate**
   ```promql
   rate(cache_hits_total[5m]) / (rate(cache_hits_total[5m]) + rate(cache_misses_total[5m]))
   ```
   - Show cache performance
   - Point out: ~90%+ hit rate

5. **Show WebSocket Connections**
   ```promql
   websocket_connections_total
   ```
   - Show active connections

#### Key Points:
- ✅ **Metrics**: Request rate, latency, errors
- ✅ **Business Metrics**: Notifications sent, cache hits
- ✅ **Real-time**: Live dashboards
- ✅ **Alerting**: Set thresholds for alerts

---

### Demo: Logs (Loki)

#### What You Do:

1. **Switch to Loki**
   - In Explore, select "Loki" datasource

2. **Query Backend Logs**
   ```logql
   {service="backend"}
   ```
   - Show all backend logs
   - Point out: Structured JSON logs

3. **Filter for Notifications**
   ```logql
   {service="backend"} |= "notification"
   ```
   - Show only notification-related logs

4. **Query Error Logs**
   ```logql
   {service="backend"} | json | level="error"
   ```
   - Show error logs (if any)

5. **Show Log Rate**
   ```logql
   rate({service="backend"}[5m])
   ```
   - Show logs per second

#### Key Points:
- ✅ **Centralized**: All logs in one place
- ✅ **Searchable**: Fast queries with LogQL
- ✅ **Structured**: JSON logs for easy parsing
- ✅ **Correlation**: Link logs to traces

---

### Demo: Distributed Tracing (Tempo)

#### What You Do:

1. **Switch to Tempo**
   - In Explore, select "Tempo" datasource

2. **Search for Traces**
   - Service Name: `demo-backend`
   - Click "Run query"

3. **Open a Trace**
   - Click on a trace from the list
   - Show the trace timeline
   - Point out spans:
     - HTTP Request (parent span)
     - Database Query (child span)
     - Redis Get (child span)
     - Kafka Publish (child span)

4. **Show Trace Details**
   - Click on spans to see timing
   - Show total duration
   - Show service dependencies

#### Key Points:
- ✅ **Distributed Tracing**: Follow requests across services
- ✅ **Performance**: Find bottlenecks
- ✅ **Dependencies**: Visualize service interactions
- ✅ **Debugging**: Understand failure paths

---

### Demo: Dashboard

#### What You Do:

1. **Open Dashboard**
   - Click "Dashboards" (four squares icon)
   - Click "Browse"
   - Open "Demo Application Dashboard"

2. **Show All Together**
   - HTTP request rate graph
   - Latency percentiles
   - WebSocket connections
   - Redis operations
   - Cache hit rate gauge
   - Recent logs panel

3. **Generate Load** (optional)
   ```bash
   # In terminal
   for i in {1..20}; do
     curl -X POST http://localhost:3001/api/notifications \
       -H "Content-Type: application/json" \
       -d "{\"message\":\"Load test $i\",\"type\":\"info\"}" &
   done
   wait
   ```
   - Watch metrics spike in dashboard
   - Show real-time updates

#### Key Points:
- ✅ **Single Pane of Glass**: All metrics in one view
- ✅ **Real-time**: Updates every 5 seconds
- ✅ **Correlated**: Metrics + Logs + Traces
- ✅ **Actionable**: Alerts and notifications

---

## PART 6: Container & Cloud Native (5 minutes)

### Demo: Docker Compose

#### What You Say:
> "Everything runs in containers. Docker Compose for local development, Kubernetes for production."

#### What You Do:

1. **Show Running Containers**
   ```bash
   docker-compose ps
   ```
   - Point out 15+ services running
   - Show health status

2. **Show Docker Compose File**
   ```bash
   cat docker-compose.yml | head -50
   ```
   - Show service definitions
   - Point out: networks, volumes, health checks

3. **Show Container Logs**
   ```bash
   docker-compose logs --tail=20 backend
   ```

---

### Demo: Kubernetes (Optional - if you have K8s running)

#### What You Do:

```bash
# Show K8s manifests
ls -la k8s/

# Show deployment
cat k8s/backend-deployment.yaml | head -30

# If deployed to K8s:
kubectl get pods -n demo-app
kubectl get svc -n demo-app
kubectl get hpa -n demo-app
```

#### Key Points:
- ✅ **Scalable**: HPA auto-scales based on load
- ✅ **Resilient**: Self-healing, rolling updates
- ✅ **Portable**: Works on any K8s (EKS, DOKS, GKE)

---

### Demo: Terraform (Show Files)

#### What You Say:
> "Infrastructure as Code - entire cloud infrastructure defined in Terraform. One command deploys everything to AWS or DigitalOcean."

#### What You Do:

```bash
# Show Terraform structure
ls -la terraform/

# Show AWS resources
cat terraform/aws/eks.tf | head -20

# Show DigitalOcean resources
cat terraform/digitalocean/main.tf | head -20
```

#### Key Points:
- ✅ **Reproducible**: Same infrastructure every time
- ✅ **Version Controlled**: Infrastructure in Git
- ✅ **Multi-Cloud**: AWS and DigitalOcean ready
- ✅ **Production-Grade**: RDS, MSK, EKS

---

## PART 7: CI/CD with ArgoCD (3 minutes)

#### What You Say:
> "GitOps with ArgoCD. Push to Git, and ArgoCD automatically deploys to all clusters. No manual kubectl apply needed."

#### What You Do:

1. **Show GitHub Actions Workflow**
   ```bash
   cat .github/workflows/ci-cd.yaml | head -50
   ```
   - Point out: test → build → push → update manifests

2. **Show ArgoCD Configuration**
   ```bash
   cat argocd/applications/demo-app-multi-cluster.yaml
   ```
   - Show multi-cluster deployment
   - Point out: auto-sync, self-heal

3. **Explain Flow**
   ```
   Developer pushes code
        ↓
   GitHub Actions builds images
        ↓
   Updates K8s manifests in Git
        ↓
   ArgoCD detects change
        ↓
   Auto-deploys to: AWS EKS, DigitalOcean DOKS, Dev cluster
   ```

#### Key Points:
- ✅ **GitOps**: Git is source of truth
- ✅ **Automated**: No manual deployments
- ✅ **Multi-Cluster**: Deploy to multiple clouds
- ✅ **Rollback**: Revert any Git commit

---

## PART 8: Summary & Q&A (4 minutes)

### Recap What They Saw:

#### Architecture Patterns:
✅ **Event-Driven**: Kafka for async communication  
✅ **Batch Processing**: Scheduled jobs with BullMQ  
✅ **CQRS**: Separate read (Redis) and write (PostgreSQL)  
✅ **Event Sourcing**: Complete audit trail  

#### Technologies:
✅ **Backend**: Node.js, TypeScript, Express  
✅ **Frontend**: React, TypeScript, Vite  
✅ **Database**: PostgreSQL with TypeORM  
✅ **Cache**: Redis  
✅ **Message Queue**: Apache Kafka  
✅ **Observability**: LGTM Stack (Loki, Grafana, Tempo, Mimir)  

#### DevOps:
✅ **Containers**: Docker multi-stage builds  
✅ **Local Dev**: Docker Compose  
✅ **Orchestration**: Kubernetes with HPA  
✅ **IaC**: Terraform (AWS + DigitalOcean)  
✅ **CI/CD**: GitHub Actions + ArgoCD  

### Production-Ready Features:
✅ Health checks & readiness probes  
✅ Graceful shutdown  
✅ Resource limits  
✅ Security (non-root containers, secrets)  
✅ Monitoring & alerting  
✅ Distributed tracing  
✅ Auto-scaling  
✅ Multi-cloud support  

---

## 🎯 Talking Points for Different Audiences

### For Developers:
- "Type-safe end-to-end with TypeScript"
- "Event sourcing gives you complete audit trail"
- "WebSocket and SSE for real-time features"
- "BullMQ handles retry logic automatically"

### For Architects:
- "Event-driven architecture with Kafka"
- "CQRS pattern with read/write separation"
- "Distributed tracing for debugging microservices"
- "Multi-cloud deployment with single codebase"

### For DevOps/SRE:
- "Full observability with LGTM stack"
- "Infrastructure as Code with Terraform"
- "GitOps with ArgoCD - Git is source of truth"
- "Auto-scaling with Kubernetes HPA"

### For Management:
- "Production-ready, enterprise-grade patterns"
- "Scales from startup to enterprise"
- "Multi-cloud prevents vendor lock-in"
- "Complete monitoring reduces MTTR"

---

## 🧹 Post-Demo Cleanup

```bash
# Stop all services
docker-compose down

# Or clean everything including volumes
docker-compose down -v
```

---

## 💡 Pro Tips

1. **Practice First**: Run through once before the real demo
2. **Have Backup**: Pre-load data in case something fails
3. **Window Management**: Use separate browser windows/terminals
4. **Timing**: Adjust based on audience questions
5. **Engagement**: Ask "What patterns do you use?" throughout
6. **Terminal Size**: Increase font size for visibility
7. **Browser Zoom**: 125-150% for better visibility

---

## 🚨 Troubleshooting During Demo

### Services not responding?
```bash
docker-compose restart backend
docker-compose logs backend
```

### Kafka UI not showing messages?
- Wait 5-10 seconds, Kafka can lag slightly
- Refresh the browser

### Database query fails?
```bash
docker-compose restart postgres
# Wait 10 seconds
```

### Grafana not loading?
- Check login: admin/admin
- Restart: `docker-compose restart grafana`

---

## 📊 Success Metrics

After the demo, audience should understand:
- ✅ Event-driven architecture
- ✅ Batch processing vs. real-time
- ✅ Why observability matters
- ✅ How GitOps works
- ✅ Multi-cloud deployment
- ✅ Production-ready patterns

---

**Ready to demo?** Run through this script and showcase a production-grade cloud-native application! 🚀
