import { expect } from "chai";
import { ethers } from "hardhat";
import { ShieldedVault } from "../typechain-types";

describe("ShieldedVault", function () {
  let vault: ShieldedVault;
  let owner: any;
  let user1: any;
  let user2: any;
  let mockRiskOracle: any; // Mock Risk Oracle contract for testing
  const maxRiskScore = 30;
  const riskOracleUrl = "http://localhost:3000";

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();

    // Use user2 address as mock Risk Oracle (valid address, not zero)
    const riskOracleAddress = user2.address;

    const ShieldedVault = await ethers.getContractFactory("ShieldedVault");
    vault = await ShieldedVault.deploy(
      riskOracleAddress,
      maxRiskScore,
      riskOracleUrl
    );
    await vault.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await vault.owner()).to.equal(owner.address);
    });

    it("Should set the correct max risk score", async function () {
      expect(await vault.maxRiskScore()).to.equal(maxRiskScore);
    });

    it("Should set the correct risk oracle URL", async function () {
      expect(await vault.riskOracleUrl()).to.equal(riskOracleUrl);
    });
  });

  describe("Deposit", function () {
    it("Should allow users to deposit CRO", async function () {
      const depositAmount = ethers.parseEther("1.0");
      
      await expect(vault.connect(user1).deposit({ value: depositAmount }))
        .to.emit(vault, "Deposited")
        .withArgs(user1.address, depositAmount);

      expect(await vault.balances(user1.address)).to.equal(depositAmount);
    });

    it("Should reject zero deposits", async function () {
      await expect(
        vault.connect(user1).deposit({ value: 0 })
      ).to.be.revertedWith("ShieldedVault: Deposit amount must be greater than zero");
    });

    it("Should allow multiple deposits", async function () {
      const amount1 = ethers.parseEther("1.0");
      const amount2 = ethers.parseEther("0.5");

      await vault.connect(user1).deposit({ value: amount1 });
      await vault.connect(user1).deposit({ value: amount2 });

      expect(await vault.balances(user1.address)).to.equal(amount1 + amount2);
    });
  });

  describe("Withdraw", function () {
    it("Should allow users to withdraw their deposits", async function () {
      const depositAmount = ethers.parseEther("1.0");
      const withdrawAmount = ethers.parseEther("0.5");

      await vault.connect(user1).deposit({ value: depositAmount });

      await expect(vault.connect(user1).withdraw(withdrawAmount))
        .to.emit(vault, "Withdrawn")
        .withArgs(user1.address, withdrawAmount);

      expect(await vault.balances(user1.address)).to.equal(depositAmount - withdrawAmount);
    });

    it("Should reject withdrawals exceeding balance", async function () {
      const depositAmount = ethers.parseEther("1.0");
      const withdrawAmount = ethers.parseEther("2.0");

      await vault.connect(user1).deposit({ value: depositAmount });

      await expect(
        vault.connect(user1).withdraw(withdrawAmount)
      ).to.be.revertedWith("ShieldedVault: Insufficient balance");
    });
  });

  describe("Risk Check", function () {
    it("Should allow transaction when risk score is below threshold", async function () {
      const depositAmount = ethers.parseEther("1.0");
      const riskScore = 20; // Below maxRiskScore (30)
      const target = user2.address;
      const callData = "0x";
      const value = ethers.parseEther("0.1");
      const proof = "0x";

      await vault.connect(user1).deposit({ value: depositAmount });

      await expect(
        vault.connect(user1).executeWithRiskCheck(
          target,
          callData,
          value,
          riskScore,
          proof,
          { value: value }
        )
      )
        .to.emit(vault, "TransactionAllowed")
        .withArgs(user1.address, target, riskScore);
    });

    it("Should block transaction when risk score exceeds threshold", async function () {
      const depositAmount = ethers.parseEther("1.0");
      const riskScore = 95; // Above maxRiskScore (30)
      const target = user2.address;
      const callData = "0x";
      const value = ethers.parseEther("0.1");
      const proof = "0x";

      await vault.connect(user1).deposit({ value: depositAmount });

      const result = await vault.connect(user1).executeWithRiskCheck.staticCall(
        target,
        callData,
        value,
        riskScore,
        proof,
        { value: value }
      );

      expect(result).to.be.false;

      await expect(
        vault.connect(user1).executeWithRiskCheck(
          target,
          callData,
          value,
          riskScore,
          proof,
          { value: value }
        )
      )
        .to.emit(vault, "TransactionBlocked")
        .withArgs(user1.address, target, riskScore, "Risk score exceeds maximum allowed threshold");
    });

    it("Should check risk score correctly", async function () {
      expect(await vault.checkRiskScore(20)).to.be.true; // Below threshold
      expect(await vault.checkRiskScore(30)).to.be.true; // Equal to threshold
      expect(await vault.checkRiskScore(31)).to.be.false; // Above threshold
    });
  });

  describe("Admin Functions", function () {
    it("Should allow owner to update max risk score", async function () {
      const newScore = 50;
      await expect(vault.setMaxRiskScore(newScore))
        .to.emit(vault, "MaxRiskScoreUpdated")
        .withArgs(maxRiskScore, newScore);

      expect(await vault.maxRiskScore()).to.equal(newScore);
    });

    it("Should reject max risk score > 100", async function () {
      await expect(vault.setMaxRiskScore(101))
        .to.be.revertedWith("ShieldedVault: Max risk score must be 0-100");
    });

    it("Should allow owner to pause/unpause", async function () {
      await vault.pause();
      expect(await vault.paused()).to.be.true;

      await vault.unpause();
      expect(await vault.paused()).to.be.false;
    });

    it("Should prevent operations when paused", async function () {
      await vault.pause();

      await expect(
        vault.connect(user1).deposit({ value: ethers.parseEther("1.0") })
      ).to.be.revertedWithCustomError(vault, "EnforcedPause");
    });
  });

  describe("Emergency Functions", function () {
    it("Should allow owner to emergency withdraw", async function () {
      const depositAmount = ethers.parseEther("1.0");
      await vault.connect(user1).deposit({ value: depositAmount });

      await expect(vault.emergencyWithdraw(user1.address))
        .to.emit(vault, "EmergencyWithdrawn")
        .withArgs(user1.address, depositAmount);

      expect(await vault.balances(user1.address)).to.equal(0);
    });

    it("Should reject emergency withdraw for zero balance", async function () {
      await expect(
        vault.emergencyWithdraw(user1.address)
      ).to.be.revertedWith("ShieldedVault: No funds to emergency withdraw for this user");
    });
  });

  describe("Receive Function", function () {
    it("Should accept deposits via receive()", async function () {
      const amount = ethers.parseEther("1.0");
      
      await expect(
        user1.sendTransaction({
          to: await vault.getAddress(),
          value: amount,
        })
      )
        .to.emit(vault, "Deposited")
        .withArgs(user1.address, amount);
    });
  });
});
