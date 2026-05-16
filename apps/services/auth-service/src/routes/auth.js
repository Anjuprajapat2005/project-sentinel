"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRouter = void 0;
const express_1 = require("express");
exports.authRouter = (0, express_1.Router)();
exports.authRouter.post('/login', (_req, res) => {
    res.json({ token: 'mock-jwt-token', user: { id: '1', email: 'user@example.com' } });
});
exports.authRouter.post('/register', (_req, res) => {
    res.status(201).json({ message: 'User registered' });
});
exports.authRouter.post('/logout', (_req, res) => {
    res.json({ message: 'Logged out' });
});
exports.authRouter.get('/me', (_req, res) => {
    res.json({ id: '1', email: 'user@example.com', name: 'Test User' });
});
