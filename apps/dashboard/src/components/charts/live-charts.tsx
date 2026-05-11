'use client';

import { useState, useEffect } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

import { cn } from '@/lib/utils';

interface DataPoint {
  time: string;
  value: number;
  [key: string]: string | number;
}

interface ChartProps {
  data: DataPoint[];
  className?: string;
  height?: number;
}

// Generate live data
function generateLiveData(baseValue: number, variance: number, points = 20) {
  const data: DataPoint[] = [];
  const now = Date.now();

  for (let i = points - 1; i >= 0; i--) {
    const time = new Date(now - i * 60000);
    const value = baseValue + (Math.random() - 0.5) * variance;
    data.push({
      time: time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      value: Math.round(value * 10) / 10,
    });
  }
  return data;
}

const chartColors = {
  primary: 'hsl(var(--primary))',
  success: 'hsl(142 76% 36%)',
  warning: 'hsl(38 92% 50%)',
  destructive: 'hsl(0 84% 60%)',
  muted: 'hsl(var(--muted))',
};

export function RequestRateChart({ data, className, height = 280 }: ChartProps) {
  return (
    <div className={cn('rounded-xl border bg-card p-5', className)}>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-semibold">Request Rate</h3>
        <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
          Live
        </span>
      </div>
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="requestGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
              <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis dataKey="time" stroke="hsl(var(--muted-foreground))" fontSize={12} />
          <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
          <Tooltip
            contentStyle={{
              backgroundColor: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '0.75rem',
              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
            }}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke="hsl(var(--primary))"
            strokeWidth={2}
            fill="url(#requestGradient)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function LatencyChart({ data, className, height = 280 }: ChartProps) {
  return (
    <div className={cn('rounded-xl border bg-card p-5', className)}>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-semibold">Latency (ms)</h3>
        <div className="flex gap-2">
          <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs text-emerald-500">
            p50: 45ms
          </span>
          <span className="rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs text-amber-500">
            p99: 120ms
          </span>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis dataKey="time" stroke="hsl(var(--muted-foreground))" fontSize={12} />
          <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
          <Tooltip
            contentStyle={{
              backgroundColor: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '0.75rem',
            }}
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke="hsl(142 76% 36%)"
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function ErrorRateChart({ data, className, height = 280 }: ChartProps) {
  return (
    <div className={cn('rounded-xl border bg-card p-5', className)}>
      <h3 className="mb-4 font-semibold">Error Rate (%)</h3>
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis dataKey="time" stroke="hsl(var(--muted-foreground))" fontSize={12} />
          <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
          <Tooltip
            contentStyle={{
              backgroundColor: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '0.75rem',
            }}
          />
          <Bar dataKey="value" fill="hsl(0 84% 60%)" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

const SERVICE_COLORS = ['hsl(var(--primary))', 'hsl(142 76% 36%)', 'hsl(38 92% 50%)', 'hsl(199 89% 48%)'];

export function TrafficDistributionChart({ className, height = 280 }: { className?: string; height?: number }) {
  const data = [
    { name: 'API Gateway', value: 45 },
    { name: 'Auth Service', value: 25 },
    { name: 'Notification', value: 20 },
    { name: 'Other', value: 10 },
  ];

  return (
    <div className={cn('rounded-xl border bg-card p-5', className)}>
      <h3 className="mb-4 font-semibold">Traffic Distribution</h3>
      <div className="flex items-center gap-8">
        <ResponsiveContainer width="50%" height={height}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={90}
              paddingAngle={2}
              dataKey="value"
            >
              {data.map((_, index) => (
                <Cell key={`cell-${index}`} fill={SERVICE_COLORS[index % SERVICE_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '0.75rem',
              }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="space-y-3">
          {data.map((item, index) => (
            <div key={item.name} className="flex items-center gap-2">
              <div
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: SERVICE_COLORS[index % SERVICE_COLORS.length] }}
              />
              <span className="text-sm">{item.name}</span>
              <span className="ml-auto text-sm font-medium">{item.value}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function LiveCharts() {
  const [requestData, setRequestData] = useState(() => generateLiveData(1500, 400));
  const [latencyData, setLatencyData] = useState(() => generateLiveData(50, 20));
  const [errorData, setErrorData] = useState(() => generateLiveData(0.5, 0.4));

  useEffect(() => {
    const timer = setInterval(() => {
      setRequestData((prev) => {
        const newData = [...prev.slice(1)];
        const lastValue = prev[prev.length - 1].value;
        const newValue = lastValue + (Math.random() - 0.5) * 100;
        newData.push({
          time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
          value: Math.round(newValue),
        });
        return newData;
      });

      setLatencyData((prev) => {
        const newData = [...prev.slice(1)];
        const lastValue = prev[prev.length - 1].value;
        const newValue = lastValue + (Math.random() - 0.5) * 15;
        newData.push({
          time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
          value: Math.round(Math.max(10, newValue)),
        });
        return newData;
      });

      setErrorData((prev) => {
        const newData = [...prev.slice(1)];
        const newValue = Math.random() * 0.8;
        newData.push({
          time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
          value: Math.round(newValue * 100) / 100,
        });
        return newData;
      });
    }, 2000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <RequestRateChart data={requestData} />
      <LatencyChart data={latencyData} />
      <ErrorRateChart data={errorData} />
      <TrafficDistributionChart />
    </div>
  );
}