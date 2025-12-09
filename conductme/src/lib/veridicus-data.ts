/**
 * VERIDICUS Data Fetching
 * 
 * React hooks and utilities for fetching VERIDICUS data with caching and error handling.
 */

import { useState, useEffect, useCallback } from 'react';
import {
  fetchTokenMetrics,
  fetchQuantumJobs,
  fetchStakingMetrics,
  fetchNetworkStats,
  fetchGovernanceProposals,
  fetchQuantumPricing,
  fetchQuantumProviders,
  type TokenMetrics,
  type QuantumJob,
  type StakingMetrics,
  type NetworkStats,
  type GovernanceProposal,
} from './veridicus-api';

/**
 * Hook for token metrics with auto-refresh
 */
export function useTokenMetrics(refreshInterval: number = 60000) {
  const [data, setData] = useState<TokenMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const metrics = await fetchTokenMetrics();
      setData(metrics);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch token metrics'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, refreshInterval);
    return () => clearInterval(interval);
  }, [fetchData, refreshInterval]);

  return { data, loading, error, refetch: fetchData };
}

/**
 * Hook for quantum jobs with real-time updates
 */
export function useQuantumJobs(refreshInterval: number = 5000) {
  const [data, setData] = useState<QuantumJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const jobs = await fetchQuantumJobs(50);
      setData(jobs);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch quantum jobs'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, refreshInterval);
    return () => clearInterval(interval);
  }, [fetchData, refreshInterval]);

  return { data, loading, error, refetch: fetchData };
}

/**
 * Hook for staking metrics
 */
export function useStakingMetrics(refreshInterval: number = 60000) {
  const [data, setData] = useState<StakingMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const metrics = await fetchStakingMetrics();
      setData(metrics);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch staking metrics'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, refreshInterval);
    return () => clearInterval(interval);
  }, [fetchData, refreshInterval]);

  return { data, loading, error, refetch: fetchData };
}

/**
 * Hook for network statistics
 */
export function useNetworkStats(refreshInterval: number = 60000) {
  const [data, setData] = useState<NetworkStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const stats = await fetchNetworkStats();
      setData(stats);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch network stats'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, refreshInterval);
    return () => clearInterval(interval);
  }, [fetchData, refreshInterval]);

  return { data, loading, error, refetch: fetchData };
}

/**
 * Hook for governance proposals
 */
export function useGovernanceProposals(refreshInterval: number = 30000) {
  const [data, setData] = useState<GovernanceProposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const proposals = await fetchGovernanceProposals();
      setData(proposals);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch governance proposals'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, refreshInterval);
    return () => clearInterval(interval);
  }, [fetchData, refreshInterval]);

  return { data, loading, error, refetch: fetchData };
}

/**
 * Hook for quantum pricing (static, cached)
 */
export function useQuantumPricing() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    fetchQuantumPricing()
      .then(setData)
      .catch((err) => setError(err instanceof Error ? err : new Error('Failed to fetch pricing')))
      .finally(() => setLoading(false));
  }, []);

  return { data, loading, error };
}

/**
 * Hook for quantum providers (static, cached)
 */
export function useQuantumProviders() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    fetchQuantumProviders()
      .then(setData)
      .catch((err) => setError(err instanceof Error ? err : new Error('Failed to fetch providers')))
      .finally(() => setLoading(false));
  }, []);

  return { data, loading, error };
}

