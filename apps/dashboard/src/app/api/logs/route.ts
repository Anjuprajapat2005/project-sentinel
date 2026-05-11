import { NextResponse } from 'next/server';

export async function GET(): Promise<NextResponse> {
  const fallbackLogs = [
    { id: 1, service: 'auth-service', level: 'INFO', message: 'Service started successfully', metadata: null, timestamp: new Date().toISOString() },
    { id: 2, service: 'payment-service', level: 'INFO', message: 'Service started successfully', metadata: null, timestamp: new Date().toISOString() },
    { id: 3, service: 'notification-service', level: 'INFO', message: 'Service started successfully', metadata: null, timestamp: new Date().toISOString() },
    { id: 4, service: 'monitoring-service', level: 'INFO', message: 'Service started successfully', metadata: null, timestamp: new Date().toISOString() },
    { id: 5, service: 'api-gateway', level: 'INFO', message: 'Service started successfully', metadata: null, timestamp: new Date().toISOString() },
  ];

  return NextResponse.json({ success: true, data: fallbackLogs });
}