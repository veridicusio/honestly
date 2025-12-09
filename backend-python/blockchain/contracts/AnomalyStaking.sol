// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title AnomalyStaking
 * @notice Economic incentives for honest anomaly reporting with Karak restaking
 * @dev Staking tiers, slashing, rewards, and dispute resolution
 */
interface IKarakVault {
    function deposit(uint256 amount, address onBehalfOf) external returns (uint256 shares);
    function withdraw(uint256 shares, address to) external returns (uint256 amount);
    function claimYield(uint256 shares) external returns (uint256 yield);
    function getCurrentAPY() external view returns (uint256);
}

interface IZkMLVerifier {
    function verifyInnocence(
        bytes32 agentId,
        bytes calldata proof
    ) external view returns (bool);
}

contract AnomalyStaking is ReentrancyGuard, Ownable {
    IERC20 public stakingToken;             // LINK
    IKarakVault public karakVault;          // Karak restaking for yield
    IZkMLVerifier public zkmlVerifier;      // zkML verifier for innocence proofs
    
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
    
    address public anomalyRegistry;  // Only registry can record anomalies
    
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
        uint256 lastReportTimestamp; // For daily limits
        uint256 reportsToday;        // Daily report counter
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
    
    modifier onlyRegistry() {
        require(msg.sender == anomalyRegistry, "Only registry");
        _;
    }
    
    constructor(address _stakingToken, address _karakVault, address _zkmlVerifier) Ownable(msg.sender) {
        stakingToken = IERC20(_stakingToken);
        karakVault = IKarakVault(_karakVault);
        zkmlVerifier = IZkMLVerifier(_zkmlVerifier);
    }
    
    function setZkMLVerifier(address _zkmlVerifier) external onlyOwner {
        zkmlVerifier = IZkMLVerifier(_zkmlVerifier);
    }
    
    function setRegistry(address _registry) external onlyOwner {
        anomalyRegistry = _registry;
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
     * @notice Unstake tokens (with cooldown for active reporters)
     */
    function unstake(uint256 amount) external nonReentrant {
        Reporter storage r = reporters[msg.sender];
        require(r.stakedAmount >= amount, "Insufficient stake");
        
        // Check for pending reports (can't unstake if reports pending)
        // Simplified: allow unstaking if no reports in last 7 days
        require(
            block.timestamp > r.lastReportTimestamp + DISPUTE_WINDOW,
            "Cooldown active"
        );
        
        r.stakedAmount -= amount;
        r.tier = _calculateTier(r.stakedAmount);
        
        // Withdraw from Karak if restaking
        if (r.isRestaking && r.karakShares > 0) {
            uint256 sharesToWithdraw = (amount * r.karakShares) / (r.stakedAmount + amount);
            karakVault.withdraw(sharesToWithdraw, msg.sender);
            r.karakShares -= sharesToWithdraw;
        }
        
        stakingToken.transfer(msg.sender, amount);
    }
    
    /**
     * @notice Record an anomaly (called by registry after oracle confirmation)
     */
    function recordAnomaly(
        bytes32 agentId,
        uint256 anomalyScore,
        uint16 sourceChain,
        address reporter
    ) external onlyRegistry {
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
        r.lastReportTimestamp = block.timestamp;
        r.reportsToday++;
        
        emit AnomalyReported(reportId, agentId, reporter);
    }
    
    /**
     * @notice Open a dispute (requires 5% bond)
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
        // This would call the verifier contract
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
            // In practice, transfer to burn address
            stakingToken.transfer(address(0xdead), dispute.bond);
        }
        
        emit DisputeResolved(reportId, dispute.result);
    }
    
    /**
     * @notice Confirm report after dispute window (reward reporter)
     */
    function confirmReport(bytes32 reportId) external nonReentrant {
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
        
        // Reset daily counter if new day
        if (block.timestamp > r.lastReportTimestamp + 1 days) {
            return true; // Can report, counter will reset
        }
        
        // Check daily limits based on tier
        if (r.tier == Tier.Gold) return true; // Unlimited
        if (r.tier == Tier.Silver) return r.reportsToday < 50;
        if (r.tier == Tier.Bronze) return r.reportsToday < 10;
        
        return false;
    }
    
    function _verifyInnocenceProof(
        bytes32 agentId,
        bytes calldata proof
    ) internal view returns (bool) {
        if (address(zkmlVerifier) == address(0)) {
            return false; // No verifier set, default to not innocent
        }
        return zkmlVerifier.verifyInnocence(agentId, proof);
    }
    
    function getReporterInfo(address reporter) external view returns (
        uint256 stakedAmount,
        Tier tier,
        uint256 reportsCount,
        uint256 successfulReports,
        uint256 slashedCount,
        uint256 rewardsEarned,
        bool isRestaking,
        uint256 karakShares
    ) {
        Reporter storage r = reporters[reporter];
        return (
            r.stakedAmount,
            r.tier,
            r.reportsCount,
            r.successfulReports,
            r.slashedCount,
            r.rewardsEarned,
            r.isRestaking,
            r.karakShares
        );
    }
    
    function getReportInfo(bytes32 reportId) external view returns (
        bytes32 agentId,
        address reporter,
        uint256 anomalyScore,
        uint256 timestamp,
        uint256 stakeAtRisk,
        ReportStatus status
    ) {
        AnomalyReport storage report = reports[reportId];
        return (
            report.agentId,
            report.reporter,
            report.anomalyScore,
            report.timestamp,
            report.stakeAtRisk,
            report.status
        );
    }
}

