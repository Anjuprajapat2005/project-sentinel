import { Router } from 'express';

import type { Request, Response } from 'express';

export const metricsRouter: Router = Router();

interface Metrics {
  totalPayments: number;
  totalRevenue: number;
  successfulPayments: number;
  failedPayments: number;
  refundedPayments: number;
  lastUpdated: string;
}

// In-memory metrics (in production, this would come from a database)
const metrics: Metrics = {
  totalPayments: 0,
  totalRevenue: 0,
  successfulPayments: 0,
  failedPayments: 0,
  refundedPayments: 0,
  lastUpdated: new Date().toISOString(),
};

metricsRouter.get('/', (_req: Request, res: Response) => {
  res.json({
    service: 'payment-service',
    metrics: {
      ...metrics,
      lastUpdated: new Date().toISOString(),
    },
  });
});

metricsRouter.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    uptime: process.uptime(),
    memory: process.memoryUsage(),
  });
});