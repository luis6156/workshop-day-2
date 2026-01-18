# Monitoring Stack (LGTM)

Complete observability stack using Grafana's LGTM (Loki, Grafana, Tempo, Mimir).

## Components

### 📊 Grafana (Port 3002)
- **Purpose**: Visualization and dashboarding
- **Access**: http://localhost:3002
- **Credentials**: admin / admin
- **Features**:
  - Pre-configured datasources
  - Custom dashboards
  - Alerting
  - Explore views

### 📝 Loki (Port 3100)
- **Purpose**: Log aggregation and querying
- **Features**:
  - Efficient log storage
  - Label-based indexing
  - LogQL query language
  - 7-day retention

### 🔍 Tempo (Ports 3200, 4317, 4318)
- **Purpose**: Distributed tracing
- **Features**:
  - OpenTelemetry compatible
  - Trace ID lookup
  - Service graph
  - Trace to logs/metrics correlation

### 📈 Mimir (Port 9009)
- **Purpose**: Long-term metrics storage
- **Features**:
  - Prometheus compatible
  - Horizontal scalability
  - Multi-tenancy support
  - Query federation

### 🎯 Prometheus (Port 9090)
- **Purpose**: Metrics collection and short-term storage
- **Features**:
  - Service discovery
  - PromQL queries
  - Remote write to Mimir
  - Self-monitoring

### 📦 Promtail
- **Purpose**: Log shipping to Loki
- **Features**:
  - Docker log collection
  - Label extraction
  - Service discovery

## Quick Start

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f grafana

# Stop all services
docker-compose down
```

## Data Flow

```
┌─────────────────────────────────────────┐
│           Application Layer              │
├─────────────────────────────────────────┤
│  Backend ──┬─► Metrics ──► Prometheus   │
│            ├─► Logs ────► Loki          │
│            └─► Traces ──► Tempo         │
└─────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────┐
│          Storage & Processing            │
├─────────────────────────────────────────┤
│  Prometheus ──► Mimir (long-term)       │
│  Promtail ────► Loki                    │
│  OTLP ────────► Tempo                   │
└─────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────┐
│          Visualization Layer             │
├─────────────────────────────────────────┤
│  Grafana ◄─┬─ Mimir/Prometheus          │
│            ├─ Loki                      │
│            └─ Tempo                     │
└─────────────────────────────────────────┘
```

## Accessing Services

### Grafana Dashboards
1. Open http://localhost:3002
2. Login with admin/admin
3. Navigate to Dashboards → Browse
4. Open "Demo Application Dashboard"

### Exploring Logs
1. In Grafana, go to Explore
2. Select "Loki" datasource
3. Use LogQL: `{service="backend"} |= "error"`

### Viewing Traces
1. In Grafana, go to Explore
2. Select "Tempo" datasource
3. Search by trace ID or service name

### Prometheus Metrics
1. Open http://localhost:9090
2. Use PromQL queries:
   - `rate(http_requests_total[5m])`
   - `websocket_connections_total`
   - `redis_operations_total`

## Key Metrics

### Application Metrics
- `http_request_duration_seconds` - Request latency histogram
- `http_requests_total` - Total HTTP requests counter
- `websocket_connections_total` - Active WebSocket connections
- `redis_operations_total` - Redis operations by type
- `cache_hits_total` / `cache_misses_total` - Cache performance
- `notifications_sent_total` - Notifications sent by type

### System Metrics
- CPU usage
- Memory usage
- Network I/O
- Disk I/O

## LogQL Examples

```logql
# All backend logs
{service="backend"}

# Error logs only
{service="backend"} |= "error"

# JSON parsing
{service="backend"} | json | level="error"

# Rate of errors
rate({service="backend"} |= "error"[5m])
```

## PromQL Examples

```promql
# Request rate
rate(http_requests_total[5m])

# P95 latency
histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))

# Cache hit ratio
rate(cache_hits_total[5m]) / (rate(cache_hits_total[5m]) + rate(cache_misses_total[5m]))

# Error rate
rate(http_requests_total{status_code=~"5.."}[5m])
```

## Troubleshooting

### Logs not appearing in Loki
- Check Promtail is running: `docker-compose ps promtail`
- Verify Loki connectivity: `curl http://localhost:3100/ready`
- Check Promtail logs: `docker-compose logs promtail`

### Traces not appearing in Tempo
- Verify OTLP endpoint is accessible
- Check Tempo logs: `docker-compose logs tempo`
- Ensure application is sending traces

### Metrics not in Grafana
- Check Prometheus targets: http://localhost:9090/targets
- Verify backend `/metrics` endpoint
- Check Prometheus logs: `docker-compose logs prometheus`

## Data Retention

- **Loki**: 7 days (168h)
- **Tempo**: 7 days (168h)
- **Prometheus**: 7 days
- **Mimir**: Configurable (default: unlimited)

## Configuration Files

- `prometheus/prometheus.yml` - Prometheus config
- `loki/loki-config.yaml` - Loki config
- `tempo/tempo-config.yaml` - Tempo config
- `mimir/mimir-config.yaml` - Mimir config
- `promtail/promtail-config.yaml` - Promtail config
- `grafana/provisioning/` - Grafana datasources and dashboards

## Performance Tuning

### For Development
Current settings are optimized for local development with minimal resource usage.

### For Production
Consider:
- Increase retention periods
- Add more Mimir replicas
- Configure object storage (S3, GCS)
- Enable authentication
- Set up alerting rules
- Configure backup strategies

## License

MIT
