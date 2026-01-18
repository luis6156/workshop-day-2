import { AppDataSource } from '../database/data-source';
import { Event, EventType } from '../database/entities/Event';
import { kafkaService, KafkaTopics } from './kafka.service';
import { logger } from '../utils/logger';

class EventService {
  private eventRepository = AppDataSource.getRepository(Event);

  /**
   * Publish an event to both database and Kafka
   */
  async publishEvent(
    eventType: EventType,
    aggregateId: string,
    aggregateType: string,
    payload: Record<string, any>,
    metadata?: Record<string, any>
  ): Promise<Event> {
    try {
      // Save event to database (event sourcing)
      const event = this.eventRepository.create({
        eventType,
        aggregateId,
        aggregateType,
        payload,
        metadata,
      });

      const savedEvent = await this.eventRepository.save(event);

      // Publish to Kafka for event-driven processing
      await kafkaService.publish(
        KafkaTopics.EVENTS,
        {
          id: savedEvent.id,
          eventType: savedEvent.eventType,
          aggregateId: savedEvent.aggregateId,
          aggregateType: savedEvent.aggregateType,
          payload: savedEvent.payload,
          metadata: savedEvent.metadata,
          createdAt: savedEvent.createdAt,
        },
        aggregateId
      );

      logger.info('Event published', {
        eventId: savedEvent.id,
        eventType,
        aggregateId,
        aggregateType,
      });

      return savedEvent;
    } catch (error) {
      logger.error('Failed to publish event:', {
        eventType,
        aggregateId,
        error,
      });
      throw error;
    }
  }

  /**
   * Get events for a specific aggregate
   */
  async getEventsForAggregate(
    aggregateId: string,
    aggregateType?: string
  ): Promise<Event[]> {
    const query = this.eventRepository
      .createQueryBuilder('event')
      .where('event.aggregateId = :aggregateId', { aggregateId })
      .orderBy('event.createdAt', 'ASC');

    if (aggregateType) {
      query.andWhere('event.aggregateType = :aggregateType', { aggregateType });
    }

    return query.getMany();
  }

  /**
   * Get unprocessed events
   */
  async getUnprocessedEvents(limit: number = 100): Promise<Event[]> {
    return this.eventRepository.find({
      where: { processed: false },
      order: { createdAt: 'ASC' },
      take: limit,
    });
  }

  /**
   * Mark event as processed
   */
  async markEventAsProcessed(eventId: string): Promise<void> {
    await this.eventRepository.update(eventId, {
      processed: true,
      processedAt: new Date(),
    });
  }

  /**
   * Get event stream (for event replay or audit)
   */
  async getEventStream(
    fromDate?: Date,
    toDate?: Date,
    eventTypes?: EventType[]
  ): Promise<Event[]> {
    const query = this.eventRepository.createQueryBuilder('event');

    if (fromDate) {
      query.andWhere('event.createdAt >= :fromDate', { fromDate });
    }

    if (toDate) {
      query.andWhere('event.createdAt <= :toDate', { toDate });
    }

    if (eventTypes && eventTypes.length > 0) {
      query.andWhere('event.eventType IN (:...eventTypes)', { eventTypes });
    }

    return query.orderBy('event.createdAt', 'ASC').getMany();
  }
}

export const eventService = new EventService();
