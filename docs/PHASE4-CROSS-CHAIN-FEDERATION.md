# Phase 4: Cross-Chain Anomaly Federation

> **Status**: Design Phase  
> **Dependencies**: Phase 3 ML/zkML Complete  
> **Target**: Q2 2025

## Overview

Federated anomaly detection across EVM chains + Solana, with economic incentives via staking/slashing and Chainlink oracle validation.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     CROSS-CHAIN ANOMALY FEDERATION                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   ┌──────────────┐        ┌──────────────┐        ┌──────────────┐         │
│   │   Solana     │        │   Ethereum   │        │   Polygon    │         │
│   │   Agents     │        │   Agents     │        │   Agents     │         │
│   └──────┬───────┘        └──────┬───────┘        └──────┬───────┘         │
│          │                       │                       │                  │
│          ▼                       ▼                       ▼                  │
│   ┌──────────────┐        ┌──────────────┐        ┌──────────────┐         │
│   │  ML Detector │        │  ML Detector │        │  ML Detector │         │
│   │  + zkML Proof│        │  + zkML Proof│        │  + zkML Proof│         │
│   └──────┬───────┘        └──────┬───────┘        └──────┬───────┘         │
│          │                       │                       │                  │
│          │    ┌──────────────────┴──────────────────┐    │                  │
│          └───►│         🌀 WORMHOLE GUARDIAN        │◄───┘                  │
│               │              NETWORK                │                       │
│               └──────────────────┬──────────────────┘                       │
│                                  │                                          │
│                                  ▼                                          │
│                    ┌─────────────────────────┐                              │
│                    │    VAA (Verified        │                              │
│                    │    Action Approval)     │                              │
│                    │    + zkML Proof Hash    │                              │
│                    └────────────┬────────────┘                              │
│                                 │                                           │
│               ┌─────────────────┼─────────────────┐                         │
│               ▼                 ▼                 ▼                         │
│   ┌───────────────────┐ ┌─────────────┐ ┌───────────────────┐              │
│   │  🔗 CHAINLINK     │ │  ANOMALY    │ │  STAKING          │              │
│   │  CCIP ORACLE      │ │  REGISTRY   │ │  CONTRACT         │              │
│   │                   │ │  (Ethereum) │ │                   │              │
│   │  - VAA Validation │ │             │ │  - Reporter Stake │              │
│   │  - zkML Verify    │ │  - Store    │ │  - Slash on False │              │
│   │  - Threshold Vote │ │  - Query    │ │  - Reward on True │              │
│   └─────────┬─────────┘ │  - Dispute  │ └─────────┬─────────┘              │
│             │           └──────┬──────┘           │                         │
│             │                  │                  │                         │
│             └──────────────────┼──────────────────┘                         │
│                                ▼                                            │
│                    ┌─────────────────────────┐                              │
│                    │    📢 ALERT DISPATCH    │                              │
│                    │                         │                              │
│                    │  - Dashboard WebSocket  │                              │
│                    │  - Slack/Discord        │                              │
│                    │  - On-chain Event       │                              │
│                    └─────────────────────────┘                              │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Architecture Components

### 1. Chain-Native ML Detectors

Each supported chain runs local anomaly detection:

```solidity
// Deployed on each chain
interface ILocalDetector {
    // Emit when anomaly detected locally
    event AnomalyDetected(
        bytes32 indexed agentId,
        uint256 anomalyScore,      // Scaled by 1e18
        uint256 threshold,
        bytes32 zkmlProofHash,     // Hash of zkML proof
        bytes32[] flags
    );
    
    // Called by off-chain ML service
    function reportAnomaly(
        bytes32 agentId,
        uint256 anomalyScore,
        bytes32 zkmlProofHash,
        bytes calldata zkmlProof   // Full Groth16 proof
    ) external;
}
```

### 2. Wormhole VAA Bridge

Anomalies are packaged into Wormhole VAAs for cross-chain propagation:

```typescript
interface AnomalyVAA {
  // Wormhole standard fields
  version: number;
  guardianSetIndex: number;
  signatures: GuardianSignature[];
  
  // Anomaly payload
  payload: {
    sourceChain: ChainId;           // e.g., CHAIN_ID_SOLANA
    agentId: string;                // did:honestly:sol:agent:xyz
    anomalyScore: bigint;           // 850000000000000000 = 0.85
    threshold: bigint;
    zkmlProofHash: string;          // keccak256 of proof
    flags: string[];
    timestamp: number;
    reporterAddress: string;        // For slashing
  };
}
```

### 3. Chainlink CCIP Oracle

Validates VAAs and zkML proofs before registry write:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {CCIPReceiver} from "@chainlink/contracts-ccip/src/v0.8/ccip/applications/CCIPReceiver.sol";
import {IWormhole} from "./interfaces/IWormhole.sol";
import {Groth16Verifier} from "./Groth16Verifier.sol";

contract AnomalyOracle is CCIPReceiver {
    IWormhole public wormhole;
    Groth16Verifier public zkmlVerifier;
    
    // Minimum guardian signatures for VAA
    uint8 public constant MIN_GUARDIANS = 13;
    
    // Oracle threshold voting
    uint256 public constant ORACLE_QUORUM = 3;
    mapping(bytes32 => uint256) public voteCount;
    mapping(bytes32 => mapping(address => bool)) public hasVoted;
    
    event VAAAValidated(
        bytes32 indexed vaaHash,
        uint16 sourceChain,
        bytes32 agentId,
        bool zkmlValid
    );
    
    event AnomalyConfirmed(
        bytes32 indexed agentId,
        uint256 anomalyScore,
        uint16 sourceChain
    );
    
    /**
     * @notice Validate incoming VAA and zkML proof
     * @param vaa Raw VAA bytes from Wormhole
     * @param zkmlProof Full Groth16 proof for zkML inference
     * @param publicInputs Public inputs to zkML circuit
     */
    function validateAnomaly(
        bytes calldata vaa,
        bytes calldata zkmlProof,
        uint256[] calldata publicInputs
    ) external {
        // 1. Parse and verify VAA signatures
        (IWormhole.VM memory vm, bool valid, ) = wormhole.parseAndVerifyVM(vaa);
        require(valid, "Invalid VAA");
        require(vm.signatures.length >= MIN_GUARDIANS, "Insufficient guardians");
        
        // 2. Decode anomaly payload
        AnomalyPayload memory payload = abi.decode(vm.payload, (AnomalyPayload));
        
        // 3. Verify zkML proof matches claimed hash
        bytes32 proofHash = keccak256(zkmlProof);
        require(proofHash == payload.zkmlProofHash, "Proof hash mismatch");
        
        // 4. Verify zkML Groth16 proof
        bool zkmlValid = zkmlVerifier.verifyProof(zkmlProof, publicInputs);
        
        bytes32 vaaHash = keccak256(vaa);
        emit VAAAValidated(vaaHash, vm.emitterChainId, payload.agentId, zkmlValid);
        
        // 5. Oracle vote (requires ORACLE_QUORUM confirmations)
        if (zkmlValid && !hasVoted[vaaHash][msg.sender]) {
            hasVoted[vaaHash][msg.sender] = true;
            voteCount[vaaHash]++;
            
            if (voteCount[vaaHash] >= ORACLE_QUORUM) {
                _confirmAnomaly(payload);
            }
        }
    }
    
    function _confirmAnomaly(AnomalyPayload memory payload) internal {
        // Write to registry, trigger staking rewards/slashes
        anomalyRegistry.recordAnomaly(
            payload.agentId,
            payload.anomalyScore,
            payload.sourceChain,
            payload.reporterAddress
        );
        
        emit AnomalyConfirmed(
            payload.agentId,
            payload.anomalyScore,
            payload.sourceChain
        );
    }
}
```

### 4. Staking & Slashing Contract

Economic incentives for honest reporting:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract AnomalyStaking is ReentrancyGuard {
    IERC20 public stakingToken;         // e.g., LINK or native token
    
    uint256 public constant MIN_STAKE = 100 ether;          // Min to report
    uint256 public constant SLASH_PERCENT = 50;             // 50% slash on false positive
    uint256 public constant REWARD_PERCENT = 10;            // 10% of slash goes to disputer
    uint256 public constant DISPUTE_WINDOW = 7 days;
    
    struct Reporter {
        uint256 stakedAmount;
        uint256 reportsCount;
        uint256 slashedCount;
        uint256 rewardsEarned;
        bool isActive;
    }
    
    struct AnomalyReport {
        bytes32 agentId;
        address reporter;
        uint256 anomalyScore;
        uint256 timestamp;
        uint256 stakeAtRisk;
        ReportStatus status;
    }
    
    enum ReportStatus { Pending, Confirmed, Disputed, Slashed }
    
    mapping(address => Reporter) public reporters;
    mapping(bytes32 => AnomalyReport) public reports;  // reportId => Report
    
    event Staked(address indexed reporter, uint256 amount);
    event AnomalyReported(bytes32 indexed reportId, bytes32 agentId, address reporter);
    event Disputed(bytes32 indexed reportId, address disputer);
    event Slashed(bytes32 indexed reportId, address reporter, uint256 amount);
    event Rewarded(bytes32 indexed reportId, address reporter, uint256 amount);
    
    /**
     * @notice Stake tokens to become a reporter
     */
    function stake(uint256 amount) external nonReentrant {
        require(amount >= MIN_STAKE, "Below minimum stake");
        
        stakingToken.transferFrom(msg.sender, address(this), amount);
        
        reporters[msg.sender].stakedAmount += amount;
        reporters[msg.sender].isActive = true;
        
        emit Staked(msg.sender, amount);
    }
    
    /**
     * @notice Report an anomaly (called by oracle after VAA validation)
     */
    function recordAnomaly(
        bytes32 agentId,
        uint256 anomalyScore,
        uint16 sourceChain,
        address reporter
    ) external onlyOracle {
        require(reporters[reporter].isActive, "Reporter not staked");
        require(reporters[reporter].stakedAmount >= MIN_STAKE, "Insufficient stake");
        
        bytes32 reportId = keccak256(abi.encodePacked(
            agentId, anomalyScore, block.timestamp, reporter
        ));
        
        // Put stake at risk
        uint256 stakeAtRisk = reporters[reporter].stakedAmount * SLASH_PERCENT / 100;
        
        reports[reportId] = AnomalyReport({
            agentId: agentId,
            reporter: reporter,
            anomalyScore: anomalyScore,
            timestamp: block.timestamp,
            stakeAtRisk: stakeAtRisk,
            status: ReportStatus.Pending
        });
        
        reporters[reporter].reportsCount++;
        
        emit AnomalyReported(reportId, agentId, reporter);
    }
    
    /**
     * @notice Dispute a false positive (requires proof)
     * @param reportId The report to dispute
     * @param innocenceProof ZK proof that agent behavior was normal
     */
    function dispute(
        bytes32 reportId,
        bytes calldata innocenceProof
    ) external nonReentrant {
        AnomalyReport storage report = reports[reportId];
        require(report.status == ReportStatus.Pending, "Not disputable");
        require(
            block.timestamp <= report.timestamp + DISPUTE_WINDOW,
            "Dispute window closed"
        );
        
        // Verify innocence proof (agent proves they weren't anomalous)
        bool innocent = _verifyInnocenceProof(report.agentId, innocenceProof);
        require(innocent, "Innocence proof invalid");
        
        // Slash reporter
        uint256 slashAmount = report.stakeAtRisk;
        reporters[report.reporter].stakedAmount -= slashAmount;
        reporters[report.reporter].slashedCount++;
        
        // Reward disputer
        uint256 reward = slashAmount * REWARD_PERCENT / 100;
        stakingToken.transfer(msg.sender, reward);
        
        // Burn or redistribute rest
        stakingToken.transfer(address(0xdead), slashAmount - reward);
        
        report.status = ReportStatus.Slashed;
        
        emit Disputed(reportId, msg.sender);
        emit Slashed(reportId, report.reporter, slashAmount);
    }
    
    /**
     * @notice Confirm report after dispute window (reward reporter)
     */
    function confirmReport(bytes32 reportId) external {
        AnomalyReport storage report = reports[reportId];
        require(report.status == ReportStatus.Pending, "Not pending");
        require(
            block.timestamp > report.timestamp + DISPUTE_WINDOW,
            "Dispute window active"
        );
        
        // Reward reporter for valid detection
        uint256 reward = report.stakeAtRisk * REWARD_PERCENT / 100;
        reporters[report.reporter].rewardsEarned += reward;
        stakingToken.transfer(report.reporter, reward);
        
        report.status = ReportStatus.Confirmed;
        
        emit Rewarded(reportId, report.reporter, reward);
    }
    
    function _verifyInnocenceProof(
        bytes32 agentId,
        bytes calldata proof
    ) internal view returns (bool) {
        // Verify ZK proof that agent's behavior was within normal bounds
        // Could use same zkML verifier with inverted threshold
        return zkmlVerifier.verifyInnocence(agentId, proof);
    }
}
```

### 5. Anomaly Registry

Immutable record of confirmed anomalies:

```solidity
contract AnomalyRegistry {
    struct AnomalyRecord {
        bytes32 agentId;
        uint256 anomalyScore;
        uint16 sourceChain;
        bytes32 zkmlProofHash;
        uint256 timestamp;
        address reporter;
        bool disputed;
    }
    
    // agentId => anomaly history
    mapping(bytes32 => AnomalyRecord[]) public agentAnomalies;
    
    // Global anomaly feed (for dashboard)
    AnomalyRecord[] public allAnomalies;
    
    // Stats
    mapping(bytes32 => uint256) public agentAnomalyCount;
    mapping(uint16 => uint256) public chainAnomalyCount;
    
    event AnomalyRecorded(
        bytes32 indexed agentId,
        uint256 indexed recordIndex,
        uint256 anomalyScore,
        uint16 sourceChain
    );
    
    function recordAnomaly(
        bytes32 agentId,
        uint256 anomalyScore,
        uint16 sourceChain,
        bytes32 zkmlProofHash,
        address reporter
    ) external onlyStakingContract {
        AnomalyRecord memory record = AnomalyRecord({
            agentId: agentId,
            anomalyScore: anomalyScore,
            sourceChain: sourceChain,
            zkmlProofHash: zkmlProofHash,
            timestamp: block.timestamp,
            reporter: reporter,
            disputed: false
        });
        
        uint256 index = agentAnomalies[agentId].length;
        agentAnomalies[agentId].push(record);
        allAnomalies.push(record);
        
        agentAnomalyCount[agentId]++;
        chainAnomalyCount[sourceChain]++;
        
        emit AnomalyRecorded(agentId, index, anomalyScore, sourceChain);
    }
    
    // Query functions for dashboard
    function getAgentHistory(bytes32 agentId) external view returns (AnomalyRecord[] memory) {
        return agentAnomalies[agentId];
    }
    
    function getRecentAnomalies(uint256 count) external view returns (AnomalyRecord[] memory) {
        uint256 len = allAnomalies.length;
        uint256 start = len > count ? len - count : 0;
        
        AnomalyRecord[] memory recent = new AnomalyRecord[](len - start);
        for (uint256 i = start; i < len; i++) {
            recent[i - start] = allAnomalies[i];
        }
        return recent;
    }
}
```

## Economic Model

### Staking Tiers

| Tier | Stake Required | Max Reports/Day | Slash % | Reward % |
|------|---------------|-----------------|---------|----------|
| Bronze | 100 LINK | 10 | 50% | 5% |
| Silver | 500 LINK | 50 | 40% | 8% |
| Gold | 2000 LINK | Unlimited | 30% | 12% |

### Incentive Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    ECONOMIC FLOW                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   Reporter Stakes 100 LINK                                  │
│            │                                                │
│            ▼                                                │
│   ┌─────────────────┐                                       │
│   │ Anomaly Report  │                                       │
│   │ (50 LINK at     │                                       │
│   │  risk)          │                                       │
│   └────────┬────────┘                                       │
│            │                                                │
│      ┌─────┴─────┐                                          │
│      ▼           ▼                                          │
│  ┌───────┐   ┌───────┐                                      │
│  │ TRUE  │   │ FALSE │                                      │
│  │POSITIVE   │POSITIVE│                                      │
│  └───┬───┘   └───┬───┘                                      │
│      │           │                                          │
│      ▼           ▼                                          │
│  +5 LINK     -50 LINK (slashed)                             │
│  reward          │                                          │
│                  ├──▶ 5 LINK to disputer                    │
│                  └──▶ 45 LINK burned                        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Dispute Resolution

1. **7-day window** for disputes after report
2. **Innocence proof** required (ZK proof of normal behavior)
3. **Slash on false positive**: 50% of reporter's stake
4. **Reward disputer**: 10% of slashed amount
5. **Burn remainder**: Deflationary pressure

## Deployment Plan

### Phase 4.1: Testnet (Week 1-2)
- Deploy contracts to Sepolia + Solana Devnet
- Mock Wormhole guardian (single signer)
- Dashboard integration

### Phase 4.2: Mainnet Beta (Week 3-4)
- Ethereum mainnet + Solana mainnet
- Real Wormhole guardians
- Limited staking (100 reporters cap)

### Phase 4.3: Full Launch (Week 5+)
- Add Polygon, Arbitrum, Base
- Chainlink CCIP integration
- Remove staking cap

## Contract Addresses (Testnet)

| Contract | Sepolia | Solana Devnet |
|----------|---------|---------------|
| LocalDetector | `0x...` | `...` |
| AnomalyOracle | `0x...` | N/A |
| AnomalyStaking | `0x...` | N/A |
| AnomalyRegistry | `0x...` | N/A |
| zkMLVerifier | `0x...` | N/A |

## Security Considerations

1. **Sybil Resistance**: Minimum stake prevents spam reporting
2. **Collusion**: Oracle quorum (3/5) prevents single-point manipulation
3. **Front-running**: Commit-reveal scheme for disputes
4. **zkML Soundness**: Groth16 with trusted setup (same as AAIP)
5. **Cross-chain Replay**: VAA includes chain ID and nonce

## Integration with Existing AAIP

```typescript
// backend-python/api/cross_chain_reporter.py

class CrossChainReporter:
    """Reports local anomalies to Wormhole for cross-chain propagation."""
    
    async def report_anomaly(
        self,
        anomaly: AnomalyResult,
        zkml_proof: bytes,
    ) -> str:
        """
        Package anomaly into VAA and submit to Wormhole.
        
        Returns: VAA hash for tracking
        """
        # 1. Create payload
        payload = AnomalyPayload(
            agent_id=anomaly.agent_id,
            anomaly_score=int(anomaly.anomaly_score * 1e18),
            threshold=int(anomaly.threshold * 1e18),
            zkml_proof_hash=keccak256(zkml_proof),
            flags=anomaly.flags,
            reporter=self.reporter_address,
        )
        
        # 2. Submit to Wormhole core bridge
        tx = await self.wormhole_bridge.publish_message(
            nonce=self._next_nonce(),
            payload=payload.encode(),
            consistency_level=1,  # Finalized
        )
        
        # 3. Wait for guardian signatures
        vaa = await self.wormhole_spy.get_vaa(
            emitter_chain=self.chain_id,
            emitter_address=self.bridge_address,
            sequence=tx.sequence,
        )
        
        return vaa.hash()
```

---

## Summary

Phase 4 transforms Honestly's anomaly detection from single-chain to **trustless cross-chain federation** with:

✅ **Wormhole VAAs** for secure cross-chain messaging  
✅ **Chainlink CCIP** for decentralized oracle validation  
✅ **Staking/Slashing** for economic security  
✅ **zkML proofs** for verifiable ML inference  
✅ **7-day dispute window** for false positive protection  

This creates a self-sustaining anomaly detection network where honest reporting is rewarded and malicious reporting is punished.

