import winston from 'winston';

const { combine, timestamp, json, colorize } = winston.format;

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL ?? 'info',
  format: combine(
    timestamp(),
    json(),
    colorize({ all: process.env.NODE_ENV !== 'production' })
  ),
  defaultMeta: { service: 'api-gateway' },
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/api-gateway.log' }),
  ],
});
