export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface User extends BaseEntity {
  email: string;
  name: string;
  role: UserRole;
  isActive: boolean;
}

export enum UserRole {
  ADMIN = 'ADMIN',
  USER = 'USER',
  VIEWER = 'VIEWER',
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  errors?: ApiError[];
}

export interface ApiError {
  code: string;
  message: string;
  field?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ServiceHealth {
  serviceName: string;
  status: HealthStatus;
  version: string;
  uptime: number;
  lastChecked: Date;
}

export enum HealthStatus {
  HEALTHY = 'HEALTHY',
  DEGRADED = 'DEGRADED',
  UNHEALTHY = 'UNHEALTHY',
}

export interface LogEntry {
  timestamp: Date;
  level: LogLevel;
  service: string;
  message: string;
  metadata?: Record<string, unknown>;
}

export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
  FATAL = 'FATAL',
}

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  createdAt: Date;
}

export enum NotificationType {
  INFO = 'INFO',
  SUCCESS = 'SUCCESS',
  WARNING = 'WARNING',
  ERROR = 'ERROR',
}

export interface MonitoringMetric {
  name: string;
  value: number;
  unit: string;
  timestamp: Date;
  tags?: Record<string, string>;
}

export interface ChaosAction {
  id: string;
  type: ChaosActionType;
  targetService: string;
  status: ChaosStatus;
  startedAt: Date;
  completedAt?: Date;
  metadata?: Record<string, unknown>;
}

export enum ChaosActionType {
  KILL_SERVICE = 'KILL_SERVICE',
  DELAY_REQUESTS = 'DELAY_REQUESTS',
  INJECT_ERROR = 'INJECT_ERROR',
  CONSUME_MEMORY = 'CONSUME_MEMORY',
  DROP_PACKETS = 'DROP_PACKETS',
}

export enum ChaosStatus {
  PENDING = 'PENDING',
  RUNNING = 'RUNNING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}