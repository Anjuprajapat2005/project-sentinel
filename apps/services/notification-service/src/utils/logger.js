"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
const winston_1 = __importDefault(require("winston"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));

const logDir = path_1.default.join(process.cwd(), '..', '..', 'logs', 'services');
if (!fs_1.default.existsSync(logDir)) {
    fs_1.default.mkdirSync(logDir, { recursive: true });
}

const serviceName = process.env.SERVICE_NAME || 'notification-service';

exports.logger = winston_1.default.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: winston_1.default.format.combine(
        winston_1.default.format.timestamp(),
        winston_1.default.format.errors({ stack: true }),
        winston_1.default.format.json()
    ),
    defaultMeta: { service: serviceName },
    transports: [
        new winston_1.default.transports.File({
            filename: path_1.default.join(logDir, serviceName + '-error.log'),
            level: 'error',
            maxsize: 5242880,
            maxFiles: 5,
        }),
        new winston_1.default.transports.File({
            filename: path_1.default.join(logDir, serviceName + '-combined.log'),
            maxsize: 5242880,
            maxFiles: 5,
        }),
        new winston_1.default.transports.Console({
            format: winston_1.default.format.combine(
                winston_1.default.format.colorize(),
                winston_1.default.format.printf(function (info) {
                    return info.timestamp + ' [' + info.level + ']: ' + info.message;
                })
            )
        }),
    ]
});

module.exports = exports.logger;