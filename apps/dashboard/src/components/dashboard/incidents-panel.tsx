'use client';

import { formatDistanceToNow } from 'date-fns';
import { AlertCircle, AlertTriangle, Clock, Search, Filter, Zap, X } from 'lucide-react';
import { useState, useEffect } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

const severityConfig = {
  critical: { label: 'Critical', color: 'bg-red-500/10 text-red-500 border-red-500/30', icon: AlertCircle, pulse: true },
  high: { label: 'High', color: 'bg-orange-500/10 text-orange-500 border-orange-500/30', icon: AlertTriangle, pulse: false },
  medium: { label: 'Medium', color: 'bg-amber-500/10 text-amber-500 border-amber-500/30', icon: Zap, pulse: false },
  low: { label: 'Low', color: 'bg-blue-500/10 text-blue-500 border-blue-500/30', icon: Clock, pulse: false },
};

const FALLBACK_INCIDENTS: any[] = [];

interface IncidentItemProps {
  incident: {
    id: number;
    service_name: string;
    chaos_type: string;
    description: string;
    severity: string;
    status: string;
    timestamp: string;
    rollback_available: number;
  };
  onRollback?: (id: number) => void;
}

function IncidentItem({ incident, onRollback }: IncidentItemProps) {
  const config = severityConfig[incident.severity as keyof typeof severityConfig] || severityConfig.low;
  const SeverityIcon = config.icon;
  const [timeAgo, setTimeAgo] = useState('');

  useEffect(() => {
    setTimeAgo(formatDistanceToNow(new Date(incident.timestamp), { addSuffix: true }));
    const interval = setInterval(() => {
      setTimeAgo(formatDistanceToNow(new Date(incident.timestamp), { addSuffix: true }));
    }, 60000);
    return () => clearInterval(interval);
  }, [incident.timestamp]);

  return (
    <div className="group relative overflow-hidden rounded-xl border bg-card p-4 transition-all hover:shadow-md">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <div className={cn('flex h-10 w-10 items-center justify-center rounded-lg border', config.color)}>
            <SeverityIcon className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-semibold">{incident.service_name}</h4>
              <Badge variant="outline" className="text-xs">{incident.chaos_type}</Badge>
            </div>
            <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{incident.description}</p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <Badge variant="outline" className={config.color}>{config.label}</Badge>
          <span className="text-xs text-muted-foreground">{timeAgo}</span>
        </div>
      </div>

      {incident.rollback_available === 1 && (
        <div className="mt-3 flex items-center justify-between border-t pt-3">
          <span className="text-xs text-muted-foreground">Rollback available</span>
          <Button size="sm" variant="outline" onClick={() => onRollback?.(incident.id)}>
            Rollback
          </Button>
        </div>
      )}

      {config.pulse && (
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-500">
          <div className="h-full w-full animate-pulse bg-red-500 opacity-50" />
        </div>
      )}
    </div>
  );
}

export function IncidentsPanel() {
  const [incidents, setIncidents] = useState<any[]>(FALLBACK_INCIDENTS);
  const [loading, setLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [search, setSearch] = useState('');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    const fetchIncidents = async () => {
      try {
        const response = await fetch('/api/incidents', { signal: AbortSignal.timeout(5000) });
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setIncidents(data.data);
            setIsConnected(true);
          }
        }
      } catch (err) {
        console.warn('Failed to fetch incidents:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchIncidents();
    const interval = setInterval(fetchIncidents, 30000);
    return () => clearInterval(interval);
  }, []);

  const filteredIncidents = incidents.filter((incident) => {
    const matchesSearch = incident.description?.toLowerCase().includes(search.toLowerCase()) ||
      incident.service_name?.toLowerCase().includes(search.toLowerCase());
    const matchesSeverity = severityFilter === 'all' || incident.severity === severityFilter;
    const matchesStatus = statusFilter === 'all' || incident.status === statusFilter;
    return matchesSearch && matchesSeverity && matchesStatus;
  });

  const criticalCount = incidents.filter((i) => i.severity === 'critical').length;
  const highCount = incidents.filter((i) => i.severity === 'high').length;
  const activeCount = incidents.filter((i) => i.status === 'active').length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Incidents Panel
          </span>
          <div className="flex items-center gap-2">
            {criticalCount > 0 && (
              <Badge variant="destructive" className="animate-pulse">
                {criticalCount} Critical
              </Badge>
            )}
            <Badge variant={isConnected ? 'default' : 'destructive'}>
              {isConnected ? 'Live' : 'Disconnected'}
            </Badge>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-4 gap-4">
          <div className="text-center p-3 rounded-lg bg-red-500/10 border border-red-500/30">
            <p className="text-2xl font-bold text-red-500">{criticalCount}</p>
            <p className="text-xs text-muted-foreground">Critical</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-orange-500/10 border border-orange-500/30">
            <p className="text-2xl font-bold text-orange-500">{highCount}</p>
            <p className="text-xs text-muted-foreground">High</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-muted">
            <p className="text-2xl font-bold">{activeCount}</p>
            <p className="text-xs text-muted-foreground">Active</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-muted">
            <p className="text-2xl font-bold">{incidents.length}</p>
            <p className="text-xs text-muted-foreground">Total</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search incidents..."
              value={search}
              onChange={(value: string) => setSearch(value)}
              className="pl-9"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Tabs value={severityFilter} onValueChange={setSeverityFilter}>
              <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="critical">Critical</TabsTrigger>
                <TabsTrigger value="high">High</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>

        <div className="space-y-3 max-h-96 overflow-y-auto">
          {filteredIncidents.map((incident) => (
            <IncidentItem
              key={incident.id}
              incident={incident}
              onRollback={(id) => console.log('Rollback:', id)}
            />
          ))}
          {filteredIncidents.length === 0 && !loading && (
            <div className="text-center py-8 text-muted-foreground">
              No incidents match your filters
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}