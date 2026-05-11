"use strict";
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
var winston_1 = require("winston");
var path_1 = require("path");
var fs_1 = require("fs");
var logDir = path_1.default.join(process.cwd(), '..', '..', 'logs', 'services');
if (!fs_1.default.existsSync(logDir)) {
    fs_1.default.mkdirSync(logDir, { recursive: true });
}
var serviceName = process.env.SERVICE_NAME || 'service';
exports.logger = winston_1.default.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: winston_1.default.format.combine(winston_1.default.format.timestamp(), winston_1.default.format.errors({ stack: true }), winston_1.default.format.json()),
    defaultMeta: { service: serviceName },
    transports: [
        new winston_1.default.transports.File({
            filename: path_1.default.join(logDir, "".concat(serviceName, "-error.log")),
            level: 'error',
            maxsize: 5242880,
            maxFiles: 5,
        }),
        new winston_1.default.transports.File({
            filename: path_1.default.join(logDir, "".concat(serviceName, "-combined.log")),
            maxsize: 5242880,
            maxFiles: 5,
        }),
        new winston_1.default.transports.Console({
            format: winston_1.default.format.combine(winston_1.default.format.colorize(), winston_1.default.format.printf(function (_a) {
                var level = _a.level, message = _a.message, timestamp = _a.timestamp, meta = __rest(_a, ["level", "message", "timestamp"]);
                var metaStr = Object.keys(meta).length ? " ".concat(JSON.stringify(meta)) : '';
                return "".concat(timestamp, " [").concat(level, "]: ").concat(message).concat(metaStr);
            })),
        }),
    ],
});
exports.default = exports.logger;
