import fs from 'fs';
import path from 'path';

import winston from 'winston';

const logDir = path.join(__dirname, '..', '..', '..', '..', '..', 'logs', 'services');

if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

const serviceName = process.env.SERVICE_NAME || 'service';

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: serviceName },
  transports: [
    new winston.transports.File({
      filename: path.join(logDir, `${serviceName}-error.log`),
      level: 'error',
      maxsize: 5242880,
      maxFiles: 5,
    }),
    new winston.transports.File({
      filename: path.join(logDir, `${serviceName}-combined.log`),
      maxsize: 5242880,
      maxFiles: 5,
    }),
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf((info) => {
          const metaObj: Record<string, unknown> = {};
          Object.keys(info).forEach((key) => {
            if (!['level', 'message', 'timestamp'].includes(key)) {
              metaObj[key] = info[key as keyof typeof info];
            }
          });
          const metaStr = Object.keys(metaObj).length ? ` ${JSON.stringify(metaObj)}` : '';
          return `${String(info.timestamp)} [${String(info.level)}]: ${String(info.message)}${metaStr}`;
        }) as unknown as winston.Logform.Format
      ),
    }),
  ],
});

export default logger;