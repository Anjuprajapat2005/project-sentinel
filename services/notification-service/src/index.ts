import express, { Express, Request, Response } from 'express';
import morgan from 'morgan';
import { SERVICE_PORTS } from '@sentinel/shared';
import { logger } from './utils/logger';
import { notificationRouter } from './routes/notification';

const app: Express = express();
const PORT = SERVICE_PORTS['notification-service'];

app.use(morgan('combined'));
app.use(express.json());

app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'healthy', service: 'notification-service', version: '1.0.0' });
});

app.use('/notifications', notificationRouter);

app.listen(PORT, () => {
  logger.info(`Notification Service listening on port ${PORT}`);
});
