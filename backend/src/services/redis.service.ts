import Redis from 'ioredis';
import { config } from '../config';
import { logger } from '../utils/logger';
import { redisOperations, cacheHitRate, cacheMissRate } from '../utils/metrics';

class RedisService {
  private client: Redis;
  private isConnected: boolean = false;

  constructor() {
    this.client = new Redis({
      host: config.redis.host,
      port: config.redis.port,
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
    });

    this.client.on('connect', () => {
      this.isConnected = true;
      logger.info('Redis connected successfully');
    });

    this.client.on('error', (err) => {
      logger.error('Redis error:', err);
      this.isConnected = false;
    });

    this.client.on('close', () => {
      this.isConnected = false;
      logger.warn('Redis connection closed');
    });
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await this.client.get(key);
      
      if (value) {
        cacheHitRate.inc({ cache_type: 'redis' });
        redisOperations.inc({ operation: 'get', status: 'success' });
        logger.debug(`Cache hit for key: ${key}`);
        return JSON.parse(value) as T;
      }
      
      cacheMissRate.inc({ cache_type: 'redis' });
      logger.debug(`Cache miss for key: ${key}`);
      return null;
    } catch (error) {
      redisOperations.inc({ operation: 'get', status: 'error' });
      logger.error('Redis GET error:', error);
      return null;
    }
  }

  async set(key: string, value: any, ttlSeconds?: number): Promise<boolean> {
    try {
      const serialized = JSON.stringify(value);
      
      if (ttlSeconds) {
        await this.client.setex(key, ttlSeconds, serialized);
      } else {
        await this.client.set(key, serialized);
      }
      
      redisOperations.inc({ operation: 'set', status: 'success' });
      logger.debug(`Cache set for key: ${key}, TTL: ${ttlSeconds || 'none'}`);
      return true;
    } catch (error) {
      redisOperations.inc({ operation: 'set', status: 'error' });
      logger.error('Redis SET error:', error);
      return false;
    }
  }

  async delete(key: string): Promise<boolean> {
    try {
      await this.client.del(key);
      redisOperations.inc({ operation: 'delete', status: 'success' });
      logger.debug(`Cache deleted for key: ${key}`);
      return true;
    } catch (error) {
      redisOperations.inc({ operation: 'delete', status: 'error' });
      logger.error('Redis DELETE error:', error);
      return false;
    }
  }

  async increment(key: string): Promise<number> {
    try {
      const value = await this.client.incr(key);
      redisOperations.inc({ operation: 'incr', status: 'success' });
      return value;
    } catch (error) {
      redisOperations.inc({ operation: 'incr', status: 'error' });
      logger.error('Redis INCR error:', error);
      throw error;
    }
  }

  async publish(channel: string, message: string): Promise<void> {
    try {
      await this.client.publish(channel, message);
      redisOperations.inc({ operation: 'publish', status: 'success' });
      logger.debug(`Published to channel: ${channel}`);
    } catch (error) {
      redisOperations.inc({ operation: 'publish', status: 'error' });
      logger.error('Redis PUBLISH error:', error);
    }
  }

  async subscribe(channel: string, callback: (message: string) => void): Promise<void> {
    const subscriber = this.client.duplicate();
    
    subscriber.subscribe(channel, (err) => {
      if (err) {
        logger.error(`Failed to subscribe to ${channel}:`, err);
        return;
      }
      logger.info(`Subscribed to channel: ${channel}`);
    });

    subscriber.on('message', (ch, message) => {
      if (ch === channel) {
        callback(message);
      }
    });
  }

  async flush(): Promise<void> {
    try {
      await this.client.flushdb();
      logger.info('Redis database flushed');
    } catch (error) {
      logger.error('Redis FLUSH error:', error);
    }
  }

  getClient(): Redis {
    return this.client;
  }

  isReady(): boolean {
    return this.isConnected;
  }

  async disconnect(): Promise<void> {
    await this.client.quit();
    logger.info('Redis disconnected');
  }
}

export const redisService = new RedisService();
