import { SERVICE_PORTS } from '@sentinel/shared';
import express, { type Express, type Request, type Response } from 'express';
import morgan from 'morgan';

import { metricsRouter } from './routes/metrics.js';
import { logger } from './utils/logger.js';

const app: Express = express();
const PORT = SERVICE_PORTS['monitoring-service'];

app.use(morgan('combined'));
app.use(express.json());

app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'healthy', service: 'monitoring-service', version: '1.0.0' });
});

app.use('/metrics', metricsRouter);

app.listen(PORT, () => {
  logger.info(`Monitoring Service listening on port ${PORT}`);
});
