'use client';

import { Activity, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';
import { useState, useEffect } from 'react';

import { cn } from '@/lib/utils';

interface ServiceStatusProps {
  name: string;
  status: 'healthy' | 'degraded' | 'down';
  uptime: number;
  latency: number;
  requests: number;
  icon?: string;
}

const statusConfig = {
  healthy: {
    label: 'Healthy',
    color: 'text-emerald-500',
    bgColor: 'bg-emerald-500/10',
    borderColor: 'border-emerald-500/30',
    dotColor: 'bg-emerald-500',
    glowColor: 'shadow-emerald-500/20',
  },
  degraded: {
    label: 'Degraded',
    color: 'text-amber-500',
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500/30',
    dotColor: 'bg-amber-500',
    glowColor: 'shadow-amber-500/20',
  },
  down: {
    label: 'Down',
    color: 'text-red-500',
    bgColor: 'bg-red-500/10',
    borderColor: 'border-red-500/30',
    dotColor: 'bg-red-500',
    glowColor: 'shadow-red-500/20',
  },
};

export function ServiceStatusCard({ name, status, uptime, latency, requests, icon }: ServiceStatusProps) {
  const [liveLatency, setLiveLatency] = useState(latency);
  const config = statusConfig[status];

  useEffect(() => {
    const timer = setInterval(() => {
      setLiveLatency((prev) => {
        const change = (Math.random() - 0.5) * 10;
        return Math.max(1, prev + change);
      });
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-xl border bg-card p-5 transition-all duration-300',
        'hover:shadow-lg hover:-translate-y-0.5',
        config.borderColor,
        `shadow-lg ${config.glowColor}`
      )}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <h3 className="font-semibold">{name}</h3>
          <div className="flex items-center gap-2">
            <div className={cn('h-2 w-2 rounded-full', config.dotColor, status === 'degraded' && 'animate-pulse')} />
            <span className={cn('text-xs font-medium', config.color)}>{config.label}</span>
          </div>
        </div>
        <div className="h-10 w-10 rounded-lg bg-muted/50 flex items-center justify-center">
          <Activity className="h-5 w-5 text-muted-foreground" />
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-4">
        <div>
          <p className="text-xs text-muted-foreground">Uptime</p>
          <p className="text-lg font-semibold tabular-nums">{uptime.toFixed(1)}%</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Latency</p>
          <p className="text-lg font-semibold tabular-nums">{Math.round(liveLatency)}ms</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Req/s</p>
          <p className="text-lg font-semibold tabular-nums">{requests}</p>
        </div>
      </div>
    </div>
  );
}

interface StatusOverviewProps {
  services: ServiceStatusProps[];
}

export function StatusOverview({ services }: StatusOverviewProps) {
  const counts = services.reduce(
    (acc, s) => {
      acc[s.status]++;
      return acc;
    },
    { healthy: 0, degraded: 0, down: 0 }
  );

  return (
    <div className="rounded-xl border bg-card p-5">
      <h3 className="text-lg font-semibold mb-4">Service Status</h3>
      <div className="grid grid-cols-3 gap-4">
        <div className="flex items-center gap-3 rounded-lg bg-emerald-500/10 p-3">
          <CheckCircle2 className="h-5 w-5 text-emerald-500" />
          <div>
            <p className="text-2xl font-bold text-emerald-500">{counts.healthy}</p>
            <p className="text-xs text-muted-foreground">Healthy</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-lg bg-amber-500/10 p-3">
          <AlertTriangle className="h-5 w-5 text-amber-500" />
          <div>
            <p className="text-2xl font-bold text-amber-500">{counts.degraded}</p>
            <p className="text-xs text-muted-foreground">Degraded</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-lg bg-red-500/10 p-3">
          <Clock className="h-5 w-5 text-red-500" />
          <div>
            <p className="text-2xl font-bold text-red-500">{counts.down}</p>
            <p className="text-xs text-muted-foreground">Down</p>
          </div>
        </div>
      </div>
    </div>
  );
}