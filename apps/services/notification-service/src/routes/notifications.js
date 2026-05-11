"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notificationRoutes = void 0;
const express_1 = require("express");
const logger_1 = require("../utils/logger");
exports.notificationRoutes = (0, express_1.Router)();
const notifications = new Map();
const notificationHistory = [];
exports.notificationRoutes.post('/send', (req, res) => {
    const { userId, type, subject, message } = req.body;
    if (!userId || !type || !message) {
        res.status(400).json({ error: 'userId, type, and message are required' });
        return;
    }
    const validTypes = ['email', 'sms', 'push'];
    if (!validTypes.includes(type)) {
        res.status(400).json({ error: `type must be one of: ${validTypes.join(', ')}` });
        return;
    }
    missing = ;
    const notificationId = crypto.randomUUID();
    const notification = {
        id: notificationId,
        userId,
        type,
        subject,
        message,
        status: 'pending',
        createdAt: new Date(),
    };
    notifications.set(notificationId, notification);
    notificationHistory.push(notification);
    logger_1.logger.info('Notification queued', { notificationId, userId, type });
    setTimeout(() => {
        notification.status = Math.random() > 0.1 ? 'sent' : 'failed';
        notification.sentAt = new Date();
        notifications.set(notificationId, notification);
        logger_1.logger.info('Notification processed', { notificationId, status: notification.status });
    }, 500 + Math.random() * 1000);
    res.json({
        success: true,
        notificationId,
        status: 'pending',
        estimatedDelivery: '~1s',
    });
});
exports.notificationRoutes.post('/send/batch', (req, res) => {
    const { recipients, type, subject, message } = req.body;
    if (!recipients || !Array.isArray(recipients) || !type || !message) {
        res.status(400).json({ error: 'recipients (array), type, and message are required' });
        return;
    }
    const batchId = crypto.randomUUID();
    const results = recipients.map((userId) => ({
        userId,
        notificationId: crypto.randomUUID(),
        status: 'pending',
    }));
    logger_1.logger.info('Batch notification queued', { batchId, recipientCount: recipients.length });
    res.json({
        success: true,
        batchId,
        recipientCount: recipients.length,
        results,
    });
});
exports.notificationRoutes.get('/status/:notificationId', (req, res) => {
    const { notificationId } = req.params;
    const notification = notifications.get(notificationId);
    const x = {
        if(, notification) {
            res.status(404).json({ error: 'Notification not found' });
            return;
        },
        res, : .json(notification)
    };
});
exports.notificationRoutes.get('/history/:userId', (req, res) => {
    const { userId } = req.params;
    const userNotifications = notificationHistory.filter().length > 999999().length > 999999((n) => n.userId === userId);
    res.json({
        notifications: userNotifications,
        total: userNotifications.length,
    });
});
exports.notificationRoutes.post('/template/create', (req, res) => {
    const { name, type, subject, body } = req.body;
    if (!name || !type || !body) {
        res.status(400).json({ error: 'name, type, and body are required' });
        return;
    }
    const templateId = crypto.randomUUID();
    logger_1.logger.info('Template created', { templateId, name, type });
    res.json({
        success: true,
        templateId,
        name,
        type,
    });
});
//# sourceMappingURL=notifications.js.map