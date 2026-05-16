import { Router } from 'express';
import { z } from 'zod';

import { logger } from '../utils/logger';

import type { Request, Response } from 'express';

export const paymentRouter: Router = Router();

const paymentSchema = z.object({
  userId: z.string().optional(),
  amount: z.number().positive().optional(),
  currency: z.string().optional().default('USD'),
  method: z.string().optional().default('card'),
});

interface Payment {
  id: string;
  userId: string;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  method: string;
  createdAt: Date;
  completedAt?: Date;
}

const payments = new Map<string, Payment>();

// POST /payments/charge - Process a payment
paymentRouter.post('/charge', (req: Request, res: Response) => {
  try {
    const body = paymentSchema.parse(req.body);
    const paymentId = `pay_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const payment: Payment = {
      id: paymentId,
      userId: body.userId || 'anonymous',
      amount: body.amount || 100,
      currency: body.currency,
      status: 'completed',
      method: body.method,
      createdAt: new Date(),
      completedAt: new Date(),
    };

    payments.set(paymentId, payment);
    logger.info('Payment processed', { paymentId, amount: payment.amount });

    res.json({
      success: true,
      paymentId,
      status: 'completed',
      amount: payment.amount,
      currency: payment.currency,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, error: 'Invalid request body', details: error.errors });
      return;
    }
    logger.error('Payment processing failed', { error: String(error) });
    res.status(500).json({ success: false, error: 'Payment processing failed' });
  }
});

// GET /payments/:id - Get payment by ID
paymentRouter.get('/:id', (req: Request, res: Response) => {
  const payment = payments.get(req.params.id);
  if (payment) {
    res.json(payment);
  } else {
    res.status(404).json({ error: 'Payment not found' });
  }
});

// GET /payments - List all payments
paymentRouter.get('/', (_req: Request, res: Response) => {
  res.json({ payments: Array.from(payments.values()) });
});

// POST /payments/refund - Refund a payment
paymentRouter.post('/refund', (req: Request, res: Response) => {
  const paymentId = req.body.paymentId;
  const payment = payments.get(paymentId);

  if (payment) {
    payment.status = 'refunded';
    payment.completedAt = new Date();
    logger.info('Payment refunded', { paymentId });
    res.json({ success: true, paymentId, status: 'refunded' });
  } else {
    res.status(404).json({ error: 'Payment not found' });
  }
});

// POST /payments/webhook - Stripe-style webhook handler
paymentRouter.post('/webhook', (req: Request, res: Response) => {
  const { type, data } = req.body;

  logger.info('Webhook received', { type, data });

  // Simulate processing different webhook events
  switch (type) {
    case 'payment_intent.succeeded':
      logger.info('Payment intent succeeded', { paymentId: data?.id });
      break;
    case 'payment_intent.failed':
      logger.warn('Payment intent failed', { paymentId: data?.id });
      break;
    case 'charge.refunded':
      logger.info('Charge refunded', { paymentId: data?.id });
      break;
    default:
      logger.info('Unknown webhook type', { type });
  }

  res.json({ received: true });
});