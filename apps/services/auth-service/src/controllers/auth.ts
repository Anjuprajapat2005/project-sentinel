import { type Request, type Response, type NextFunction } from 'express';
import { createUserSchema, loginSchema, refreshTokenSchema } from '@sentinel/shared';
import { createLogger } from '@sentinel/shared';

const logger = createLogger('auth-controller');

export const authController = {
  register: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = createUserSchema.parse(req.body);
      logger.info('User registration attempt', { email: data.email });
      res.status(201).json({ success: true, data: { message: 'User created' } });
    } catch (error) {
      next(error);
    }
  },

  login: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = loginSchema.parse(req.body);
      logger.info('User login attempt', { email: data.email });
      res.json({ success: true, data: { accessToken: 'token', refreshToken: 'refresh' } });
    } catch (error) {
      next(error);
    }
  },

  refresh: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = refreshTokenSchema.parse(req.body);
      logger.info('Token refresh attempt');
      res.json({ success: true, data: { accessToken: 'new-token' } });
    } catch (error) {
      next(error);
    }
  },

  logout: async (_req: Request, res: Response, next: NextFunction) => {
    try {
      logger.info('User logout');
      res.json({ success: true, data: { message: 'Logged out' } });
    } catch (error) {
      next(error);
    }
  },

  me: async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.json({ success: true, data: { user: { id: '1', email: 'user@test.com' } } });
    } catch (error) {
      next(error);
    }
  },
};