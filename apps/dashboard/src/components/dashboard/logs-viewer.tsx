'use client';

import { formatDistanceToNow } from 'date-fns';
import { FileText, Search, RefreshCw, Trash2, Download, Info, AlertTriangle, AlertCircle } from 'lucide-react';
import React, { useState, useEffect, useRef } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

const levelConfig = {
  ERROR: { label: 'Error', color: 'bg-red-500/10 text-red-500 border-red-500/30', icon: AlertCircle },
  WARN: { label: 'Warning', color: 'bg-amber-500/10 text-amber-500 border-amber-500/30', icon: AlertTriangle },
  INFO: { label: 'Info', color: 'bg-blue-500/10 text-blue-500 border-blue-500/30', icon: Info },
  DEBUG: { label: 'Debug', color: 'bg-muted text-muted-foreground', icon: FileText },
};

const FALLBACK_LOGS = [
  { id: 1, service: 'auth-service', level: 'INFO', message: 'Service started successfully', metadata: null, timestamp: new Date().toISOString() },
  { id: 2, service: 'payment-service', level: 'INFO', message: 'Service started successfully', metadata: null, timestamp: new Date().toISOString() },
  { id: 3, service: 'notification-service', level: 'INFO', message: 'Service started successfully', metadata: null, timestamp: new Date().toISOString() },
  { id: 4, service: 'monitoring-service', level: 'INFO', message: 'Service started successfully', metadata: null, timestamp: new Date().toISOString() },
  { id: 5, service: 'api-gateway', level: 'INFO', message: 'Service started successfully', metadata: null, timestamp: new Date().toISOString() },
];

interface LogEntryProps {
  log: {
    id: number;
    service: string;
    level: string;
    message: string;
    metadata: string | null;
    timestamp: string;
  };
  onExpand?: () => void;
}

function LogEntry({ log, onExpand }: LogEntryProps) {
  const config = levelConfig[log.level as keyof typeof levelConfig] || levelConfig.INFO;
  const LevelIcon = config.icon;
  const [timeAgo, setTimeAgo] = useState('');

  useEffect(() => {
    setTimeAgo(formatDistanceToNow(new Date(log.timestamp), { addSuffix: true }));
    const interval = setInterval(() => {
      setTimeAgo(formatDistanceToNow(new Date(log.timestamp), { addSuffix: true }));
    }, 60000);
    return () => clearInterval(interval);
  }, [log.timestamp]);

  return (
    <div
      className={cn(
        'flex items-start gap-3 rounded-lg border p-3 cursor-pointer transition-all hover:bg-muted/50',
        config.color
      )}
      onClick={onExpand}
    >
      <div className={cn('flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg border', config.color)}>
        <LevelIcon className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">{log.service}</Badge>
          <Badge variant="outline" className={cn('text-xs', config.color)}>{config.label}</Badge>
          <span className="ml-auto text-xs text-muted-foreground">{timeAgo}</span>
        </div>
        <p className="mt-1 text-sm truncate">{log.message}</p>
        {log.metadata && (
          <p className="mt-1 text-xs text-muted-foreground truncate">Metadata: {log.metadata}</p>
        )}
      </div>
    </div>
  );
}

export function LogsViewer() {
  const [logs, setLogs] = useState<any[]>(FALLBACK_LOGS);
  const [loading, setLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [search, setSearch] = useState('');
  const [levelFilter, setLevelFilter] = useState<string>('all');
  const [serviceFilter, setServiceFilter] = useState<string>('all');
  const [autoScroll, setAutoScroll] = useState(true);
  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const response = await fetch('/api/logs', { signal: AbortSignal.timeout(5000) });
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data.length > 0) {
            setLogs(data.data);
            setIsConnected(true);
          }
        }
      } catch (err) {
        console.warn('Failed to fetch logs:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
    const interval = setInterval(fetchLogs, 30000);
    return () => clearInterval(interval);
  }, []);

  const services = [...new Set(logs.map(l => l.service))];
  const filteredLogs = logs.filter((log) => {
    const matchesSearch = log.message?.toLowerCase().includes(search.toLowerCase()) ||
      log.service?.toLowerCase().includes(search.toLowerCase());
    const matchesLevel = levelFilter === 'all' || log.level === levelFilter;
    const matchesService = serviceFilter === 'all' || log.service === serviceFilter;
    return matchesSearch && matchesLevel && matchesService;
  });

  const errorCount = logs.filter((l) => l.level === 'ERROR').length;
  const warnCount = logs.filter((l) => l.level === 'WARN').length;

  useEffect(() => {
    if (autoScroll && logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [filteredLogs, autoScroll]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Logs Viewer
          </span>
          <div className="flex items-center gap-2">
            {errorCount > 0 && (
              <Badge variant="destructive">{errorCount} Errors</Badge>
            )}
            {warnCount > 0 && (
              <Badge variant="default" className="bg-amber-500">{warnCount} Warnings</Badge>
            )}
            <Badge variant={isConnected ? 'default' : 'destructive'}>
              {isConnected ? 'Live' : 'Disconnected'}
            </Badge>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search logs..."
              value={search}
              onChange={(value: string) => setSearch(value)}
              className="pl-9"
            />
          </div>
          <Tabs value={levelFilter} onValueChange={setLevelFilter}>
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="ERROR">Error</TabsTrigger>
              <TabsTrigger value="WARN">Warn</TabsTrigger>
              <TabsTrigger value="INFO">Info</TabsTrigger>
            </TabsList>
          </Tabs>
          <Button size="icon" variant="outline" onClick={() => window.location.reload()}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>

        {services.length > 0 && (
          <div className="flex items-center gap-4 text-sm">
            <span className="text-muted-foreground">Service:</span>
            <Tabs value={serviceFilter} onValueChange={setServiceFilter}>
              <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                {services.slice(0, 5).map((service) => (
                  <TabsTrigger key={service} value={service}>
                    {service}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>
        )}

        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={autoScroll}
              onChange={(e) => setAutoScroll(e.target.checked)}
              className="rounded"
            />
            Auto-scroll
          </label>
          <Button size="sm" variant="outline" onClick={() => {
            const blob = new Blob([JSON.stringify(filteredLogs, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `logs-${Date.now()}.json`;
            a.click();
          }}>
            <Download className="h-4 w-4 mr-1" />
            Export
          </Button>
        </div>

        <div className="space-y-2 max-h-96 overflow-y-auto rounded-lg border p-2">
          {filteredLogs.map((log) => (
            <LogEntry key={log.id} log={log} />
          ))}
          {filteredLogs.length === 0 && !loading && (
            <div className="text-center py-8 text-muted-foreground">
              No logs match your filters
            </div>
          )}
          <div ref={logsEndRef} />
        </div>
      </CardContent>
    </Card>
  );
}