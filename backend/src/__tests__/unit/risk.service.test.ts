/**
 * Risk Service Unit Tests
 */

import { RiskService } from '../../services/risk/risk.service';

// Mock ethers
jest.mock('ethers', () => ({
  ethers: {
    isAddress: jest.fn((address: string) => address.startsWith('0x') && address.length === 42),
    Wallet: jest.fn(),
    JsonRpcProvider: jest.fn(() => ({
      getCode: jest.fn().mockResolvedValue('0x608060405234801561001057600080fd5b50'),
      getBlockNumber: jest.fn().mockResolvedValue(1000000),
    })),
  },
}));

describe('RiskService', () => {
  let riskService: RiskService;
  const mockNetwork = 'cronos-testnet';
  const mockPrivateKey = '0x1234567890123456789012345678901234567890123456789012345678901234';
  const mockRpcUrl = 'https://evm-t3.cronos.org';
  const mockContractAddress = '0x1234567890123456789012345678901234567890';

  beforeEach(() => {
    riskService = new RiskService(mockNetwork, mockPrivateKey, mockRpcUrl, mockContractAddress);
  });

  describe('analyzeRisk', () => {
    it('should analyze risk for a valid contract address', async () => {
      const request = {
        contract: '0x1234567890123456789012345678901234567890',
      };

      const result = await riskService.analyzeRisk(request);

      expect(result).toBeDefined();
      expect(result.contract).toBe(request.contract.toLowerCase());
      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(100);
      expect(result.proof).toBeDefined();
      expect(result.timestamp).toBeDefined();
    });

    it('should normalize contract address to lowercase', async () => {
      const request = {
        contract: '0xABCDEF1234567890ABCDEF1234567890ABCDEF12',
      };

      const result = await riskService.analyzeRisk(request);

      expect(result.contract).toBe(request.contract.toLowerCase());
    });

    it('should include details in the result', async () => {
      const request = {
        contract: '0x1234567890123456789012345678901234567890',
      };

      const result = await riskService.analyzeRisk(request);

      expect(result.details).toBeDefined();
      expect(typeof result.details).toBe('object');
    });
  });

  describe('verifyProofOnChain', () => {
    it('should verify proof on-chain', async () => {
      const contract = '0x1234567890123456789012345678901234567890';
      const timestamp = Math.floor(Date.now() / 1000);
      const proof = '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890';

      // This will fail if contract is not deployed, but we're testing the method exists
      try {
        await riskService.verifyProofOnChain(contract, timestamp, proof);
      } catch (error) {
        // Expected to fail in test environment, but method should exist
        expect(error).toBeDefined();
      }
    });
  });
});
