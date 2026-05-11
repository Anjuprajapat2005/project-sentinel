'use client';

import {
  Search,
  Download,
  RefreshCw,
  Terminal,
  AlertCircle,
  Info,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ChevronDown,
  ChevronUp,
  Copy,
} from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useMounted } from '@/hooks/use-live-data';
import { cn } from '@/lib/utils';

type LogLevel = 'INFO' | 'WARN' | 'ERROR' | 'DEBUG' | 'FATAL';

interface LogEntry {
  id: string;
  timestamp: Date;
  level: LogLevel;
  service: string;
  message: string;
  metadata?: Record<string, unknown>;
  traceId?: string;
}

const services = [
  'All Services',
  'API Gateway',
  'Auth Service',
  'Notification Service',
  'Database Primary',
  'Redis Cache',
  'Message Queue',
];

const levels: LogLevel[] = ['DEBUG', 'INFO', 'WARN', 'ERROR', 'FATAL'];

const levelConfig: Record<LogLevel, { color: string; bgColor: string; icon: typeof Info }> = {
  DEBUG: { color: 'text-gray-400', bgColor: 'bg-gray-500/10', icon: Terminal },
  INFO: { color: 'text-blue-400', bgColor: 'bg-blue-500/10', icon: Info },
  WARN: { color: 'text-amber-400', bgColor: 'bg-amber-500/10', icon: AlertTriangle },
  ERROR: { color: 'text-red-400', bgColor: 'bg-red-500/10', icon: XCircle },
  FATAL: { color: 'text-red-600', bgColor: 'bg-red-600/10', icon: AlertCircle },
};

function seededRandom(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

const INITIAL_TIME = 1715251200000;

function generateMockLogs(count: number, baseTime: number): LogEntry[] {
  const messages: Record<string, string[]> = {
    'API Gateway': ['Request processed', 'Rate limit exceeded', 'Connection timeout', 'SSL validated', 'Payload parsing failed'],
    'Auth Service': ['Auth successful', 'Invalid JWT', 'Session refresh', 'Password reset', 'MFA completed'],
    'Notification Service': ['Email queued', 'SMTP connected', 'Webhook failed', 'Template rendered', 'Rate limit hit'],
    'Database Primary': ['Query completed', 'Pool created', 'Transaction committed', 'Slow query', 'Deadlock retry'],
    'Redis Cache': ['Cache hit', 'Cache miss', 'Key expired', 'Memory pressure', 'Eviction executed'],
    'Message Queue': ['Message published', 'Consumer rebalanced', 'Acknowledged', 'Batch completed', 'Lag increasing'],
  };

  const serviceList = Object.keys(messages);
  const serviceMessages = Object.values(messages);

  return Array.from({ length: count }, (_, i) => {
    const seed1 = baseTime + i * 12345;
    const seed2 = baseTime + i * 54321;
    const seed3 = baseTime + i * 11111;
    const seed4 = baseTime + i * 22222;
    const seed5 = baseTime + i * 33333;

    const serviceIndex = Math.floor(seededRandom(seed1) * serviceList.length);
    const messageIndex = Math.floor(seededRandom(seed2) * serviceMessages[serviceIndex].length);
    const levelRand = seededRandom(seed3);

    let level: LogLevel;
    if (levelRand < 0.05) level = 'FATAL';
    else if (levelRand < 0.1) level = 'ERROR';
    else if (levelRand < 0.2) level = 'WARN';
    else if (levelRand < 0.3) level = 'DEBUG';
    else level = 'INFO';

    return {
      id: `log-${baseTime}-${i}`,
      timestamp: new Date(baseTime - Math.floor(seededRandom(seed4) * 3600000)),
      level,
      service: serviceList[serviceIndex],
      message: serviceMessages[serviceIndex][messageIndex],
      traceId: seededRandom(seed5) > 0.7 ? `trace-${Math.floor(seededRandom(seed5 + 1) * 99999999999).toString(36)}` : undefined,
      metadata: seededRandom(seed5 + 2) > 0.8 ? { requestId: `req-${Math.floor(seededRandom(seed5 + 3) * 9999999999).toString(36)}` } : undefined,
    };
  });
}

function LogEntryRow({ entry }: { entry: LogEntry; onExpand: () => void }) {
  const config = levelConfig[entry.level];
  const Icon = config.icon;
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className={cn(
        'group relative border-b border-border py-3 px-4 hover:bg-muted/30 transition-colors',
        entry.level === 'ERROR' && 'bg-red-500/5',
        entry.level === 'FATAL' && 'bg-red-500/10'
      )}
    >
      <div className="flex items-start gap-4">
        <div className={cn('flex h-6 w-6 items-center justify-center rounded', config.bgColor)}>
          <Icon className={cn('h-4 w-4', config.color)} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-xs text-muted-foreground font-mono">
              {entry.timestamp.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
            <Badge variant="outline" className="text-xs font-mono">{entry.service}</Badge>
            {entry.traceId && <span className="text-xs text-muted-foreground font-mono">{entry.traceId}</span>}
          </div>
          <p className="mt-1 text-sm font-medium">{entry.message}</p>
          {expanded && entry.metadata && (
            <pre className="mt-2 rounded bg-muted p-2 text-xs font-mono overflow-x-auto">
              {JSON.stringify(entry.metadata, null, 2)}
            </pre>
          )}
        </div>
        <button onClick={() => setExpanded(!expanded)} className="opacity-0 group-hover:opacity-100 transition-opacity">
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}

export default function LogsPage() {
  const mounted = useMounted();
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [search, setSearch] = useState('');
  const [selectedService, setSelectedService] = useState('All Services');
  const [selectedLevel, setSelectedLevel] = useState<string>('all');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    setLogs(generateMockLogs(100, INITIAL_TIME));
  }, []);

  useEffect(() => {
    if (!autoRefresh || !mounted) return;
    const timer = setInterval(() => {
      const newLog = generateMockLogs(1, Date.now())[0];
      setLogs((prev) => [newLog, ...prev.slice(0, 99)]);
    }, 3000);
    return () => clearInterval(timer);
  }, [autoRefresh, mounted]);

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const matchesSearch = log.message.toLowerCase().includes(search.toLowerCase()) ||
        log.service.toLowerCase().includes(search.toLowerCase()) ||
        log.traceId?.toLowerCase().includes(search.toLowerCase());
      const matchesService = selectedService === 'All Services' || log.service === selectedService;
      const matchesLevel = selectedLevel === 'all' || log.level === selectedLevel;
      return matchesSearch && matchesService && matchesLevel;
    });
  }, [logs, search, selectedService, selectedLevel]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setLogs(generateMockLogs(100, Date.now()));
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const handleCopy = () => {
    const text = filteredLogs.map((l) => `[${l.timestamp.toISOString()}] ${l.level} [${l.service}] ${l.message}`).join('\n');
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text);
    }
  };

  const errorCount = logs.filter((l) => l.level === 'ERROR' || l.level === 'FATAL').length;
  const warnCount = logs.filter((l) => l.level === 'WARN').length;

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Logs</h1>
          <p className="text-muted-foreground">Real-time application logging</p>
        </div>
        <div className="flex items-center gap-3">
          {mounted && errorCount > 0 && <Badge variant="destructive" className="animate-pulse">{errorCount} Errors</Badge>}
          {mounted && warnCount > 0 && <Badge variant="default" className="bg-amber-500">{warnCount} Warnings</Badge>}
          <Button variant="outline" size="sm" onClick={() => setAutoRefresh(!autoRefresh)} className={autoRefresh ? 'bg-primary/10' : ''}>
            <RefreshCw className={cn('h-4 w-4', autoRefresh && 'animate-spin')} />
            {autoRefresh ? 'Live' : 'Paused'}
          </Button>
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            <RefreshCw className={cn('h-4 w-4', isRefreshing && 'animate-spin')} />Refresh
          </Button>
          <Button variant="outline" size="sm"><Download className="h-4 w-4" />Export</Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <div className="relative flex-1 min-w-[300px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search logs..." value={search} onChange={setSearch} className="pl-9" />
        </div>
        <Select value={selectedService} onValueChange={setSelectedService}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="Service" /></SelectTrigger>
          <SelectContent>
            {services.map((service) => <SelectItem key={service} value={service}>{service}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={selectedLevel} onValueChange={setSelectedLevel}>
          <SelectTrigger className="w-[140px]"><SelectValue placeholder="Level" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Levels</SelectItem>
            {levels.map((level) => <SelectItem key={level} value={level}>{level}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <Card className="flex-1 overflow-hidden">
        <CardHeader className="border-b bg-muted/50 py-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Terminal className="h-4 w-4" />Log Stream
              <span className="rounded-full bg-muted px-2 py-0.5 text-xs">{filteredLogs.length} entries</span>
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={handleCopy}><Copy className="h-4 w-4" /></Button>
          </div>
        </CardHeader>
        <CardContent className="h-full overflow-y-auto p-0">
          <div className="font-mono text-sm">
            {mounted ? (
              filteredLogs.map((entry) => <LogEntryRow key={entry.id} entry={entry} onExpand={() => {}} />)
            ) : (
              <div className="flex h-32 items-center justify-center">
                <p className="text-muted-foreground">Loading logs...</p>
              </div>
            )}
          </div>
          {mounted && filteredLogs.length === 0 && (
            <div className="flex h-64 items-center justify-center"><p className="text-muted-foreground">No logs match your filters</p></div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}