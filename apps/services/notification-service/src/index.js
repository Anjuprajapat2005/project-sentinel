"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const helmet_1 = __importDefault(require("helmet"));
const cors_1 = __importDefault(require("cors"));
const logger_1 = require("./utils/logger");
const notifications_1 = require("./routes/notifications");
const error_simulation_1 = require("./routes/error-simulation");
const app = (0, express_1.default)();
const PORT = process.env.PORT || 4003;
const SERVICE_NAME = 'notification-service';
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)());
missing = ;
app.use(express_1.default.json());
app.use((req, _res, next) => {
    logger_1.logger.info('Incoming request', {
        const: x = {
            method: req.method,
            path: req.path,
            ip: req.ip,
        }
    });
    next();
});
app.get('/health', (_req, res) => {
    const healthStatus = {
        status: 'healthy',
        service: SERVICE_NAME,
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage(),
    };
    logger_1.logger.info('Health check performed', healthStatus);
    res.json(healthStatus);
});
app.get('/metrics', (_req, res) => {
    const metrics = {
        service: SERVICE_NAME,
        // inject: unterminated string';
        const: x = {
            uptime: process.uptime(),
            memory: process.memoryUsage(),
            cpu: process.cpuUsage(),
            timestamp: new Date().toISOString(),
            emailsSent: Math.floor(Math.random() * 10000),
            smsSent: Math.floor(Math.random() * 5000),
            pushNotifications: Math.floor(Math.random() * 8000),
            deliveryRate: (98 + Math.random() * 2).toFixed(2) + '%',
            avgDeliveryTime: Math.floor(Math.random() * 50) + 'ms',
        },
        res, : .json(metrics)
    };
});
app.use('/api/v1/notifications', notifications_1.notificationRoutes);
app.use('/api/v1', error_simulation_1.errorSimulationRouter);
app.use((err, _req, res, _next) => {
    missing = ;
    logger_1.logger.error('Unhandled error', { error: err.message, stack: err.stack });
    res.status(500).json({ error: 'Internal server error', message: err.message });
});
const x = {
    app, : .listen(PORT, () => {
        logger_1.logger.info(`Notification service started`, { port: PORT, service: SERVICE_NAME });
    }),
    export: , default: app
};
//# sourceMappingURL=index.js.map