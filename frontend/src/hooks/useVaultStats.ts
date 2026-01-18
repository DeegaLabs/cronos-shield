/**
 * Hook to fetch vault statistics (TVL, depositors, blocked transactions)
 */

import { useEthersSigner } from './useEthersSigner';
import { Contract, formatEther } from 'ethers';
import { useQuery } from '@tanstack/react-query';

const SHIELDED_VAULT_ABI = [
  'function balances(address) view returns (uint256)',
  'event Deposited(address indexed user, uint256 amount)',
  'event TransactionBlocked(address indexed user, address indexed target, uint256 riskScore, string reason)',
] as const;

const VAULT_CONTRACT_ADDRESS = (import.meta.env.VITE_SHIELDED_VAULT_ADDRESS || '').trim();

export interface VaultStats {
  totalValueLocked: string;
  totalValueLockedFormatted: string;
  totalDepositors: number;
  transactionsBlocked: number;
}

export function useVaultStats() {
  const signer = useEthersSigner();

  const { data: stats, isLoading } = useQuery({
    queryKey: ['vault-stats'],
    queryFn: async (): Promise<VaultStats> => {
      if (!signer || !VAULT_CONTRACT_ADDRESS) {
        throw new Error('Signer or contract not available');
      }

      const contract = new Contract(VAULT_CONTRACT_ADDRESS, SHIELDED_VAULT_ABI, signer.provider!);

      // Get current block number
      const currentBlock = await signer.provider!.getBlockNumber();
      const fromBlock = Math.max(0, currentBlock - 10000); // Last 10,000 blocks

      // Fetch Deposited events to get all depositors
      const depositedEvents = await contract.queryFilter(
        contract.filters.Deposited(),
        fromBlock,
        'latest'
      );

      // Get unique depositors
      const depositorAddresses = new Set<string>();
      let totalValueLocked = 0n;

      // Get balances for all depositors
      const balancePromises: Promise<bigint>[] = [];
      const addresses: string[] = [];

      depositedEvents.forEach((event) => {
        if ('args' in event && event.args) {
          const user = event.args.user;
          if (user && typeof user === 'string') {
            depositorAddresses.add(user);
            addresses.push(user);
          }
        }
      });

      // Fetch current balances for all depositors
      for (const address of Array.from(depositorAddresses)) {
        balancePromises.push(
          contract.balances(address).catch(() => 0n)
        );
      }

      const balances = await Promise.all(balancePromises);
      balances.forEach((balance) => {
        totalValueLocked += balance;
      });

      // Count blocked transactions
      const blockedEvents = await contract.queryFilter(
        contract.filters.TransactionBlocked(),
        fromBlock,
        'latest'
      );

      return {
        totalValueLocked: totalValueLocked.toString(),
        totalValueLockedFormatted: formatEther(totalValueLocked),
        totalDepositors: depositorAddresses.size,
        transactionsBlocked: blockedEvents.length,
      };
    },
    enabled: !!signer && !!VAULT_CONTRACT_ADDRESS,
    refetchInterval: 60000, // Refetch every 60 seconds
  });

  return {
    stats: stats || {
      totalValueLocked: '0',
      totalValueLockedFormatted: '0.0000',
      totalDepositors: 0,
      transactionsBlocked: 0,
    },
    isLoading,
  };
}
