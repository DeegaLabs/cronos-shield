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
      // Look back 10,000 blocks (approximately 1-2 days on Cronos)
      const fromBlock = Math.max(0, currentBlock - 10000);

      // Fetch all events in parallel
      const [depositedEvents, withdrawnEvents, blockedEvents, allowedEvents] = await Promise.all([
        contract.queryFilter(
          contract.filters.Deposited(address),
          fromBlock,
          'latest'
        ),
        contract.queryFilter(
          contract.filters.Withdrawn(address),
          fromBlock,
          'latest'
        ),
        contract.queryFilter(
          contract.filters.TransactionBlocked(address),
          fromBlock,
          'latest'
        ),
        contract.queryFilter(
          contract.filters.TransactionAllowed(address),
          fromBlock,
          'latest'
        ),
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
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  return {
    transactions: transactions || [],
    isLoading,
  };
}
