import client from 'prom-client';

// Create a Registry to register the metrics
export const register = new client.Registry();

// Add default metrics (CPU, memory, etc.)
client.collectDefaultMetrics({ register });

// Custom metrics
export const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 5],
  registers: [register],
});

export const httpRequestTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register],
});

export const websocketConnections = new client.Gauge({
  name: 'websocket_connections_total',
  help: 'Number of active WebSocket connections',
  registers: [register],
});

export const redisOperations = new client.Counter({
  name: 'redis_operations_total',
  help: 'Total number of Redis operations',
  labelNames: ['operation', 'status'],
  registers: [register],
});

export const cacheHitRate = new client.Counter({
  name: 'cache_hits_total',
  help: 'Total number of cache hits',
  labelNames: ['cache_type'],
  registers: [register],
});

export const cacheMissRate = new client.Counter({
  name: 'cache_misses_total',
  help: 'Total number of cache misses',
  labelNames: ['cache_type'],
  registers: [register],
});

export const notificationsSent = new client.Counter({
  name: 'notifications_sent_total',
  help: 'Total number of notifications sent',
  labelNames: ['type'],
  registers: [register],
});
