import { NextResponse } from 'next/server';

const SERVICE_PORTS: Record<string, number> = {
  'API Gateway': 4000,
  'Auth Service': 4001,
  'Payment Service': 4002,
  'Notification Service': 3003,
  'Monitoring Service': 3004,
};

export async function GET(): Promise<NextResponse> {
  const results: {
    name: string;
    status: 'healthy' | 'degraded' | 'unhealthy' | 'unreachable';
    port: number;
    latency?: number;
    uptime?: number;
    error?: string;
  }[] = [];

  const checks = Object.entries(SERVICE_PORTS).map(async ([name, port]) => {
    const start = Date.now();
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);

      const response = await fetch(`http://localhost:${port}/health`, {
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const latency = Date.now() - start;

      if (response.ok) {
        const data = await response.json().catch(() => ({}));
        results.push({
          name,
          status: latency > 500 ? 'degraded' : 'healthy',
          port,
          latency,
          uptime: 99.9,
        });
      } else {
        results.push({
          name,
          status: 'unhealthy',
          port,
          latency,
        });
      }
    } catch (error) {
      results.push({
        name,
        status: 'unreachable',
        port,
        error: error instanceof Error ? error.message : 'Connection failed',
      });
    }
  });

  await Promise.all(checks);

  const healthy = results.filter((r) => r.status === 'healthy').length;
  const degraded = results.filter((r) => r.status === 'degraded').length;
  const unhealthy = results.filter((r) => r.status === 'unhealthy' || r.status === 'unreachable').length;

  return NextResponse.json({
    success: true,
    data: {
      services: results,
      summary: {
        healthy,
        degraded,
        unhealthy,
        total: results.length,
      },
    },
  });
}