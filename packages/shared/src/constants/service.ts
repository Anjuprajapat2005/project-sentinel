export const SERVICES = {
  DASHBOARD: 'dashboard',
  AUTH: 'auth-service',
  API_GATEWAY: 'api-gateway',
  NOTIFICATION: 'notification-service',
  MONITORING: 'monitoring-service',
} as const;

export const PORTS = {
  [SERVICES.DASHBOARD]: 3000,
  [SERVICES.AUTH]: 4001,
  [SERVICES.API_GATEWAY]: 4000,
  [SERVICES.NOTIFICATION]: 4003,
  [SERVICES.MONITORING]: 4004,
} as const;