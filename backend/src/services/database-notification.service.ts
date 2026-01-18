import { AppDataSource } from '../database/data-source';
import {
  Notification,
  NotificationType,
  NotificationStatus,
} from '../database/entities/Notification';
import { eventService } from './event.service';
import { EventType } from '../database/entities/Event';
import { kafkaService, KafkaTopics } from './kafka.service';
import { redisService } from './redis.service';
import { logger } from '../utils/logger';
import { notificationsSent } from '../utils/metrics';

class DatabaseNotificationService {
  private notificationRepository = AppDataSource.getRepository(Notification);
  private readonly CACHE_KEY = 'notifications:recent';
  private readonly CACHE_TTL = 300; // 5 minutes

  async createNotification(
    message: string,
    type: NotificationType = NotificationType.INFO,
    userId?: string,
    metadata?: Record<string, any>
  ): Promise<Notification> {
    try {
      // Create notification in database
      const notification = this.notificationRepository.create({
        message,
        type,
        userId,
        metadata,
        status: NotificationStatus.PENDING,
      });

      const savedNotification = await this.notificationRepository.save(notification);

      logger.info('Notification created', {
        notificationId: savedNotification.id,
        type,
        userId,
      });

      // Publish event for event-driven processing
      await eventService.publishEvent(
        EventType.NOTIFICATION_CREATED,
        savedNotification.id,
        'notification',
        {
          message: savedNotification.message,
          type: savedNotification.type,
          userId: savedNotification.userId,
        },
        { source: 'api' }
      );

      // Publish to Kafka for real-time processing
      await kafkaService.publish(
        KafkaTopics.NOTIFICATIONS,
        {
          id: savedNotification.id,
          message: savedNotification.message,
          type: savedNotification.type,
          userId: savedNotification.userId,
          metadata: savedNotification.metadata,
          status: savedNotification.status,
          timestamp: savedNotification.createdAt,
        },
        savedNotification.id
      );

      // Invalidate cache
      await redisService.delete(this.CACHE_KEY);

      // Update metrics
      notificationsSent.inc({ type: savedNotification.type });

      return savedNotification;
    } catch (error) {
      logger.error('Failed to create notification:', error);
      throw error;
    }
  }

  async getNotifications(
    limit: number = 50,
    offset: number = 0,
    userId?: string
  ): Promise<{ notifications: Notification[]; total: number }> {
    try {
      // Try cache first
      const cacheKey = `${this.CACHE_KEY}:${userId || 'all'}:${limit}:${offset}`;
      const cached = await redisService.get<{ notifications: Notification[]; total: number }>(
        cacheKey
      );

      if (cached) {
        logger.debug('Notifications retrieved from cache');
        return cached;
      }

      // Query database
      const query = this.notificationRepository
        .createQueryBuilder('notification')
        .leftJoinAndSelect('notification.user', 'user')
        .orderBy('notification.createdAt', 'DESC')
        .take(limit)
        .skip(offset);

      if (userId) {
        query.where('notification.userId = :userId', { userId });
      }

      const [notifications, total] = await query.getManyAndCount();

      const result = { notifications, total };

      // Cache the result
      await redisService.set(cacheKey, result, this.CACHE_TTL);

      return result;
    } catch (error) {
      logger.error('Failed to get notifications:', error);
      throw error;
    }
  }

  async getNotificationById(id: string): Promise<Notification | null> {
    return this.notificationRepository.findOne({
      where: { id },
      relations: ['user'],
    });
  }

  async updateNotificationStatus(
    id: string,
    status: NotificationStatus,
    errorMessage?: string
  ): Promise<void> {
    const updateData: any = { status };

    if (status === NotificationStatus.SENT) {
      updateData.sentAt = new Date();
    } else if (status === NotificationStatus.DELIVERED) {
      updateData.deliveredAt = new Date();
    } else if (status === NotificationStatus.FAILED) {
      updateData.errorMessage = errorMessage;
    }

    await this.notificationRepository.update(id, updateData);

    // Publish event
    let eventType: EventType;
    switch (status) {
      case NotificationStatus.SENT:
        eventType = EventType.NOTIFICATION_SENT;
        break;
      case NotificationStatus.DELIVERED:
        eventType = EventType.NOTIFICATION_DELIVERED;
        break;
      case NotificationStatus.FAILED:
        eventType = EventType.NOTIFICATION_FAILED;
        break;
      default:
        return;
    }

    await eventService.publishEvent(eventType, id, 'notification', { status });

    logger.info('Notification status updated', { notificationId: id, status });
  }

  async getPendingNotifications(limit: number = 100): Promise<Notification[]> {
    return this.notificationRepository.find({
      where: { status: NotificationStatus.PENDING },
      order: { createdAt: 'ASC' },
      take: limit,
    });
  }

  async getNotificationStats(userId?: string): Promise<{
    total: number;
    pending: number;
    sent: number;
    delivered: number;
    failed: number;
  }> {
    const query = this.notificationRepository.createQueryBuilder('notification');

    if (userId) {
      query.where('notification.userId = :userId', { userId });
    }

    const [total, pending, sent, delivered, failed] = await Promise.all([
      query.getCount(),
      query.clone().where('notification.status = :status', { status: NotificationStatus.PENDING }).getCount(),
      query.clone().where('notification.status = :status', { status: NotificationStatus.SENT }).getCount(),
      query.clone().where('notification.status = :status', { status: NotificationStatus.DELIVERED }).getCount(),
      query.clone().where('notification.status = :status', { status: NotificationStatus.FAILED }).getCount(),
    ]);

    return { total, pending, sent, delivered, failed };
  }

  async deleteOldNotifications(daysOld: number = 30): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const result = await this.notificationRepository
      .createQueryBuilder()
      .delete()
      .where('createdAt < :cutoffDate', { cutoffDate })
      .execute();

    logger.info(`Deleted ${result.affected} old notifications`, { daysOld });

    return result.affected || 0;
  }
}

export const databaseNotificationService = new DatabaseNotificationService();
