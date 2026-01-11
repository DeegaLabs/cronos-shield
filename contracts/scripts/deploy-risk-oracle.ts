import { ethers } from "hardhat";

/**
 * Deploy RiskOracle contract
 * 
 * Usage:
 *   npx hardhat run scripts/deploy-risk-oracle.ts --network cronosTestnet
 */
async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying RiskOracle with account:", deployer.address);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.formatEther(balance), "CRO");

  // Deploy RiskOracle
  const RiskOracle = await ethers.getContractFactory("RiskOracle");
  const riskOracle = await RiskOracle.deploy();

  await riskOracle.waitForDeployment();
  const address = await riskOracle.getAddress();

  console.log("\n✅ RiskOracle deployed to:", address);
  console.log("   Network:", process.env.NETWORK || "cronosTestnet");
  console.log("\n📝 Save this address:");
  console.log(`   RISK_ORACLE_CONTRACT_ADDRESS=${address}`);

  // Verify deployment
  console.log("\n🔍 Verifying deployment...");
  const owner = await riskOracle.owner();
  const isAuthorized = await riskOracle.authorizedOracles(deployer.address);
  
  console.log("   Owner:", owner);
  console.log("   Deployer authorized:", isAuthorized);

  // Get explorer URL
  const chainId = await ethers.provider.getNetwork().then(n => n.chainId);
  const explorerUrl = chainId === 338n 
    ? `https://testnet.cronoscan.com/address/${address}`
    : chainId === 25n
    ? `https://cronoscan.com/address/${address}`
    : `Chain ID: ${chainId}`;
  
  console.log("\n🔗 Explorer:", explorerUrl);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
