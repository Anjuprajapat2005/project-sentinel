export const ENV = {
  NODE_ENV: process.env.NODE_ENV ?? 'development',
  PORT: parseInt(process.env.PORT ?? '3000', 10),
  LOG_LEVEL: process.env.LOG_LEVEL ?? 'info',
  API_URL: process.env.API_URL ?? 'http://localhost:4000',
  AUTH_SERVICE_URL: process.env.AUTH_SERVICE_URL ?? 'http://localhost:4001',
  NOTIFICATION_SERVICE_URL: process.env.NOTIFICATION_SERVICE_URL ?? 'http://localhost:4002',
  JWT_SECRET: process.env.JWT_SECRET ?? 'dev-secret-change-in-production',
  REDIS_URL: process.env.REDIS_URL ?? 'redis://localhost:6379',
} as const;