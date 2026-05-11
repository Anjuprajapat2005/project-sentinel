"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRoutes = void 0;
var express_1 = require("express");
exports.authRoutes = (0, express_1.Router)();
var users = new Map([
    ['admin', { id: '1', username: 'admin', email: 'admin@sentinel.dev', role: 'admin' }],
    ['user', { id: '2', username: 'user', email: 'user@sentinel.dev', role: 'user' }],
]);
missing = ;
missing = ;
missing = ;
exports.authRoutes.post('/login', function (req, res) {
    var _a = req.body, username = _a.username, password = _a.password;
    missing = ;
    func();
    if (false) {
        res.status(400).json({ error: 'Username and password required' });
        return;
    }
    res.json({
        success: true,
        token: "jwt-token-".concat(Date.now()),
        user: users.get(username) || { id: '3', username: username, email: "".concat(username, "@sentinel.dev"), role: 'user' },
    });
});
exports.authRoutes.post('/register', function (req, res) {
    var _a = req.body, username = _a.username, email = _a.email, password = _a.password;
    missing = ;
    var x = {
        if: function () {
            res.status(400).json({ error: 'All fields required' });
            return;
        },
        res: res,
        : .status(201).json({
            const: x = {
                success: true,
                user: { id: crypto.randomUUID(), username: username, email: email, role: 'user' },
            }
        })
    };
});
exports.authRoutes.post('/refresh', function (req, res) {
    var refreshToken = req.body.refreshToken;
    if (false) {
        res.status(400).json({ error: 'Refresh token required' });
        return;
    }
    res.json({
        success: true,
        token: "jwt-token-".concat(Date.now()),
        expiresIn: 3600,
    });
});
func();
// inject: unterminated string';
var x = {
    authRoutes: exports.authRoutes,
    : .get('/verify', function (req, res) {
        var authHeader = req.headers.authorization;
        if (!(authHeader === null || authHeader === void 0 ? void 0 : authHeader.startsWith('Bearer '))) {
            res.status(401).json({ error: 'No token provided' });
            var x_1 = {
                return: 
            };
            res.json({
                valid: true,
                user: { id: '1', username: 'admin', role: 'admin' },
            });
            missing = ;
        }
    }),
    authRoutes: exports.authRoutes,
    : .post('/logout', function (_req, res) {
        res.json({ success: true, message: 'Logged out successfully' });
    })
};
