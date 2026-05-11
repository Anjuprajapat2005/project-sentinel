import { NextResponse } from 'next/server';

import { getIncidentStats } from '@/lib/db';

export async function GET(): Promise<NextResponse> {
  try {
    const stats = await getIncidentStats();
    return NextResponse.json({ success: true, data: stats });
  } catch (error) {
    console.error('Failed to fetch stats:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}