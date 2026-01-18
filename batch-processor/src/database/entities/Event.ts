import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('events')
@Index(['aggregateId', 'aggregateType'])
@Index(['eventType'])
@Index(['createdAt'])
export class Event {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 255 })
  eventType!: string;

  @Column({ type: 'varchar', length: 255 })
  aggregateType!: string;

  @Column({ type: 'uuid' })
  aggregateId!: string;

  @Column({ type: 'jsonb' })
  payload!: any;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: any;

  @Column({ type: 'int', default: 1 })
  version!: number;

  @CreateDateColumn()
  createdAt!: Date;
}
