import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

import { NextResponse } from 'next/server';
import initSqlJs from 'sql.js';

const DB_PATH = join(process.cwd(), 'database', 'sentinel.db');

async function queryDb(sql: string, params: string[] = []): Promise<Record<string, unknown>[]> {
  try {
    if (!existsSync(DB_PATH)) {
      return [];
    }
    const SQL = await initSqlJs();
    const buffer = readFileSync(DB_PATH);
    const db = new SQL.Database(buffer);
    const results = db.exec(sql, params);
    if (results.length === 0) return [];
    const columns = results[0].columns;
    return results[0].values.map(row => {
      const obj: Record<string, unknown> = {};
      columns.forEach((col: string, i: number) => { obj[col] = row[i]; });
      return obj;
    });
  } catch {
    return [];
  }
}

export async function GET(): Promise<NextResponse> {
  try {
    const today = new Date().toISOString().split('T')[0];
    const reports = await queryDb(
      `SELECT * FROM incident_reports WHERE created_at >= ? ORDER BY created_at DESC`,
      [today]
    );

    const total = reports.length;
    const resolved = reports.filter(r => (r.tests_passed as number) > 0).length;
    const failed = total - resolved;
    const totalResolutionTime = reports.reduce((sum: number, r: Record<string, unknown>) => sum + ((r.resolution_time_seconds as number) || 0), 0);
    const avgResolutionTime = total > 0 ? Math.round(totalResolutionTime / total) : 0;

    const services = [...new Set(reports.map((r: Record<string, unknown>) => {
      const match = (r.title as string)?.match(/in (.+)$/);
      return match ? match[1] : 'Unknown';
    }))];

    const chaosTypes = [...new Set(reports.map((r: Record<string, unknown>) => {
      const match = (r.title as string)?.match(/#\d+: (.+) in/);
      return match ? match[1] : 'Unknown';
    }))];

    return NextResponse.json({
      success: true,
      data: {
        generatedAt: new Date().toISOString(),
        period: today,
        summary: {
          totalIncidents: total,
          resolved: resolved,
          failed: failed,
          resolutionRate: total > 0 ? `${Math.round((resolved / total) * 100)}%` : 'N/A',
          avgResolutionTimeSeconds: avgResolutionTime
        },
        affectedServices: services,
        incidentTypes: chaosTypes,
        reports: reports.map((r: Record<string, unknown>) => ({
          id: r.id,
          title: r.title,
          summary: r.summary,
          root_cause: r.root_cause,
          fix_applied: r.fix_applied,
          tests_created: r.tests_created,
          tests_passed: r.tests_passed,
          resolution_time_seconds: r.resolution_time_seconds,
          created_at: r.created_at
        }))
      }
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to generate post-mortem' },
      { status: 500 }
    );
  }
}
