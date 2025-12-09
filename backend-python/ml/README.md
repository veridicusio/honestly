# ML Module for Honestly

Phase 3 ML integration: Anomaly detection, zkML (Zero-Knowledge Machine Learning), and pattern analysis for ZK proofs and AAIP.

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        ML Pipeline                                   │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  Neo4j ──→ neo4j_loader ──→ autoencoder (train)                     │
│                                    │                                 │
│  agent_features ──→ autoencoder ──→ anomaly_score                   │
│                          │              │                            │
│                          ▼              ▼                            │
│                   latent_vector    zkml_prover                      │
│                                         │                            │
│                                         ▼                            │
│                              ZK Proof: "score > 0.8"                │
│                                         │                            │
│                                         ▼                            │
│                              Hyperledger Fabric                      │
│                              (on-chain anchor)                       │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

## Features

### 1. Anomaly Detection (`anomaly_detector.py`)

Isolation Forest-based anomaly detection for ZK proof patterns:

- **Reputation jumps**: Sudden +25 points in 24h
- **Burst detection**: >20 proofs/hour or >100 proofs/day
- **Sybil patterns**: Low nullifier diversity (reused identities)
- **Rapid-fire**: <1s between proofs
- **Unusual timing**: Late night activity (2-5 AM)

```python
from ml.anomaly_detector import get_detector

detector = get_detector()
score = detector.analyze_proof(proof_data, agent_id="did:honestly:agent:xyz")

# Returns:
# {
#   "anomaly_score": 0.72,      # 0.0 (normal) to 1.0 (anomalous)
#   "is_anomalous": True,       # score > 0.7 threshold
#   "flags": ["reputation_jump", "burst_1h"],
#   "confidence": 0.85,
#   "details": { ... }
# }
```

### 2. Reputation Analyzer (`reputation_analyzer.py`)

Time series analysis for AI agent reputation:

- **Trend detection**: Rising, falling, stable
- **Volatility analysis**: Standard deviation of scores
- **Gaming detection**: Alternating high/low patterns
- **Cross-agent comparison**: Rankings and outliers

```python
from ml.reputation_analyzer import ReputationAnalyzer

analyzer = ReputationAnalyzer(neo4j_driver)
trend = analyzer.analyze_agent("did:honestly:agent:xyz")

# Returns:
# {
#   "current_reputation": 75,
#   "average_reputation": 68.5,
#   "trend": {"direction": "rising", "magnitude": 0.5},
#   "volatility": 8.2,
#   "anomaly_flags": ["sudden_jump"]
# }
```

## API Endpoints

### Single Proof Verification with Anomaly Score

```bash
POST /ai/verify-proof
{
  "proof_data": "{...}",
  "proof_type": "agent_reputation",
  "include_anomaly_score": true
}

# Response:
{
  "verified": true,
  "proof_type": "agent_reputation",
  "verification_time_ms": 45.2,
  "anomaly": {
    "anomaly_score": 0.15,
    "is_anomalous": false,
    "flags": [],
    "confidence": 0.92
  }
}
```

### Batch Verification (Enterprise)

```bash
POST /ai/verify-proofs-batch
{
  "proofs": [
    {"proof_data": "{...}", "proof_type": "agent_reputation"},
    {"proof_data": "{...}", "proof_type": "agent_capability"}
  ],
  "include_anomaly_score": true
}

# Response:
{
  "results": [...],
  "summary": {
    "total": 10,
    "verified": 9,
    "failed": 1,
    "anomalous": 2,
    "total_time_ms": 312.5,
    "avg_time_ms": 31.25
  }
}
```

### Anomaly Stats

```bash
GET /ai/anomaly-stats

# Response:
{
  "status": "available",
  "stats": {
    "total_agents_tracked": 150,
    "total_proofs_analyzed": 12847,
    "ml_enabled": true,
    "model_trained": true,
    "anomaly_threshold": 0.7
  }
}
```

## Configuration

```bash
# Environment variables
ANOMALY_MODEL_PATH=/path/to/model.pkl  # Pre-trained model
ANOMALY_THRESHOLD=0.7                   # Score threshold (0-1)

# Thresholds (in anomaly_detector.py)
REPUTATION_JUMP_THRESHOLD = 25  # Points per 24h
BURST_THRESHOLD_1H = 20         # Max proofs per hour
BURST_THRESHOLD_24H = 100       # Max proofs per 24h
SYBIL_NULLIFIER_RATIO = 0.5     # Unique nullifiers / total
```

## Training

To train the ML model on historical data:

```python
from ml.anomaly_detector import get_detector

detector = get_detector()

# Prepare training data (list of proof feature dicts)
training_data = [
    {
        "hour_of_day": 14,
        "day_of_week": 2,
        "time_since_last": 3600,
        "proof_count_1h": 5,
        "proof_count_24h": 20,
        "reputation_delta": 2,
        "threshold": 50,
        # ...
    },
    # ... at least 100 samples
]

detector.train(training_data)
detector.save_model(Path("models/anomaly_model.pkl"))
```

## Neo4j Schema

The reputation analyzer creates these indexes:

```cypher
CREATE CONSTRAINT agent_reputation_id IF NOT EXISTS
FOR (r:ReputationProof) REQUIRE r.proof_id IS UNIQUE

CREATE INDEX agent_reputation_agent IF NOT EXISTS
FOR (r:ReputationProof) ON (r.agent_id)

CREATE INDEX agent_reputation_time IF NOT EXISTS
FOR (r:ReputationProof) ON (r.timestamp)
```

## Performance

| Operation | Latency | Notes |
|-----------|---------|-------|
| Single anomaly analysis | <5ms | In-memory, no DB |
| Batch (10 proofs) | <50ms | Parallel processing |
| Model training (10K samples) | ~2s | One-time |
| Reputation trend query | <20ms | Neo4j indexed |

## LSTM Autoencoder (`autoencoder.py`)

Deep learning anomaly detection for agent activity sequences:

```python
from ml.autoencoder import get_autoencoder, create_training_dataset
from ml.neo4j_loader import Neo4jDataLoader

# Load training data from Neo4j
loader = Neo4jDataLoader(neo4j_driver)
train_data = loader.load_agent_sequences(days=30, seq_len=10)

# Train autoencoder
autoencoder = get_autoencoder()
history = autoencoder.fit(train_data, epochs=50)

# Detect anomaly
result = autoencoder.detect_anomaly(agent_features)
# result.anomaly_score: 0.0-1.0
# result.reconstruction_error: raw MSE
# result.is_anomalous: True if score > threshold

# Export for zkML
autoencoder.export_onnx(Path("model.onnx"))
```

### Input Features (per timestep)

| Feature | Description | Range |
|---------|-------------|-------|
| reputation_score | Current rep | 0-100 |
| claim_count | Claims in period | 0+ |
| proof_count | Proofs generated | 0+ |
| interaction_count | Agent interactions | 0+ |
| hour_of_day | Time feature | 0-1 |
| day_of_week | Day feature | 0-1 |
| response_time_avg | Avg response (ms) | 0+ |
| error_rate | Error rate | 0-1 |

## zkML Prover (`zkml_prover.py`)

Zero-knowledge proofs of ML inference (DeepProve integration):

```python
from ml.zkml_prover import get_zkml_prover

prover = get_zkml_prover()

# Generate ZK proof that anomaly_score > threshold
proof = prover.prove_anomaly_threshold(
    agent_features=features,
    threshold=0.8,
)

# proof.public_inputs = ["800", "1"]  # threshold*1000, is_above
# proof.proof = { pi_a, pi_b, pi_c }  # Groth16 proof

# Verify proof
is_valid = prover.verify_proof(proof)
```

### Why zkML?

- **Privacy**: Prove "agent is anomalous" without revealing features or model
- **Anti-gaming**: Model weights hidden, can't reverse-engineer
- **On-chain**: Anchor proof to Hyperledger for immutable audit
- **Performance**: <1s inference + <500ms verify (DeepProve)

## Neo4j Data Loader (`neo4j_loader.py`)

Load training data from the agent/claim graph:

```python
from ml.neo4j_loader import create_training_dataset

# Create labeled dataset
data, labels = create_training_dataset(
    neo4j_driver=driver,
    normal_samples=500,
    anomaly_samples=50,
    seq_len=10,
)

# data: List of sequences
# labels: 0=normal, 1=anomaly
```

### Cypher Query (internal)

```cypher
MATCH (a:Agent)
OPTIONAL MATCH (a)-[:HAS_CLAIM]->(c:Claim)
OPTIONAL MATCH (a)-[:HAS_PROOF]->(p:Proof)
OPTIONAL MATCH (a)-[:INTERACTS_WITH]->(other:Agent)
RETURN a.id, a.reputation, count(c), count(p), count(other)
```

## Dependencies

**Required:**
- numpy
- py2neo (for Neo4j)

**Optional (for ML models):**
- scikit-learn>=1.3.0 (isolation forest)
- torch>=2.0.0 (LSTM autoencoder)
- deepprove (zkML, install separately)

Without PyTorch, the autoencoder falls back to statistical methods.
Without DeepProve, zkML generates mock proofs for development.

