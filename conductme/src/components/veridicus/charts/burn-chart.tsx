"use client";

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { formatNumber } from '@/lib/utils';

interface BurnDataPoint {
  date: string;
  burned: number;
  cumulative: number;
}

interface BurnChartProps {
  data?: BurnDataPoint[];
  loading?: boolean;
}

export function BurnChart({ data = [], loading = false }: BurnChartProps) {
  // Mock data if none provided
  const chartData = data.length > 0 ? data : [
    { date: '2025-01-01', burned: 0, cumulative: 0 },
    { date: '2025-01-15', burned: 50, cumulative: 50 },
    { date: '2025-02-01', burned: 75, cumulative: 125 },
    { date: '2025-02-15', burned: 100, cumulative: 225 },
    { date: '2025-03-01', burned: 150, cumulative: 375 },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Burn History</CardTitle>
        <CardDescription>VERIDICUS token burn rate over time</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="h-64 flex items-center justify-center text-muted-foreground">
            Loading chart data...
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
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
              <Line
                type="monotone"
                dataKey="burned"
                stroke="#f59e0b"
                strokeWidth={2}
                name="Daily Burned"
                dot={{ r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="cumulative"
                stroke="#8b5cf6"
                strokeWidth={2}
                name="Cumulative Burned"
                dot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}

