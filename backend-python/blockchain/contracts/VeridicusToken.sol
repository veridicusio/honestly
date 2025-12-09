// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {ERC20Votes} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Votes.sol";
import {ERC20Permit} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import {Nonces} from "@openzeppelin/contracts/utils/Nonces.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title VERIDICUSToken
 * @notice VERIDICUS - Governance and utility token for Honestly protocol
 * @dev Mission-driven token: Change the world, not just make money
 * 
 * Features:
 * - Governance voting (ERC20Votes)
 * - Quantum computing access (burn for compute)
 * - Fee discounts (hold for staking discounts)
 * - Community rewards (mint to contributors)
 * - Open source grants (treasury distribution)
 * 
 * Total Supply: 1,000,000 VERIDICUS (1M - small, focused)
 * 
 * Distribution:
 * - 60% Community Rewards (600K)
 * - 30% Protocol Treasury (300K)
 * - 10% Team (100K, 4-year vesting)
 * 
 * Philosophy:
 * - No initial sale (Phase 4)
 * - Mission-first, profit-second
 * - Option to sell later if needed for growth (governance decides)
 */
contract VERIDICUSToken is ERC20, ERC20Votes, ERC20Permit, Nonces, Ownable {
    uint256 public constant MAX_SUPPLY = 1_000_000 * 10**18; // 1M tokens
    
    // Treasury address (for grants and future sales)
    address public treasury;
    
    // Quantum computing gateway (burns tokens for compute)
    address public quantumGateway;
    
    // Fee discount thresholds
    uint256 public constant DISCOUNT_THRESHOLD_1 = 1_000 * 10**18;  // 1K VERIDICUS = 10% discount
    uint256 public constant DISCOUNT_THRESHOLD_2 = 5_000 * 10**18;  // 5K VERIDICUS = 25% discount
    uint256 public constant DISCOUNT_THRESHOLD_3 = 20_000 * 10**18; // 20K VERIDICUS = 50% discount
    
    // Quantum compute pricing (in VERIDICUS)
    uint256 public constant ZKML_PROOF_COST = 10 * 10**18;      // 10 VERIDICUS
    uint256 public constant CIRCUIT_OPTIMIZE_COST = 5 * 10**18; // 5 VERIDICUS
    uint256 public constant ANOMALY_DETECT_COST = 20 * 10**18;  // 20 VERIDICUS
    uint256 public constant SECURITY_AUDIT_COST = 50 * 10**18;  // 50 VERIDICUS
    
    // Events
    event TokensMinted(address indexed to, uint256 amount, string reason);
    event TokensBurned(address indexed from, uint256 amount, string reason);
    event QuantumComputePaid(address indexed user, uint256 amount, string jobType);
    event TreasuryUpdated(address indexed oldTreasury, address indexed newTreasury);
    event QuantumGatewayUpdated(address indexed oldGateway, address indexed newGateway);
    
    // Minters (for community rewards)
    mapping(address => bool) public minters;
    
    modifier onlyMinter() {
        require(minters[msg.sender] || msg.sender == owner(), "Not authorized minter");
        _;
    }
    
    modifier onlyQuantumGateway() {
        require(msg.sender == quantumGateway, "Only quantum gateway");
        _;
    }
    
    constructor(address _treasury) 
        ERC20("VERIDICUS", "VERIDICUS")
        ERC20Permit("VERIDICUS")
        Ownable(msg.sender)
    {
        treasury = _treasury;
        
        // Mint initial supply to treasury for distribution
        // 600K to community rewards pool
        // 300K to treasury
        // 100K to team (vested)
        
        _mint(_treasury, 900_000 * 10**18); // 900K to treasury for distribution
        // Remaining 100K will be minted to team with vesting
        
        emit TokensMinted(_treasury, 900_000 * 10**18, "Initial treasury allocation");
    }
    
    /**
     * @notice Set treasury address
     */
    function setTreasury(address _treasury) external onlyOwner {
        address oldTreasury = treasury;
        treasury = _treasury;
        emit TreasuryUpdated(oldTreasury, _treasury);
    }
    
    /**
     * @notice Set quantum gateway address
     */
    function setQuantumGateway(address _gateway) external onlyOwner {
        address oldGateway = quantumGateway;
        quantumGateway = _gateway;
        emit QuantumGatewayUpdated(oldGateway, _gateway);
    }
    
    /**
     * @notice Authorize a minter (for community rewards)
     */
    function addMinter(address minter) external onlyOwner {
        minters[minter] = true;
    }
    
    /**
     * @notice Revoke minter authorization
     */
    function removeMinter(address minter) external onlyOwner {
        minters[minter] = false;
    }
    
    /**
     * @notice Mint tokens (for community rewards, grants, etc.)
     * @dev Can only mint up to MAX_SUPPLY
     */
    function mint(address to, uint256 amount, string calldata reason) external onlyMinter {
        require(totalSupply() + amount <= MAX_SUPPLY, "Exceeds max supply");
        _mint(to, amount);
        emit TokensMinted(to, amount, reason);
    }
    
    /**
     * @notice Burn tokens (for quantum compute, deflationary)
     * @dev Called by quantum gateway when user pays for compute
     */
    function burnForQuantumCompute(
        address from,
        uint256 amount,
        string calldata jobType
    ) external onlyQuantumGateway {
        _burn(from, amount);
        emit TokensBurned(from, amount, "quantum_compute");
        emit QuantumComputePaid(from, amount, jobType);
    }
    
    /**
     * @notice Get fee discount percentage based on VERIDICUS balance
     * @param holder Address to check
     * @return discount Discount percentage (0-50)
     */
    function getFeeDiscount(address holder) external view returns (uint256) {
        uint256 balance = balanceOf(holder);
        
        if (balance >= DISCOUNT_THRESHOLD_3) return 50; // 50% discount
        if (balance >= DISCOUNT_THRESHOLD_2) return 25; // 25% discount
        if (balance >= DISCOUNT_THRESHOLD_1) return 10; // 10% discount
        
        return 0; // No discount
    }
    
    /**
     * @notice Check if address qualifies for discount
     */
    function hasDiscount(address holder) external view returns (bool) {
        return balanceOf(holder) >= DISCOUNT_THRESHOLD_1;
    }
    
    /**
     * @notice Get quantum compute cost for a job type
     * @param jobType Type of quantum job
     * @return cost Cost in VERIDICUS
     */
    function getQuantumComputeCost(string calldata jobType) external pure returns (uint256) {
        bytes32 jobHash = keccak256(bytes(jobType));
        
        if (jobHash == keccak256(bytes("zkml_proof"))) {
            return ZKML_PROOF_COST;
        } else if (jobHash == keccak256(bytes("circuit_optimize"))) {
            return CIRCUIT_OPTIMIZE_COST;
        } else if (jobHash == keccak256(bytes("anomaly_detect"))) {
            return ANOMALY_DETECT_COST;
        } else if (jobHash == keccak256(bytes("security_audit"))) {
            return SECURITY_AUDIT_COST;
        }
        
        revert("Unknown job type");
    }
    
    /**
     * @notice Override to support snapshot voting
     */
    function _update(address from, address to, uint256 value)
        internal
        override(ERC20, ERC20Votes)
    {
        super._update(from, to, value);
    }
    
    /**
     * @notice Nonces for permit
     */
    function nonces(address owner)
        public
        view
        override(ERC20Permit, Nonces)
        returns (uint256)
    {
        return super.nonces(owner);
    }
}

