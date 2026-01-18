# 🎬 Demo Quick Reference Card

**Print this or keep it on a second monitor during your demo!**

---

## ⚡ Quick Start

```bash
# Start everything
cd /Users/fmicu/Desktop/workshop-day2
docker-compose up -d

# Wait 60 seconds, then verify
docker-compose ps
```

---

## 🌐 Open These URLs

| Service | URL | Login |
|---------|-----|-------|
| Frontend | http://localhost:3000 | - |
| Kafka UI | http://localhost:8080 | - |
| Grafana | http://localhost:3002 | admin/admin |

---

## 🎯 Demo Flow (30 min)

1. **Architecture** (3 min) - Show diagram
2. **Real-time** (5 min) - WebSocket + SSE
3. **Event-Driven** (7 min) - Kafka + Batch Processor
4. **Data Layer** (5 min) - PostgreSQL + Redis
5. **Observability** (8 min) - LGTM Stack
6. **Cloud Native** (5 min) - Docker + K8s + Terraform
7. **CI/CD** (3 min) - ArgoCD + GitHub Actions
8. **Q&A** (4 min)

---

## 💬 Key Commands

### Create Notification
```bash
curl -X POST http://localhost:3001/api/notifications \
  -H "Content-Type: application/json" \
  -d '{"message":"Demo notification","type":"info"}'
```

### View Database
```bash
docker-compose exec postgres psql -U postgres -d demo_app -c \
  "SELECT * FROM notifications ORDER BY \"createdAt\" DESC LIMIT 5;"
```

### View Redis
```bash
docker-compose exec redis redis-cli
KEYS *
GET notifications:recent
EXIT
```

### View Logs
```bash
docker-compose logs -f backend
docker-compose logs -f batch-processor
```

### Generate Load
```bash
for i in {1..10}; do
  curl -X POST http://localhost:3001/api/notifications \
    -H "Content-Type: application/json" \
    -d "{\"message\":\"Load test $i\",\"type\":\"info\"}" &
done
wait
```

---

## 📊 Grafana Queries

### Prometheus (Metrics)
```promql
# Request rate
rate(http_requests_total[5m])

# P95 latency
histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))

# Cache hit rate
rate(cache_hits_total[5m]) / (rate(cache_hits_total[5m]) + rate(cache_misses_total[5m]))

# WebSocket connections
websocket_connections_total
```

### Loki (Logs)
```logql
# All backend logs
{service="backend"}

# Notification logs
{service="backend"} |= "notification"

# Error logs
{service="backend"} | json | level="error"
```

---

## 🎤 Key Talking Points

### Architecture
- "Event-driven with Kafka"
- "Batch processing with BullMQ"
- "Full CQRS with read/write separation"
- "Event sourcing for audit trails"

### Real-time
- "WebSocket: bidirectional, sub-millisecond"
- "SSE: one-way streaming, HTTP-based"
- "Redis pub/sub for broadcasting"

### Data
- "PostgreSQL with TypeORM - type-safe"
- "Redis for caching - sub-millisecond reads"
- "Kafka for events - guaranteed delivery"

### Observability
- "LGTM = Loki, Grafana, Tempo, Mimir"
- "Metrics, logs, and traces - all correlated"
- "Production-grade observability"

### DevOps
- "GitOps with ArgoCD - Git is source of truth"
- "Multi-cloud: AWS and DigitalOcean"
- "Infrastructure as Code with Terraform"

---

## 🚨 Emergency Fixes

### Service Not Responding
```bash
docker-compose restart <service-name>
docker-compose logs <service-name>
```

### Reset Everything
```bash
docker-compose down -v
docker-compose up -d
# Wait 60 seconds
```

### Out of Memory
```bash
# Stop monitoring services temporarily
docker-compose stop mimir tempo
```

---

## ✅ Success Checklist

Before demo:
- [ ] All services running (`docker-compose ps`)
- [ ] Frontend loads (http://localhost:3000)
- [ ] Kafka UI loads (http://localhost:8080)
- [ ] Grafana loads (http://localhost:3002)
- [ ] Can create notification via curl
- [ ] Terminal font is LARGE
- [ ] Browser zoom is 125-150%

During demo:
- [ ] Speak clearly and slowly
- [ ] Show, don't just tell
- [ ] Pause for questions
- [ ] Use audience-appropriate language

After demo:
- [ ] Answer all questions
- [ ] Share GitHub repo link
- [ ] Offer to dive deeper on any topic

---

## 🎯 Time Management

If running short:
- ✂️ Skip Terraform files (just mention it)
- ✂️ Skip Redis demo (mention caching)
- ✂️ Reduce Grafana queries (show dashboard only)

If running long:
- ➕ Deep dive into event sourcing
- ➕ Show Kubernetes scaling
- ➕ Demonstrate ArgoCD sync
- ➕ Show multi-cloud deployment

---

## 📱 Backup Plan

If Docker fails:
1. Switch to screenshots/slides
2. Show code walkthrough instead
3. Discuss architecture patterns
4. Q&A session

Have these ready:
- Architecture diagram
- Screenshots of running app
- Code examples
- Grafana dashboard screenshots

---

## 🎬 Opening Line

> "Today I'm going to show you a production-ready cloud-native application that demonstrates everything you need for modern software: event-driven architecture, batch processing, real-time communication, and full observability. This isn't a toy app - this is production-grade code that you could deploy today."

## 🎬 Closing Line

> "What you've seen is a complete cloud-native application with patterns you can use in production today. All the code is on GitHub, fully documented. Any questions?"

---

**You got this! 🚀**
