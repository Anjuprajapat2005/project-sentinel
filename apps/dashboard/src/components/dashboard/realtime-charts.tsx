'use client';

import { Activity, TrendingUp, AlertTriangle, RefreshCw } from 'lucide-react';
import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const COLORS = ['#22c55e', '#f97316', '#eab308', '#ef4444', '#3b82f6', '#8b5cf6'];

const FALLBACK_STATS = {
  total_incidents: 0,
  active_incidents: 0,
  critical_incidents: 0,
  bySeverity: [],
  byService: [],
  byType: [],
};

export function RealtimeCharts() {
  const [stats, setStats] = useState<any>(FALLBACK_STATS);
  const [loading, setLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [chartData, setChartData] = useState<any[]>(generateFallbackChartData());

  function generateFallbackChartData() {
    return Array.from({ length: 12 }, (_, i) => ({
      time: `${String(i).padStart(2, '0')}:00`,
      incidents: Math.floor(Math.random() * 5),
      errors: Math.floor(Math.random() * 2),
    }));
  }

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/stats', { signal: AbortSignal.timeout(5000) });
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setStats(data.data);
            setIsConnected(true);
          }
        }
      } catch (err) {
        console.warn('Failed to fetch stats:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const incidentsByService = stats.byService?.map((s: any) => ({
    name: s.service_name,
    value: s.count,
  })) || [];

  const incidentsByType = stats.byType?.map((t: any) => ({
    name: t.chaos_type,
    value: t.count,
  })) || [];

  const severityData = stats.bySeverity?.map((s: any) => ({
    name: s.severity,
    value: s.count,
    color: s.severity === 'critical' ? '#ef4444' : s.severity === 'high' ? '#f97316' : s.severity === 'medium' ? '#eab308' : '#3b82f6',
  })) || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Real-time Analytics</h2>
        <div className="flex items-center gap-2">
          <Badge variant={isConnected ? 'default' : 'destructive'}>
            {isConnected ? 'Live' : 'Disconnected'}
          </Badge>
          <Badge variant="outline">
            {stats.total_incidents || 0} Total Incidents
          </Badge>
          <Badge variant="destructive">
            {stats.critical_incidents || 0} Critical
          </Badge>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="rounded-lg bg-primary/10 p-3">
              <Activity className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-3xl font-bold">{stats.total_incidents || 0}</p>
              <p className="text-sm text-muted-foreground">Total Incidents</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="rounded-lg bg-red-500/10 p-3">
              <AlertTriangle className="h-6 w-6 text-red-500" />
            </div>
            <div>
              <p className="text-3xl font-bold text-red-500">{stats.critical_incidents || 0}</p>
              <p className="text-sm text-muted-foreground">Critical</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="rounded-lg bg-orange-500/10 p-3">
              <TrendingUp className="h-6 w-6 text-orange-500" />
            </div>
            <div>
              <p className="text-3xl font-bold text-orange-500">{stats.active_incidents || 0}</p>
              <p className="text-sm text-muted-foreground">Active</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="rounded-lg bg-green-500/10 p-3">
              <RefreshCw className="h-6 w-6 text-green-500" />
            </div>
            <div>
              <p className="text-3xl font-bold">{loading ? '...' : incidentsByService.length}</p>
              <p className="text-sm text-muted-foreground">Services</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Incidents Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="time" tick={{ fontSize: 12 }} className="text-muted-foreground" />
                <YAxis tick={{ fontSize: 12 }} className="text-muted-foreground" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--card)',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="incidents"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={false}
                  name="Incidents"
                />
                <Line
                  type="monotone"
                  dataKey="errors"
                  stroke="#ef4444"
                  strokeWidth={2}
                  dot={false}
                  name="Errors"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Incidents by Service</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={incidentsByService.length > 0 ? incidentsByService : [{ name: 'No Data', value: 0 }]}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} className="text-muted-foreground" />
                <YAxis tick={{ fontSize: 12 }} className="text-muted-foreground" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--card)',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                  }}
                />
                <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Incidents by Type</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={incidentsByType.length > 0 ? incidentsByType : [{ name: 'No Data', value: 1 }]}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {incidentsByType.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Incidents by Severity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {severityData.length > 0 ? severityData.map((item: any) => (
                <div key={item.name} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium capitalize">{item.name}</span>
                    <span className="text-sm text-muted-foreground">{item.value}</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${(item.value / (stats.total_incidents || 1)) * 100}%`,
                        backgroundColor: item.color,
                      }}
                    />
                  </div>
                </div>
              )) : (
                <p className="text-center text-muted-foreground py-8">No severity data available</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}