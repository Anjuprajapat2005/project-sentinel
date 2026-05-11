import { Router, Request, Response } from 'express';

export const authRouter: Router = Router();

authRouter.post('/login', (_req: Request, res: Response) => {
  res.json({ token: 'mock-jwt-token', user: { id: '1', email: 'user@example.com' } });
});

authRouter.post('/register', (_req: Request, res: Response) => {
  res.status(201).json({ message: 'User registered' });
});

authRouter.post('/logout', (_req: Request, res: Response) => {
  res.json({ message: 'Logged out' });
});

authRouter.get('/me', (_req: Request, res: Response) => {
  res.json({ id: '1', email: 'user@example.com', name: 'Test User' });
});