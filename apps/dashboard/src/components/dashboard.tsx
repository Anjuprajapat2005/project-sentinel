'use client';

import { Activity, Bell, Cpu, Database, Server, Shield, type LucideIcon } from 'lucide-react';

import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Progress } from './ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';

interface Service {
  name: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  icon: LucideIcon;
  port: number;
}

interface Metric {
  label: string;
  value: number;
  icon?: LucideIcon;
  unit?: string;
}

const services: Service[] = [
  { name: 'API Gateway', status: 'healthy', icon: Server, port: 3001 },
  { name: 'Auth Service', status: 'healthy', icon: Shield, port: 3002 },
  { name: 'Notification Service', status: 'degraded', icon: Bell, port: 3003 },
  { name: 'Monitoring Service', status: 'healthy', icon: Activity, port: 3004 },
];

const metrics: Metric[] = [
  { label: 'CPU Usage', value: 45, icon: Cpu },
  { label: 'Memory Usage', value: 62, icon: Database },
  { label: 'Request Rate', value: 1284, unit: 'req/s' },
  { label: 'Active Connections', value: 342 },
];

export function Dashboard() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6" />
            <span className="text-xl font-bold">Project Sentinel</span>
          </div>
          <nav className="flex items-center gap-4">
            <Button variant="ghost">Dashboard</Button>
            <Button variant="ghost">Services</Button>
            <Button variant="ghost">Logs</Button>
            <Button variant="destructive">Chaos</Button>
          </nav>
        </div>
      </header>

      <main className="container py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Monitor your infrastructure in real-time</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
          {metrics.map((metric) => (
            <Card key={metric.label}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  {metric.label}
                </CardTitle>
                {metric.icon && <metric.icon className="h-4 w-4 text-muted-foreground" />}
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {metric.value}
                  {metric.unit && <span className="text-sm text-muted-foreground ml-1">{metric.unit}</span>}
                </div>
                <Progress value={metric.value} className="mt-2" />
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs defaultValue="services">
          <TabsList>
            <TabsTrigger value="services">Services</TabsTrigger>
            <TabsTrigger value="recent">Recent Activity</TabsTrigger>
            <TabsTrigger value="alerts">Alerts</TabsTrigger>
          </TabsList>

          <TabsContent value="services" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              {services.map((service) => (
                <Card key={service.name}>
                  <CardHeader className="flex flex-row items-center">
                    <service.icon className="h-5 w-5 mr-2" />
                    <div className="flex-1">
                      <CardTitle>{service.name}</CardTitle>
                      <CardDescription>Port {service.port}</CardDescription>
                    </div>
                    <Badge
                      variant={
                        service.status === 'healthy'
                          ? 'default'
                          : service.status === 'degraded'
                          ? 'secondary'
                          : 'destructive'
                      }
                    >
                      {service.status}
                    </Badge>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="recent">
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest events across all services</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Activity feed will appear here.</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="alerts">
            <Card>
              <CardHeader>
                <CardTitle>Active Alerts</CardTitle>
                <CardDescription>Currently active system alerts</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">No active alerts.</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}