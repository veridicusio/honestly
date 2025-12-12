"use client";

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { formatNumber } from '@/lib/utils';

interface GrowthDataPoint {
  date: string;
  users: number;
  jobs: number;
}

interface NetworkGrowthProps {
  data?: GrowthDataPoint[];
  loading?: boolean;
}

export function NetworkGrowth({ data = [], loading = false }: NetworkGrowthProps) {
  // Mock data if none provided
  const chartData = data.length > 0 ? data : [
    { date: '2025-01', users: 100, jobs: 50 },
    { date: '2025-02', users: 250, jobs: 150 },
    { date: '2025-03', users: 500, jobs: 400 },
    { date: '2025-04', users: 750, jobs: 800 },
    { date: '2025-05', users: 1000, jobs: 1500 },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Network Growth</CardTitle>
        <CardDescription>User and job growth trends over time</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="h-64 flex items-center justify-center text-muted-foreground">
            Loading chart data...
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorJobs" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="date"
                className="text-xs"
                tick={{ fill: 'currentColor', fontSize: 12 }}
              />
              <YAxis
                className="text-xs"
                tick={{ fill: 'currentColor', fontSize: 12 }}
                tickFormatter={(value) => formatNumber(value)}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '0.5rem',
                }}
                formatter={(value: number) => formatNumber(value)}
              />
              <Legend />
              <Area
                type="monotone"
                dataKey="users"
                stroke="#3b82f6"
                fillOpacity={1}
                fill="url(#colorUsers)"
                name="Active Users"
              />
              <Area
                type="monotone"
                dataKey="jobs"
                stroke="#8b5cf6"
                fillOpacity={1}
                fill="url(#colorJobs)"
                name="Jobs Executed"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}

