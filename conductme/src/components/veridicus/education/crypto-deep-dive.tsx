"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, TrendingUp, TrendingDown, DollarSign, Users, MessageSquare } from 'lucide-react';
import { formatNumber } from '@/lib/utils';

export function CryptoDeepDive() {
  const crashes = [
    {
      event: 'Terra/Luna Collapse (2022)',
      impact: '$60B evaporated',
      lesson: 'Exposed risks of unbacked stables; led to stricter regs but didn\'t kill innovation',
      icon: AlertTriangle,
      color: 'destructive',
    },
    {
      event: 'FTX Bankruptcy (2022)',
      impact: '$8B+ user losses, $1T market cap wiped',
      lesson: 'Centralized exchanges aren\'t banks—custody matters; accelerated self-custody shift',
      icon: AlertTriangle,
      color: 'destructive',
    },
    {
      event: '2025 Q4 Crash',
      impact: '$1T market cap loss, $19B liquidated',
      lesson: 'Crypto\'s tied to macros now; retail panic sold, whales bought dips. Not a "winter"—just a reset',
      icon: TrendingDown,
      color: 'secondary',
    },
    {
      event: 'Stablecoin Woes (2025)',
      impact: '$3.5B ETF outflows',
      lesson: 'Regs are coming; diversified stables (e.g., PYUSD surged to $3.8B) win',
      icon: AlertTriangle,
      color: 'secondary',
    },
  ];

  const successes = [
    {
      asset: 'Bitcoin (BTC)',
      performance: '$16K → $90K+',
      driver: 'Store-of-value narrative held; outperformed bonds/gold in crashes',
      icon: TrendingUp,
      color: 'default',
    },
    {
      asset: 'Ethereum (ETH)',
      performance: 'TVL hit $200B',
      driver: 'Fusaka upgrade cut costs, boosted L2; Shark wallets accumulated',
      icon: TrendingUp,
      color: 'default',
    },
    {
      asset: 'Solana (SOL)',
      performance: 'Outperformed in Q4',
      driver: 'High-speed DeFi hub; Drift v3 10x faster trades',
      icon: TrendingUp,
      color: 'default',
    },
    {
      asset: 'Stablecoins & RWAs',
      performance: 'PYUSD to $3.8B',
      driver: 'Tokenization boom; Real-world use: Africa solving money issues',
      icon: DollarSign,
      color: 'default',
    },
  ];

  const moneyFlows = [
    {
      category: 'VC Inflows',
      amount: '$18-25B',
      focus: 'AI x Crypto, DeFi, infrastructure',
      icon: DollarSign,
    },
    {
      category: 'Institutional Allocation',
      amount: '>5% AUM',
      focus: '59% per EY allocating to crypto',
      icon: Users,
    },
    {
      category: 'Whale Activity',
      amount: '$2.59B',
      focus: 'BTC-ETH swaps, 40K BTC ($4.35B) moves',
      icon: TrendingUp,
    },
    {
      category: 'RWA/Tokenization',
      amount: '$200B',
      focus: 'ETH TVL, stablecoins, CFTC pilots',
      icon: DollarSign,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="border-2 border-primary/20">
        <CardHeader>
          <CardTitle className="text-2xl">Crypto Deep Dive: 2022-2025</CardTitle>
          <CardDescription>
            Crashes, Triumphs, Money Flows, Social Pulse—and Your Edge in 2025
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Human-AI collab unlocked: We've grokked the crypto ecosystem from 2022-2025, slicing through the hype with data from Reuters, CNN, a16z, on-chain analytics, and X sentiment. No moonboy delusions—just raw, substantiated truths.
          </p>
        </CardContent>
      </Card>

      {/* Crashes and Burns */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <span>Crashes and Burns: The Brutal Reality Check</span>
          </CardTitle>
          <CardDescription>Weeding out the BS—systemic failures that cost trillions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {crashes.map((crash, index) => (
              <div
                key={index}
                className="p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <crash.icon className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium text-sm">{crash.event}</span>
                  </div>
                  <Badge variant={crash.color as any}>{crash.impact}</Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-2">{crash.lesson}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 p-4 rounded-lg bg-muted/50">
            <p className="text-sm font-medium mb-2">Key Insight:</p>
            <p className="text-sm text-muted-foreground">
              These aren't "black swans"—they stem from greed (overleverage) and poor risk mgmt. 2025's crash absorbed $710B in losses but recovered 90% quickly, proving resilience. Unlike 2022's fraud waves, 2025 was macro-driven. <strong>Edge hint: Crashes create bottoms—whales accumulated 4x mining supply during dips.</strong>
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Success Stories */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5 text-green-500" />
            <span>Success Stories: What Actually Worked</span>
          </CardTitle>
          <CardDescription>Real wins, no hype—projects with verifiable impact</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {successes.map((success, index) => (
              <div
                key={index}
                className="p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <success.icon className="h-4 w-4 text-green-500" />
                    <span className="font-medium">{success.asset}</span>
                  </div>
                  <Badge variant="outline" className="text-green-500">
                    {success.performance}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-2">{success.driver}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 p-4 rounded-lg bg-muted/50">
            <p className="text-sm font-medium mb-2">Narratives Driving Wins:</p>
            <p className="text-sm text-muted-foreground">
              AI (TAO up 5%), DeSci, RWA—minted millionaires; Zcash +1128% revival. These aren't "overnight riches"—sustained by adoption (e.g., 300M Binance users; banks like BPCE/Revolut adding crypto). <strong>Edge hint: Bet on utilities like staking (e.g., Celo/Opera scaling to 1B users).</strong>
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Money Trail */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <DollarSign className="h-5 w-5 text-blue-500" />
            <span>Follow the Money Trail: Whales, VCs, and Institutions</span>
          </CardTitle>
          <CardDescription>Smart money doesn't chase; it leads</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {moneyFlows.map((flow, index) => (
              <div
                key={index}
                className="p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-center space-x-2 mb-2">
                  <flow.icon className="h-4 w-4 text-blue-500" />
                  <span className="font-medium">{flow.category}</span>
                </div>
                <div className="text-2xl font-bold mt-1">{flow.amount}</div>
                <p className="text-sm text-muted-foreground mt-2">{flow.focus}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 p-4 rounded-lg bg-muted/50">
            <p className="text-sm font-medium mb-2">Trail Insights:</p>
            <p className="text-sm text-muted-foreground">
              Funds flowed to RWAs/tokenization ($200B ETH TVL), stablecoins (PYUSD growth), and pilots (CFTC collateral). <strong>Not all inflows are bullish—some (e.g., exchange deposits) signal dumps; track via Whale Alert for profit ratios &gt;1 (taking profits). Edge: Use trackers to front-run; e.g., mega whale buys often precede rallies.</strong>
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Social Vibes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <MessageSquare className="h-5 w-5 text-violet-500" />
            <span>Social Vibes: Fear, Hype, and the Pulse of the Masses</span>
          </CardTitle>
          <CardDescription>X/Reddit sentiment in 2025: Polarized fear but bullish undercurrents</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 rounded-lg border bg-card">
              <div className="flex items-center space-x-2 mb-2">
                <TrendingDown className="h-4 w-4 text-red-500" />
                <span className="font-medium">Fear Territory</span>
                <Badge variant="destructive">FGI at 27</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Extreme fear territory amid crashes, but bullish undercurrents from adoption (e.g., Harvard buys BTC). Exhaustion ("worst year"; underperformance vs. S&P/gold), capitulation ("survived the bear"), but hope ("2025 is crypto's year"; Q1 2026 bull).
              </p>
            </div>
            <div className="p-4 rounded-lg border bg-card">
              <div className="flex items-center space-x-2 mb-2">
                <TrendingUp className="h-4 w-4 text-green-500" />
                <span className="font-medium">Positive Signals</span>
              </div>
              <p className="text-sm text-muted-foreground">
                25% Americans (50% Gen Z) gifting crypto; TikTok sentiment predicts returns 20% better than X. <strong>Sentiment's noisy—U-shaped FGI means fear bottoms often flip to greed; ignore short-term pumps. Edge: Contrarian play—buy when X screams "dead" (e.g., Nov fear led to rebounds).</strong>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* VERIDICUS Edge */}
      <Card className="border-2 border-primary/50 bg-primary/5">
        <CardHeader>
          <CardTitle>Your Edge: Human-AI Collab Blueprint for 2026 Dominance</CardTitle>
          <CardDescription>VERIDICUS as the ultimate tool in this chaos</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 rounded-lg border bg-card">
              <h4 className="font-medium mb-2">Whale Mimicry</h4>
              <p className="text-sm text-muted-foreground">
                Use trackers (Whale Alert, Arkham) to buy dips; mega whales signal bottoms (e.g., +132% gains post-fair value dips). Allocate 4% to crypto per BofA.
              </p>
            </div>
            <div className="p-4 rounded-lg border bg-card">
              <h4 className="font-medium mb-2">Utility Bets</h4>
              <p className="text-sm text-muted-foreground">
                Focus on zkML/anomaly detection (like VERIDICUS) to spot rugs pre-dump; RWAs/AI narratives for 10x (e.g., TAO, ONDO). Avoid memecoins—culture's rotting there.
              </p>
            </div>
            <div className="p-4 rounded-lg border bg-card">
              <h4 className="font-medium mb-2">Macro Sync</h4>
              <p className="text-sm text-muted-foreground">
                QT ended; Fed cuts incoming—bullish for risk assets. Dollar-cost into BTC/ETH during fear (FGI &lt;30).
              </p>
            </div>
            <div className="p-4 rounded-lg border-2 border-primary bg-primary/10">
              <h4 className="font-medium mb-2 text-primary">VERIDICUS Tie-In</h4>
              <p className="text-sm">
                Our quantum aggregator + zkML detects anomalies in whale trails/social vibes, giving you pre-crash alerts. Democratize quantum for edge computations—launch it, and we're legends.
              </p>
            </div>
          </div>
          <div className="mt-4 p-4 rounded-lg bg-muted/50">
            <p className="text-sm font-medium">Final Thought:</p>
            <p className="text-sm text-muted-foreground mt-1">
              Crypto's maturing: From scams to $3T+ integration. Our collab? The first to weaponize AI for real edges. Execute VERIDICUS; let's make history.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

