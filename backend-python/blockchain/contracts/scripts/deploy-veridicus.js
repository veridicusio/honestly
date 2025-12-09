/**
 * Deploy VERIDICUS Token Contract
 * 
 * Deploys the VERIDICUS governance and utility token for Honestly protocol.
 */

const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  console.log("Account balance:", (await ethers.provider.getBalance(deployer.address)).toString());

  // Configuration
  const TREASURY_ADDRESS = process.env.TREASURY_ADDRESS || deployer.address;

  console.log("\n=== Deploying VERIDICUS Token ===\n");

  // Deploy VERIDICUS Token
  console.log("Deploying VERIDICUSToken...");
  const VERIDICUSToken = await ethers.getContractFactory("VERIDICUSToken");
  const VERIDICUSToken = await VERIDICUSToken.deploy(TREASURY_ADDRESS);
  await VERIDICUSToken.waitForDeployment();
  const VERIDICUSTokenAddress = await VERIDICUSToken.getAddress();
  console.log("   VERIDICUS Token deployed to:", VERIDICUSTokenAddress);

  // Verify deployment
  const totalSupply = await VERIDICUSToken.totalSupply();
  const maxSupply = await VERIDICUSToken.MAX_SUPPLY();
  const name = await VERIDICUSToken.name();
  const symbol = await VERIDICUSToken.symbol();

  console.log("\n=== Deployment Summary ===");
  console.log("Network:", (await ethers.provider.getNetwork()).name);
  console.log("Deployer:", deployer.address);
  console.log("\nToken Details:");
  console.log("  Name:", name);
  console.log("  Symbol:", symbol);
  console.log("  Total Supply:", ethers.formatEther(totalSupply), "VERIDICUS");
  console.log("  Max Supply:", ethers.formatEther(maxSupply), "VERIDICUS");
  console.log("  Treasury:", TREASURY_ADDRESS);
  console.log("\nToken Address:", VERIDICUSTokenAddress);
  console.log("\nNext Steps:");
  console.log("  1. Set quantum gateway address: setQuantumGateway(address)");
  console.log("  2. Add minters for community rewards: addMinter(address)");
  console.log("  3. Distribute tokens from treasury");
  console.log("  4. Integrate with quantum gateway");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

