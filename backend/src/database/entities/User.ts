import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { Notification } from './Notification';

@Entity('users')
@Index(['email'], { unique: true })
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 255 })
  email!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  name?: string;

  @Column({ type: 'boolean', default: true })
  isActive!: boolean;

  @Column({ type: 'jsonb', nullable: true })
  preferences?: {
    notificationTypes?: string[];
    emailEnabled?: boolean;
    pushEnabled?: boolean;
  };

  @OneToMany(() => Notification, (notification) => notification.user)
  notifications!: Notification[];

  @Column({ type: 'timestamp', nullable: true })
  lastLoginAt?: Date;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
