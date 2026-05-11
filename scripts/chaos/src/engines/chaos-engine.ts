import { randomUUID } from 'crypto';

import { ChaosActionType, ChaosStatus } from '@sentinel/shared';

import { logger } from '../utils/logger';

interface ChaosEngineOptions {
  targetServices: string[];
  intervalMs: number;
  dryRun: boolean;
}

interface ChaosAction {
  id: string;
  type: ChaosActionType;
  targetService: string;
  status: ChaosStatus;
  timestamp: Date;
}

const CHAOS_ACTIONS: ChaosActionType[] = [
  ChaosActionType.CONSUME_MEMORY,
  ChaosActionType.DELAY_REQUESTS,
  ChaosActionType.INJECT_ERROR,
];

export class ChaosEngine {
  private timer: ReturnType<typeof setInterval> | null = null;
  private actions: ChaosAction[] = [];
  private readonly options: ChaosEngineOptions;

  constructor(options: ChaosEngineOptions) {
    this.options = options;
  }

  async start(): Promise<void> {
    logger.info('Chaos Engine started', { options: this.options });

    this.timer = setInterval(async () => {
      await this.executeRandomChaos();
    }, this.options.intervalMs);
  }

  async stop(): Promise<void> {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    logger.info('Chaos Engine stopped');
  }

  private async executeRandomChaos(): Promise<void> {
    const targetService = this.options.targetServices[
      Math.floor(Math.random() * this.options.targetServices.length)
    ];

    const actionType = CHAOS_ACTIONS[Math.floor(Math.random() * CHAOS_ACTIONS.length)];

    const action: ChaosAction = {
      id: randomUUID(),
      type: actionType,
      targetService,
      status: ChaosStatus.PENDING,
      timestamp: new Date(),
    };

    this.actions.push(action);
    logger.info('Executing chaos action', { action });

    if (!this.options.dryRun) {
      action.status = ChaosStatus.RUNNING;
      await this.runAction(action);
    }
  }

  private async runAction(action: ChaosAction): Promise<void> {
    try {
      switch (action.type) {
        case ChaosActionType.DELAY_REQUESTS:
          await this.delayRequests(action.targetService);
          break;
        case ChaosActionType.INJECT_ERROR:
          await this.injectError(action.targetService);
          break;
        case ChaosActionType.CONSUME_MEMORY:
          await this.consumeMemory();
          break;
      }
      action.status = ChaosStatus.COMPLETED;
      logger.info('Chaos action completed', { action });
    } catch (error) {
      action.status = ChaosStatus.FAILED;
      logger.error('Chaos action failed', { action, error });
    }
  }

  private async delayRequests(_service: string): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }

  private async injectError(_service: string): Promise<void> {
    throw new Error('Injected chaos error');
  }

  private async consumeMemory(): Promise<void> {
    const chunks: unknown[] = [];
    for (let i = 0; i < 100; i++) {
      chunks.push(new Array(1024 * 1024).fill('x'));
    }
    await new Promise((resolve) => setTimeout(resolve, 5000));
  }

  getActions(): ChaosAction[] {
    return [...this.actions];
  }
}