import { NextResponse } from 'next/server';

const SERVICE_PORTS: Record<string, number> = {
  'api-gateway': 4000,
  'auth-service': 4001,
  'payment-service': 4002,
  'notification-service': 3003,
  'monitoring-service': 3004,
};

export async function GET(): Promise<NextResponse> {
  const results: {
    name: string;
    status: string;
    port: number;
    response_time?: number;
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
      const responseTime = Date.now() - start;

      results.push({
        name,
        status: response.ok ? 'healthy' : 'unhealthy',
        port,
        response_time: responseTime,
      });
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

  return NextResponse.json({ success: true, data: results });
}