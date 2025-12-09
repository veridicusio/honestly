// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {CCIPReceiver} from "@chainlink/contracts-ccip/src/v0.8/ccip/applications/CCIPReceiver.sol";
import {Client} from "@chainlink/contracts-ccip/src/v0.8/ccip/libraries/Client.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title AnomalyOracle
 * @notice Validates Wormhole VAAs and zkML proofs for cross-chain anomaly detection
 * @dev Uses Chainlink CCIP for cross-chain messaging and oracle validation
 */
interface IWormhole {
    struct VM {
        uint8 version;
        uint32 timestamp;
        uint32 nonce;
        uint16 emitterChainId;
        bytes32 emitterAddress;
        uint64 sequence;
        uint8 consistencyLevel;
        bytes payload;
        uint32 guardianSetIndex;
        GuardianSignature[] signatures;
        bytes32 hash;
    }
    
    struct GuardianSignature {
        bytes32 r;
        bytes32 s;
        uint8 v;
        uint8 guardianIndex;
    }
    
    function parseAndVerifyVM(bytes calldata encodedVM) external view returns (VM memory vm, bool valid, string memory reason);
}

interface IZkMLVerifier {
    function verifyProof(
        bytes calldata proof,
        uint256[] calldata publicInputs
    ) external view returns (bool);
    
    function verifyInnocence(
        bytes32 agentId,
        bytes calldata proof
    ) external view returns (bool);
}

interface IAnomalyRegistry {
    function recordAnomaly(
        bytes32 agentId,
        uint256 anomalyScore,
        uint16 sourceChain,
        bytes32 zkmlProofHash,
        address reporter
    ) external;
}

struct AnomalyPayload {
    bytes32 agentId;
    uint256 anomalyScore;      // Scaled by 1e18
    uint256 threshold;
    bytes32 zkmlProofHash;
    string[] flags;
    uint256 timestamp;
    address reporterAddress;
}

contract AnomalyOracle is CCIPReceiver, ReentrancyGuard, Ownable {
    IWormhole public wormhole;
    IZkMLVerifier public zkmlVerifier;
    IAnomalyRegistry public anomalyRegistry;
    
    // Minimum guardian signatures for VAA
    uint8 public constant MIN_GUARDIANS = 13;
    
    // Oracle threshold voting
    uint256 public constant ORACLE_QUORUM = 3;
    mapping(bytes32 => uint256) public voteCount;
    mapping(bytes32 => mapping(address => bool)) public hasVoted;
    mapping(address => bool) public authorizedOracles;
    
    // VAA tracking
    mapping(bytes32 => bool) public processedVAAs;
    
    event VAAValidated(
        bytes32 indexed vaaHash,
        uint16 sourceChain,
        bytes32 agentId,
        bool zkmlValid
    );
    
    event AnomalyConfirmed(
        bytes32 indexed agentId,
        uint256 anomalyScore,
        uint16 sourceChain,
        address reporter
    );
    
    event OracleVote(
        bytes32 indexed vaaHash,
        address oracle,
        bool zkmlValid
    );
    
    event OracleAuthorized(address indexed oracle);
    event OracleRevoked(address indexed oracle);
    
    constructor(
        address _router,
        address _wormhole,
        address _zkmlVerifier,
        address _anomalyRegistry
    ) CCIPReceiver(_router) Ownable(msg.sender) {
        wormhole = IWormhole(_wormhole);
        zkmlVerifier = IZkMLVerifier(_zkmlVerifier);
        anomalyRegistry = IAnomalyRegistry(_anomalyRegistry);
    }
    
    /**
     * @notice Authorize an oracle node
     */
    function authorizeOracle(address oracle) external onlyOwner {
        authorizedOracles[oracle] = true;
        emit OracleAuthorized(oracle);
    }
    
    /**
     * @notice Revoke oracle authorization
     */
    function revokeOracle(address oracle) external onlyOwner {
        authorizedOracles[oracle] = false;
        emit OracleRevoked(oracle);
    }
    
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
    ) external nonReentrant {
        require(authorizedOracles[msg.sender], "Not authorized oracle");
        
        bytes32 vaaHash = keccak256(vaa);
        require(!processedVAAs[vaaHash], "VAA already processed");
        
        // 1. Parse and verify VAA signatures
        (IWormhole.VM memory vm, bool valid, string memory reason) = wormhole.parseAndVerifyVM(vaa);
        require(valid, string(abi.encodePacked("Invalid VAA: ", reason)));
        require(vm.signatures.length >= MIN_GUARDIANS, "Insufficient guardians");
        
        // 2. Decode anomaly payload
        AnomalyPayload memory payload = abi.decode(vm.payload, (AnomalyPayload));
        
        // 3. Verify zkML proof matches claimed hash
        bytes32 proofHash = keccak256(zkmlProof);
        require(proofHash == payload.zkmlProofHash, "Proof hash mismatch");
        
        // 4. Verify zkML Groth16 proof
        bool zkmlValid = zkmlVerifier.verifyProof(zkmlProof, publicInputs);
        
        emit VAAValidated(vaaHash, vm.emitterChainId, payload.agentId, zkmlValid);
        emit OracleVote(vaaHash, msg.sender, zkmlValid);
        
        // 5. Oracle vote (requires ORACLE_QUORUM confirmations)
        if (zkmlValid && !hasVoted[vaaHash][msg.sender]) {
            hasVoted[vaaHash][msg.sender] = true;
            voteCount[vaaHash]++;
            
            if (voteCount[vaaHash] >= ORACLE_QUORUM) {
                processedVAAs[vaaHash] = true;
                _confirmAnomaly(payload, vm.emitterChainId);
            }
        }
    }
    
    /**
     * @notice Handle CCIP message (for cross-chain oracle coordination)
     */
    function _ccipReceive(Client.Any2EVMMessage memory message) internal override {
        // Decode message from other chain's oracle
        // This allows oracle coordination across chains
        // Implementation depends on CCIP message format
    }
    
    function _confirmAnomaly(
        AnomalyPayload memory payload,
        uint16 sourceChain
    ) internal {
        // Write to registry, trigger staking rewards/slashes
        anomalyRegistry.recordAnomaly(
            payload.agentId,
            payload.anomalyScore,
            sourceChain,
            payload.zkmlProofHash,
            payload.reporterAddress
        );
        
        emit AnomalyConfirmed(
            payload.agentId,
            payload.anomalyScore,
            sourceChain,
            payload.reporterAddress
        );
    }
    
    /**
     * @notice Get vote count for a VAA
     */
    function getVoteCount(bytes32 vaaHash) external view returns (uint256) {
        return voteCount[vaaHash];
    }
    
    /**
     * @notice Check if VAA has been processed
     */
    function isProcessed(bytes32 vaaHash) external view returns (bool) {
        return processedVAAs[vaaHash];
    }
}

