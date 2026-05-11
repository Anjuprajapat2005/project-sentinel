import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { SERVICE_PORTS, HTTP_STATUS, API_PREFIX } from '@sentinel/shared';
import { logger } from './utils/logger';

const app: Express = express();
const PORT = SERVICE_PORTS['api-gateway'];

app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());

app.get(`${API_PREFIX}/health`, (_req: Request, res: Response) => {
  res.json({ status: 'healthy', service: 'api-gateway', version: '1.0.0' });
});

app.use(
  `${API_PREFIX}/auth`,
  createProxyMiddleware({
    target: `http://localhost:${SERVICE_PORTS['auth-service']}`,
    changeOrigin: true,
    pathRewrite: { [`^${API_PREFIX}/auth`]: '' },
  })
);

app.use(
  `${API_PREFIX}/notifications`,
  createProxyMiddleware({
    target: `http://localhost:${SERVICE_PORTS['notification-service']}`,
    changeOrigin: true,
    pathRewrite: { [`^${API_PREFIX}/notifications`]: '' },
  })
);

app.use(
  `${API_PREFIX}/monitoring`,
  createProxyMiddleware({
    target: `http://localhost:${SERVICE_PORTS['monitoring-service']}`,
    changeOrigin: true,
    pathRewrite: { [`^${API_PREFIX}/monitoring`]: '' },
  })
);

app.use((_req: Request, res: Response) => {
  res.status(HTTP_STATUS.NOT_FOUND).json({ error: 'Not found' });
});

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  logger.error(err.message);
  res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  logger.info(`API Gateway listening on port ${PORT}`);
});
