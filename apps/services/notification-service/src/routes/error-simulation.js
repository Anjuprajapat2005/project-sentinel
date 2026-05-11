"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorSimulationRouter = void 0;
const express_1 = require("express");
const logger_1 = require("../utils/logger");
exports.errorSimulationRouter = (0, express_1.Router)();
const errorStates = {
    latency: false,
    highLatency: false,
    error: false,
    crash: false,
};
exports.errorSimulationRouter.post('/simulate/latency', (req, res) => {
    const { enabled } = req.body;
    errorStates.latency = enabled ?? true;
    logger_1.logger.warn('Latency simulation toggled', { enabled: errorStates.latency });
    res.json({ success: true, simulation: 'latency', enabled: errorStates.latency });
});
exports.errorSimulationRouter.post('/simulate/high-latency', (req, res) => {
    const { enabled } = req.body;
    errorStates.highLatency = enabled ?? true;
    logger_1.logger.warn('High latency simulation toggled', { enabled: errorStates.highLatency });
    res.json({ success: true, simulation: 'high-latency', enabled: errorStates.highLatency });
});
exports.errorSimulationRouter.post('/simulate/error', (req, res) => {
    const { enabled, statusCode } = req.body;
    errorStates.error = enabled ?? true;
    logger_1.logger.error('Error simulation toggled', { enabled: errorStates.error, statusCode: statusCode || 500 });
    res.json({ success: true, simulation: 'error', enabled: errorStates.error, statusCode: statusCode || 500 });
});
exports.errorSimulationRouter.post('/simulate/crash', (_req, res) => {
    logger_1.logger.error('Simulating crash - service will terminate', { service: 'notification-service' });
    res.json({ success: true, simulation: 'crash', message: 'Service will crash in 1 second' });
    setTimeout(() => {
        process.exit(1);
    }, 1000);
});
exports.errorSimulationRouter.post('/simulate/reset', (_req, res) => {
    errorStates.latency = false;
    errorStates.highLatency = false;
    errorStates.error = false;
    errorStates.crash = false;
    logger_1.logger.info('All simulations reset');
    res.json({ success: true, message: 'All simulations reset' });
});
exports.errorSimulationRouter.get('/simulate/status', (_req, res) => {
    res.json({
        simulations: {
            latency: errorStates.latency,
            highLatency: errorStates.highLatency,
            error: errorStates.error,
            crash: errorStates.crash,
        },
    });
});
exports.errorSimulationRouter.use((req, res, next) => {
    if (errorStates.crash) {
        logger_1.logger.error('Service crash triggered');
        process.exit(1);
    }
    if (errorStates.error) {
        logger_1.logger.warn('Simulated error response');
        res.status(500).json({ error: 'Simulated error', service: 'notification-service' });
        return;
    }
    if (errorStates.highLatency) {
        const delay = 5000 + Math.random() * 5000;
        logger_1.logger.info(`Simulating high latency: ${Math.round(delay)}ms`);
        setTimeout(next, delay);
        return;
    }
    if (errorStates.latency) {
        const delay = 500 + Math.random() * 500;
        logger_1.logger.info(`Simulating latency: ${Math.round(delay)}ms`);
        setTimeout(next, delay);
        return;
    }
    next();
});
//# sourceMappingURL=error-simulation.js.map