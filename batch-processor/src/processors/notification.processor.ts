import { kafkaService, KafkaTopics } from '../services/kafka.service';
import { AppDataSource } from '../../../../backend/src/database/data-source';
import { Notification, NotificationStatus } from '../../../../backend/src/database/entities/Notification';
import { logger } from '../utils/logger';

class NotificationProcessor {
  private notificationRepository = AppDataSource.getRepository(Notification);
  private isProcessing = false;

  async start() {
    // Subscribe to notification events from Kafka
    await kafkaService.subscribe(
      KafkaTopics.NOTIFICATIONS,
      this.processNotification.bind(this),
      'notification-processor'
    );

    // Start periodic batch processing
    this.startBatchProcessing();

    logger.info('✓ Notification processor started');
  }

  async stop() {
    this.isProcessing = false;
    logger.info('✓ Notification processor stopped');
  }

  private async processNotification(message: any): Promise<void> {
    const { id, message: text, type, userId } = message;

    logger.info('Processing notification from Kafka', { id, type, userId });

    try {
      // Simulate notification sending (email, push, SMS, etc.)
      await this.sendNotification(id, text, type);

      // Update status to sent
      await this.notificationRepository.update(id, {
        status: NotificationStatus.SENT,
        sentAt: new Date(),
      });

      logger.info('Notification sent successfully', { id });

      // Simulate delivery confirmation with delay
      setTimeout(async () => {
        await this.notificationRepository.update(id, {
          status: NotificationStatus.DELIVERED,
          deliveredAt: new Date(),
        });
        logger.info('Notification delivered', { id });
      }, 1000);
    } catch (error: any) {
      logger.error('Failed to process notification', { id, error: error.message });

      // Update retry count
      const notification = await this.notificationRepository.findOne({ where: { id } });
      
      if (notification) {
        const retryCount = (notification.retryCount || 0) + 1;

        if (retryCount >= 3) {
          // Max retries reached, mark as failed
          await this.notificationRepository.update(id, {
            status: NotificationStatus.FAILED,
            retryCount,
            errorMessage: error.message,
          });
          logger.error('Notification failed after max retries', { id, retryCount });
        } else {
          // Schedule retry
          await this.notificationRepository.update(id, {
            retryCount,
          });
          
          // Re-publish to Kafka for retry
          setTimeout(async () => {
            await kafkaService.publish(KafkaTopics.NOTIFICATIONS, message, id);
            logger.info('Notification re-queued for retry', { id, retryCount });
          }, 2000 * retryCount); // Exponential backoff
        }
      }
    }
  }

  private async sendNotification(id: string, message: string, type: string): Promise<void> {
    // Simulate actual notification sending
    // In production, this would integrate with:
    // - SendGrid/AWS SES for email
    // - Firebase/SNS for push notifications
    // - Twilio for SMS
    // - Slack/Discord webhooks
    
    return new Promise((resolve, reject) => {
      // Simulate network delay
      setTimeout(() => {
        // Simulate 5% failure rate
        if (Math.random() < 0.05) {
          reject(new Error('Simulated notification sending failure'));
        } else {
          logger.debug('Notification sent via external service', { id, type });
          resolve();
        }
      }, 100);
    });
  }

  private startBatchProcessing() {
    this.isProcessing = true;

    // Process pending notifications in batches every 30 seconds
    const interval = setInterval(async () => {
      if (!this.isProcessing) {
        clearInterval(interval);
        return;
      }

      try {
        await this.processPendingBatch();
      } catch (error) {
        logger.error('Error in batch processing:', error);
      }
    }, 30000); // 30 seconds

    logger.info('✓ Batch processing started (30s interval)');
  }

  private async processPendingBatch(): Promise<void> {
    const batchSize = 100;

    // Get pending notifications
    const pendingNotifications = await this.notificationRepository.find({
      where: { status: NotificationStatus.PENDING },
      take: batchSize,
      order: { createdAt: 'ASC' },
    });

    if (pendingNotifications.length === 0) {
      logger.debug('No pending notifications to process');
      return;
    }

    logger.info(`Processing batch of ${pendingNotifications.length} notifications`);

    // Process in parallel with concurrency limit
    const concurrency = 10;
    for (let i = 0; i < pendingNotifications.length; i += concurrency) {
      const batch = pendingNotifications.slice(i, i + concurrency);
      
      await Promise.allSettled(
        batch.map((notification) =>
          this.processNotification({
            id: notification.id,
            message: notification.message,
            type: notification.type,
            userId: notification.userId,
          })
        )
      );
    }

    logger.info(`Batch processing completed: ${pendingNotifications.length} notifications`);
  }
}

export const notificationProcessor = new NotificationProcessor();
