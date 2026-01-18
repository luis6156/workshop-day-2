import express, { Express } from 'express';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import { config } from './config';
import { logger } from './utils/logger';
import { metricsMiddleware } from './middleware/metrics.middleware';
import { loggerMiddleware } from './middleware/logger.middleware';
import apiRoutes from './routes/api.routes';
import metricsRoutes from './routes/metrics.routes';
import { notificationService } from './services/notification.service';
import { websocketConnections } from './utils/metrics';

export function createApp(): { app: Express; httpServer: any; io: SocketIOServer } {
  const app = express();
  const httpServer = createServer(app);
  
  // Initialize Socket.IO
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: config.cors.origin,
      methods: ['GET', 'POST'],
    },
  });

  // Middleware
  app.use(cors({ origin: config.cors.origin }));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(loggerMiddleware);
  app.use(metricsMiddleware);

  // Routes
  app.use('/api', apiRoutes);
  app.use(metricsRoutes);

  // Root endpoint
  app.get('/', (req, res) => {
    res.json({
      name: 'Cloud Native Demo API',
      version: '1.0.0',
      endpoints: {
        health: '/api/health',
        notifications: '/api/notifications',
        sse: '/api/sse/notifications',
        websocket: 'ws://localhost:' + config.port,
        metrics: '/metrics',
      },
    });
  });

  // WebSocket connection handling
  io.on('connection', (socket) => {
    websocketConnections.inc();
    logger.info('WebSocket client connected', { socketId: socket.id });

    // Send welcome message
    socket.emit('connected', {
      message: 'Connected to notification server',
      socketId: socket.id,
      timestamp: new Date().toISOString(),
    });

    // Subscribe to notifications and forward to this client
    notificationService.subscribeToNotifications((notification) => {
      socket.emit('notification', notification);
    });

    // Handle client messages
    socket.on('message', (data) => {
      logger.info('Message received from client', { socketId: socket.id, data });
      socket.emit('message-ack', { received: true, timestamp: new Date().toISOString() });
    });

    // Handle ping
    socket.on('ping', () => {
      socket.emit('pong', { timestamp: new Date().toISOString() });
    });

    // Handle disconnect
    socket.on('disconnect', (reason) => {
      websocketConnections.dec();
      logger.info('WebSocket client disconnected', { socketId: socket.id, reason });
    });

    // Handle errors
    socket.on('error', (error) => {
      logger.error('WebSocket error', { socketId: socket.id, error });
    });
  });

  // Error handling middleware
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    logger.error('Unhandled error:', err);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: config.nodeEnv === 'development' ? err.message : undefined,
    });
  });

  return { app, httpServer, io };
}
