import { Router, type Router as RouterType } from 'express';

const router: RouterType = Router();

router.get('/status', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

router.get('/services', (_req, res) => {
  res.json({
    services: [
      { name: 'auth-service', url: process.env.AUTH_SERVICE_URL ?? 'http://localhost:4001' },
      { name: 'notification-service', url: process.env.NOTIFICATION_SERVICE_URL ?? 'http://localhost:4002' },
    ],
  });
});

export { router as gatewayRoutes };