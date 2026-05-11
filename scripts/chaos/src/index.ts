import { ChaosEngine } from './engines/chaos-engine';

const engine = new ChaosEngine({
  targetServices: ['auth-service', 'api-gateway', 'notification-service'],
  intervalMs: 60000,
  dryRun: false,
});

engine.start().catch(console.error);

process.on('SIGINT', async () => {
  await engine.stop();
  process.exit(0);
});