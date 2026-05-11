'use client';

import { AlertCircle, AlertTriangle, CheckCircle2, Clock, Zap } from 'lucide-react';

import { cn } from '@/lib/utils';

type IncidentSeverity = 'critical' | 'high' | 'medium' | 'low';
type IncidentStatus = 'active' | 'investigating' | 'resolved';

interface Incident {
  id: string | number;
  title: string;
  description: string;
  severity: IncidentSeverity;
  status: IncidentStatus;
  service: string;
  startedAt: Date;
  resolvedAt?: Date;
  assignee?: string;
}

const severityConfig = {
  critical: {
    label: 'Critical',
    color: 'bg-red-500/10 text-red-500 border-red-500/30',
    icon: AlertCircle,
    pulse: true,
  },
  high: {
    label: 'High',
    color: 'bg-orange-500/10 text-orange-500 border-orange-500/30',
    icon: AlertTriangle,
    pulse: false,
  },
  medium: {
    label: 'Medium',
    color: 'bg-amber-500/10 text-amber-500 border-amber-500/30',
    icon: Zap,
    pulse: false,
  },
  low: {
    label: 'Low',
    color: 'bg-blue-500/10 text-blue-500 border-blue-500/30',
    icon: Clock,
    pulse: false,
  },
};

const statusConfig = {
  active: {
    label: 'Active',
    color: 'bg-red-500/10 text-red-500',
  },
  investigating: {
    label: 'Investigating',
    color: 'bg-amber-500/10 text-amber-500',
  },
  resolved: {
    label: 'Resolved',
    color: 'bg-emerald-500/10 text-emerald-500',
  },
};

interface IncidentCardProps {
  incident: Incident;
  onClick?: () => void;
}

export function IncidentCard({ incident, onClick }: IncidentCardProps) {
  const severity = severityConfig[incident.severity];
  const status = statusConfig[incident.status];
  const SeverityIcon = severity.icon;
  const duration = incident.resolvedAt
    ? Math.round((incident.resolvedAt.getTime() - incident.startedAt.getTime()) / 60000)
    : Math.round((Date.now() - incident.startedAt.getTime()) / 60000);

  return (
    <div
      className={cn(
        'group relative overflow-hidden rounded-xl border bg-card p-5 transition-all duration-300',
        'hover:shadow-lg hover:-translate-y-0',
        'cursor-pointer hover:border-primary/30'
      )}
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <div
            className={cn(
              'flex h-10 w-10 items-center justify-center rounded-lg border',
              severity.color
            )}
          >
            <SeverityIcon className="h-5 w-5" />
          </div>
          <div>
            <h4 className="font-semibold group-hover:text-primary transition-colors">
              {incident.title}
            </h4>
            <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
              {incident.description}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-medium', status.color)}>
          {status.label}
        </span>
        <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground">
          {incident.service}
        </span>
        <span className="ml-auto text-xs text-muted-foreground">
          {duration}m {incident.resolvedAt ? '(resolved)' : ''}
        </span>
      </div>

      {severity.pulse && (
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-500">
          <div className="h-full w-full animate-pulse bg-red-500 opacity-50" />
        </div>
      )}
    </div>
  );
}

interface IncidentTimelineProps {
  incidents: Incident[];
}

export function IncidentTimeline({ incidents }: IncidentTimelineProps) {
  const sortedIncidents = [...incidents].sort(
    (a, b) => b.startedAt.getTime() - a.startedAt.getTime()
  );

  return (
    <div className="space-y-4">
      {sortedIncidents.map((incident, index) => {
        const severity = severityConfig[incident.severity];
        const SeverityIcon = severity.icon;

        return (
          <div key={incident.id} className="flex gap-4">
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-full border',
                  severity.color
                )}
              >
                <SeverityIcon className="h-4 w-4" />
              </div>
              {index < sortedIncidents.length - 1 && (
                <div className="h-full w-px bg-border" />
              )}
            </div>
            <div className="flex-1 pb-6">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{incident.title}</span>
                <span className="text-xs text-muted-foreground">
                  {incident.startedAt.toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{incident.description}</p>
              <div className="mt-2 flex items-center gap-2">
                <span className={cn('rounded-full px-2 py-0.5 text-xs', severity.color)}>
                  {severity.label}
                </span>
                <span className="text-xs text-muted-foreground">{incident.service}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}