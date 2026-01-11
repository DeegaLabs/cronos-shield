/**
 * Script to authorize an oracle address in RiskOracle contract
 * 
 * Usage:
 *   npx hardhat run scripts/authorize-oracle.ts --network cronosTestnet
 * 
 * Set ORACLE_ADDRESS in .env or pass as argument
 */

import { ethers } from "hardhat";
import * as dotenv from "dotenv";

dotenv.config();

async function main() {
  const contractAddress = process.env.RISK_ORACLE_CONTRACT_ADDRESS;
  const oracleAddress = process.env.ORACLE_ADDRESS || process.argv[2];

  if (!contractAddress) {
    throw new Error("❌ RISK_ORACLE_CONTRACT_ADDRESS not set in .env");
  }

  if (!oracleAddress) {
    throw new Error("❌ ORACLE_ADDRESS not set. Set in .env or pass as argument");
  }

  console.log("🔐 Authorizing oracle address...\n");
  console.log("📍 Contract:", contractAddress);
  console.log("👤 Oracle:", oracleAddress);
  console.log("");

  // Get contract
  const RiskOracle = await ethers.getContractFactory("RiskOracle");
  const riskOracle = RiskOracle.attach(contractAddress);

  // Check if already authorized
  const isAuthorized = await riskOracle.authorizedOracles(oracleAddress);
  if (isAuthorized) {
    console.log("✅ Oracle is already authorized!");
    return;
  }

  // Authorize oracle
  console.log("📝 Sending transaction...");
  const tx = await riskOracle.authorizeOracle(oracleAddress);
  console.log("⏳ Waiting for confirmation...");
  await tx.wait();

  console.log("\n✅ Oracle authorized successfully!");
  console.log("🔗 Transaction:", tx.hash);
  console.log("🔗 View on explorer:", getExplorerUrl(tx.hash));
}

function getExplorerUrl(txHash: string): string {
  const network = process.env.NETWORK || "cronos-testnet";
  if (network === "cronos-mainnet") {
    return `https://cronoscan.com/tx/${txHash}`;
  }
  return `https://testnet.cronoscan.com/tx/${txHash}`;
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
