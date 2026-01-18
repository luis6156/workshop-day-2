import { Kafka, Producer, Consumer, EachMessagePayload } from 'kafkajs';
import { config } from '../config';
import { logger } from '../utils/logger';

export enum KafkaTopics {
  NOTIFICATIONS = 'notifications',
  EVENTS = 'events',
  BATCH_JOBS = 'batch-jobs',
  DEAD_LETTER = 'dead-letter-queue',
}

class KafkaService {
  private kafka: Kafka;
  private producer: Producer | null = null;
  private consumers: Map<string, Consumer> = new Map();
  private connected: boolean = false;

  constructor() {
    this.kafka = new Kafka({
      clientId: config.kafka.clientId,
      brokers: config.kafka.brokers,
      retry: {
        initialRetryTime: 100,
        retries: 8,
      },
    });
  }

  async connect(): Promise<void> {
    try {
      this.producer = this.kafka.producer({
        maxInFlightRequests: 5,
        idempotent: true,
        transactionalId: config.kafka.clientId,
      });

      await this.producer.connect();
      this.connected = true;
      logger.info('✓ Kafka producer connected', {
        brokers: config.kafka.brokers,
        clientId: config.kafka.clientId,
      });
    } catch (error) {
      logger.error('✗ Failed to connect Kafka producer:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    try {
      if (this.producer) {
        await this.producer.disconnect();
      }

      for (const [name, consumer] of this.consumers.entries()) {
        await consumer.disconnect();
        logger.info(`Kafka consumer disconnected: ${name}`);
      }

      this.connected = false;
      logger.info('✓ Kafka disconnected');
    } catch (error) {
      logger.error('✗ Error disconnecting Kafka:', error);
    }
  }

  async publish(topic: string, message: any, key?: string): Promise<void> {
    if (!this.producer) {
      throw new Error('Kafka producer not initialized');
    }

    try {
      const payload = {
        topic,
        messages: [
          {
            key: key || null,
            value: JSON.stringify({
              ...message,
              timestamp: new Date().toISOString(),
              source: config.kafka.clientId,
            }),
            headers: {
              'content-type': 'application/json',
              'correlation-id': message.correlationId || '',
            },
          },
        ],
      };

      await this.producer.send(payload);

      logger.debug('Message published to Kafka', {
        topic,
        key,
        messageId: message.id,
      });
    } catch (error) {
      logger.error('Failed to publish message to Kafka:', {
        topic,
        error,
      });
      throw error;
    }
  }

  async publishBatch(topic: string, messages: any[]): Promise<void> {
    if (!this.producer) {
      throw new Error('Kafka producer not initialized');
    }

    try {
      const kafkaMessages = messages.map((message) => ({
        key: message.key || null,
        value: JSON.stringify({
          ...message,
          timestamp: new Date().toISOString(),
          source: config.kafka.clientId,
        }),
        headers: {
          'content-type': 'application/json',
        },
      }));

      await this.producer.send({
        topic,
        messages: kafkaMessages,
      });

      logger.info(`Batch published to Kafka: ${messages.length} messages`, {
        topic,
      });
    } catch (error) {
      logger.error('Failed to publish batch to Kafka:', { topic, error });
      throw error;
    }
  }

  async subscribe(
    topic: string,
    handler: (payload: any) => Promise<void>,
    consumerName?: string
  ): Promise<void> {
    const name = consumerName || `${topic}-consumer`;

    try {
      const consumer = this.kafka.consumer({
        groupId: config.kafka.groupId,
        sessionTimeout: 30000,
        heartbeatInterval: 3000,
      });

      await consumer.connect();
      await consumer.subscribe({ topic, fromBeginning: false });

      await consumer.run({
        eachMessage: async (payload: EachMessagePayload) => {
          const { topic, partition, message } = payload;

          try {
            const value = message.value?.toString();
            if (!value) {
              logger.warn('Received empty message', { topic, partition });
              return;
            }

            const data = JSON.parse(value);
            
            logger.debug('Message received from Kafka', {
              topic,
              partition,
              offset: message.offset,
              messageId: data.id,
            });

            await handler(data);

            // Message processed successfully
            logger.debug('Message processed successfully', {
              topic,
              offset: message.offset,
            });
          } catch (error) {
            logger.error('Error processing Kafka message:', {
              topic,
              partition,
              offset: message.offset,
              error,
            });

            // Send to dead letter queue
            await this.publishToDeadLetterQueue(topic, message, error);
          }
        },
      });

      this.consumers.set(name, consumer);
      logger.info(`✓ Kafka consumer subscribed: ${name}`, { topic });
    } catch (error) {
      logger.error(`✗ Failed to subscribe consumer: ${name}`, { topic, error });
      throw error;
    }
  }

  private async publishToDeadLetterQueue(
    originalTopic: string,
    message: any,
    error: any
  ): Promise<void> {
    try {
      await this.publish(
        KafkaTopics.DEAD_LETTER,
        {
          originalTopic,
          message: message.value?.toString(),
          error: error.message,
          offset: message.offset,
          timestamp: new Date().toISOString(),
        },
        message.key?.toString()
      );
    } catch (dlqError) {
      logger.error('Failed to publish to dead letter queue:', dlqError);
    }
  }

  isConnected(): boolean {
    return this.connected;
  }
}

export const kafkaService = new KafkaService();
