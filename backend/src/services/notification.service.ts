import { v4 as uuidv4 } from 'uuid';
import { redisService } from './redis.service';
import { logger } from '../utils/logger';
import { notificationsSent } from '../utils/metrics';

export interface Notification {
  id: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  timestamp: Date;
  metadata?: Record<string, any>;
}

class NotificationService {
  private readonly CACHE_KEY = 'notifications:list';
  private readonly CACHE_TTL = 300; // 5 minutes

  async createNotification(
    message: string,
    type: Notification['type'] = 'info',
    metadata?: Record<string, any>
  ): Promise<Notification> {
    const notification: Notification = {
      id: uuidv4(),
      message,
      type,
      timestamp: new Date(),
      metadata,
    };

    logger.info('Creating notification', { notification });

    // Store in Redis
    await this.storeNotification(notification);
    
    // Publish to Redis pub/sub for real-time updates
    await redisService.publish('notifications', JSON.stringify(notification));
    
    notificationsSent.inc({ type: notification.type });

    return notification;
  }

  async getNotifications(limit: number = 50): Promise<Notification[]> {
    // Try to get from cache
    const cached = await redisService.get<Notification[]>(this.CACHE_KEY);
    
    if (cached) {
      logger.debug('Notifications retrieved from cache');
      return cached;
    }

    // If not in cache, get from storage
    const notifications = await this.getStoredNotifications(limit);
    
    // Cache the results
    await redisService.set(this.CACHE_KEY, notifications, this.CACHE_TTL);
    
    return notifications;
  }

  private async storeNotification(notification: Notification): Promise<void> {
    const key = `notification:${notification.id}`;
    await redisService.set(key, notification, 3600); // 1 hour TTL
    
    // Add to list
    const notifications = await this.getStoredNotifications(49);
    notifications.unshift(notification);
    await redisService.set(this.CACHE_KEY, notifications, this.CACHE_TTL);
  }

  private async getStoredNotifications(limit: number): Promise<Notification[]> {
    // This is a simple implementation
    // In production, you'd want to use Redis sorted sets or a database
    const cached = await redisService.get<Notification[]>(this.CACHE_KEY);
    return cached ? cached.slice(0, limit) : [];
  }

  async clearNotifications(): Promise<void> {
    await redisService.delete(this.CACHE_KEY);
    logger.info('Notifications cache cleared');
  }

  // Subscribe to notification updates
  subscribeToNotifications(callback: (notification: Notification) => void): void {
    redisService.subscribe('notifications', (message) => {
      try {
        const notification = JSON.parse(message) as Notification;
        callback(notification);
      } catch (error) {
        logger.error('Failed to parse notification message:', error);
      }
    });
  }
}

export const notificationService = new NotificationService();
