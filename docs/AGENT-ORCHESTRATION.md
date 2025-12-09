# Agent Orchestration Guide

**ConductMe** - Human-gated AI orchestration with cryptographic proof of humanity.

## Overview

ConductMe enables you to orchestrate multiple AI agents (Claude, GPT-4, local LLMs) with cryptographic guarantees that every action is authorized by a verified human. This prevents AI agents from operating autonomously without human oversight.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    CONDUCTME ORCHESTRATION                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   ┌──────────────┐                                              │
│   │   Human      │                                              │
│   │  Operator    │                                              │
│   └──────┬───────┘                                              │
│          │                                                      │
│          │ 1. Prove Humanity (one-time)                        │
│          ▼                                                      │
│   ┌──────────────────────────────────────┐                     │
│   │     Honestly ZK Proof                │                     │
│   │  (Age/Authenticity via Groth16)      │                     │
│   └──────────────┬───────────────────────┘                     │
│                  │                                              │
│                  │ 2. Generate Semaphore Identity             │
│                  ▼                                              │
│   ┌──────────────────────────────────────┐                     │
│   │   Semaphore Identity (Client-Side)   │                     │
│   │   - commitment (public)              │                     │
│   │   - trapdoor (secret, never sent)    │                     │
│   │   - nullifier (secret, never sent)   │                     │
│   └──────────────┬───────────────────────┘                     │
│                  │                                              │
│                  │ 3. Register with Trust Bridge               │
│                  ▼                                              │
│   ┌──────────────────────────────────────┐                     │
│   │   ConductMe Verified Humans Group     │                     │
│   │   (Merkle Tree of Commitments)        │                     │
│   └──────────────┬───────────────────────┘                     │
│                  │                                              │
│                  │ 4. Authorize AI Actions                     │
│                  ▼                                              │
│   ┌──────────────────────────────────────┐                     │
│   │   AI Action Request                   │                     │
│   │   - type: query/generate/execute      │                     │
│   │   - aiId: claude-3-opus              │                     │
│   │   - prompt: "..."                     │                     │
│   └──────────────┬───────────────────────┘                     │
│                  │                                              │
│                  │ 5. Generate Semaphore Proof                 │
│                  ▼                                              │
│   ┌──────────────────────────────────────┐                     │
│   │   Semaphore Membership Proof          │                     │
│   │   - Proves: I'm in the group          │                     │
│   │   - Zero-knowledge: Unlinkable        │                     │
│   │   - Nullifier: Prevents replay       │                     │
│   └──────────────┬───────────────────────┘                     │
│                  │                                              │
│                  │ 6. Execute Action                           │
│                  ▼                                              │
│   ┌──────────────────────────────────────┐                     │
│   │   AI Agent (Claude/GPT-4/Local)      │                     │
│   │   Action Executed + Logged            │                     │
│   └────────────────────────────────────────┘                     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Key Concepts

### 1. Human Verification (One-Time)

Before orchestrating AI agents, you must prove you're human:

```typescript
// Client-side (browser)
import { register } from '@conductme/trust-bridge';

// You've already generated an Honestly ZK proof (age/authenticity)
const result = await register(
  honestlyProofCommitment,
  honestlyNullifier,
  honestlyProof
);

// Returns: { success: true, commitment: "0x..." }
```

**Privacy**: The server never sees your salt, trapdoor, or nullifier. Identity is generated client-side.

### 2. Semaphore Identity

Each verified human gets a Semaphore identity:

- **Commitment**: Public identifier (hash of trapdoor + nullifier)
- **Trapdoor**: Secret value (never sent to server)
- **Nullifier**: Prevents double-signaling (never sent to server)

### 3. Action Authorization

Every AI action requires a Semaphore proof:

```typescript
import { Conductor, Actions } from '@conductme/trust-bridge';

const conductor = new Conductor({ groupId: 'conductme-main' });

// Create an action
const action = Actions.query(
  'claude-3-opus',
  'What is the capital of France?'
);

// Execute with human authorization
const signedAction = await conductor.executeAction(identity, action);

// Returns: {
//   action: {...},
//   proof: {
//     proof: {...},           // Groth16 proof
//     nullifierHash: "0x...", // Prevents replay
//     signal: "...",          // Action data
//     merkleTreeRoot: "0x..." // Current group root
//   },
//   humanVerified: true
// }
```

### 4. Action Types

| Type | Description | Example |
|------|-------------|---------|
| `query` | Ask AI a question | "What is 2+2?" |
| `generate` | Generate content | "Write a poem" |
| `execute` | Execute a function | Run code, make API call |
| `vote` | Vote on proposal | Approve/reject action |
| `sign` | Sign data | Sign transaction, document |

## Usage Examples

### Basic Orchestration

```typescript
import { Conductor, Actions } from '@conductme/trust-bridge';
import { getOrCreateIdentity } from '@conductme/trust-bridge';

// Initialize
const conductor = new Conductor({ groupId: 'conductme-main' });
const identity = await getOrCreateIdentity();

// Query Claude
const queryAction = Actions.query(
  'claude-3-opus',
  'Explain quantum computing'
);
const result = await conductor.executeAction(identity, queryAction);

// Generate with GPT-4
const generateAction = Actions.generate(
  'gpt-4-turbo',
  'Write a haiku about AI',
  { temperature: 0.7 }
);
const poem = await conductor.executeAction(identity, generateAction);
```

### Workflow Builder

ConductMe includes a visual workflow builder (React Flow) for chaining AI actions:

```typescript
// Define workflow
const workflow = {
  nodes: [
    { id: '1', type: 'ai-query', aiId: 'claude-3-opus', prompt: '...' },
    { id: '2', type: 'ai-generate', aiId: 'gpt-4', prompt: '...' },
  ],
  edges: [
    { source: '1', target: '2' }
  ]
};

// Execute workflow (each step requires human proof)
await conductor.executeWorkflow(identity, workflow);
```

## Security Properties

### Privacy

- **Unlinkability**: Actions cannot be linked to each other or to your identity
- **Zero-Knowledge**: Proofs reveal only membership, nothing else
- **Client-Side Secrets**: Trapdoor/nullifier never leave your browser

### Replay Prevention

- **Nullifiers**: Each action generates a unique nullifier hash
- **Tracking**: Server tracks used nullifiers (prevents double-execution)
- **Scope**: Nullifiers are scoped to action type + AI + time window

### Audit Trail

All actions are logged with:
- Action details (type, AI, prompt)
- Semaphore proof (verifiable)
- Timestamp
- Nullifier (for replay detection)

## Integration with Honestly

ConductMe integrates with Honestly's ZK proofs:

1. **Human Verification**: Use Honestly's age/authenticity proofs
2. **Identity Bridge**: Map Honestly proof → Semaphore identity
3. **Action Logging**: All actions can be anchored to L2 for audit

## API Reference

See `conductme/bridge/README.md` for complete API documentation.

## Privacy-Preserving Registration

**CRITICAL**: Identity generation happens client-side. The server never sees:
- Your salt
- Your trapdoor
- Your nullifier
- Any way to link Honestly proof to Semaphore identity

See `conductme/bridge/SECURITY.md` for details.

---

**Last Updated**: December 2024  
**Status**: Production Ready

