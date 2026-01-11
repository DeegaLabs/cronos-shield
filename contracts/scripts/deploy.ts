import { ethers } from "hardhat";

/**
 * Deploy script for ShieldedVault
 * 
 * Usage:
 *   npx hardhat run scripts/deploy.ts --network cronosTestnet
 */
async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.formatEther(balance), "CRO");

  // Get Risk Oracle address from environment or use zero address for testing
  const riskOracleAddress = process.env.RISK_ORACLE_CONTRACT_ADDRESS || ethers.ZeroAddress;
  const maxRiskScore = process.env.MAX_RISK_SCORE || "30"; // Default: 30
  const riskOracleUrl = process.env.RISK_ORACLE_URL || "http://localhost:3000";

  console.log("\nDeployment parameters:");
  console.log("  Risk Oracle Address:", riskOracleAddress);
  console.log("  Max Risk Score:", maxRiskScore);
  console.log("  Risk Oracle URL:", riskOracleUrl);

  // Deploy ShieldedVault
  const ShieldedVault = await ethers.getContractFactory("ShieldedVault");
  const vault = await ShieldedVault.deploy(
    riskOracleAddress,
    maxRiskScore,
    riskOracleUrl
  );

  await vault.waitForDeployment();
  const vaultAddress = await vault.getAddress();

  console.log("\n✅ ShieldedVault deployed to:", vaultAddress);
  console.log("   Network:", process.env.NETWORK || "cronosTestnet");
  console.log("\n📝 Save this address for configuration:");
  console.log(`   SHIELDED_VAULT_ADDRESS=${vaultAddress}`);

  // Verify deployment
  console.log("\n🔍 Verifying deployment...");
  const owner = await vault.owner();
  const maxScore = await vault.maxRiskScore();
  const url = await vault.riskOracleUrl();

  console.log("   Owner:", owner);
  console.log("   Max Risk Score:", maxScore.toString());
  console.log("   Risk Oracle URL:", url);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
