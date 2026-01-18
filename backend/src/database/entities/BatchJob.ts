import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum BatchJobType {
  NOTIFICATION_DIGEST = 'notification_digest',
  DATA_CLEANUP = 'data_cleanup',
  REPORT_GENERATION = 'report_generation',
  USER_SYNC = 'user_sync',
}

export enum BatchJobStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

@Entity('batch_jobs')
@Index(['status', 'scheduledAt'])
@Index(['type', 'status'])
export class BatchJob {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({
    type: 'enum',
    enum: BatchJobType,
  })
  type!: BatchJobType;

  @Column({
    type: 'enum',
    enum: BatchJobStatus,
    default: BatchJobStatus.PENDING,
  })
  status!: BatchJobStatus;

  @Column({ type: 'jsonb', nullable: true })
  parameters?: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  result?: Record<string, any>;

  @Column({ type: 'int', default: 0 })
  processedCount!: number;

  @Column({ type: 'int', default: 0 })
  failedCount!: number;

  @Column({ type: 'int', default: 0 })
  totalCount!: number;

  @Column({ type: 'text', nullable: true })
  errorMessage?: string;

  @Column({ type: 'timestamp', nullable: true })
  scheduledAt?: Date;

  @Column({ type: 'timestamp', nullable: true })
  startedAt?: Date;

  @Column({ type: 'timestamp', nullable: true })
  completedAt?: Date;

  @Column({ type: 'int', nullable: true })
  durationMs?: number;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  // Calculate progress percentage
  get progress(): number {
    if (this.totalCount === 0) return 0;
    return Math.round((this.processedCount / this.totalCount) * 100);
  }
}
