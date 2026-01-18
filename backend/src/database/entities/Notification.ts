import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from './User';

export enum NotificationType {
  INFO = 'info',
  SUCCESS = 'success',
  WARNING = 'warning',
  ERROR = 'error',
}

export enum NotificationStatus {
  PENDING = 'pending',
  SENT = 'sent',
  FAILED = 'failed',
  DELIVERED = 'delivered',
}

@Entity('notifications')
@Index(['status', 'createdAt'])
@Index(['userId', 'createdAt'])
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 500 })
  message!: string;

  @Column({
    type: 'enum',
    enum: NotificationType,
    default: NotificationType.INFO,
  })
  type!: NotificationType;

  @Column({
    type: 'enum',
    enum: NotificationStatus,
    default: NotificationStatus.PENDING,
  })
  status!: NotificationStatus;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;

  @Column({ type: 'uuid', nullable: true })
  userId?: string;

  @ManyToOne(() => User, (user) => user.notifications, { nullable: true })
  @JoinColumn({ name: 'userId' })
  user?: User;

  @Column({ type: 'timestamp', nullable: true })
  sentAt?: Date;

  @Column({ type: 'timestamp', nullable: true })
  deliveredAt?: Date;

  @Column({ type: 'int', default: 0 })
  retryCount!: number;

  @Column({ type: 'text', nullable: true })
  errorMessage?: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
