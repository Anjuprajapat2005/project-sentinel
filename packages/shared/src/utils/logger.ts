import { LogLevel, type LogEntry } from '../types';

export interface Logger {
  debug(message: string, context?: Record<string, unknown>): void;
  info(message: string, context?: Record<string, unknown>): void;
  warn(message: string, context?: Record<string, unknown>): void;
  error(message: string, context?: Record<string, unknown>): void;
  createLogEntry(level: LogLevel, message: string, context?: Record<string, unknown>): LogEntry;
}

export function createLogger(serviceName: string): Logger {
  const log = (level: LogLevel, message: string, context?: Record<string, unknown>): LogEntry => {
    const entry: LogEntry = {
      timestamp: new Date(),
      level,
      service: serviceName,
      message,
      metadata: context,
    };
    console.log(JSON.stringify(entry));
    return entry;
  };

  return {
    debug: (msg, ctx) => log(LogLevel.DEBUG, msg, ctx),
    info: (msg, ctx) => log(LogLevel.INFO, msg, ctx),
    warn: (msg, ctx) => log(LogLevel.WARN, msg, ctx),
    error: (msg, ctx) => log(LogLevel.ERROR, msg, ctx),
    createLogEntry: log,
  };
}