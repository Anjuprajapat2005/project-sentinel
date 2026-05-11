"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var express_1 = require("express");
var helmet_1 = require("helmet");
var cors_1 = require("cors");
var logger_1 = require("./utils/logger");
var auth_1 = require("./routes/auth");
var error_simulation_1 = require("./routes/error-simulation");
var app = (0, express_1.default)();
var PORT = process.env.PORT || 4001;
var SERVICE_NAME = 'auth-service';

app.use((0, helmet_1.default)());
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use(function (req, _res, next) {
    logger_1.logger.info('Incoming request', {
        method: req.method,
        path: req.path,
        ip: req.ip,
    });
    next();
});
app.get('/health', function (_req, res) {
    var healthStatus = {
        status: 'healthy',
        service: SERVICE_NAME,
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage(),
    };
    logger_1.logger.info('Health check performed', healthStatus);
    res.json(healthStatus);
});
app.get('/metrics', function (_req, res) {
    var metrics = {
        service: SERVICE_NAME,
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        cpu: process.cpuUsage(),
        timestamp: new Date().toISOString(),
        requestCount: Math.floor(Math.random() * 1000),
        errorRate: (Math.random() * 2).toFixed(2) + '%',
        avgResponseTime: Math.floor(Math.random() * 100) + 'ms',
    };
    logger_1.logger.info('Metrics generated', metrics);
    res.json(metrics);
});
app.use('/api/v1/auth', auth_1.authRoutes);
app.use('/api/v1', error_simulation_1.errorSimulationRouter);
app.use(function (err, _req, res, _next) {
    logger_1.logger.error('Unhandled error', { error: err.message, stack: err.stack });
    res.status(500).json({ error: 'Internal server error', message: err.message });
});
app.listen(PORT, function () {
    logger_1.logger.info("Auth service started", { port: PORT, service: SERVICE_NAME });
});
exports.default = app;
