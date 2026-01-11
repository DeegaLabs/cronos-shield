/**
 * Tests for RiskOracle contract
 * 
 * Run with: npx hardhat test
 */

import { expect } from "chai";
import { ethers } from "hardhat";
import type { RiskOracle } from "../typechain-types";

describe("RiskOracle", function () {
  let riskOracle: RiskOracle;
  let owner: any;
  let oracle: any;
  let user: any;

  beforeEach(async function () {
    [owner, oracle, user] = await ethers.getSigners();

    // Deploy contract
    const RiskOracleFactory = await ethers.getContractFactory("RiskOracle");
    riskOracle = await RiskOracleFactory.deploy();
    await riskOracle.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await riskOracle.owner()).to.equal(owner.address);
    });

    it("Should authorize deployer as oracle", async function () {
      expect(await riskOracle.authorizedOracles(owner.address)).to.be.true;
    });
  });

  describe("Oracle Authorization", function () {
    it("Should allow owner to authorize oracle", async function () {
      await riskOracle.authorizeOracle(oracle.address);
      expect(await riskOracle.authorizedOracles(oracle.address)).to.be.true;
    });

    it("Should allow owner to revoke oracle", async function () {
      await riskOracle.authorizeOracle(oracle.address);
      await riskOracle.revokeOracle(oracle.address);
      expect(await riskOracle.authorizedOracles(oracle.address)).to.be.false;
    });

    it("Should not allow non-owner to authorize oracle", async function () {
      await expect(
        riskOracle.connect(user).authorizeOracle(oracle.address)
      ).to.be.revertedWith("RiskOracle: caller is not owner");
    });
  });

  describe("Store Result", function () {
    const contractAddress = ethers.Wallet.createRandom().address;
    const score = 25;
    const proofHash = ethers.id("test-proof");
    const timestamp = Math.floor(Date.now() / 1000);

    it("Should allow authorized oracle to store result", async function () {
      await riskOracle.authorizeOracle(oracle.address);
      
      await expect(
        riskOracle.connect(oracle).storeResult(
          contractAddress,
          score,
          proofHash,
          timestamp
        )
      ).to.emit(riskOracle, "RiskResultStored");
    });

    it("Should not allow unauthorized oracle to store result", async function () {
      await expect(
        riskOracle.connect(user).storeResult(
          contractAddress,
          score,
          proofHash,
          timestamp
        )
      ).to.be.revertedWith("RiskOracle: caller is not authorized oracle");
    });

    it("Should reject invalid score (> 100)", async function () {
      await riskOracle.authorizeOracle(oracle.address);
      
      await expect(
        riskOracle.connect(oracle).storeResult(
          contractAddress,
          101,
          proofHash,
          timestamp
        )
      ).to.be.revertedWith("RiskOracle: invalid score (must be 0-100)");
    });

    it("Should reject zero address", async function () {
      await riskOracle.authorizeOracle(oracle.address);
      
      await expect(
        riskOracle.connect(oracle).storeResult(
          ethers.ZeroAddress,
          score,
          proofHash,
          timestamp
        )
      ).to.be.revertedWith("RiskOracle: invalid contract address");
    });
  });

  describe("Get Result", function () {
    const contractAddress = ethers.Wallet.createRandom().address;
    const score = 30;
    const proofHash = ethers.id("test-proof");
    const timestamp = Math.floor(Date.now() / 1000);

    beforeEach(async function () {
      await riskOracle.authorizeOracle(oracle.address);
      await riskOracle.connect(oracle).storeResult(
        contractAddress,
        score,
        proofHash,
        timestamp
      );
    });

    it("Should retrieve stored result", async function () {
      const result = await riskOracle.getResult(contractAddress, timestamp);
      
      expect(result.score).to.equal(score);
      expect(result.proofHash).to.equal(proofHash);
      expect(result.resultTimestamp).to.equal(timestamp);
      expect(result.oracleAddress).to.equal(oracle.address);
      expect(result.exists).to.be.true;
    });

    it("Should return exists=false for non-existent result", async function () {
      const nonExistentTimestamp = timestamp + 1000;
      const result = await riskOracle.getResult(contractAddress, nonExistentTimestamp);
      
      expect(result.exists).to.be.false;
    });
  });

  describe("Verify Proof", function () {
    const contractAddress = ethers.Wallet.createRandom().address;
    const score = 40;
    const proofHash = ethers.id("test-proof");
    const timestamp = Math.floor(Date.now() / 1000);

    beforeEach(async function () {
      await riskOracle.authorizeOracle(oracle.address);
      await riskOracle.connect(oracle).storeResult(
        contractAddress,
        score,
        proofHash,
        timestamp
      );
    });

    it("Should verify correct proof", async function () {
      const isValid = await riskOracle.verifyProof(
        contractAddress,
        timestamp,
        proofHash
      );
      
      expect(isValid).to.be.true;
    });

    it("Should reject incorrect proof", async function () {
      const wrongProof = ethers.id("wrong-proof");
      const isValid = await riskOracle.verifyProof(
        contractAddress,
        timestamp,
        wrongProof
      );
      
      expect(isValid).to.be.false;
    });

    it("Should return false for non-existent result", async function () {
      const nonExistentTimestamp = timestamp + 1000;
      const isValid = await riskOracle.verifyProof(
        contractAddress,
        nonExistentTimestamp,
        proofHash
      );
      
      expect(isValid).to.be.false;
    });
  });
});
