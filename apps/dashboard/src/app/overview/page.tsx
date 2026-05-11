'use client';

import { formatDistanceToNow } from 'date-fns';
import { Cpu, MemoryStick, HardDrive, Network, Server, Activity, Globe, Shield, AlertCircle, CreditCard } from 'lucide-react';
import { useState, useEffect } from 'react';

import { AgentStatusPanel } from '@/components/dashboard/agent-status-panel';
import { IncidentsPanel } from '@/components/dashboard/incidents-panel';
import { LogsViewer } from '@/components/dashboard/logs-viewer';
import { MetricCard } from '@/components/dashboard/metric-card';
import { RealtimeCharts } from '@/components/dashboard/realtime-charts';
import { ServiceStatusPanel } from '@/components/dashboard/service-status-panel';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface PaymentMetrics {
  totalPayments: number;
  totalRevenue: number;
  successfulPayments: number;
  failedPayments: number;
  refundedPayments: number;
}

const FALLBACK_STATS = {
  total_incidents: 0,
  active_incidents: 0,
  critical_incidents: 0,
  resolved_incidents: 0,
};

export default function OverviewPage() {
  const [stats, setStats] = useState<any>(FALLBACK_STATS);
  const [services, setServices] = useState<any[]>([]);
  const [incidents, setIncidents] = useState<any[]>([]);
  const [paymentMetrics, setPaymentMetrics] = useState<PaymentMetrics | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, servicesRes] = await Promise.all([
          fetch('/api/stats', { signal: AbortSignal.timeout(5000) }),
          fetch('/api/services', { signal: AbortSignal.timeout(5000) }),
        ]);

        if (statsRes.ok) {
          const statsData = await statsRes.json();
          if (statsData.success) {
            setStats(statsData.data);
          }
        }

        if (servicesRes.ok) {
          const servicesData = await servicesRes.json();
          if (servicesData.success) {
            setServices(servicesData.data);
          }
        }

        setIsConnected(true);
      } catch (err) {
        console.warn('Failed to fetch overview data:', err);
        setIsConnected(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    fetch('http://localhost:4002/metrics')
      .then(res => res.json())
      .then(data => setPaymentMetrics(data.metrics || null))
      .catch(() => setPaymentMetrics(null));
  }, []);

  const recentIncidents = incidents.slice(0, 6);
  const activeCount = incidents.filter(i => i.status === 'active').length;
  const criticalCount = incidents.filter(i => i.severity === 'critical').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">System Overview</h1>
          <p className="text-muted-foreground">
            {isConnected ? 'Real-time infrastructure monitoring' : 'Loading from API...'}
          </p>
        </div>
        <div className={`flex items-center gap-2 rounded-lg px-3 py-1.5 ${criticalCount > 0 ? 'bg-red-500/10' : 'bg-emerald-500/10'}`}>
          <div className={`h-2 w-2 animate-pulse rounded-full ${criticalCount > 0 ? 'bg-red-500' : 'bg-emerald-500'}`} />
          <span className={`text-sm font-medium ${criticalCount > 0 ? 'text-red-500' : 'text-emerald-500'}`}>
            {criticalCount > 0 ? `${criticalCount} Critical Incidents` : 'All Systems Operational'}
          </span>
        </div>
      </div>

      <RealtimeCharts />

      <AgentStatusPanel />

      <div className="grid gap-6 lg:grid-cols-2">
        <ServiceStatusPanel />
        {paymentMetrics ? (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Payment Service
                </CardTitle>
                <Badge variant="default">Connected</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">Total Payments</p>
                  <p className="text-2xl font-bold">{paymentMetrics.totalPayments}</p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">Total Revenue</p>
                  <p className="text-2xl font-bold">${paymentMetrics.totalRevenue.toLocaleString()}</p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">Successful</p>
                  <p className="text-2xl font-bold text-green-500">{paymentMetrics.successfulPayments}</p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">Failed</p>
                  <p className="text-2xl font-bold text-red-500">{paymentMetrics.failedPayments}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Payment Service
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Service unavailable. Start payment-service on port 4002.</p>
            </CardContent>
          </Card>
        )}
        <IncidentsPanel />
      </div>

      <LogsViewer />

      <div className="grid gap-4 md:grid-cols-4">
        <MetricCard
          title="Total Incidents"
          value={stats.total_incidents || 0}
          icon={<AlertCircle className="h-5 w-5" />}
          color="default"
        />
        <MetricCard
          title="Active Incidents"
          value={stats.active_incidents || 0}
          icon={<Activity className="h-5 w-5" />}
          color="warning"
        />
        <MetricCard
          title="Services"
          value={services.length || 0}
          icon={<Server className="h-5 w-5" />}
          color="success"
        />
        <MetricCard
          title="Critical"
          value={stats.critical_incidents || 0}
          icon={<Shield className="h-5 w-5" />}
          color="destructive"
        />
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Recent Incidents</CardTitle>
            <Badge variant={activeCount > 0 ? 'destructive' : 'default'}>
              {activeCount} Active
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {recentIncidents.length > 0 ? recentIncidents.map((incident) => (
              <div key={incident.id} className="rounded-lg border p-4">
                <div className="flex items-center justify-between">
                  <Badge variant={incident.severity === 'critical' ? 'destructive' : 'default'}>
                    {incident.severity}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(incident.timestamp), { addSuffix: true })}
                  </span>
                </div>
                <p className="mt-2 font-medium">{incident.service_name}</p>
                <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{incident.description}</p>
                <p className="mt-2 text-xs text-muted-foreground">{incident.chaos_type}</p>
              </div>
            )) : (
              <div className="col-span-full text-center py-8 text-muted-foreground">
                No recent incidents
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}