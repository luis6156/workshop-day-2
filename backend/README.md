# Backend Service

Node.js/TypeScript backend service with WebSocket, SSE, Redis caching, and full LGTM observability.

## Features

- ✅ RESTful API with Express
- ✅ WebSocket real-time communication (Socket.io)
- ✅ Server-Sent Events (SSE) for streaming
- ✅ Redis caching and pub/sub
- ✅ Prometheus metrics
- ✅ Loki logging
- ✅ Tempo distributed tracing (OpenTelemetry)
- ✅ TypeScript for type safety

## Installation

```bash
npm install
```

## Development

```bash
# Start in development mode with hot reload
npm run dev

# Build TypeScript
npm run build

# Start production build
npm start
```

## API Endpoints

### REST API

- `GET /` - API information
- `GET /api/health` - Health check
- `GET /api/notifications` - Get notifications (cached)
- `POST /api/notifications` - Create notification
- `DELETE /api/notifications` - Clear cache
- `GET /api/cache-test` - Test Redis increment
- `GET /metrics` - Prometheus metrics

### Server-Sent Events

- `GET /api/sse/notifications` - Subscribe to notification stream

### WebSocket Events

Connect to `ws://localhost:3001`

**Server → Client:**
- `connected` - Connection established
- `notification` - New notification
- `pong` - Response to ping
- `message-ack` - Message acknowledgment

**Client → Server:**
- `message` - Send message
- `ping` - Ping server

## Environment Variables

Copy `.env.example` to `.env` and configure:

```env
PORT=3001
NODE_ENV=development
REDIS_HOST=localhost
REDIS_PORT=6379
CORS_ORIGIN=http://localhost:3000
LOKI_HOST=http://localhost:3100
TEMPO_ENDPOINT=http://localhost:4318/v1/traces
```

## Testing with cURL

```bash
# Health check
curl http://localhost:3001/api/health

# Get notifications
curl http://localhost:3001/api/notifications

# Create notification
curl -X POST http://localhost:3001/api/notifications \
  -H "Content-Type: application/json" \
  -d '{"message":"Test notification","type":"info"}'

# SSE stream
curl -N http://localhost:3001/api/sse/notifications

# Metrics
curl http://localhost:3001/metrics
```

## Testing WebSocket

```javascript
const socket = io('http://localhost:3001');

socket.on('connected', (data) => {
  console.log('Connected:', data);
});

socket.on('notification', (notification) => {
  console.log('Notification:', notification);
});

socket.emit('ping');
socket.on('pong', (data) => {
  console.log('Pong:', data);
});
```

## Observability

### Metrics (Prometheus)
Available at `/metrics` endpoint:
- `http_request_duration_seconds` - Request latency
- `http_requests_total` - Total requests
- `websocket_connections_total` - Active WebSocket connections
- `redis_operations_total` - Redis operations
- `cache_hits_total` / `cache_misses_total` - Cache performance
- `notifications_sent_total` - Notifications sent

### Logs (Loki)
Structured JSON logs with Winston:
- Request/response logging
- Error tracking
- Redis operations
- WebSocket events

### Traces (Tempo)
OpenTelemetry automatic instrumentation:
- HTTP requests
- Redis operations
- Custom spans

## Architecture

```
┌─────────────────────┐
│   Express Server    │
├─────────────────────┤
│ - REST API          │
│ - SSE Endpoint      │
│ - Metrics Endpoint  │
└─────────────────────┘
         │
         ├──────────────┐
         │              │
┌────────▼────────┐ ┌──▼───────────────┐
│  Socket.IO      │ │  Redis Service   │
│  WebSocket      │ │  - Cache         │
│  Server         │ │  - Pub/Sub       │
└─────────────────┘ └──────────────────┘
         │
         ▼
┌─────────────────────┐
│ Notification Service│
└─────────────────────┘
```

## License

MIT
