import { DataSource } from 'typeorm';
import { Notification } from './entities/Notification';
import { BatchJob } from './entities/BatchJob';
import { Event } from './entities/Event';
import { User } from './entities/User';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '5432'),
  username: process.env.DATABASE_USER || 'demo',
  password: process.env.DATABASE_PASSWORD || 'demo123',
  database: process.env.DATABASE_NAME || 'demo_db',
  entities: [Notification, BatchJob, Event, User],
  synchronize: false, // Don't auto-sync in production
  logging: process.env.NODE_ENV === 'development',
});
