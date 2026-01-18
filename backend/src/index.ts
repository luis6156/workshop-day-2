import 'reflect-metadata';
import { config } from './config';
import { logger } from './utils/logger';
import { startTracing, shutdownTracing } from './utils/tracing';
import { createApp } from './app';
import { redisService } from './services/redis.service';
import { initializeDatabase, closeDatabase } from './database/data-source';
import { kafkaService } from './services/kafka.service';

async function startServer() {
  try {
    // Start OpenTelemetry tracing
    if (config.nodeEnv === 'production') {
      startTracing();
    }

    // Initialize database
    await initializeDatabase();
    logger.info('✓ Database initialized');

    // Initialize Kafka
    try {
      await kafkaService.connect();
      logger.info('✓ Kafka connected');
    } catch (error) {
      logger.warn('⚠ Kafka connection failed, continuing without Kafka', { error });
    }

    // Create Express app with WebSocket support
    const { app, httpServer, io } = createApp();

    // Start the server
    const server = httpServer.listen(config.port, () => {
      logger.info(`🚀 Server started on port ${config.port}`);
      logger.info(`📊 Environment: ${config.nodeEnv}`);
      logger.info(`💾 Database: ${config.database.host}:${config.database.port}`);
      logger.info(`📮 Kafka: ${config.kafka.brokers.join(', ')}`);
      logger.info(`📡 WebSocket: ws://localhost:${config.port}`);
      logger.info(`🔄 SSE: http://localhost:${config.port}/api/sse/notifications`);
      logger.info(`📈 Metrics: http://localhost:${config.port}/metrics`);
      logger.info(`💚 Health: http://localhost:${config.port}/api/health`);
    });

    return { server, io };
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

  // Graceful shutdown
  process.on('SIGTERM', async () => {
    logger.info('SIGTERM signal received: closing HTTP server');
    await shutdown();
  });

  process.on('SIGINT', async () => {
    logger.info('SIGINT signal received: closing HTTP server');
    await shutdown();
  });
}

async function shutdown() {
  try {
    const { server, io } = await startServer();
    
    if (server) {
      server.close(() => {
        logger.info('HTTP server closed');
      });
    }
    
    if (io) {
      io.close(() => {
        logger.info('Socket.IO server closed');
      });
    }
    
    // Disconnect from services
    await redisService.disconnect();
    await kafkaService.disconnect();
    await closeDatabase();
    
    // Shutdown tracing
    if (config.nodeEnv === 'production') {
      await shutdownTracing();
    }
    
    logger.info('✓ Graceful shutdown completed');
    process.exit(0);
  } catch (error) {
    logger.error('Error during shutdown:', error);
    process.exit(1);
  }
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

export { app, httpServer, io };
