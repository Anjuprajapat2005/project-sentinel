import { Router, Request, Response } from 'express';

export const notificationRouter = Router();

notificationRouter.get('/', (_req: Request, res: Response) => {
  res.json({ items: [], total: 0 });
});

notificationRouter.post('/', (req: Request, res: Response) => {
  res.status(201).json({ message: 'Notification sent' });
});

notificationRouter.patch('/:id/read', (req: Request, res: Response) => {
  res.json({ message: 'Notification marked as read' });
});