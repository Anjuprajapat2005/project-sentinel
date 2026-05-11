import { Router, type Request, type Response } from 'express';

export const metricsRouter: Router = Router();

metricsRouter.get('/', (_req: Request, res: Response) => {
  res.json({
    items: [
      { name: 'cpu_usage', value: 45.2, unit: 'percent', timestamp: new Date() },
      { name: 'memory_usage', value: 62.8, unit: 'percent', timestamp: new Date() },
      { name: 'request_rate', value: 1284, unit: 'req/s', timestamp: new Date() },
    ],
    total: 3,
  });
});

metricsRouter.get('/stats', (_req: Request, res: Response) => {
  res.json({
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    cpu: process.cpuUsage(),
  });
});
