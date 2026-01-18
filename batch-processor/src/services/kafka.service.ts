import { Kafka, Producer, Consumer, EachMessagePayload } from 'kafkajs';
import { logger } from '../utils/logger';

export enum KafkaTopics {
  NOTIFICATIONS = 'notifications',
  EVENTS = 'events',
  BATCH_JOBS = 'batch-jobs',
  DEAD_LETTER = 'dead-letter-queue',
}

const KAFKA_BROKERS = (process.env.KAFKA_BROKERS || 'localhost:9092').split(',');
const KAFKA_CLIENT_ID = process.env.KAFKA_CLIENT_ID || 'batch-processor';
const KAFKA_GROUP_ID = process.env.KAFKA_GROUP_ID || 'batch-processor-group';

class KafkaService {
  private kafka: Kafka;
  private producer: Producer | null = null;
  private consumers: Map<string, Consumer> = new Map();

  constructor() {
    this.kafka = new Kafka({
      clientId: KAFKA_CLIENT_ID,
      brokers: KAFKA_BROKERS,
    });
  }

  async connect(): Promise<void> {
    this.producer = this.kafka.producer();
    await this.producer.connect();
    logger.info('Kafka producer connected');
  }

  async disconnect(): Promise<void> {
    if (this.producer) {
      await this.producer.disconnect();
    }
    for (const [name, consumer] of this.consumers.entries()) {
      await consumer.disconnect();
      logger.info(`Kafka consumer disconnected: ${name}`);
    }
  }

  async publish(topic: string, message: any, key?: string): Promise<void> {
    if (!this.producer) throw new Error('Producer not connected');
    
    await this.producer.send({
      topic,
      messages: [{ key: key || null, value: JSON.stringify(message) }],
    });
  }

  async subscribe(
    topic: string,
    handler: (payload: any) => Promise<void>,
    consumerName: string
  ): Promise<void> {
    const consumer = this.kafka.consumer({ groupId: KAFKA_GROUP_ID });
    await consumer.connect();
    await consumer.subscribe({ topic, fromBeginning: false });

    await consumer.run({
      eachMessage: async ({ message }: EachMessagePayload) => {
        const value = message.value?.toString();
        if (value) {
          await handler(JSON.parse(value));
        }
      },
    });

    this.consumers.set(consumerName, consumer);
  }
}

export const kafkaService = new KafkaService();
