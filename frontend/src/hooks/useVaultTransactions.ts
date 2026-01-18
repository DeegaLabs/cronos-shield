/**
 * Hook to fetch transaction history from ShieldedVault contract events
 */

import { useAccount } from 'wagmi';
import { useEthersSigner } from './useEthersSigner';
import { Contract, formatEther } from 'ethers';
import { useQuery } from '@tanstack/react-query';

const SHIELDED_VAULT_ABI = [
  'event Deposited(address indexed user, uint256 amount)',
  'event Withdrawn(address indexed user, uint256 amount)',
  'event TransactionBlocked(address indexed user, address indexed target, uint256 riskScore, string reason)',
  'event TransactionAllowed(address indexed user, address indexed target, uint256 riskScore)',
] as const;

const VAULT_CONTRACT_ADDRESS = (import.meta.env.VITE_SHIELDED_VAULT_ADDRESS || '').trim();

export interface VaultTransaction {
  id: string;
  type: 'deposit' | 'withdraw' | 'blocked' | 'allowed';
  timestamp: Date;
  amount?: string;
  formattedAmount?: string;
  target?: string;
  riskScore?: number;
  reason?: string;
  txHash: string;
  blockNumber: number;
}

export function useVaultTransactions(limit: number = 50) {
  const { address } = useAccount();
  const signer = useEthersSigner();

  const { data: transactions, isLoading } = useQuery({
    queryKey: ['vault-transactions', address, limit],
    queryFn: async (): Promise<VaultTransaction[]> => {
      if (!signer || !address || !VAULT_CONTRACT_ADDRESS) {
        throw new Error('Signer, address, or contract not available');
      }

      const contract = new Contract(VAULT_CONTRACT_ADDRESS, SHIELDED_VAULT_ABI, signer.provider!);

      // Get current block number
      const currentBlock = await signer.provider!.getBlockNumber();
      // Look back 1,500 blocks (approximately 2.5 hours on Cronos)
      // Must use specific block number, not 'latest', to respect RPC limit of 2000 blocks
      const fromBlock = Math.max(0, currentBlock - 1500);
      const toBlock = currentBlock; // Use specific block number, not 'latest'

      // Fetch all events in parallel with error handling
      const [depositedEvents, withdrawnEvents, blockedEvents, allowedEvents] = await Promise.all([
        contract.queryFilter(
          contract.filters.Deposited(address),
          fromBlock,
          toBlock
        ).catch((err) => {
          console.warn('Failed to fetch Deposited events:', err);
          return [];
        }),
        contract.queryFilter(
          contract.filters.Withdrawn(address),
          fromBlock,
          toBlock
        ).catch((err) => {
          console.warn('Failed to fetch Withdrawn events:', err);
          return [];
        }),
        contract.queryFilter(
          contract.filters.TransactionBlocked(address),
          fromBlock,
          toBlock
        ).catch((err) => {
          console.warn('Failed to fetch TransactionBlocked events:', err);
          return [];
        }),
        contract.queryFilter(
          contract.filters.TransactionAllowed(address),
          fromBlock,
          toBlock
        ).catch((err) => {
          console.warn('Failed to fetch TransactionAllowed events:', err);
          return [];
        }),
      ]);

      // Get block timestamps for all unique block numbers
      const uniqueBlockNumbers = new Set<number>();
      [...depositedEvents, ...withdrawnEvents, ...blockedEvents, ...allowedEvents].forEach((event) => {
        if (event.blockNumber) {
          uniqueBlockNumbers.add(Number(event.blockNumber));
        }
      });

      // Fetch block timestamps in parallel
      const blockTimestamps = new Map<number, number>();
      await Promise.all(
        Array.from(uniqueBlockNumbers).map(async (blockNum) => {
          try {
            const block = await signer.provider!.getBlock(blockNum);
            if (block) {
              blockTimestamps.set(blockNum, block.timestamp * 1000); // Convert to milliseconds
            }
          } catch (error) {
            console.warn(`Failed to get block ${blockNum}:`, error);
            // Fallback to approximate timestamp (6s per block on Cronos)
            blockTimestamps.set(blockNum, Date.now() - (currentBlock - blockNum) * 6000);
          }
        })
      );

      // Transform events to transactions
      const allTransactions: VaultTransaction[] = [];

      // Helper to get timestamp
      const getTimestamp = (blockNumber: number): Date => {
        const timestamp = blockTimestamps.get(blockNumber) || Date.now();
        return new Date(timestamp);
      };

      // Helper to check if event has args (EventLog)
      const isEventLog = (event: any): event is { args: any; transactionHash: string; logIndex: number; blockNumber: number } => {
        return event && 'args' in event && 'transactionHash' in event;
      };

      // Deposited events
      depositedEvents.forEach((event) => {
        if (isEventLog(event) && event.args) {
          const blockNum = Number(event.blockNumber);
          allTransactions.push({
            id: `${event.transactionHash}-${event.logIndex}`,
            type: 'deposit',
            timestamp: getTimestamp(blockNum),
            amount: event.args.amount?.toString(),
            formattedAmount: formatEther(event.args.amount || 0n),
            txHash: event.transactionHash,
            blockNumber: blockNum,
          });
        }
      });

      // Withdrawn events
      withdrawnEvents.forEach((event) => {
        if (isEventLog(event) && event.args) {
          const blockNum = Number(event.blockNumber);
          allTransactions.push({
            id: `${event.transactionHash}-${event.logIndex}`,
            type: 'withdraw',
            timestamp: getTimestamp(blockNum),
            amount: event.args.amount?.toString(),
            formattedAmount: formatEther(event.args.amount || 0n),
            txHash: event.transactionHash,
            blockNumber: blockNum,
          });
        }
      });

      // TransactionBlocked events
      blockedEvents.forEach((event) => {
        if (isEventLog(event) && event.args) {
          const blockNum = Number(event.blockNumber);
          allTransactions.push({
            id: `${event.transactionHash}-${event.logIndex}`,
            type: 'blocked',
            timestamp: getTimestamp(blockNum),
            target: event.args.target,
            riskScore: Number(event.args.riskScore),
            reason: event.args.reason,
            txHash: event.transactionHash,
            blockNumber: blockNum,
          });
        }
      });

      // TransactionAllowed events
      allowedEvents.forEach((event) => {
        if (isEventLog(event) && event.args) {
          const blockNum = Number(event.blockNumber);
          allTransactions.push({
            id: `${event.transactionHash}-${event.logIndex}`,
            type: 'allowed',
            timestamp: getTimestamp(blockNum),
            target: event.args.target,
            riskScore: Number(event.args.riskScore),
            txHash: event.transactionHash,
            blockNumber: blockNum,
          });
        }
      });

      // Sort by block number (most recent first)
      allTransactions.sort((a, b) => b.blockNumber - a.blockNumber);

      // Limit results
      return allTransactions.slice(0, limit);
    },
    enabled: !!signer && !!address && !!VAULT_CONTRACT_ADDRESS,
    refetchInterval: 60000, // Refetch every 60 seconds (reduced frequency)
    retry: 2, // Retry failed requests up to 2 times
    retryDelay: 1000, // Wait 1 second between retries
  });

  return {
    transactions: transactions || [],
    isLoading,
  };
}
