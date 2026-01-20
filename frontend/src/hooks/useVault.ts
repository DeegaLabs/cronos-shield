/**
 * Hook for interacting with ShieldedVault contract
 */

import { useAccount } from 'wagmi';
import { useEthersSigner } from './useEthersSigner';
import { Contract, formatEther, parseEther, getAddress } from 'ethers';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const SHIELDED_VAULT_ABI = [
  'function deposit() payable',
  'function withdraw(uint256 amount)',
  'function balances(address) view returns (uint256)',
  'function maxRiskScore() view returns (uint256)',
  'function riskOracleAddress() view returns (address)',
  'function riskOracleUrl() view returns (string)',
  'function owner() view returns (address)',
  'function paused() view returns (bool)',
  'function executeWithRiskCheck(address target, bytes calldata, uint256 value, uint256 riskScore, bytes calldata proof) payable returns (bool)',
  'function checkRiskScore(uint256 riskScore) view returns (bool)',
  'event Deposited(address indexed user, uint256 amount)',
  'event Withdrawn(address indexed user, uint256 amount)',
  'event TransactionBlocked(address indexed user, address indexed target, uint256 riskScore, string reason)',
  'event TransactionAllowed(address indexed user, address indexed target, uint256 riskScore)',
] as const;

// Get contract address from env and trim any whitespace/newlines
const VAULT_CONTRACT_ADDRESS = (import.meta.env.VITE_SHIELDED_VAULT_ADDRESS || '').trim();

export function useVault() {
  const { address } = useAccount();
  const signer = useEthersSigner();
  const queryClient = useQueryClient();

  // Get vault contract instance
  const getVaultContract = () => {
    if (!signer || !VAULT_CONTRACT_ADDRESS) {
      return null;
    }
    try {
      // Trim whitespace and normalize address using getAddress
      // getAddress validates and normalizes without ENS resolution
      const normalizedAddress = getAddress(VAULT_CONTRACT_ADDRESS.trim());
      // Create contract with normalized address
      // Pass address directly to avoid ENS resolution
      return new Contract(normalizedAddress, SHIELDED_VAULT_ABI, signer);
    } catch (error) {
      console.error('Error creating contract:', error);
      return null;
    }
  };

  // Get vault info (maxRiskScore, riskOracleAddress, etc.)
  const { data: vaultInfo, isLoading: isLoadingInfo } = useQuery({
    queryKey: ['vault-info'],
    queryFn: async () => {
      const contract = getVaultContract();
      if (!contract) throw new Error('Contract not available');

      const [maxRiskScore, riskOracleAddress, riskOracleUrl, owner, paused] = await Promise.all([
        contract.maxRiskScore(),
        contract.riskOracleAddress(),
        contract.riskOracleUrl(),
        contract.owner(),
        contract.paused(),
      ]);

      return {
        maxRiskScore: Number(maxRiskScore),
        riskOracleAddress,
        riskOracleUrl,
        owner,
        paused,
        contractAddress: VAULT_CONTRACT_ADDRESS,
      };
    },
    enabled: !!signer && !!VAULT_CONTRACT_ADDRESS,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Get user balance
  const { data: balance, isLoading: isLoadingBalance } = useQuery({
    queryKey: ['vault-balance', address],
    queryFn: async () => {
      const contract = getVaultContract();
      if (!contract || !address) throw new Error('Contract or address not available');

      const balance = await contract.balances(address);
      return {
        raw: balance.toString(),
        formatted: formatEther(balance),
      };
    },
    enabled: !!signer && !!address && !!VAULT_CONTRACT_ADDRESS,
    refetchInterval: 10000, // Refetch every 10 seconds
  });

  // Deposit mutation
  const depositMutation = useMutation({
    mutationFn: async (amount: string) => {
      const contract = getVaultContract();
      if (!contract) throw new Error('Contract not available');
      if (!address) throw new Error('Wallet not connected');

      const amountWei = parseEther(amount);
      const tx = await contract.deposit({ value: amountWei });
      await tx.wait();
      return tx.hash;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vault-balance'] });
      queryClient.invalidateQueries({ queryKey: ['vault-info'] });
      queryClient.invalidateQueries({ queryKey: ['vault-transactions'] });
    },
  });

  // Withdraw mutation
  const withdrawMutation = useMutation({
    mutationFn: async (amount: string) => {
      const contract = getVaultContract();
      if (!contract) throw new Error('Contract not available');
      if (!address) throw new Error('Wallet not connected');

      const amountWei = parseEther(amount);
      const tx = await contract.withdraw(amountWei);
      await tx.wait();
      return tx.hash;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vault-balance'] });
      queryClient.invalidateQueries({ queryKey: ['vault-info'] });
      queryClient.invalidateQueries({ queryKey: ['vault-transactions'] });
    },
  });

  // Execute protected transaction mutation
  const executeProtectedTransactionMutation = useMutation({
    mutationFn: async (params: {
      target: string;
      callData: string;
      value: string;
      riskScore: number;
      proof: string;
    }) => {
      const contract = getVaultContract();
      if (!contract) throw new Error('Contract not available');
      if (!address) throw new Error('Wallet not connected');

      const valueWei = parseEther(params.value);
      
      // Convert callData and proof to bytes
      // Ensure they start with 0x, otherwise add it
      const callDataBytes = params.callData.trim() === '' || params.callData.trim() === '0x'
        ? '0x'
        : params.callData.startsWith('0x')
        ? params.callData
        : '0x' + params.callData;
      
      const proofBytes = params.proof.trim() === '' || params.proof.trim() === '0x'
        ? '0x'
        : params.proof.startsWith('0x')
        ? params.proof
        : '0x' + params.proof;
      
      const tx = await contract.executeWithRiskCheck(
        params.target,
        callDataBytes,
        valueWei,
        params.riskScore,
        proofBytes
      );
      await tx.wait();
      return tx.hash;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vault-balance'] });
      queryClient.invalidateQueries({ queryKey: ['vault-info'] });
      queryClient.invalidateQueries({ queryKey: ['vault-transactions'] });
    },
  });

  return {
    vaultInfo,
    balance,
    isLoadingInfo,
    isLoadingBalance,
    deposit: depositMutation.mutateAsync,
    withdraw: withdrawMutation.mutateAsync,
    executeProtectedTransaction: executeProtectedTransactionMutation.mutateAsync,
    isDepositing: depositMutation.isPending,
    isWithdrawing: withdrawMutation.isPending,
    isExecutingProtectedTransaction: executeProtectedTransactionMutation.isPending,
    depositError: depositMutation.error,
    withdrawError: withdrawMutation.error,
    protectedTransactionError: executeProtectedTransactionMutation.error,
    contractAddress: VAULT_CONTRACT_ADDRESS,
  };
}
