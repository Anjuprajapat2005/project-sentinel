'use client';

import { useState, useEffect, useCallback } from 'react';

interface PostMortemReport {
  generatedAt: string;
  period: string;
  summary: {
    totalIncidents: number;
    resolved: number;
    failed: number;
    resolutionRate: string;
    avgResolutionTimeSeconds: number;
  };
  affectedServices: string[];
  incidentTypes: string[];
  reports: ReportSummary[];
}

interface ReportSummary {
  id: number;
  title: string;
  summary: string;
  root_cause: string;
  fix_applied: string;
  tests_created: number;
  tests_passed: number;
  resolution_time_seconds: number;
  created_at: string;
}

export default function PostMortemPage() {
  const [report, setReport] = useState<PostMortemReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReport = useCallback(async () => {
    try {
      const response = await fetch('/api/postmortem', {
        signal: AbortSignal.timeout(5000)
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setReport(data.data);
          setError(null);
        } else {
          setError(data.error || 'Failed to load report');
        }
      } else {
        setError(`HTTP ${response.status}`);
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        setError('Request timed out');
      } else {
        setError('Failed to fetch post-mortem report');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReport();
    const interval = setInterval(fetchReport, 30000);
    return () => clearInterval(interval);
  }, [fetchReport]);

  const formatDuration = (seconds: number): string => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}m ${secs}s`;
  };

  const formatDate = (dateStr: string): string => {
    try {
      return new Date(dateStr).toLocaleString();
    } catch {
      return dateStr;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error && !report) {
    return (
      <div className="min-h-screen bg-gray-950 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="bg-red-950 border border-red-800 rounded-lg p-6">
            <h2 className="text-red-400 text-lg font-semibold mb-2">Error Loading Report</h2>
            <p className="text-red-300">{error}</p>
            <button
              onClick={fetchReport}
              className="mt-4 px-4 py-2 bg-red-800 hover:bg-red-700 rounded text-white"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  const stats = report?.summary ?? {
    totalIncidents: 0,
    resolved: 0,
    failed: 0,
    resolutionRate: 'N/A',
    avgResolutionTimeSeconds: 0
  };

  return (
    <div className="min-h-screen bg-gray-950 p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Post-Mortem Report</h1>
            <p className="text-gray-400 mt-1">
              {report?.period ? `Period: ${report.period}` : 'No data available'}
            </p>
          </div>
          <button
            onClick={fetchReport}
            className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg transition-colors"
          >
            Refresh
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
            <p className="text-gray-400 text-sm">Total Incidents</p>
            <p className="text-3xl font-bold text-white mt-1">{stats.totalIncidents}</p>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
            <p className="text-gray-400 text-sm">Resolved</p>
            <p className="text-3xl font-bold text-green-400 mt-1">{stats.resolved}</p>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
            <p className="text-gray-400 text-sm">Failed</p>
            <p className="text-3xl font-bold text-red-400 mt-1">{stats.failed}</p>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
            <p className="text-gray-400 text-sm">Resolution Rate</p>
            <p className="text-3xl font-bold text-cyan-400 mt-1">{stats.resolutionRate}</p>
          </div>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Performance Metrics</h2>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <p className="text-gray-400 text-sm">Avg Resolution Time</p>
              <p className="text-2xl font-bold text-white">{formatDuration(stats.avgResolutionTimeSeconds)}</p>
            </div>
            <div>
              <p className="text-gray-400 text-sm">Generated At</p>
              <p className="text-lg text-white">{report?.generatedAt ? formatDate(report.generatedAt) : 'N/A'}</p>
            </div>
          </div>
        </div>

        {(report?.affectedServices?.length ?? 0) > 0 && (
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Affected Services</h2>
            <div className="flex flex-wrap gap-2">
              {report?.affectedServices.map((service) => (
                <span
                  key={service}
                  className="px-3 py-1 bg-purple-900/50 text-purple-300 rounded-full text-sm"
                >
                  {service}
                </span>
              ))}
            </div>
          </div>
        )}

        {(report?.incidentTypes?.length ?? 0) > 0 && (
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Incident Types</h2>
            <div className="flex flex-wrap gap-2">
              {report?.incidentTypes.map((type) => (
                <span
                  key={type}
                  className="px-3 py-1 bg-orange-900/50 text-orange-300 rounded-full text-sm"
                >
                  {type}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Incident Reports</h2>
          {(report?.reports?.length ?? 0) > 0 ? (
            <div className="space-y-4">
              {report?.reports.map((r) => (
                <div
                  key={r.id}
                  className="border border-gray-700 rounded-lg p-4 hover:border-gray-600 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-white font-medium">{r.title}</h3>
                      <p className="text-gray-400 text-sm mt-1">{r.summary}</p>
                      <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Root Cause:</span>
                          <span className="text-gray-300 ml-1">{r.root_cause || 'N/A'}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Fix:</span>
                          <span className="text-gray-300 ml-1">{r.fix_applied ? 'Applied' : 'None'}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Tests:</span>
                          <span className="text-green-400 ml-1">
                            {r.tests_passed}/{r.tests_created}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500">Time:</span>
                          <span className="text-gray-300 ml-1">
                            {formatDuration(r.resolution_time_seconds)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <span className="text-gray-500 text-sm">{formatDate(r.created_at)}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500">No incident reports available</p>
              <p className="text-gray-600 text-sm mt-2">
                Reports will appear after incidents are resolved
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
