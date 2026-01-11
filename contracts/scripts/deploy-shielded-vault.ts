import { ethers } from "hardhat";

/**
 * Deploy ShieldedVault contract
 * 
 * Usage:
 *   npx hardhat run scripts/deploy-shielded-vault.ts --network cronosTestnet
 */
async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying ShieldedVault with account:", deployer.address);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.formatEther(balance), "CRO");

  // Get configuration from environment
  const riskOracleAddress = process.env.RISK_ORACLE_CONTRACT_ADDRESS || ethers.ZeroAddress;
  const maxRiskScore = process.env.MAX_RISK_SCORE || "30";
  const riskOracleUrl = process.env.RISK_ORACLE_URL || "http://localhost:3000";

  if (riskOracleAddress === ethers.ZeroAddress) {
    console.warn("\n⚠️  WARNING: RISK_ORACLE_CONTRACT_ADDRESS not set, using zero address");
  }

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
  console.log("\n📝 Save this address:");
  console.log(`   SHIELDED_VAULT_ADDRESS=${vaultAddress}`);

  // Verify deployment
  console.log("\n🔍 Verifying deployment...");
  const owner = await vault.owner();
  const maxScore = await vault.maxRiskScore();
  const url = await vault.riskOracleUrl();

  console.log("   Owner:", owner);
  console.log("   Max Risk Score:", maxScore.toString());
  console.log("   Risk Oracle URL:", url);

  // Get explorer URL
  const chainId = await ethers.provider.getNetwork().then(n => n.chainId);
  const explorerUrl = chainId === 338n 
    ? `https://testnet.cronoscan.com/address/${vaultAddress}`
    : chainId === 25n
    ? `https://cronoscan.com/address/${vaultAddress}`
    : `Chain ID: ${chainId}`;
  
  console.log("\n🔗 Explorer:", explorerUrl);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
