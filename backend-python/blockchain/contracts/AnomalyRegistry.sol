// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title AnomalyRegistry
 * @notice Immutable record of confirmed anomalies across all chains
 * @dev Stores anomaly history for agents and provides query functions
 */
contract AnomalyRegistry is Ownable {
    struct AnomalyRecord {
        bytes32 agentId;
        uint256 anomalyScore;      // Scaled by 1e18
        uint16 sourceChain;
        bytes32 zkmlProofHash;
        uint256 timestamp;
        address reporter;
        bool disputed;
        bytes32 reportId;          // Link to staking contract
    }
    
    // agentId => anomaly history
    mapping(bytes32 => AnomalyRecord[]) public agentAnomalies;
    
    // Global anomaly feed (for dashboard)
    AnomalyRecord[] public allAnomalies;
    
    // Stats
    mapping(bytes32 => uint256) public agentAnomalyCount;
    mapping(uint16 => uint256) public chainAnomalyCount;
    mapping(address => uint256) public reporterAnomalyCount;
    
    // Only staking contract can record (after oracle confirmation)
    address public stakingContract;
    
    event AnomalyRecorded(
        bytes32 indexed agentId,
        uint256 indexed recordIndex,
        uint256 anomalyScore,
        uint16 sourceChain,
        address reporter
    );
    
    event AnomalyDisputed(
        bytes32 indexed agentId,
        uint256 indexed recordIndex
    );
    
    modifier onlyStaking() {
        require(msg.sender == stakingContract, "Only staking contract");
        _;
    }
    
    constructor() Ownable(msg.sender) {}
    
    function setStakingContract(address _staking) external onlyOwner {
        stakingContract = _staking;
    }
    
    /**
     * @notice Record a confirmed anomaly
     * @dev Called by staking contract after oracle confirmation
     */
    function recordAnomaly(
        bytes32 agentId,
        uint256 anomalyScore,
        uint16 sourceChain,
        bytes32 zkmlProofHash,
        address reporter
    ) external onlyStaking returns (uint256) {
        bytes32 reportId = keccak256(abi.encodePacked(
            agentId, anomalyScore, block.timestamp, reporter
        ));
        
        AnomalyRecord memory record = AnomalyRecord({
            agentId: agentId,
            anomalyScore: anomalyScore,
            sourceChain: sourceChain,
            zkmlProofHash: zkmlProofHash,
            timestamp: block.timestamp,
            reporter: reporter,
            disputed: false,
            reportId: reportId
        });
        
        uint256 index = agentAnomalies[agentId].length;
        agentAnomalies[agentId].push(record);
        allAnomalies.push(record);
        
        agentAnomalyCount[agentId]++;
        chainAnomalyCount[sourceChain]++;
        reporterAnomalyCount[reporter]++;
        
        emit AnomalyRecorded(agentId, index, anomalyScore, sourceChain, reporter);
        
        return index;
    }
    
    /**
     * @notice Mark anomaly as disputed
     */
    function markDisputed(
        bytes32 agentId,
        uint256 recordIndex
    ) external onlyStaking {
        require(recordIndex < agentAnomalies[agentId].length, "Invalid index");
        agentAnomalies[agentId][recordIndex].disputed = true;
        
        // Also update in global array (find by agentId + timestamp)
        for (uint256 i = 0; i < allAnomalies.length; i++) {
            if (allAnomalies[i].agentId == agentId && 
                allAnomalies[i].timestamp == agentAnomalies[agentId][recordIndex].timestamp) {
                allAnomalies[i].disputed = true;
                break;
            }
        }
        
        emit AnomalyDisputed(agentId, recordIndex);
    }
    
    // === Query Functions ===
    
    /**
     * @notice Get anomaly history for an agent
     */
    function getAgentHistory(bytes32 agentId) external view returns (AnomalyRecord[] memory) {
        return agentAnomalies[agentId];
    }
    
    /**
     * @notice Get recent anomalies (for dashboard)
     */
    function getRecentAnomalies(uint256 count) external view returns (AnomalyRecord[] memory) {
        uint256 len = allAnomalies.length;
        uint256 start = len > count ? len - count : 0;
        
        AnomalyRecord[] memory recent = new AnomalyRecord[](len - start);
        for (uint256 i = start; i < len; i++) {
            recent[i - start] = allAnomalies[i];
        }
        return recent;
    }
    
    /**
     * @notice Get anomaly count for an agent
     */
    function getAgentAnomalyCount(bytes32 agentId) external view returns (uint256) {
        return agentAnomalyCount[agentId];
    }
    
    /**
     * @notice Get anomaly count for a chain
     */
    function getChainAnomalyCount(uint16 chainId) external view returns (uint256) {
        return chainAnomalyCount[chainId];
    }
    
    /**
     * @notice Get total anomalies
     */
    function getTotalAnomalies() external view returns (uint256) {
        return allAnomalies.length;
    }
    
    /**
     * @notice Get reporter's anomaly count
     */
    function getReporterCount(address reporter) external view returns (uint256) {
        return reporterAnomalyCount[reporter];
    }
}

