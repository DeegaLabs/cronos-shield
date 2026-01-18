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
  'event Deposited(address indexed user, uint256 amount)',
  'event Withdrawn(address indexed user, uint256 amount)',
  'event TransactionBlocked(address indexed user, address indexed target, uint256 riskScore, string reason)',
  'event TransactionAllowed(address indexed user, address indexed target, uint256 riskScore)',
] as const;

const VAULT_CONTRACT_ADDRESS = import.meta.env.VITE_SHIELDED_VAULT_ADDRESS || '';

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
    },
  });

  return {
    vaultInfo,
    balance,
    isLoadingInfo,
    isLoadingBalance,
    deposit: depositMutation.mutateAsync,
    withdraw: withdrawMutation.mutateAsync,
    isDepositing: depositMutation.isPending,
    isWithdrawing: withdrawMutation.isPending,
    depositError: depositMutation.error,
    withdrawError: withdrawMutation.error,
    contractAddress: VAULT_CONTRACT_ADDRESS,
  };
}
