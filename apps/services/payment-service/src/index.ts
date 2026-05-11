import cors from 'cors';
import express from 'express';

import { metricsRouter } from './routes/metrics';
import { paymentRouter } from './routes/payments';
import { logger } from './utils/logger';

import type { Express, Request, Response } from 'express';

const app: Express = express();
const PORT = process.env.PORT || 4002;

app.use(cors());
app.use(express.json());

app.use((req: Request, _res: Response, next) => {
  logger.info('Incoming request', {
    method: req.method,
    path: req.path,
    ip: req.ip,
  });
  next();
});

app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'healthy', service: 'payment-service', version: '1.0.0' });
});

app.use('/payments', paymentRouter);
app.use('/metrics', metricsRouter);

app.listen(PORT, () => {
  logger.info(`Payment Service listening on port ${PORT}`);
});

export default app;