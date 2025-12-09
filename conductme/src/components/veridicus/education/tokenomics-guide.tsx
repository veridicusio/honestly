"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { formatNumber } from '@/lib/utils';

const COLORS = ['#3b82f6', '#8b5cf6', '#f59e0b'];

export function TokenomicsGuide() {
  const supplyData = [
    { name: 'Community Rewards', value: 600_000, color: COLORS[0] },
    { name: 'Treasury', value: 300_000, color: COLORS[1] },
    { name: 'Team', value: 100_000, color: COLORS[2] },
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>VERIDICUS Tokenomics Guide</CardTitle>
          <CardDescription>Understanding the 1,000,000 VERIDICUS supply distribution</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Supply Breakdown */}
          <div>
            <h3 className="font-medium mb-4">Total Supply: 1,000,000 VERIDICUS</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                {supplyData.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 rounded-lg border bg-card">
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 rounded" style={{ backgroundColor: item.color }} />
                      <span>{item.name}</span>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{formatNumber(item.value)}</div>
                      <div className="text-xs text-muted-foreground">
                        {((item.value / 1_000_000) * 100).toFixed(0)}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={supplyData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {supplyData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Vesting Schedule */}
          <div className="p-4 rounded-lg border bg-card">
            <h3 className="font-medium mb-3">Vesting Schedule</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Community (60%):</span>
                <span>50% unlocked at launch, 50% vested over 6 months</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Treasury (30%):</span>
                <span>Locked in multisig DAO</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Team (10%):</span>
                <span>24-month linear vest, 6-month cliff</span>
              </div>
            </div>
          </div>

          {/* Burn Mechanism */}
          <div className="p-4 rounded-lg border bg-card">
            <h3 className="font-medium mb-3">Dynamic Burn Mechanism</h3>
            <p className="text-sm text-muted-foreground mb-3">
              VERIDICUS tokens are burned when used for quantum computing jobs. The burn amount is calculated as:
            </p>
            <div className="space-y-2 text-sm">
              <div className="p-2 rounded bg-muted">
                <code className="text-xs">Burn = 1 VDC (base) + (qubits × 0.1 VDC)</code>
              </div>
              <p className="text-xs text-muted-foreground">
                This creates deflationary pressure and ensures token scarcity as usage grows.
              </p>
            </div>
          </div>

          {/* Staking Benefits */}
          <div className="p-4 rounded-lg border bg-card">
            <h3 className="font-medium mb-3">Staking Benefits</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="text-center p-3 rounded bg-muted">
                <div className="text-xs text-muted-foreground">Standard</div>
                <div className="font-medium mt-1">0% discount</div>
              </div>
              <div className="text-center p-3 rounded bg-muted">
                <div className="text-xs text-muted-foreground">Bronze (1K+)</div>
                <div className="font-medium mt-1">20% discount</div>
              </div>
              <div className="text-center p-3 rounded bg-muted">
                <div className="text-xs text-muted-foreground">Silver (5K+)</div>
                <div className="font-medium mt-1">40% discount</div>
              </div>
              <div className="text-center p-3 rounded bg-muted">
                <div className="text-xs text-muted-foreground">Gold (20K+)</div>
                <div className="font-medium mt-1">60% discount</div>
              </div>
            </div>
          </div>

          {/* Governance */}
          <div className="p-4 rounded-lg border bg-card">
            <h3 className="font-medium mb-3">Quadratic Voting Governance</h3>
            <p className="text-sm text-muted-foreground">
              VERIDICUS uses quadratic voting to prevent whale dominance. Your voting power = √(staked tokens). This ensures smaller holders have meaningful influence while still rewarding larger stakeholders.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

