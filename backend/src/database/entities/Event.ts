import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

export enum EventType {
  NOTIFICATION_CREATED = 'notification.created',
  NOTIFICATION_SENT = 'notification.sent',
  NOTIFICATION_DELIVERED = 'notification.delivered',
  NOTIFICATION_FAILED = 'notification.failed',
  USER_CREATED = 'user.created',
  USER_UPDATED = 'user.updated',
  BATCH_JOB_STARTED = 'batch_job.started',
  BATCH_JOB_COMPLETED = 'batch_job.completed',
  BATCH_JOB_FAILED = 'batch_job.failed',
}

@Entity('events')
@Index(['eventType', 'createdAt'])
@Index(['aggregateId', 'eventType'])
export class Event {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({
    type: 'enum',
    enum: EventType,
  })
  eventType!: EventType;

  @Column({ type: 'uuid' })
  aggregateId!: string; // ID of the entity this event is about

  @Column({ type: 'varchar', length: 100 })
  aggregateType!: string; // e.g., 'notification', 'user', 'batch_job'

  @Column({ type: 'jsonb' })
  payload!: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: {
    userId?: string;
    source?: string;
    correlationId?: string;
    causationId?: string;
  };

  @Column({ type: 'boolean', default: false })
  processed!: boolean;

  @Column({ type: 'timestamp', nullable: true })
  processedAt?: Date;

  @CreateDateColumn()
  createdAt!: Date;
}
