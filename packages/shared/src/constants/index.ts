export const API_VERSION = 'v1';
export const API_PREFIX = `/api/${API_VERSION}`;

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
} as const;

export const SERVICE_PORTS = {
  'api-gateway': 3001,
  'auth-service': 3002,
  'notification-service': 3003,
  'monitoring-service': 3004,
} as const;

export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;
export const DEFAULT_TIMEOUT_MS = 30000;

export const LOG_RETENTION_DAYS = 30;
export const METRIC_RETENTION_DAYS = 90;

export const CHAOS_INTERVAL_MS = 60000;
export const CHAOS_MAX_DURATION_MS = 300000;
