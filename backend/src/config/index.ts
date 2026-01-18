import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '3001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  },
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'demo_app',
  },
  kafka: {
    brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(','),
    clientId: process.env.KAFKA_CLIENT_ID || 'demo-backend',
    groupId: process.env.KAFKA_GROUP_ID || 'demo-backend-group',
  },
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  },
  loki: {
    host: process.env.LOKI_HOST || 'http://localhost:3100',
  },
  tempo: {
    endpoint: process.env.TEMPO_ENDPOINT || 'http://localhost:4318/v1/traces',
  },
  mimir: {
    endpoint: process.env.MIMIR_ENDPOINT || 'http://localhost:9009',
  },
};
