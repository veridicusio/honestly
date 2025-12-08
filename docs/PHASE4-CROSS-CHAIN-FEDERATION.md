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

### 4. Staking & Slashing Contract (with Karak Restaking)

Economic incentives for honest reporting + yield on idle stakes:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import {IKarakVault} from "./interfaces/IKarakVault.sol";

contract AnomalyStaking is ReentrancyGuard {
    IERC20 public stakingToken;             // LINK
    IKarakVault public karakVault;          // Karak restaking for yield
    
    // Stake thresholds
    uint256 public constant BRONZE_STAKE = 100 ether;
    uint256 public constant SILVER_STAKE = 500 ether;
    uint256 public constant GOLD_STAKE = 2000 ether;
    
    // Economic params
    uint256 public constant SLASH_BRONZE = 50;      // 50%
    uint256 public constant SLASH_SILVER = 40;      // 40%
    uint256 public constant SLASH_GOLD = 30;        // 30%
    uint256 public constant REWARD_PERCENT = 10;    // 10% from slash pool
    uint256 public constant DISPUTE_BOND_PERCENT = 5; // 5% bond to dispute
    uint256 public constant DISPUTE_WINDOW = 7 days;
    
    // Slash pool for rewards
    uint256 public slashPool;
    
    enum Tier { None, Bronze, Silver, Gold }
    enum ReportStatus { Pending, Confirmed, Disputed, Slashed }
    enum DisputeResult { Pending, DisputerWins, ReporterWins }
    
    struct Reporter {
        uint256 stakedAmount;
        uint256 karakShares;        // Shares in Karak vault
        uint256 reportsCount;
        uint256 successfulReports;
        uint256 slashedCount;
        uint256 rewardsEarned;
        Tier tier;
        bool isRestaking;           // Opted into Karak yield
    }
    
    struct AnomalyReport {
        bytes32 agentId;
        address reporter;
        uint256 anomalyScore;
        uint256 timestamp;
        uint256 stakeAtRisk;
        ReportStatus status;
    }
    
    struct Dispute {
        bytes32 reportId;
        address disputer;
        uint256 bond;
        uint256 timestamp;
        DisputeResult result;
    }
    
    mapping(address => Reporter) public reporters;
    mapping(bytes32 => AnomalyReport) public reports;
    mapping(bytes32 => Dispute) public disputes;
    
    event Staked(address indexed reporter, uint256 amount, Tier tier);
    event Restaked(address indexed reporter, uint256 shares);
    event AnomalyReported(bytes32 indexed reportId, bytes32 agentId, address reporter);
    event DisputeOpened(bytes32 indexed reportId, address disputer, uint256 bond);
    event DisputeResolved(bytes32 indexed reportId, DisputeResult result);
    event Slashed(bytes32 indexed reportId, address reporter, uint256 amount);
    event Rewarded(address indexed recipient, uint256 amount, string reason);
    
    constructor(address _stakingToken, address _karakVault) {
        stakingToken = IERC20(_stakingToken);
        karakVault = IKarakVault(_karakVault);
    }
    
    /**
     * @notice Stake tokens to become a reporter
     * @param amount Amount of LINK to stake
     * @param enableRestaking Opt into Karak restaking for yield
     */
    function stake(uint256 amount, bool enableRestaking) external nonReentrant {
        require(amount >= BRONZE_STAKE, "Below minimum (100 LINK)");
        
        stakingToken.transferFrom(msg.sender, address(this), amount);
        
        Reporter storage r = reporters[msg.sender];
        r.stakedAmount += amount;
        r.tier = _calculateTier(r.stakedAmount);
        
        // Optional: Restake into Karak for yield
        if (enableRestaking) {
            stakingToken.approve(address(karakVault), amount);
            uint256 shares = karakVault.deposit(amount, address(this));
            r.karakShares += shares;
            r.isRestaking = true;
            emit Restaked(msg.sender, shares);
        }
        
        emit Staked(msg.sender, amount, r.tier);
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
        Reporter storage r = reporters[reporter];
        require(r.tier != Tier.None, "Reporter not staked");
        require(_canReport(reporter), "Daily limit reached");
        
        bytes32 reportId = keccak256(abi.encodePacked(
            agentId, anomalyScore, block.timestamp, reporter
        ));
        
        // Calculate stake at risk based on tier
        uint256 slashPercent = _getSlashPercent(r.tier);
        uint256 stakeAtRisk = r.stakedAmount * slashPercent / 100;
        
        reports[reportId] = AnomalyReport({
            agentId: agentId,
            reporter: reporter,
            anomalyScore: anomalyScore,
            timestamp: block.timestamp,
            stakeAtRisk: stakeAtRisk,
            status: ReportStatus.Pending
        });
        
        r.reportsCount++;
        
        emit AnomalyReported(reportId, agentId, reporter);
    }
    
    /**
     * @notice Open a dispute (requires 5% bond)
     * @param reportId The report to dispute
     */
    function openDispute(bytes32 reportId) external nonReentrant {
        AnomalyReport storage report = reports[reportId];
        require(report.status == ReportStatus.Pending, "Not disputable");
        require(
            block.timestamp <= report.timestamp + DISPUTE_WINDOW,
            "Dispute window closed"
        );
        require(disputes[reportId].disputer == address(0), "Already disputed");
        
        // Calculate and collect bond (5% of reporter's stake at risk)
        uint256 bond = report.stakeAtRisk * DISPUTE_BOND_PERCENT / 100;
        require(bond > 0, "Invalid bond");
        
        stakingToken.transferFrom(msg.sender, address(this), bond);
        
        disputes[reportId] = Dispute({
            reportId: reportId,
            disputer: msg.sender,
            bond: bond,
            timestamp: block.timestamp,
            result: DisputeResult.Pending
        });
        
        report.status = ReportStatus.Disputed;
        
        emit DisputeOpened(reportId, msg.sender, bond);
    }
    
    /**
     * @notice Resolve dispute with innocence proof
     * @param reportId The disputed report
     * @param innocenceProof ZK proof that agent was NOT anomalous
     */
    function resolveDispute(
        bytes32 reportId,
        bytes calldata innocenceProof
    ) external nonReentrant {
        AnomalyReport storage report = reports[reportId];
        Dispute storage dispute = disputes[reportId];
        
        require(report.status == ReportStatus.Disputed, "Not disputed");
        require(dispute.result == DisputeResult.Pending, "Already resolved");
        
        // Verify innocence proof via zkML verifier
        bool innocent = _verifyInnocenceProof(report.agentId, innocenceProof);
        
        if (innocent) {
            // DISPUTER WINS - Reporter was wrong
            dispute.result = DisputeResult.DisputerWins;
            
            // Slash reporter
            uint256 slashAmount = report.stakeAtRisk;
            reporters[report.reporter].stakedAmount -= slashAmount;
            reporters[report.reporter].slashedCount++;
            reporters[report.reporter].tier = _calculateTier(
                reporters[report.reporter].stakedAmount
            );
            
            // Reward disputer (10% of slashed + bond returned)
            uint256 reward = slashAmount * REWARD_PERCENT / 100;
            stakingToken.transfer(dispute.disputer, reward + dispute.bond);
            
            // Rest goes to slash pool
            slashPool += slashAmount - reward;
            
            report.status = ReportStatus.Slashed;
            
            emit Slashed(reportId, report.reporter, slashAmount);
            emit Rewarded(dispute.disputer, reward, "dispute_win");
            
        } else {
            // REPORTER WINS - Dispute failed
            dispute.result = DisputeResult.ReporterWins;
            
            // Burn disputer's bond (deflationary)
            stakingToken.transfer(address(0xdead), dispute.bond);
            
            // Reporter can claim reward after window
        }
        
        emit DisputeResolved(reportId, dispute.result);
    }
    
    /**
     * @notice Confirm report after dispute window (reward reporter)
     */
    function confirmReport(bytes32 reportId) external {
        AnomalyReport storage report = reports[reportId];
        require(
            report.status == ReportStatus.Pending || 
            (report.status == ReportStatus.Disputed && 
             disputes[reportId].result == DisputeResult.ReporterWins),
            "Cannot confirm"
        );
        require(
            block.timestamp > report.timestamp + DISPUTE_WINDOW,
            "Dispute window active"
        );
        
        // Reward reporter from slash pool
        uint256 reward = report.stakeAtRisk * REWARD_PERCENT / 100;
        if (reward > slashPool) reward = slashPool;
        
        if (reward > 0) {
            slashPool -= reward;
            reporters[report.reporter].rewardsEarned += reward;
            reporters[report.reporter].successfulReports++;
            stakingToken.transfer(report.reporter, reward);
            
            emit Rewarded(report.reporter, reward, "true_positive");
        }
        
        report.status = ReportStatus.Confirmed;
    }
    
    /**
     * @notice Claim Karak restaking yield
     */
    function claimYield() external nonReentrant {
        Reporter storage r = reporters[msg.sender];
        require(r.isRestaking && r.karakShares > 0, "Not restaking");
        
        uint256 yield = karakVault.claimYield(r.karakShares);
        if (yield > 0) {
            stakingToken.transfer(msg.sender, yield);
            emit Rewarded(msg.sender, yield, "karak_yield");
        }
    }
    
    // === View Functions ===
    
    function _calculateTier(uint256 amount) internal pure returns (Tier) {
        if (amount >= GOLD_STAKE) return Tier.Gold;
        if (amount >= SILVER_STAKE) return Tier.Silver;
        if (amount >= BRONZE_STAKE) return Tier.Bronze;
        return Tier.None;
    }
    
    function _getSlashPercent(Tier tier) internal pure returns (uint256) {
        if (tier == Tier.Gold) return SLASH_GOLD;
        if (tier == Tier.Silver) return SLASH_SILVER;
        return SLASH_BRONZE;
    }
    
    function _canReport(address reporter) internal view returns (bool) {
        Reporter storage r = reporters[reporter];
        // Gold = unlimited, Silver = 50/day, Bronze = 10/day
        // Simplified: check tier
        return r.tier != Tier.None;
    }
    
    function _verifyInnocenceProof(
        bytes32 agentId,
        bytes calldata proof
    ) internal view returns (bool) {
        return zkmlVerifier.verifyInnocence(agentId, proof);
    }
    
    function getReporterInfo(address reporter) external view returns (
        uint256 stakedAmount,
        Tier tier,
        uint256 reportsCount,
        uint256 successfulReports,
        uint256 slashedCount,
        uint256 rewardsEarned,
        bool isRestaking
    ) {
        Reporter storage r = reporters[reporter];
        return (
            r.stakedAmount,
            r.tier,
            r.reportsCount,
            r.successfulReports,
            r.slashedCount,
            r.rewardsEarned,
            r.isRestaking
        );
    }
}
```

### Karak Vault Interface

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

interface IKarakVault {
    /// @notice Deposit LINK for restaking yield
    function deposit(uint256 amount, address onBehalfOf) external returns (uint256 shares);
    
    /// @notice Withdraw staked LINK
    function withdraw(uint256 shares, address to) external returns (uint256 amount);
    
    /// @notice Claim accumulated yield
    function claimYield(uint256 shares) external returns (uint256 yield);
    
    /// @notice Get current APY (scaled by 1e18)
    function getCurrentAPY() external view returns (uint256);
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

### Event Outcomes

| Event | Result | Notes |
|-------|--------|-------|
| **True Positive** | +10% from slash pool | Chainlink off-chain resolvers confirm—feeds into registry for immutable cred |
| **False Positive** | -50% stake slashed | Oracle auto-triggers; funds pool for TPs |
| **Dispute (Win)** | +10% slashed + bond back | Disputer submits zkML innocence proof—resolves in <60s via CCIP |
| **Dispute (Lose)** | -100% bond burned | Deflationary hammer—LINK supply shrinks, value up |
| **Restake Bonus** | +2-5% APY via Karak | Idle stakes compound; claimable quarterly to avoid gas wars |

### Staking Tiers (with Risk/Reward Analysis)

| Tier | Stake (LINK) | Slash % | APY | R/R Ratio | Insight |
|------|-------------|---------|-----|-----------|---------|
| 🥉 Bronze | 100 | 50% | 2% | **25:1** `(50÷2)` | High risk entry—perfect for testing waters |
| 🥈 Silver | 500 | 40% | 3.5% | **11:1** `(40÷3.5≈11.4)` | Balanced sweet spot—∞ disputes reward active reporters |
| 🥇 Gold | 2000 | 30% | 5%+ | **6:1** `(30÷5)` | Pro tier jackpot—priority slots + 4x better returns than Bronze |

### R/R Calculation Explainer

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     RISK/REWARD RATIO FORMULA                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│                         Slash %                                             │
│         R/R Ratio = ─────────────                                           │
│                          APY                                                │
│                                                                             │
│   ───────────────────────────────────────────────────────────────────────   │
│                                                                             │
│   BRONZE:  50% ÷ 2%   = 25:1   →  "25 units pain per 1% gain"              │
│   SILVER:  40% ÷ 3.5% = 11:1   →  "11 units pain per 1% gain"              │
│   GOLD:    30% ÷ 5%   =  6:1   →  "6 units pain per 1% gain"               │
│                                                                             │
│   ───────────────────────────────────────────────────────────────────────   │
│                                                                             │
│   INTERPRETATION:                                                           │
│   • Lower ratio = Better risk-adjusted returns                              │
│   • Gold has 4x better hedge than Bronze (6:1 vs 25:1)                     │
│   • "Pain per point of gain" — how much slash exposure per yield unit      │
│                                                                             │
│   ───────────────────────────────────────────────────────────────────────   │
│                                                                             │
│   DYNAMIC TUNING:                                                           │
│   • APY adjusts via Karak feeds for market-fit                             │
│   • Bull market: Lower APY (demand high) → R/R increases                   │
│   • Bear market: Higher APY (attract liquidity) → R/R decreases            │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

> **Why This Matters**: Professional reporters gravitate to Gold because the math compounds—lower slash risk + higher yield = sustainable income stream. Bronze is "tuition" tier where new reporters learn without catastrophic loss.

### Why This Model Works

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        ECONOMIC FLYWHEEL                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   ┌──────────────┐                                                          │
│   │ STAKERS      │                                                          │
│   │ stake LINK   │─────────────────────┐                                    │
│   └──────┬───────┘                     │                                    │
│          │                             ▼                                    │
│          │                    ┌────────────────┐                            │
│          │                    │  KARAK VAULT   │                            │
│          │                    │  +2-5% APY     │                            │
│          │                    └────────┬───────┘                            │
│          │                             │                                    │
│          ▼                             │ (quarterly claim)                  │
│   ┌──────────────┐                     │                                    │
│   │ REPORTERS    │◄────────────────────┘                                    │
│   │ detect       │                                                          │
│   │ anomalies    │                                                          │
│   └──────┬───────┘                                                          │
│          │                                                                  │
│    ┌─────┴─────┐                                                            │
│    ▼           ▼                                                            │
│  ┌────┐     ┌────┐                                                          │
│  │ TP │     │ FP │                                                          │
│  └──┬─┘     └──┬─┘                                                          │
│     │          │                                                            │
│     ▼          ▼                                                            │
│  +10%       -50%                                                            │
│  reward     slashed ────────────────────────┐                               │
│     │                                       ▼                               │
│     │                              ┌────────────────┐                       │
│     │                              │  SLASH POOL    │                       │
│     │                              │  (funds TPs)   │                       │
│     │                              └────────┬───────┘                       │
│     │                                       │                               │
│     └───────────────────────────────────────┘                               │
│                                                                             │
│   DISPUTERS ──▶ 5% bond ──▶ WIN: +10% + bond | LOSE: bond burned 🔥        │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Key Insights

| Metric | Value | Why It Matters |
|--------|-------|----------------|
| **Dispute Bond** | 5% stake | Prevents spam; Wormhole Guardian model |
| **Resolution Time** | <60s | CCIP fast-finality for UX |
| **Claim Period** | Quarterly | Batches gas, rewards patience |
| **Burn on Lose** | 100% bond | Deflationary pressure on LINK |
| **Gold Priority** | Oracle slots | Incentivizes upgrade path |

### Incentive Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           ECONOMIC FLOW                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   Reporter Stakes 100 LINK ────────────────────┐                            │
│            │                                   │                            │
│            │                          ┌────────▼────────┐                   │
│            │                          │  KARAK RESTAKE  │                   │
│            │                          │  +2-5% APY      │                   │
│            │                          └────────┬────────┘                   │
│            ▼                                   │                            │
│   ┌─────────────────┐                          │                            │
│   │ Anomaly Report  │◄─────────────────────────┘                            │
│   │ (50 LINK at     │                                                       │
│   │  risk)          │                                                       │
│   └────────┬────────┘                                                       │
│            │                                                                │
│      ┌─────┴─────┐                                                          │
│      ▼           ▼                                                          │
│  ┌───────┐   ┌───────┐                                                      │
│  │ TRUE  │   │ FALSE │                                                      │
│  │POSITIVE   │POSITIVE│                                                      │
│  └───┬───┘   └───┬───┘                                                      │
│      │           │                                                          │
│      ▼           ▼                                                          │
│  +10 LINK    -50 LINK (slashed to pool)                                     │
│  from pool        │                                                         │
│                   │        ┌─────────────────┐                              │
│                   │        │    DISPUTE?     │                              │
│                   │        │ (5% bond req'd) │                              │
│                   │        └────────┬────────┘                              │
│                   │           ┌─────┴─────┐                                 │
│                   │           ▼           ▼                                 │
│                   │       ┌───────┐   ┌───────┐                             │
│                   │       │ WIN   │   │ LOSE  │                             │
│                   │       └───┬───┘   └───┬───┘                             │
│                   │           │           │                                 │
│                   │           ▼           ▼                                 │
│                   │     +10% slashed   -100% bond                           │
│                   │     to disputer    (burned)                             │
│                   │           │                                             │
│                   └───────────┴──────────────────────────▶ SLASH POOL       │
│                                                             (rewards +      │
│                                                              burns)         │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Dispute Resolution

1. **7-day window** for disputes after report
2. **5% bond required** to open dispute (prevents spam)
3. **Innocence proof** required (ZK proof of normal behavior)
4. **If disputer wins**: +10% of slashed amount, bond returned
5. **If disputer loses**: Bond burned (deflationary)
6. **Auto-slash**: Oracle consensus on invalid zkML triggers immediate slash

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

