// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title LocalDetector
 * @notice Chain-native anomaly detector interface
 * @dev Deployed on each supported chain (Ethereum, Solana, Polygon, etc.)
 */
contract LocalDetector is Ownable {
    // Only authorized ML service can report
    mapping(address => bool) public authorizedReporters;
    
    // Anomaly detection events
    event AnomalyDetected(
        bytes32 indexed agentId,
        uint256 anomalyScore,      // Scaled by 1e18
        uint256 threshold,
        bytes32 zkmlProofHash,     // Hash of zkML proof
        string[] flags,
        address reporter
    );
    
    event ReporterAuthorized(address indexed reporter);
    event ReporterRevoked(address indexed reporter);
    
    modifier onlyAuthorized() {
        require(authorizedReporters[msg.sender], "Not authorized");
        _;
    }
    
    constructor() Ownable(msg.sender) {}
    
    /**
     * @notice Authorize an ML service to report anomalies
     */
    function authorizeReporter(address reporter) external onlyOwner {
        authorizedReporters[reporter] = true;
        emit ReporterAuthorized(reporter);
    }
    
    /**
     * @notice Revoke reporter authorization
     */
    function revokeReporter(address reporter) external onlyOwner {
        authorizedReporters[reporter] = false;
        emit ReporterRevoked(reporter);
    }
    
    /**
     * @notice Report an anomaly detected by ML service
     * @dev Called by off-chain ML service with zkML proof hash
     */
    function reportAnomaly(
        bytes32 agentId,
        uint256 anomalyScore,
        uint256 threshold,
        bytes32 zkmlProofHash,
        string[] calldata flags
    ) external onlyAuthorized {
        require(anomalyScore >= threshold, "Below threshold");
        
        emit AnomalyDetected(
            agentId,
            anomalyScore,
            threshold,
            zkmlProofHash,
            flags,
            msg.sender
        );
    }
}

