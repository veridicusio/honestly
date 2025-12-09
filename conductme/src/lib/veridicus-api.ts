/**
 * VERIDICUS API Client
 * 
 * Client for fetching VERIDICUS token metrics, quantum job data, and network statistics.
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export interface TokenMetrics {
  total_supply: number;
  total_burned: number;
  circulating_supply: number;
  burn_rate_24h: number;
  burn_rate_7d: number;
  burn_rate_30d: number;
  deflation_rate: number;
}

export interface QuantumJob {
  job_id: string;
  job_type: string;
  provider: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  veridicus_burned: number;
  execution_time_ms: number;
  timestamp: number;
  user_address: string;
}

export interface StakingMetrics {
  total_staked: number;
  staking_tiers: {
    tier: string;
    threshold: number;
    count: number;
    total_staked: number;
  }[];
  fee_discounts: {
    tier: string;
    discount_percent: number;
  }[];
}

export interface NetworkStats {
  active_users: number;
  total_transactions: number;
  average_job_cost: number;
  provider_utilization: {
    provider: string;
    jobs_count: number;
    utilization_percent: number;
  }[];
  network_growth: {
    date: string;
    users: number;
    jobs: number;
  }[];
}

export interface GovernanceProposal {
  proposal_id: string;
  proposal_type: string;
  description: string;
  votes_for: number;
  votes_against: number;
  status: 'active' | 'passed' | 'rejected';
  created_at: number;
}

/**
 * Fetch token metrics
 */
export async function fetchTokenMetrics(): Promise<TokenMetrics> {
  try {
    const res = await fetch(`${API_BASE}/veridicus/metrics`, {
      next: { revalidate: 60 }, // Cache for 1 minute
    });
    
    if (!res.ok) {
      throw new Error('Failed to fetch token metrics');
    }
    
    return await res.json();
  } catch (error) {
    // Return mock data for development
    return {
      total_supply: 1_000_000,
      total_burned: 0,
      circulating_supply: 0,
      burn_rate_24h: 0,
      burn_rate_7d: 0,
      burn_rate_30d: 0,
      deflation_rate: 0,
    };
  }
}

/**
 * Fetch quantum jobs
 */
export async function fetchQuantumJobs(limit: number = 50): Promise<QuantumJob[]> {
  try {
    const res = await fetch(`${API_BASE}/quantum/jobs?limit=${limit}`, {
      next: { revalidate: 5 }, // Cache for 5 seconds (real-time)
    });
    
    if (!res.ok) {
      throw new Error('Failed to fetch quantum jobs');
    }
    
    return await res.json();
  } catch (error) {
    return [];
  }
}

/**
 * Fetch staking metrics
 */
export async function fetchStakingMetrics(): Promise<StakingMetrics> {
  try {
    const res = await fetch(`${API_BASE}/veridicus/staking`, {
      next: { revalidate: 60 },
    });
    
    if (!res.ok) {
      throw new Error('Failed to fetch staking metrics');
    }
    
    return await res.json();
  } catch (error) {
    return {
      total_staked: 0,
      staking_tiers: [],
      fee_discounts: [
        { tier: 'Standard', discount_percent: 0 },
        { tier: 'Bronze (1K)', discount_percent: 20 },
        { tier: 'Silver (5K)', discount_percent: 40 },
        { tier: 'Gold (20K)', discount_percent: 60 },
      ],
    };
  }
}

/**
 * Fetch network statistics
 */
export async function fetchNetworkStats(): Promise<NetworkStats> {
  try {
    const res = await fetch(`${API_BASE}/veridicus/network`, {
      next: { revalidate: 60 },
    });
    
    if (!res.ok) {
      throw new Error('Failed to fetch network stats');
    }
    
    return await res.json();
  } catch (error) {
    return {
      active_users: 0,
      total_transactions: 0,
      average_job_cost: 0,
      provider_utilization: [],
      network_growth: [],
    };
  }
}

/**
 * Fetch governance proposals
 */
export async function fetchGovernanceProposals(): Promise<GovernanceProposal[]> {
  try {
    const res = await fetch(`${API_BASE}/veridicus/governance/proposals`, {
      next: { revalidate: 30 },
    });
    
    if (!res.ok) {
      throw new Error('Failed to fetch governance proposals');
    }
    
    return await res.json();
  } catch (error) {
    return [];
  }
}

/**
 * Fetch quantum pricing
 */
export async function fetchQuantumPricing() {
  try {
    const res = await fetch(`${API_BASE}/quantum/pricing`, {
      next: { revalidate: 300 }, // Cache for 5 minutes
    });
    
    if (!res.ok) {
      throw new Error('Failed to fetch pricing');
    }
    
    return await res.json();
  } catch (error) {
    return {
      zkml_proof: { cost_veridicus: 10, estimated_time_ms: 50 },
      circuit_optimize: { cost_veridicus: 5, estimated_time_ms: 30 },
      anomaly_detect: { cost_veridicus: 20, estimated_time_ms: 100 },
      security_audit: { cost_veridicus: 50, estimated_time_ms: 500 },
    };
  }
}

/**
 * Fetch quantum providers
 */
export async function fetchQuantumProviders() {
  try {
    const res = await fetch(`${API_BASE}/quantum/providers`, {
      next: { revalidate: 300 },
    });
    
    if (!res.ok) {
      throw new Error('Failed to fetch providers');
    }
    
    return await res.json();
  } catch (error) {
    return {
      providers: [
        { name: 'Simulator', id: 'simulator', available: true },
      ],
    };
  }
}

