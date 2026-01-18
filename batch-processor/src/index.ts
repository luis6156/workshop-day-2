import 'reflect-metadata';
import { AppDataSource } from './database/data-source';
import { kafkaService } from './services/kafka.service';
import { batchJobProcessor } from './processors/batch-job.processor';
import { notificationProcessor } from './processors/notification.processor';
import { logger } from './utils/logger';

async function main() {
  try {
    logger.info('🚀 Starting Batch Processor Service');

    // Initialize database
    await AppDataSource.initialize();
    logger.info('✓ Database connected');

    // Initialize Kafka
    await kafkaService.connect();
    logger.info('✓ Kafka connected');

    // Start processors
    await batchJobProcessor.start();
    logger.info('✓ Batch job processor started');

    await notificationProcessor.start();
    logger.info('✓ Notification processor started');

    logger.info('✅ Batch Processor Service is running');

    // Graceful shutdown
    process.on('SIGTERM', async () => {
      logger.info('SIGTERM received, shutting down gracefully');
      await shutdown();
    });

    process.on('SIGINT', async () => {
      logger.info('SIGINT received, shutting down gracefully');
      await shutdown();
    });
  } catch (error) {
    logger.error('Failed to start batch processor:', error);
    process.exit(1);
  }
}

async function shutdown() {
  try {
    await batchJobProcessor.stop();
    await notificationProcessor.stop();
    await kafkaService.disconnect();
    await AppDataSource.destroy();
    logger.info('✓ Batch processor shut down successfully');
    process.exit(0);
  } catch (error) {
    logger.error('Error during shutdown:', error);
    process.exit(1);
  }
}

main();
