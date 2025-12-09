"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

const COLORS = ['#3b82f6', '#8b5cf6', '#f59e0b', '#10b981', '#ef4444'];

interface JobDistributionProps {
  data?: { name: string; value: number }[];
  loading?: boolean;
}

export function JobDistribution({ data = [], loading = false }: JobDistributionProps) {
  // Mock data if none provided
  const chartData = data.length > 0 ? data : [
    { name: 'zkML Proof', value: 45 },
    { name: 'Circuit Optimize', value: 25 },
    { name: 'Anomaly Detect', value: 20 },
    { name: 'Security Audit', value: 10 },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Job Type Distribution</CardTitle>
        <CardDescription>Breakdown of quantum job types executed</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="h-64 flex items-center justify-center text-muted-foreground">
            Loading chart data...
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '0.5rem',
                }}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}

