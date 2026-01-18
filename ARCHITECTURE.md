# Architecture Documentation

## Overview

This application demonstrates a modern cloud-native architecture combining **event-driven** and **batch processing** patterns with comprehensive observability.

## Key Architectural Patterns

### 1. Event-Driven Architecture (EDA)

**Pattern**: Asynchronous, event-based communication using Kafka

**Use Cases**:
- Real-time notification processing
- Event sourcing for audit trails
- Decoupled service communication
- Scalable message processing

**Implementation**:
```
Producer (Backend) → Kafka Topics → Consumer (Batch Processor)
                          ↓
                    Event Store (PostgreSQL)
```

**Topics**:
- `notifications` - Notification events
- `events` - Domain events (event sourcing)
- `batch-jobs` - Batch job triggers
- `dead-letter-queue` - Failed message handling

### 2. Batch Processing Architecture

**Pattern**: Scheduled and on-demand bulk data processing using BullMQ

**Use Cases**:
- Notification digests (daily/weekly summaries)
- Data cleanup and archival
- Report generation
- User synchronization from external systems

**Implementation**:
```
Scheduler → BullMQ Queue → Worker Pool → Database
     ↓            ↓             ↓            ↓
  Cron Job   Redis Store   Concurrent   PostgreSQL
                          Processing
```

**Job Types**:
- **Notification Digest**: Aggregate notifications per user
- **Data Cleanup**: Remove old records (30-day retention)
- **Report Generation**: Generate analytics reports
- **User Sync**: Sync from external identity providers

### 3. CQRS (Command Query Responsibility Segregation)

**Pattern**: Separate read and write models

**Write Side** (Commands):
- Direct PostgreSQL writes for consistency
- Publish events to Kafka
- Strong consistency guarantees

**Read Side** (Queries):
- Redis cache for frequently accessed data
- PostgreSQL for complex queries
- Eventual consistency acceptable

**Example Flow**:
```
Create Notification (Write)
    ↓
PostgreSQL Write
    ↓
Publish to Kafka
    ↓
Update Redis Cache (Async)
    ↓
Query reads from Redis (Read)
```

### 4. Event Sourcing

**Pattern**: Store all changes as a sequence of events

**Benefits**:
- Complete audit trail
- Event replay capability
- Temporal queries
- Debug and analytics

**Implementation**:
- Events stored in `events` table
- Each event links to aggregate (notification, user, batch_job)
- Events published to Kafka for processing
- Immutable event log

### 5. Saga Pattern (Distributed Transactions)

**Pattern**: Manage data consistency across services using events

**Example**: Notification Creation Saga
```
1. Create Notification (PostgreSQL)
2. Publish Event (Kafka)
3. Process Notification (Batch Processor)
4. Update Status (PostgreSQL)
5. Notify Client (WebSocket)

If step fails → Compensating transaction
```

## Data Models

### Core Entities

**Notification**
```typescript
{
  id: uuid
  message: string
  type: enum (info, success, warning, error)
  status: enum (pending, sent, delivered, failed)
  userId: uuid (foreign key)
  metadata: jsonb
  retryCount: int
  sentAt: timestamp
  deliveredAt: timestamp
  createdAt: timestamp
  updatedAt: timestamp
}
```

**User**
```typescript
{
  id: uuid
  email: string (unique)
  name: string
  isActive: boolean
  preferences: jsonb
  lastLoginAt: timestamp
  createdAt: timestamp
  updatedAt: timestamp
}
```

**BatchJob**
```typescript
{
  id: uuid
  type: enum (notification_digest, data_cleanup, report_generation, user_sync)
  status: enum (pending, running, completed, failed, cancelled)
  parameters: jsonb
  result: jsonb
  processedCount: int
  failedCount: int
  totalCount: int
  scheduledAt: timestamp
  startedAt: timestamp
  completedAt: timestamp
  durationMs: int
}
```

**Event**
```typescript
{
  id: uuid
  eventType: enum
  aggregateId: uuid
  aggregateType: string
  payload: jsonb
  metadata: jsonb
  processed: boolean
  processedAt: timestamp
  createdAt: timestamp
}
```

## Service Communication

### Synchronous Communication
- **REST API**: Client ↔ Backend
- **WebSocket**: Real-time bidirectional (Socket.io)
- **SSE**: Server-to-client streaming

### Asynchronous Communication
- **Kafka**: Service-to-service events
- **Redis Pub/Sub**: Internal cache invalidation
- **BullMQ**: Job queue management

## Scalability Patterns

### Horizontal Scaling
- **Backend**: Stateless, scale behind load balancer
- **Batch Processor**: Multiple workers, Kafka consumer groups
- **Database**: Read replicas, connection pooling
- **Kafka**: Partitioned topics for parallel processing

### Vertical Scaling
- **PostgreSQL**: Increase resources for complex queries
- **Redis**: In-memory performance optimization
- **Kafka**: Broker resources for high throughput

### Caching Strategy

**Multi-Level Caching**:
```
L1: In-Memory Cache (Application)
L2: Redis Cache (Distributed)
L3: Database Query Result Cache
```

**Cache Invalidation**:
- **Time-based**: TTL expiration (5 minutes default)
- **Event-based**: Invalidate on write operations
- **Manual**: API endpoint for cache clearing

## Resilience Patterns

### 1. Circuit Breaker
- Protect against cascading failures
- Automatic fallback to cached data
- Health check integration

### 2. Retry with Exponential Backoff
```
Attempt 1: Immediate
Attempt 2: 2 seconds delay
Attempt 3: 4 seconds delay
Max Attempts: 3
```

### 3. Dead Letter Queue
- Failed messages → DLQ topic
- Manual inspection and replay
- Error analysis and debugging

### 4. Graceful Degradation
- Continue with reduced functionality
- Cache serving when database unavailable
- Queue messages for later processing

## Observability Architecture

### Metrics (Prometheus/Mimir)
**Application Metrics**:
- `http_requests_total` - Request count
- `http_request_duration_seconds` - Latency
- `websocket_connections_total` - Active connections
- `redis_operations_total` - Cache operations
- `kafka_messages_processed_total` - Message throughput
- `batch_job_duration_seconds` - Job execution time

**Business Metrics**:
- `notifications_sent_total` - By type
- `cache_hit_rate` - Cache performance
- `event_processing_lag` - Kafka lag

### Logs (Loki)
**Structured Logging**:
```json
{
  "level": "info",
  "message": "Notification created",
  "service": "backend",
  "notificationId": "uuid",
  "userId": "uuid",
  "type": "info",
  "timestamp": "2026-01-18T12:00:00Z"
}
```

**Log Aggregation**:
- All services → Promtail → Loki
- Label-based indexing
- Fast queries with LogQL

### Traces (Tempo)
**Distributed Tracing**:
```
Request ID: trace-123
├── Backend API (span-1) [100ms]
│   ├── Database Query (span-2) [50ms]
│   ├── Redis Get (span-3) [5ms]
│   └── Kafka Publish (span-4) [10ms]
└── Batch Processor (span-5) [200ms]
    ├── Kafka Consume (span-6) [10ms]
    └── Database Update (span-7) [150ms]
```

## Security Architecture

### Authentication & Authorization
- JWT-based authentication (ready for implementation)
- Role-based access control (RBAC)
- Service-to-service authentication

### Data Security
- Encryption at rest (PostgreSQL, Redis)
- Encryption in transit (TLS/SSL)
- Secrets management (Kubernetes secrets, AWS Secrets Manager)

### Network Security
- Private subnets for data layer
- Security groups/Network policies
- VPN access for databases

## Deployment Architecture

### Local Development
```
Docker Compose
├── Application Services
├── Data Stores
├── Message Queue
└── Monitoring Stack
```

### Kubernetes (Production)
```
EKS Cluster
├── Application Namespace
│   ├── Backend (3+ replicas, HPA)
│   ├── Frontend (2+ replicas)
│   └── Batch Processor (1-5 replicas)
├── Data Namespace
│   ├── PostgreSQL (StatefulSet, PVC)
│   └── Redis (Deployment)
├── Kafka Namespace
│   └── Kafka Cluster (3 brokers)
└── Monitoring Namespace
    └── LGTM Stack
```

### AWS Infrastructure (Terraform)
```
VPC
├── Public Subnets (NAT, Load Balancers)
├── Private Subnets (EKS Nodes, RDS, ElastiCache)
├── EKS Cluster (Managed Kubernetes)
├── RDS PostgreSQL (Multi-AZ)
├── ElastiCache Redis (Cluster mode)
└── MSK (Managed Kafka)
```

## Performance Considerations

### Database Optimization
- **Indexes**: On foreign keys, status fields, timestamps
- **Partitioning**: Time-based for large tables
- **Connection Pooling**: 20 connections per service
- **Query Optimization**: Explain plans, N+1 prevention

### Kafka Optimization
- **Partitions**: 3-10 per topic for parallelism
- **Batch Size**: 100-1000 messages
- **Compression**: Snappy/LZ4
- **Consumer Groups**: Parallel processing

### Redis Optimization
- **Data Structures**: Use appropriate types (hashes, sets, sorted sets)
- **Pipelining**: Batch operations
- **Eviction Policy**: LRU for cache
- **Persistence**: AOF + RDB for durability

## Disaster Recovery

### Backup Strategy
- **PostgreSQL**: Daily full + WAL archiving
- **Redis**: RDB snapshots every 6 hours
- **Kafka**: Topic replication factor 3

### Recovery Procedures
- **Database**: Point-in-time recovery (PITR)
- **Events**: Replay from Kafka (7-day retention)
- **State**: Rebuild from event store

## Future Enhancements

### Planned Features
- [ ] GraphQL API (Apollo Server)
- [ ] gRPC for inter-service communication
- [ ] NATS for lightweight messaging
- [ ] Apache Flink for stream processing
- [ ] Elasticsearch for advanced search
- [ ] ML-based notification routing

### Architectural Evolution
- [ ] Microservices decomposition
- [ ] Service mesh (Istio/Linkerd)
- [ ] Multi-region deployment
- [ ] CQRS with separate read stores
- [ ] Event streaming analytics

## Conclusion

This architecture demonstrates enterprise-grade patterns for building scalable, resilient, and observable cloud-native applications. It combines the best of event-driven and batch processing paradigms while maintaining operational excellence through comprehensive monitoring and logging.
