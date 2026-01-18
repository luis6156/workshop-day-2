import winston from 'winston';
import LokiTransport from 'winston-loki';
import { config } from '../config';

const isDevelopment = config.nodeEnv === 'development';

// Create Winston logger with Loki transport
export const logger = winston.createLogger({
  level: isDevelopment ? 'debug' : 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { 
    service: 'demo-backend',
    environment: config.nodeEnv 
  },
  transports: [
    // Console transport
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    }),
  ],
});

// Add Loki transport in production/when Loki is available
if (!isDevelopment) {
  try {
    logger.add(
      new LokiTransport({
        host: config.loki.host,
        labels: { 
          app: 'demo-backend',
          environment: config.nodeEnv 
        },
        json: true,
        format: winston.format.json(),
        replaceTimestamp: true,
        onConnectionError: (err) => console.error('Loki connection error:', err),
      })
    );
  } catch (error) {
    console.error('Failed to add Loki transport:', error);
  }
}

export default logger;
