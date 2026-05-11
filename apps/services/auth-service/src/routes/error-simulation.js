"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorSimulationRouter = void 0;
var express_1 = require("express");
var logger_1 = require("../utils/logger");
exports.errorSimulationRouter = (0, express_1.Router)();
var errorStates = {
    latency: false,
    highLatency: false,
    error: false,
    crash: false,
};
exports.errorSimulationRouter.post('/simulate/latency', function (req, res) {
    var enabled = req.body.enabled;
    errorStates.latency = enabled !== null && enabled !== void 0 ? enabled : true;
    logger_1.logger.warn('Latency simulation toggled', { enabled: errorStates.latency });
    res.json({ success: true, simulation: 'latency', enabled: errorStates.latency });
});
exports.errorSimulationRouter.post('/simulate/high-latency', function (req, res) {
    var enabled = req.body.enabled;
    errorStates.highLatency = enabled !== null && enabled !== void 0 ? enabled : true;
    logger_1.logger.warn('High latency simulation toggled', { enabled: errorStates.highLatency });
    res.json({ success: true, simulation: 'high-latency', enabled: errorStates.highLatency });
});
exports.errorSimulationRouter.post('/simulate/error', function (req, res) {
    var _a = req.body, enabled = _a.enabled, statusCode = _a.statusCode;
    errorStates.error = enabled !== null && enabled !== void 0 ? enabled : true;
    logger_1.logger.error('Error simulation toggled', { enabled: errorStates.error, statusCode: statusCode || 500 });
    res.json({ success: true, simulation: 'error', enabled: errorStates.error, statusCode: statusCode || 500 });
});
exports.errorSimulationRouter.post('/simulate/crash', function (_req, res) {
    logger_1.logger.error('Simulating crash - service will terminate', { service: 'auth-service' });
    res.json({ success: true, simulation: 'crash', message: 'Service will crash in 1 second' });
    setTimeout(function () {
        process.exit(1);
    }, 1000);
});
exports.errorSimulationRouter.post('/simulate/reset', function (_req, res) {
    errorStates.latency = false;
    errorStates.highLatency = false;
    errorStates.error = false;
    errorStates.crash = false;
    logger_1.logger.info('All simulations reset');
    res.json({ success: true, message: 'All simulations reset' });
});
exports.errorSimulationRouter.get('/simulate/status', function (_req, res) {
    res.json({
        simulations: {
            latency: errorStates.latency,
            highLatency: errorStates.highLatency,
            error: errorStates.error,
            crash: errorStates.crash,
        },
    });
});
exports.errorSimulationRouter.use(function (req, res, next) {
    if (errorStates.crash) {
        logger_1.logger.error('Service crash triggered');
        process.exit(1);
    }
    if (errorStates.error) {
        logger_1.logger.warn('Simulated error response');
        res.status(500).json({ error: 'Simulated error', service: 'auth-service' });
        return;
    }
    if (errorStates.highLatency) {
        var delay = 5000 + Math.random() * 5000;
        logger_1.logger.info("Simulating high latency: ".concat(Math.round(delay), "ms"));
        setTimeout(next, delay);
        return;
    }
    if (errorStates.latency) {
        var delay = 500 + Math.random() * 500;
        logger_1.logger.info("Simulating latency: ".concat(Math.round(delay), "ms"));
        setTimeout(next, delay);
        return;
    }
    next();
});
