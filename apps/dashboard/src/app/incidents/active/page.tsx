'use client';

import { Search, Filter, AlertTriangle, Clock, Users, ArrowUpRight } from 'lucide-react';
import { useState } from 'react';

import { IncidentCard } from '@/components/dashboard/incident-card';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useIncidents } from '@/hooks/use-database';

export default function ActiveIncidentsPage() {
  const [search, setSearch] = useState('');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const { incidents, loading } = useIncidents('active');

  const filteredIncidents = incidents.filter((incident) => {
    const matchesSearch =
      incident.description.toLowerCase().includes(search.toLowerCase()) ||
      incident.service_name.toLowerCase().includes(search.toLowerCase());
    const matchesSeverity = severityFilter === 'all' || incident.severity === severityFilter;
    return matchesSearch && matchesSeverity;
  });

  const criticalCount = incidents.filter((i) => i.severity === 'critical').length;
  const highCount = incidents.filter((i) => i.severity === 'high').length;

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Active Incidents</h1>
          <p className="text-muted-foreground">
            {incidents.length} active incidents requiring attention
          </p>
        </div>
        <div className="flex items-center gap-3">
          {criticalCount > 0 && (
            <Badge variant="destructive" className="text-sm animate-pulse">
              {criticalCount} Critical
            </Badge>
          )}
          {highCount > 0 && (
            <Badge variant="default" className="bg-orange-500 text-white">
              {highCount} High
            </Badge>
          )}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-red-500/30 bg-red-500/5">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="rounded-lg bg-red-500/10 p-3">
              <AlertTriangle className="h-6 w-6 text-red-500" />
            </div>
            <div>
              <p className="text-3xl font-bold">{criticalCount}</p>
              <p className="text-sm text-muted-foreground">Critical</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-orange-500/30 bg-orange-500/5">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="rounded-lg bg-orange-500/10 p-3">
              <ArrowUpRight className="h-6 w-6 text-orange-500" />
            </div>
            <div>
              <p className="text-3xl font-bold">{highCount}</p>
              <p className="text-sm text-muted-foreground">High Priority</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="rounded-lg bg-muted p-3">
              <Clock className="h-6 w-6 text-muted-foreground" />
            </div>
            <div>
              <p className="text-3xl font-bold">{incidents.filter(i => i.severity === 'medium').length}</p>
              <p className="text-sm text-muted-foreground">Medium</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="rounded-lg bg-muted p-3">
              <Users className="h-6 w-6 text-muted-foreground" />
            </div>
            <div>
              <p className="text-3xl font-bold">{incidents.length}</p>
              <p className="text-sm text-muted-foreground">Total Active</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <div className="relative flex-1 min-w-[300px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search incidents..."
            value={search}
            onChange={setSearch}
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
              <TabsTrigger value="medium">Medium</TabsTrigger>
              <TabsTrigger value="low">Low</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {filteredIncidents.map((incident) => (
          <IncidentCard
            key={incident.id}
            incident={{
              id: String(incident.id),
              title: `${incident.chaos_type} in ${incident.service_name}`,
              description: incident.description,
              severity: incident.severity,
              status: incident.status === 'active' ? 'active' : 'investigating',
              service: incident.service_name,
              startedAt: new Date(incident.timestamp),
            }}
          />
        ))}
      </div>

      {filteredIncidents.length === 0 && (
        <Card className="p-12 text-center">
          <p className="text-muted-foreground">No incidents match your filters</p>
        </Card>
      )}
    </div>
  );
}
