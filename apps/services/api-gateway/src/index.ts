import { createLogger } from '@sentinel/shared';
import cors from 'cors';
import express, { type Express, type Request, type Response } from 'express';
import helmet from 'helmet';

import { gatewayRoutes } from './routes/gateway';

const app: Express = express();
const logger = createLogger('api-gateway');
const PORT = process.env.PORT ?? 4000;

app.use(helmet());
app.use(cors());
app.use(express.json());

app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'healthy', service: 'api-gateway' });
});

app.use('/api/v1', gatewayRoutes);

app.listen(PORT, () => {
  logger.info(`API Gateway running on port ${PORT}`);
});

export default app;