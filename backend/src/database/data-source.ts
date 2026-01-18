import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { config } from '../config';
import { Notification } from './entities/Notification';
import { User } from './entities/User';
import { BatchJob } from './entities/BatchJob';
import { Event } from './entities/Event';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: config.database.host,
  port: config.database.port,
  username: config.database.username,
  password: config.database.password,
  database: config.database.database,
  synchronize: config.nodeEnv === 'development', // Don't use in production!
  logging: config.nodeEnv === 'development',
  entities: [Notification, User, BatchJob, Event],
  migrations: ['src/database/migrations/**/*.ts'],
  subscribers: [],
  ssl: config.nodeEnv === 'production' ? { rejectUnauthorized: false } : false,
  extra: {
    max: 20, // Connection pool size
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  },
});

export async function initializeDatabase() {
  try {
    await AppDataSource.initialize();
    console.log('✓ Database connection established');
    
    // Run migrations in production
    if (config.nodeEnv === 'production') {
      await AppDataSource.runMigrations();
      console.log('✓ Database migrations completed');
    }
  } catch (error) {
    console.error('✗ Database connection failed:', error);
    throw error;
  }
}

export async function closeDatabase() {
  if (AppDataSource.isInitialized) {
    await AppDataSource.destroy();
    console.log('✓ Database connection closed');
  }
}
