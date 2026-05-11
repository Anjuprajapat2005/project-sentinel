'use client';

import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

import { useLiveValue } from '@/hooks/use-live-data';
import { cn } from '@/lib/utils';

interface MetricCardProps {
  title: string;
  value: number;
  unit?: string;
  icon: React.ReactNode;
  trend?: number;
  trendLabel?: string;
  color?: 'default' | 'success' | 'warning' | 'destructive';
}

export function MetricCard({
  title,
  value,
  unit,
  icon,
  trend,
  trendLabel,
  color = 'default',
}: MetricCardProps) {
  const liveValue = useLiveValue(value);

  const colorClasses = {
    default: 'bg-primary/10 text-primary border-primary/20',
    success: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
    warning: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
    destructive: 'bg-red-500/10 text-red-500 border-red-500/20',
  };

  const glowClasses = {
    default: 'hover:shadow-primary/20',
    success: 'hover:shadow-emerald-500/20',
    warning: 'hover:shadow-amber-500/20',
    destructive: 'hover:shadow-red-500/20',
  };

  return (
    <div
      className={cn(
        'group relative overflow-hidden rounded-xl border bg-card p-5 transition-all duration-300',
        'hover:shadow-lg hover:-translate-y-0.5',
        glowClasses[color]
      )}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-3">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl font-bold tabular-nums">
              {Math.round(liveValue)}
            </span>
            {unit && <span className="text-sm text-muted-foreground">{unit}</span>}
          </div>
          {trend !== undefined && (
            <div className="flex items-center gap-1">
              {trend >= 0 ? (
                <ArrowUpRight className="h-4 w-4 text-emerald-500" />
              ) : (
                <ArrowDownRight className="h-4 w-4 text-red-500" />
              )}
              <span className={cn('text-xs font-medium', trend >= 0 ? 'text-emerald-500' : 'text-red-500')}>
                {Math.abs(trend)}%
              </span>
              {trendLabel && (
                <span className="text-xs text-muted-foreground">{trendLabel}</span>
              )}
            </div>
          )}
        </div>
        <div
          className={cn(
            'flex h-12 w-12 items-center justify-center rounded-lg border',
            colorClasses[color]
          )}
        >
          {icon}
        </div>
      </div>

      {/* Live indicator */}
      <div className="absolute right-3 top-3">
        <div className="flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
        </div>
      </div>

      {/* Background glow */}
      <div
        className={cn(
          'absolute -bottom-12 -right-12 h-32 w-32 rounded-full opacity-0 blur-3xl transition-opacity duration-500',
          'group-hover:opacity-20',
          color === 'default' && 'bg-primary',
          color === 'success' && 'bg-emerald-500',
          color === 'warning' && 'bg-amber-500',
          color === 'destructive' && 'bg-red-500'
        )}
      />
    </div>
  );
}