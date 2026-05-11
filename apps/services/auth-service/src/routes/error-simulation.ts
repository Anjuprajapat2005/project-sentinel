import { Router, type Request, type Response, type NextFunction } from 'express';
import { logger } from '../utils/logger';

export const errorSimulationRouter: Router = Router();

const errorStates = {
  latency: false,
  highLatency: false,
  error: false,
  crash: false,
};

errorSimulationRouter.post('/simulate/latency', (req: Request, res: Response): void => {
  const { enabled } = req.body;
  errorStates.latency = enabled ?? true;
  logger.warn('Latency simulation toggled', { enabled: errorStates.latency });
  res.json({ success: true, simulation: 'latency', enabled: errorStates.latency });
});

errorSimulationRouter.post('/simulate/high-latency', (req: Request, res: Response): void => {
  const { enabled } = req.body;
  errorStates.highLatency = enabled ?? true;
  logger.warn('High latency simulation toggled', { enabled: errorStates.highLatency });
  res.json({ success: true, simulation: 'high-latency', enabled: errorStates.highLatency });
});

errorSimulationRouter.post('/simulate/error', (req: Request, res: Response): void => {
  const { enabled, statusCode } = req.body;
  errorStates.error = enabled ?? true;
  logger.error('Error simulation toggled', { enabled: errorStates.error, statusCode: statusCode || 500 });
  res.json({ success: true, simulation: 'error', enabled: errorStates.error, statusCode: statusCode || 500 });
});

errorSimulationRouter.post('/simulate/crash', (_req: Request, res: Response): void => {
  logger.error('Simulating crash - service will terminate', { service: 'auth-service' });
  res.json({ success: true, simulation: 'crash', message: 'Service will crash in 1 second' });
  setTimeout(() => {
    process.exit(1);
  }, 1000);
});

errorSimulationRouter.post('/simulate/reset', (_req: Request, res: Response): void => {
  errorStates.latency = false;
  errorStates.highLatency = false;
  errorStates.error = false;
  errorStates.crash = false;
  logger.info('All simulations reset');
  res.json({ success: true, message: 'All simulations reset' });
});

errorSimulationRouter.get('/simulate/status', (_req: Request, res: Response): void => {
  res.json({
    simulations: {
      latency: errorStates.latency,
      highLatency: errorStates.highLatency,
      error: errorStates.error,
      crash: errorStates.crash,
    },
  });
});

errorSimulationRouter.use((req: Request, res: Response, next: NextFunction): void => {
  if (errorStates.crash) {
    logger.error('Service crash triggered');
    process.exit(1);
  }
  if (errorStates.error) {
    logger.warn('Simulated error response');
    res.status(500).json({ error: 'Simulated error', service: 'auth-service' });
    return;
  }
  if (errorStates.highLatency) {
    const delay = 5000 + Math.random() * 5000;
    logger.info(`Simulating high latency: ${Math.round(delay)}ms`);
    setTimeout(next, delay);
    return;
  }
  if (errorStates.latency) {
    const delay = 500 + Math.random() * 500;
    logger.info(`Simulating latency: ${Math.round(delay)}ms`);
    setTimeout(next, delay);
    return;
  }
  next();
});