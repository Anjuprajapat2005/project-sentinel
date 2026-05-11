import { NextResponse } from 'next/server';

import { getAllIncidents, getActiveIncidents } from '@/lib/db';

export async function GET(request: Request): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');

  try {
    if (status === 'active') {
      const incidents = await getActiveIncidents();
      return NextResponse.json({ success: true, data: incidents });
    }

    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const incidents = await getAllIncidents(limit);
    return NextResponse.json({ success: true, data: incidents });
  } catch (error) {
    console.error('Failed to fetch incidents:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch incidents' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const body = await request.json();
    const { createIncident } = await import('@/lib/db');
    const id = await createIncident({
      service_id: body.service_id || null,
      service_name: body.service_name,
      chaos_type: body.chaos_type,
      target_file: body.target_file || null,
      description: body.description,
      severity: body.severity,
      status: body.status || 'active',
      rollback_available: body.rollback_available || 0,
      original_content: body.original_content || null,
      timestamp: body.timestamp || new Date().toISOString(),
    });
    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error('Failed to create incident:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create incident' },
      { status: 500 }
    );
  }
}