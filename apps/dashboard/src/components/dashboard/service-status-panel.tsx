'use client';

import { Activity, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import { useState, useEffect } from 'react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

const statusConfig = {
  healthy: { label: 'Healthy', color: 'bg-green-500/10 text-green-500 border-green-500/30', icon: CheckCircle2 },
  degraded: { label: 'Degraded', color: 'bg-amber-500/10 text-amber-500 border-amber-500/30', icon: AlertTriangle },
  down: { label: 'Down', color: 'bg-red-500/10 text-red-500 border-red-500/30', icon: XCircle },
  unhealthy: { label: 'Unhealthy', color: 'bg-red-500/10 text-red-500 border-red-500/30', icon: XCircle },
  unreachable: { label: 'Unreachable', color: 'bg-red-500/10 text-red-500 border-red-500/30', icon: XCircle },
  unknown: { label: 'Unknown', color: 'bg-muted text-muted-foreground', icon: Activity },
};

const FALLBACK_SERVICES = [
  { name: 'API Gateway', status: 'healthy', port: 4000 },
  { name: 'Auth Service', status: 'healthy', port: 4001 },
  { name: 'Payment Service', status: 'healthy', port: 4002 },
  { name: 'Notification Service', status: 'degraded', port: 3003 },
  { name: 'Monitoring Service', status: 'healthy', port: 3004 },
];

interface ServiceStatusProps {
  service: {
    name: string;
    status: string;
    port: number;
  };
  onClick?: () => void;
}

function ServiceStatusItem({ service, onClick }: ServiceStatusProps) {
  const config = statusConfig[service.status as keyof typeof statusConfig] || statusConfig.unknown;
  const StatusIcon = config.icon;

  return (
    <div
      className={cn(
        'flex items-center justify-between rounded-lg border p-4 transition-all hover:border-primary/30 cursor-pointer',
        config.color
      )}
      onClick={onClick}
    >
      <div className="flex items-center gap-3">
        <div className={cn('flex h-10 w-10 items-center justify-center rounded-lg border', config.color)}>
          <StatusIcon className="h-5 w-5" />
        </div>
        <div>
          <p className="font-medium">{service.name}</p>
          <p className="text-sm text-muted-foreground">Port {service.port}</p>
        </div>
      </div>
      <div className="text-right">
        <Badge variant="outline" className={config.color}>
          {config.label}
        </Badge>
      </div>
    </div>
  );
}

export function ServiceStatusPanel() {
  const [services, setServices] = useState<any[]>(FALLBACK_SERVICES);
  const [loading, setLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const response = await fetch('/api/services', { signal: AbortSignal.timeout(5000) });
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data.length > 0) {
            setServices(data.data.map((s: any) => ({
              name: s.name,
              status: s.status,
              port: s.port,
            })));
            setIsConnected(true);
          }
        }
      } catch (err) {
        console.warn('Failed to fetch services:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchServices();
    const interval = setInterval(fetchServices, 30000);
    return () => clearInterval(interval);
  }, []);

  const healthyCount = services.filter(s => s.status === 'healthy').length;
  const degradedCount = services.filter(s => s.status === 'degraded').length;
  const downCount = services.filter(s => s.status === 'down' || s.status === 'unhealthy' || s.status === 'unreachable').length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Service Status
          </span>
          <Badge variant={isConnected ? 'default' : 'destructive'}>
            {isConnected ? 'Live' : 'Disconnected'}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-3 rounded-lg bg-green-500/10 border border-green-500/30">
            <p className="text-2xl font-bold text-green-500">{healthyCount}</p>
            <p className="text-xs text-muted-foreground">Healthy</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
            <p className="text-2xl font-bold text-amber-500">{degradedCount}</p>
            <p className="text-xs text-muted-foreground">Degraded</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-red-500/10 border border-red-500/30">
            <p className="text-2xl font-bold text-red-500">{downCount}</p>
            <p className="text-xs text-muted-foreground">Down</p>
          </div>
        </div>

        <div className="space-y-2 max-h-64 overflow-y-auto">
          {services.map((service, idx) => (
            <ServiceStatusItem
              key={service.name || idx}
              service={service}
              onClick={() => console.log('Service clicked:', service.name)}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}