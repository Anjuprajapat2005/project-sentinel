'use client';

import { Play, Square, RefreshCw, Bug, TestTube, Workflow } from 'lucide-react';
import { useEffect } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAgents } from '@/hooks/use-websocket';

export function AgentStatusPanel() {
  const { agents, isAutonomous, loading, isConnected, startAutonomous, stopAutonomous, fetchAgentStatus, fetchReports, reports } = useAgents();

  useEffect(() => {
    const interval = setInterval(fetchAgentStatus, 10000);
    return () => clearInterval(interval);
  }, [fetchAgentStatus]);

  const alpha = agents?.alpha;
  const beta = agents?.beta;
  const gamma = agents?.gamma;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Workflow className="h-5 w-5" />
              Autonomous Agents
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant={isAutonomous ? 'default' : 'outline'}>
                {isAutonomous ? 'Autonomous Mode Active' : 'Manual Mode'}
              </Badge>
              <Button variant="outline" size="sm" onClick={fetchAgentStatus}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-lg border p-4">
              <div className="flex items-center gap-2">
                <Bug className="h-5 w-5 text-blue-500" />
                <span className="font-medium">Alpha (Debugger)</span>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">Log analysis & fix generation</p>
              <div className="mt-3 flex items-center gap-2">
                <Badge variant={alpha?.status === 'active' ? 'default' : 'outline'}>
                  {alpha?.status || 'unknown'}
                </Badge>
              </div>
              <div className="mt-2 text-xs text-muted-foreground">
                {alpha?.capabilities?.join(', ')}
              </div>
            </div>

            <div className="rounded-lg border p-4">
              <div className="flex items-center gap-2">
                <TestTube className="h-5 w-5 text-green-500" />
                <span className="font-medium">Beta (QA)</span>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">Regression test creation & execution</p>
              <div className="mt-3 flex items-center gap-2">
                <Badge variant={beta?.status === 'active' ? 'default' : 'outline'}>
                  {beta?.status || 'unknown'}
                </Badge>
              </div>
              <div className="mt-2 text-xs text-muted-foreground">
                {beta?.capabilities?.join(', ')}
              </div>
            </div>

            <div className="rounded-lg border p-4">
              <div className="flex items-center gap-2">
                <Workflow className="h-5 w-5 text-purple-500" />
                <span className="font-medium">Gamma (Manager)</span>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">Incident orchestration & reporting</p>
              <div className="mt-3 flex items-center gap-2">
                <Badge variant={gamma?.status === 'autonomous' ? 'default' : 'outline'}>
                  {gamma?.status || 'unknown'}
                </Badge>
              </div>
              <div className="mt-2 text-xs text-muted-foreground">
                {gamma?.capabilities?.join(', ')}
              </div>
            </div>
          </div>

          <div className="mt-6 flex items-center gap-2">
            {!isAutonomous ? (
              <Button onClick={() => startAutonomous(30000)} disabled={!isConnected}>
                <Play className="mr-2 h-4 w-4" />
                Start Autonomous Mode
              </Button>
            ) : (
              <Button variant="destructive" onClick={stopAutonomous} disabled={!isConnected}>
                <Square className="mr-2 h-4 w-4" />
                Stop Autonomous Mode
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {reports.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Incident Reports</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {reports.slice(0, 5).map((report: any) => (
                <div key={report.id} className="rounded-lg border p-3">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{report.title}</span>
                    <Badge variant={report.tests_passed > 0 ? 'default' : 'destructive'}>
                      {report.tests_passed}/{report.tests_created} tests passed
                    </Badge>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{report.summary}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Resolution time: {report.resolution_time_seconds}s
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}