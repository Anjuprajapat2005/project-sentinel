'use client';

import { Search, CheckCircle2, Clock, TrendingDown, Calendar } from 'lucide-react';
import { useState } from 'react';

import { IncidentTimeline } from '@/components/dashboard/incident-card';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

const resolvedIncidents = [
  {
    id: 'inc-0001',
    title: 'Authentication service outage',
    description: 'Users unable to login for 45 minutes due to expired SSL certificates on the auth service.',
    severity: 'critical' as const,
    status: 'resolved' as const,
    service: 'Auth Service',
    startedAt: new Date(Date.now() - 3 * 3600000),
    resolvedAt: new Date(Date.now() - 2 * 3600000),
    assignee: 'Sarah Chen',
  },
  {
    id: 'inc-0002',
    title: 'Payment processing delays',
    description: 'Stripe webhook processing delayed by 10 minutes due to queue backlog.',
    severity: 'high' as const,
    status: 'resolved' as const,
    service: 'API Gateway',
    startedAt: new Date(Date.now() - 8 * 3600000),
    resolvedAt: new Date(Date.now() - 7 * 3600000),
    assignee: 'Mike Torres',
  },
  {
    id: 'inc-0003',
    title: 'CDN origin shield failure',
    description: 'Cache servers unable to reach origin. Automatic failover to secondary origin.',
    severity: 'medium' as const,
    status: 'resolved' as const,
    service: 'CDN',
    startedAt: new Date(Date.now() - 14 * 3600000),
    resolvedAt: new Date(Date.now() - 13.5 * 3600000),
    assignee: 'Alex Kim',
  },
  {
    id: 'inc-0004',
    title: 'Database connection pool exhaustion',
    description: 'Application servers timing out due to maxed connection pools. Increased pool size.',
    severity: 'high' as const,
    status: 'resolved' as const,
    service: 'Database Primary',
    startedAt: new Date(Date.now() - 24 * 3600000),
    resolvedAt: new Date(Date.now() - 23 * 3600000),
    assignee: 'Jordan Lee',
  },
  {
    id: 'inc-0005',
    title: 'Memory leak in notification worker',
    description: 'Worker process consuming excessive memory. Deployed hotfix to restart workers.',
    severity: 'medium' as const,
    status: 'resolved' as const,
    service: 'Notification Service',
    startedAt: new Date(Date.now() - 36 * 3600000),
    resolvedAt: new Date(Date.now() - 35 * 3600000),
    assignee: 'Sam Parker',
  },
  {
    id: 'inc-0006',
    title: 'Webhook delivery failures',
    description: '3% of webhook deliveries failing due to incorrect retry logic. Fixed exponential backoff.',
    severity: 'low' as const,
    status: 'resolved' as const,
    service: 'API Gateway',
    startedAt: new Date(Date.now() - 48 * 3600000),
    resolvedAt: new Date(Date.now() - 47.5 * 3600000),
    assignee: 'Sarah Chen',
  },
];

export default function ResolvedIncidentsPage() {
  const [search, setSearch] = useState('');

  const filteredIncidents = resolvedIncidents.filter((incident) =>
    incident.title.toLowerCase().includes(search.toLowerCase()) ||
    incident.service.toLowerCase().includes(search.toLowerCase())
  );

  const totalResolved = resolvedIncidents.length;
  const avgResolutionTime = 32; // minutes
  const thisWeekCount = resolvedIncidents.filter(
    (i) => Date.now() - i.startedAt.getTime() < 7 * 24 * 3600000
  ).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Resolved Incidents</h1>
        <p className="text-muted-foreground">History of all resolved incidents and post-mortems</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="rounded-lg bg-emerald-500/10 p-3">
              <CheckCircle2 className="h-6 w-6 text-emerald-500" />
            </div>
            <div>
              <p className="text-3xl font-bold">{totalResolved}</p>
              <p className="text-sm text-muted-foreground">Total Resolved</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="rounded-lg bg-blue-500/10 p-3">
              <Clock className="h-6 w-6 text-blue-500" />
            </div>
            <div>
              <p className="text-3xl font-bold">{avgResolutionTime}m</p>
              <p className="text-sm text-muted-foreground">Avg Resolution</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="rounded-lg bg-purple-500/10 p-3">
              <Calendar className="h-6 w-6 text-purple-500" />
            </div>
            <div>
              <p className="text-3xl font-bold">{thisWeekCount}</p>
              <p className="text-sm text-muted-foreground">This Week</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="rounded-lg bg-emerald-500/10 p-3">
              <TrendingDown className="h-6 w-6 text-emerald-500" />
            </div>
            <div>
              <p className="text-3xl font-bold">-23%</p>
              <p className="text-sm text-muted-foreground">vs Last Week</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search resolved incidents..."
          value={search}
          onChange={setSearch}
          className="pl-9"
        />
      </div>

      {/* Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>Incident Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <IncidentTimeline incidents={filteredIncidents} />
        </CardContent>
      </Card>

      {/* Recent Post-Mortems */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Post-Mortems</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {resolvedIncidents.slice(0, 3).map((incident) => (
            <div
              key={incident.id}
              className="flex items-center justify-between rounded-lg border p-4 hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                <div>
                  <p className="font-medium">{incident.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {incident.service} - Resolved in{' '}
                    {Math.round(
                      (incident.resolvedAt.getTime() - incident.startedAt.getTime()) / 60000
                    )}
                    m
                  </p>
                </div>
              </div>
              <Badge variant="outline">View Post-Mortem</Badge>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}