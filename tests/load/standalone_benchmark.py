#!/usr/bin/env python3
"""
Standalone ZKP Benchmark Script
===============================

Simulates the anomaly detection logic without external dependencies.
Tests the heuristic-only path that works without sklearn.

Run: python tests/load/standalone_benchmark.py
"""

import time
import statistics
import sys
import random
from datetime import datetime, timedelta
from dataclasses import dataclass, field
from typing import Dict, Any, List, Tuple
from concurrent.futures import ThreadPoolExecutor


@dataclass
class AnomalyScore:
    """Result of anomaly analysis."""
    anomaly_score: float
    is_anomalous: bool
    flags: List[str] = field(default_factory=list)
    confidence: float = 0.0


@dataclass 
class ProofFeatures:
    """Extracted features from a proof."""
    hour_of_day: int
    day_of_week: int
    time_since_last_proof: float
    proof_count_1h: int
    proof_count_24h: int
    unique_nullifiers_1h: int
    reputation_delta: float
    threshold_requested: int
    capability_count: int
    new_capabilities: int


class HeuristicAnomalyDetector:
    """
    Heuristic-only anomaly detector.
    Simulates the full detector without sklearn dependency.
    """
    
    REPUTATION_JUMP_THRESHOLD = 25
    BURST_THRESHOLD_1H = 20
    BURST_THRESHOLD_24H = 100
    SYBIL_NULLIFIER_RATIO = 0.5
    
    def __init__(self, anomaly_threshold: float = 0.7):
        self.anomaly_threshold = anomaly_threshold
        self._history: Dict[str, List[Dict]] = {}
    
    def _extract_features(
        self,
        proof_data: Dict[str, Any],
        agent_id: str,
        proof_type: str,
    ) -> ProofFeatures:
        """Extract features from proof data."""
        now = datetime.utcnow()
        history = self._history.get(agent_id, [])
        
        hour_of_day = now.hour
        day_of_week = now.weekday()
        
        if history:
            last_ts = history[-1].get("timestamp", now - timedelta(days=1))
            time_since_last = (now - last_ts).total_seconds()
        else:
            time_since_last = 86400
        
        proof_count_1h = sum(
            1 for p in history
            if (now - p.get("timestamp", now)).total_seconds() < 3600
        )
        proof_count_24h = sum(
            1 for p in history
            if (now - p.get("timestamp", now)).total_seconds() < 86400
        )
        
        recent_nullifiers = set(
            p.get("nullifier") for p in history
            if (now - p.get("timestamp", now)).total_seconds() < 3600
            and p.get("nullifier")
        )
        unique_nullifiers_1h = len(recent_nullifiers)
        
        reputation_delta = 0.0
        threshold_requested = 0
        if proof_type == "agent_reputation":
            public_signals = proof_data.get("publicSignals", [])
            if len(public_signals) > 1:
                sig = public_signals[1]
                threshold_requested = int(sig) if str(sig).isdigit() else 0
            
            rep_history = [
                p.get("threshold", 0) for p in history
                if p.get("proof_type") == "agent_reputation"
            ]
            if rep_history:
                reputation_delta = threshold_requested - rep_history[-1]
        
        capability_count = len(proof_data.get("capabilities", []))
        known_caps = set(
            cap for p in history
            for cap in p.get("capabilities", [])
        )
        current_caps = set(proof_data.get("capabilities", []))
        new_capabilities = len(current_caps - known_caps)
        
        return ProofFeatures(
            hour_of_day=hour_of_day,
            day_of_week=day_of_week,
            time_since_last_proof=time_since_last,
            proof_count_1h=proof_count_1h,
            proof_count_24h=proof_count_24h,
            unique_nullifiers_1h=unique_nullifiers_1h,
            reputation_delta=reputation_delta,
            threshold_requested=threshold_requested,
            capability_count=capability_count,
            new_capabilities=new_capabilities,
        )
    
    def _heuristic_score(self, features: ProofFeatures) -> Tuple[float, List[str]]:
        """Calculate anomaly score using heuristics."""
        score = 0.0
        flags = []
        
        if abs(features.reputation_delta) > self.REPUTATION_JUMP_THRESHOLD:
            score += 0.3
            flags.append("reputation_jump")
        
        if features.proof_count_1h > self.BURST_THRESHOLD_1H:
            score += 0.3
            flags.append("burst_1h")
        if features.proof_count_24h > self.BURST_THRESHOLD_24H:
            score += 0.2
            flags.append("burst_24h")
        
        if features.proof_count_1h > 5:
            nullifier_ratio = features.unique_nullifiers_1h / features.proof_count_1h
            if nullifier_ratio < self.SYBIL_NULLIFIER_RATIO:
                score += 0.4
                flags.append("sybil_pattern")
        
        if features.hour_of_day >= 2 and features.hour_of_day <= 5:
            score += 0.1
            flags.append("unusual_timing")
        
        if features.time_since_last_proof < 1.0:
            score += 0.2
            flags.append("rapid_fire")
        
        if features.new_capabilities > 3:
            score += 0.2
            flags.append("capability_spike")
        
        return min(score, 1.0), flags
    
    def analyze_proof(
        self,
        proof_data: Dict[str, Any],
        agent_id: str,
        proof_type: str = "age",
        record: bool = True,
    ) -> AnomalyScore:
        """Analyze a proof for anomalies."""
        features = self._extract_features(proof_data, agent_id, proof_type)
        heuristic_score, flags = self._heuristic_score(features)
        
        if record:
            if agent_id not in self._history:
                self._history[agent_id] = []
            
            self._history[agent_id].append({
                "timestamp": datetime.utcnow(),
                "proof_type": proof_type,
                "nullifier": proof_data.get("publicSignals", [None])[-1],
                "threshold": features.threshold_requested,
                "capabilities": proof_data.get("capabilities", []),
            })
            
            if len(self._history[agent_id]) > 1000:
                self._history[agent_id] = self._history[agent_id][-1000:]
        
        return AnomalyScore(
            anomaly_score=heuristic_score,
            is_anomalous=heuristic_score > self.anomaly_threshold,
            flags=flags,
            confidence=0.8,
        )
    
    def analyze_batch(
        self,
        proofs: List[Dict[str, Any]],
        agent_id: str,
    ) -> List[AnomalyScore]:
        """Analyze a batch of proofs."""
        return [
            self.analyze_proof(
                proof.get("proof_data", {}),
                agent_id,
                proof.get("proof_type", "age"),
            )
            for proof in proofs
        ]
    
    def get_stats(self) -> Dict[str, Any]:
        """Get detector statistics."""
        return {
            "total_agents_tracked": len(self._history),
            "total_proofs_analyzed": sum(len(h) for h in self._history.values()),
            "ml_enabled": False,
            "mode": "heuristics_only",
        }


# Sample proof data
SAMPLE_PROOF = {
    "proof": {
        "pi_a": ["1", "2", "1"],
        "pi_b": [["1", "2"], ["3", "4"], ["1", "0"]],
        "pi_c": ["1", "2", "1"],
    },
    "publicSignals": ["18", "1733443200", "12345678901234567890", "98765432109876543210"],
}


def run_benchmark():
    """Run the full benchmark suite."""
    print("\n" + "="*70)
    print("  ZKP ANOMALY DETECTION BENCHMARK (Standalone)")
    print("="*70)
    print(f"\n  Started: {datetime.now().isoformat()}")
    print(f"  Python:  {sys.version.split()[0]}")
    
    detector = HeuristicAnomalyDetector(anomaly_threshold=0.7)
    print("\n✅ Heuristic detector initialized\n")
    
    # Warmup
    print("🔥 Warming up...")
    for i in range(100):
        detector.analyze_proof(SAMPLE_PROOF, f"warmup-{i}", "age")
    
    # === Single Proof Analysis ===
    print("\n📊 Single Proof Analysis")
    print("-" * 50)
    
    iterations = 10000
    latencies = []
    detector._history.clear()  # Reset
    
    start = time.perf_counter()
    for i in range(iterations):
        proof_start = time.perf_counter()
        result = detector.analyze_proof(
            SAMPLE_PROOF, 
            f"agent-{i % 100}",
            "agent_reputation"
        )
        latencies.append((time.perf_counter() - proof_start) * 1000)
    
    total_time = time.perf_counter() - start
    
    print(f"  Iterations:     {iterations:,}")
    print(f"  Total time:     {total_time*1000:.2f}ms")
    print(f"  Throughput:     {iterations/total_time:,.0f} ops/sec")
    print(f"  Latency (avg):  {statistics.mean(latencies):.4f}ms")
    print(f"  Latency (p50):  {statistics.median(latencies):.4f}ms")
    print(f"  Latency (p95):  {sorted(latencies)[int(0.95*len(latencies))]:.4f}ms")
    print(f"  Latency (p99):  {sorted(latencies)[int(0.99*len(latencies))]:.4f}ms")
    print(f"  Latency (max):  {max(latencies):.4f}ms")
    
    single_ops_sec = iterations/total_time
    single_p99 = sorted(latencies)[int(0.99*len(latencies))]
    
    # === Batch Analysis ===
    print("\n📊 Batch Analysis (10 proofs)")
    print("-" * 50)
    
    batch_iterations = 1000
    batch_latencies = []
    detector._history.clear()
    
    batch_proofs = [
        {"proof_data": SAMPLE_PROOF, "proof_type": "agent_reputation"}
        for _ in range(10)
    ]
    
    start = time.perf_counter()
    for i in range(batch_iterations):
        batch_start = time.perf_counter()
        results = detector.analyze_batch(batch_proofs, f"batch-{i}")
        batch_latencies.append((time.perf_counter() - batch_start) * 1000)
    
    total_time = time.perf_counter() - start
    
    print(f"  Batches:        {batch_iterations:,}")
    print(f"  Proofs/batch:   10")
    print(f"  Total proofs:   {batch_iterations * 10:,}")
    print(f"  Total time:     {total_time*1000:.2f}ms")
    print(f"  Batch (avg):    {statistics.mean(batch_latencies):.3f}ms")
    print(f"  Batch (p95):    {sorted(batch_latencies)[int(0.95*len(batch_latencies))]:.3f}ms")
    print(f"  Throughput:     {(batch_iterations * 10)/total_time:,.0f} proofs/sec")
    
    batch_throughput = (batch_iterations * 10)/total_time
    batch_p95 = sorted(batch_latencies)[int(0.95*len(batch_latencies))]
    
    # === Concurrent Analysis ===
    print("\n📊 Concurrent Analysis (8 threads)")
    print("-" * 50)
    
    detector._history.clear()
    concurrent_iterations = 5000
    
    def analyze_proof(args):
        agent_id, proof_type = args
        return detector.analyze_proof(SAMPLE_PROOF, agent_id, proof_type)
    
    tasks = [
        (f"concurrent-{i}", random.choice(["age", "agent_reputation", "agent_capability"]))
        for i in range(concurrent_iterations)
    ]
    
    with ThreadPoolExecutor(max_workers=8) as executor:
        start = time.perf_counter()
        results = list(executor.map(analyze_proof, tasks))
        concurrent_time = time.perf_counter() - start
    
    print(f"  Iterations:     {concurrent_iterations:,}")
    print(f"  Workers:        8")
    print(f"  Total time:     {concurrent_time*1000:.2f}ms")
    print(f"  Throughput:     {concurrent_iterations/concurrent_time:,.0f} ops/sec")
    
    concurrent_throughput = concurrent_iterations/concurrent_time
    
    # === Anomaly Detection Test ===
    print("\n📊 Anomaly Detection Accuracy")
    print("-" * 50)
    
    detector._history.clear()
    
    # Test burst detection
    for i in range(25):
        detector.analyze_proof(SAMPLE_PROOF, "burst-agent", "age")
    result = detector.analyze_proof(SAMPLE_PROOF, "burst-agent", "age")
    burst_detected = "burst_1h" in result.flags
    print(f"  Burst (25 proofs/hr): {'✅ Detected' if burst_detected else '❌ Missed'} (flags: {result.flags})")
    
    # Test rapid-fire
    detector._history.clear()
    detector.analyze_proof(SAMPLE_PROOF, "rapid-agent", "age")
    time.sleep(0.001)  # < 1 second
    result = detector.analyze_proof(SAMPLE_PROOF, "rapid-agent", "age")
    rapid_detected = "rapid_fire" in result.flags
    print(f"  Rapid-fire (<1s):     {'✅ Detected' if rapid_detected else '❌ Missed'} (score: {result.anomaly_score:.2f})")
    
    # === Stats ===
    stats = detector.get_stats()
    
    # === Summary ===
    print("\n" + "="*70)
    print("  BENCHMARK SUMMARY")
    print("="*70)
    
    single_pass = "✅" if single_p99 < 5 else "❌"
    batch_pass = "✅" if batch_p95 < 50 else "❌"
    throughput_pass = "✅" if single_ops_sec > 10000 else "❌"
    
    print(f"""
  ┌──────────────────────────────────────────────────────────────────┐
  │  PERFORMANCE RESULTS                                             │
  ├──────────────────────────────────────────────────────────────────┤
  │  Single proof (p99):     {single_p99:.3f}ms    Target: <5ms      {single_pass}  │
  │  Batch 10 (p95):         {batch_p95:.3f}ms    Target: <50ms     {batch_pass}  │
  │  Single throughput:      {single_ops_sec:,.0f} ops/sec                      │
  │  Batch throughput:       {batch_throughput:,.0f} proofs/sec                     │
  │  Concurrent (8 threads): {concurrent_throughput:,.0f} ops/sec                      │
  ├──────────────────────────────────────────────────────────────────┤
  │  TARGETS                                                         │
  │  • p99 < 5ms for single analysis      {single_pass}                        │
  │  • p95 < 50ms for batch (10)          {batch_pass}                        │
  │  • 10,000+ ops/sec                    {throughput_pass}                        │
  └──────────────────────────────────────────────────────────────────┘
  
  📈 At {single_ops_sec:,.0f} ops/sec, the /ai/verify-proofs-batch endpoint
     can handle {single_ops_sec * 60 / 1000:.0f}K requests/min on a single thread.
     
     With 8 workers: {concurrent_throughput * 60 / 1000:.0f}K requests/min
""")


if __name__ == "__main__":
    run_benchmark()

