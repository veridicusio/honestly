/**
 * Phase 4: Cross-Chain Anomaly Federation Deployment
 * 
 * Deploys all contracts for cross-chain anomaly detection:
 * - LocalDetector (on each chain)
 * - AnomalyOracle (Ethereum mainnet)
 * - AnomalyStaking (Ethereum mainnet)
 * - AnomalyRegistry (Ethereum mainnet)
 * - zkMLVerifier (Ethereum mainnet)
 */

const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  console.log("Account balance:", (await ethers.provider.getBalance(deployer.address)).toString());

  // Configuration
  const STAKING_TOKEN = process.env.STAKING_TOKEN || "0x514910771AF9Ca656af840dff83E8264EcF986CA"; // LINK
  const KARAK_VAULT = process.env.KARAK_VAULT || "0x0000000000000000000000000000000000000000"; // Set in production
  const WORMHOLE = process.env.WORMHOLE || "0x98f3c9e6E3fAce36bAad05FE09d375Ef1464288B"; // Wormhole mainnet
  const CCIP_ROUTER = process.env.CCIP_ROUTER || "0x0000000000000000000000000000000000000000"; // Set in production

  console.log("\n=== Deploying Phase 4 Contracts ===\n");

  // 1. Deploy LocalDetector (for this chain)
  console.log("1. Deploying LocalDetector...");
  const LocalDetector = await ethers.getContractFactory("LocalDetector");
  const localDetector = await LocalDetector.deploy();
  await localDetector.waitForDeployment();
  const localDetectorAddress = await localDetector.getAddress();
  console.log("   LocalDetector deployed to:", localDetectorAddress);

  // 2. Deploy AnomalyRegistry
  console.log("\n2. Deploying AnomalyRegistry...");
  const AnomalyRegistry = await ethers.getContractFactory("AnomalyRegistry");
  const anomalyRegistry = await AnomalyRegistry.deploy();
  await anomalyRegistry.waitForDeployment();
  const anomalyRegistryAddress = await anomalyRegistry.getAddress();
  console.log("   AnomalyRegistry deployed to:", anomalyRegistryAddress);

  // 3. Deploy zkMLVerifier (placeholder - would use actual Groth16 verifier)
  console.log("\n3. Deploying zkMLVerifier...");
  // In production, deploy actual Groth16 verifier contract
  // For now, use a mock
  const zkMLVerifierAddress = "0x0000000000000000000000000000000000000000";
  console.log("   zkMLVerifier (mock) at:", zkMLVerifierAddress);

  // 4. Deploy AnomalyOracle
  console.log("\n4. Deploying AnomalyOracle...");
  const AnomalyOracle = await ethers.getContractFactory("AnomalyOracle");
  const anomalyOracle = await AnomalyOracle.deploy(
    CCIP_ROUTER,
    WORMHOLE,
    zkMLVerifierAddress,
    anomalyRegistryAddress
  );
  await anomalyOracle.waitForDeployment();
  const anomalyOracleAddress = await anomalyOracle.getAddress();
  console.log("   AnomalyOracle deployed to:", anomalyOracleAddress);

  // 5. Deploy AnomalyStaking
  console.log("\n5. Deploying AnomalyStaking...");
  const AnomalyStaking = await ethers.getContractFactory("AnomalyStaking");
  const anomalyStaking = await AnomalyStaking.deploy(STAKING_TOKEN, KARAK_VAULT, zkMLVerifierAddress);
  await anomalyStaking.waitForDeployment();
  const anomalyStakingAddress = await anomalyStaking.getAddress();
  console.log("   AnomalyStaking deployed to:", anomalyStakingAddress);

  // 6. Configure contracts
  console.log("\n6. Configuring contracts...");
  
  // Set staking contract in registry
  const setStakingTx = await anomalyRegistry.setStakingContract(anomalyStakingAddress);
  await setStakingTx.wait();
  console.log("   ✓ Registry -> Staking linked");

  // Set registry in staking
  const setRegistryTx = await anomalyStaking.setRegistry(anomalyRegistryAddress);
  await setRegistryTx.wait();
  console.log("   ✓ Staking -> Registry linked");

  // Authorize deployer as oracle (for testing)
  const authorizeTx = await anomalyOracle.authorizeOracle(deployer.address);
  await authorizeTx.wait();
  console.log("   ✓ Deployer authorized as oracle");

  // Authorize deployer as reporter (for testing)
  const authorizeReporterTx = await localDetector.authorizeReporter(deployer.address);
  await authorizeReporterTx.wait();
  console.log("   ✓ Deployer authorized as reporter");

  // Summary
  console.log("\n=== Deployment Summary ===");
  console.log("Network:", (await ethers.provider.getNetwork()).name);
  console.log("Deployer:", deployer.address);
  console.log("\nContract Addresses:");
  console.log("  LocalDetector:", localDetectorAddress);
  console.log("  AnomalyRegistry:", anomalyRegistryAddress);
  console.log("  AnomalyOracle:", anomalyOracleAddress);
  console.log("  AnomalyStaking:", anomalyStakingAddress);
  console.log("  zkMLVerifier:", zkMLVerifierAddress);
  console.log("\nNext Steps:");
  console.log("  1. Deploy zkMLVerifier with actual Groth16 verifier");
  console.log("  2. Authorize oracle nodes in AnomalyOracle");
  console.log("  3. Deploy LocalDetector on other chains (Solana, Polygon, etc.)");
  console.log("  4. Configure Wormhole bridge addresses");
  console.log("  5. Set up Chainlink CCIP router");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

