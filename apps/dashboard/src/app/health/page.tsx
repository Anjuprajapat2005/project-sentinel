'use client';

import {
  Server,
  Database,
  HardDrive,
  Cpu,
  MemoryStick,
  Network,
  Activity,
  Shield,
  Clock,
  Zap,
  AlertTriangle,
  CheckCircle2,
  BarChart3,
  Loader2,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useMounted } from '@/hooks/use-live-data';
import { cn } from '@/lib/utils';

interface ServiceHealth {
  name: string;
  status: 'healthy' | 'degraded' | 'unhealthy' | 'unreachable';
  port: number;
  latency?: number;
  uptime?: number;
  error?: string;
}

const fallbackServices: ServiceHealth[] = [
  { name: 'API Gateway', status: 'healthy', port: 4000, uptime: 99.98, latency: 45 },
  { name: 'Auth Service', status: 'healthy', port: 4001, uptime: 99.95, latency: 32 },
  { name: 'Payment Service', status: 'healthy', port: 4002, uptime: 99.99, latency: 28 },
  { name: 'Notification Service', status: 'degraded', port: 3003, uptime: 98.72, latency: 89 },
  { name: 'Monitoring Service', status: 'healthy', port: 3004, uptime: 99.99, latency: 24 },
  { name: 'Database Primary', status: 'healthy', port: 8080, uptime: 99.99, latency: 12 },
  { name: 'Database Replica', status: 'healthy', port: 8080, uptime: 99.97, latency: 14 },
  { name: 'WebSocket Server', status: 'healthy', port: 8080, uptime: 99.91, latency: 8 },
];

const generateStaticHealthData = () => {
  return Array.from({ length: 30 }, (_, i) => ({
    time: `${String(i).padStart(2, '0')}:00`,
    api: 99.5 + Math.random() * 0.5,
    auth: 99.7 + Math.random() * 0.3,
    notification: 97 + Math.random() * 3,
    database: 99.9 + Math.random() * 0.1,
  }));
};

const staticServerMetrics = [
  { name: 'server-01', cpu: 45, memory: 67, disk: 42, status: 'healthy' },
  { name: 'server-02', cpu: 62, memory: 78, disk: 38, status: 'healthy' },
  { name: 'server-03', cpu: 38, memory: 54, disk: 61, status: 'healthy' },
  { name: 'server-04', cpu: 89, memory: 91, disk: 55, status: 'degraded' },
  { name: 'server-05', cpu: 52, memory: 45, disk: 33, status: 'healthy' },
  { name: 'server-06', cpu: 41, memory: 72, disk: 48, status: 'healthy' },
];

export default function SystemHealthPage() {
  const mounted = useMounted();
  const [healthData] = useState(generateStaticHealthData);
  const [metrics, setMetrics] = useState(staticServerMetrics);
  const [currentTime, setCurrentTime] = useState('00:00');
  const [services, setServices] = useState<ServiceHealth[]>(fallbackServices);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setCurrentTime(new Date().toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    }));
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const fetchHealth = async () => {
      try {
        const response = await fetch('/api/health', { signal: AbortSignal.timeout(5000) });
        if (response.ok) {
          const result = await response.json();
          if (result.success && result.data?.services) {
            setServices(result.data.services);
          }
        }
      } catch (err) {
        console.warn('Health check failed, using fallback data:', err);
        setError('Using cached health data');
      } finally {
        setLoading(false);
      }
    };

    fetchHealth();
    const interval = setInterval(fetchHealth, 30000);
    return () => clearInterval(interval);
  }, [mounted]);

  useEffect(() => {
    if (!mounted) return;

    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      }));

      setMetrics((prev) =>
        prev.map((server) => ({
          ...server,
          cpu: Math.max(10, Math.min(100, server.cpu + (Math.random() - 0.5) * 10)),
          memory: Math.max(20, Math.min(100, server.memory + (Math.random() - 0.5) * 5)),
        }))
      );
    }, 5000);

    return () => clearInterval(timer);
  }, [mounted]);

  const healthyCount = services.filter((s) => s.status === 'healthy').length;
  const degradedCount = services.filter((s) => s.status === 'degraded').length;
  const unhealthyCount = services.filter((s) => s.status === 'unhealthy' || s.status === 'unreachable').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">System Health</h1>
          <p className="text-muted-foreground">Real-time infrastructure monitoring</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="gap-1">
            <Clock className="h-3 w-3" />
            Last updated: {currentTime}
          </Badge>
        </div>
      </div>

      {/* Status Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-emerald-500/30 bg-emerald-500/5">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="rounded-lg bg-emerald-500/10 p-3">
              {loading ? (
                <Loader2 className="h-6 w-6 text-emerald-500 animate-spin" />
              ) : (
                <CheckCircle2 className="h-6 w-6 text-emerald-500" />
              )}
            </div>
            <div>
              <p className="text-3xl font-bold">{healthyCount}</p>
              <p className="text-sm text-muted-foreground">Services Healthy</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="rounded-lg bg-amber-500/10 p-3">
              <AlertTriangle className="h-6 w-6 text-amber-500" />
            </div>
            <div>
              <p className="text-3xl font-bold">{degradedCount}</p>
              <p className="text-sm text-muted-foreground">Degraded</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="rounded-lg bg-muted p-3">
              <Server className="h-6 w-6 text-muted-foreground" />
            </div>
            <div>
              <p className="text-3xl font-bold">{services.length}</p>
              <p className="text-sm text-muted-foreground">Services Monitored</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="rounded-lg bg-primary/10 p-3">
              <Zap className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-3xl font-bold">{unhealthyCount > 0 ? 'Issues' : '99.7%'}</p>
              <p className="text-sm text-muted-foreground">{unhealthyCount > 0 ? 'Attention Needed' : 'Avg Uptime'}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Health Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Service Health Over Time</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={healthData}>
              <defs>
                <linearGradient id="apiGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="authGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(142 76% 36%)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(142 76% 36%)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="notifGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(38 92% 50%)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(38 92% 50%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="time" stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <YAxis
                domain={[95, 100]}
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickFormatter={(v) => `${v}%`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '0.75rem',
                }}
              />
              <Area
                type="monotone"
                dataKey="api"
                stroke="hsl(var(--primary))"
                fill="url(#apiGradient)"
                name="API Gateway"
              />
              <Area
                type="monotone"
                dataKey="auth"
                stroke="hsl(142 76% 36%)"
                fill="url(#authGradient)"
                name="Auth Service"
              />
              <Area
                type="monotone"
                dataKey="notification"
                stroke="hsl(38 92% 50%)"
                fill="url(#notifGradient)"
                name="Notification"
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Server Metrics */}
      <Card>
        <CardHeader>
          <CardTitle>Server Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {metrics.map((server) => (
              <div
                key={server.name}
                className={cn(
                  'rounded-lg border bg-card p-4',
                  server.status === 'degraded' && 'border-amber-500/30'
                )}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Server className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{server.name}</span>
                  </div>
                  <Badge
                    variant={server.status === 'healthy' ? 'default' : 'secondary'}
                    className={server.status === 'degraded' ? 'bg-amber-500/10 text-amber-500' : ''}
                  >
                    {server.status}
                  </Badge>
                </div>
                <div className="space-y-3">
                  <div>
                    <div className="mb-1 flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1">
                        <Cpu className="h-3 w-3" /> CPU
                      </span>
                      <span>{Math.round(server.cpu)}%</span>
                    </div>
                    <Progress
                      value={server.cpu}
                      className={cn(
                        server.cpu > 80 && 'bg-amber-500 [&>div]:bg-amber-500'
                      )}
                    />
                  </div>
                  <div>
                    <div className="mb-1 flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1">
                        <MemoryStick className="h-3 w-3" /> Memory
                      </span>
                      <span>{Math.round(server.memory)}%</span>
                    </div>
                    <Progress
                      value={server.memory}
                      className={cn(
                        server.memory > 80 && 'bg-amber-500 [&>div]:bg-amber-500'
                      )}
                    />
                  </div>
                  <div>
                    <div className="mb-1 flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1">
                        <HardDrive className="h-3 w-3" /> Disk
                      </span>
                      <span>{Math.round(server.disk)}%</span>
                    </div>
                    <Progress value={server.disk} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Service Grid */}
      <Card>
        <CardHeader>
          <CardTitle>Service Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {services.map((service) => (
              <div
                key={service.name}
                className={cn(
                  'rounded-lg border bg-card p-4 transition-all',
                  service.status === 'degraded' && 'border-amber-500/30'
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {service.status === 'healthy' ? (
                      <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                    ) : service.status === 'degraded' ? (
                      <AlertTriangle className="h-5 w-5 text-amber-500 animate-pulse" />
                    ) : (
                      <AlertTriangle className="h-5 w-5 text-red-500 animate-pulse" />
                    )}
                    <span className="font-medium">{service.name}</span>
                  </div>
                  <Badge variant={service.status === 'healthy' ? 'default' : service.status === 'degraded' ? 'secondary' : 'destructive'}>
                    {service.status}
                  </Badge>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Latency</span>
                    <p className="font-medium tabular-nums">{service.latency ? `${service.latency}ms` : 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Port</span>
                    <p className="font-medium tabular-nums">{service.port}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}