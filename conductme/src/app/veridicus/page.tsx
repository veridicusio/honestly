"use client";

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { OverviewDashboard } from '@/components/veridicus/overview-dashboard';
import { TokenMetrics } from '@/components/veridicus/token-metrics';
import { JobsMonitor } from '@/components/veridicus/jobs-monitor';
import { StakingDashboard } from '@/components/veridicus/staking-dashboard';
import { NetworkStats } from '@/components/veridicus/network-stats';
import { GovernanceMonitor } from '@/components/veridicus/governance-monitor';
import { CryptoDeepDive } from '@/components/veridicus/education/crypto-deep-dive';
import { TokenomicsGuide } from '@/components/veridicus/education/tokenomics-guide';
import { QuantumPrimer } from '@/components/veridicus/education/quantum-primer';
import { BurnChart } from '@/components/veridicus/charts/burn-chart';
import { JobDistribution } from '@/components/veridicus/charts/job-distribution';
import { NetworkGrowth } from '@/components/veridicus/charts/network-growth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, BookOpen, TrendingUp } from 'lucide-react';

export default function VeridicusDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [learnTab, setLearnTab] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="border-b border-border/50 backdrop-blur-sm sticky top-0 z-50 bg-background/80">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-violet-600 flex items-center justify-center">
                <Activity className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-orange-400 to-violet-400 bg-clip-text text-transparent">
                  VERIDICUS Analytics
                </h1>
                <p className="text-xs text-muted-foreground">Quantum Computing & Token Metrics</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <div className="px-3 py-1 rounded-full bg-green-500/20 border border-green-500/50">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-xs text-green-500">Live</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="jobs">Jobs</TabsTrigger>
            <TabsTrigger value="staking">Staking</TabsTrigger>
            <TabsTrigger value="governance">Governance</TabsTrigger>
            <TabsTrigger value="learn">Learn</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <OverviewDashboard />
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <TokenMetrics />
              <div className="space-y-6">
                <BurnChart />
                <NetworkGrowth />
              </div>
            </div>
            <JobDistribution />
          </TabsContent>

          <TabsContent value="jobs" className="space-y-6">
            <JobsMonitor />
          </TabsContent>

          <TabsContent value="staking" className="space-y-6">
            <StakingDashboard />
          </TabsContent>

          <TabsContent value="governance" className="space-y-6">
            <GovernanceMonitor />
          </TabsContent>

          <TabsContent value="learn" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
              <Card className="cursor-pointer hover:bg-accent/50 transition-colors" onClick={() => setLearnTab('crypto')}>
                <CardHeader>
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="h-5 w-5 text-blue-500" />
                    <CardTitle className="text-lg">Crypto Deep Dive</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Crashes, triumphs, money flows, and social pulse from 2022-2025
                  </p>
                </CardContent>
              </Card>
              <Card className="cursor-pointer hover:bg-accent/50 transition-colors" onClick={() => setLearnTab('tokenomics')}>
                <CardHeader>
                  <div className="flex items-center space-x-2">
                    <BookOpen className="h-5 w-5 text-violet-500" />
                    <CardTitle className="text-lg">Tokenomics Guide</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Understanding VERIDICUS supply, burns, staking, and governance
                  </p>
                </CardContent>
              </Card>
              <Card className="cursor-pointer hover:bg-accent/50 transition-colors" onClick={() => setLearnTab('quantum')}>
                <CardHeader>
                  <div className="flex items-center space-x-2">
                    <Activity className="h-5 w-5 text-orange-500" />
                    <CardTitle className="text-lg">Quantum Primer</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    What is quantum computing and why VERIDICUS uses it
                  </p>
                </CardContent>
              </Card>
            </div>

            {learnTab === 'crypto' && <CryptoDeepDive />}
            {learnTab === 'tokenomics' && <TokenomicsGuide />}
            {learnTab === 'quantum' && <QuantumPrimer />}
            {!learnTab && (
              <div className="text-center py-12 text-muted-foreground">
                Select a topic above to begin learning
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

