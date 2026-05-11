import express, { Express, Request, Response } from 'express';
import morgan from 'morgan';
import { logger } from './utils/logger';
import { authRouter } from './routes/auth';

const app: Express = express();
const PORT = process.env.PORT || 4001;

app.use(morgan('combined'));
app.use(express.json());

app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'healthy', service: 'auth-service', version: '1.0.0' });
});

app.use('/auth', authRouter);

app.listen(PORT, () => {
  logger.info(`Auth Service listening on port ${PORT}`);
});
