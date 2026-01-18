/**
 * Hook to get wallet native token balance (CRO)
 */

import { useAccount } from 'wagmi';
import { useEthersSigner } from './useEthersSigner';
import { formatEther } from 'ethers';
import { useQuery } from '@tanstack/react-query';

export function useWalletBalance() {
  const { address } = useAccount();
  const signer = useEthersSigner();

  const { data: balance, isLoading } = useQuery({
    queryKey: ['wallet-balance', address],
    queryFn: async () => {
      if (!signer || !address) throw new Error('Signer or address not available');
      
      const balance = await signer.provider.getBalance(address);
      return {
        raw: balance.toString(),
        formatted: formatEther(balance),
      };
    },
    enabled: !!signer && !!address,
    refetchInterval: 10000, // Refetch every 10 seconds
  });

  return {
    balance,
    isLoading,
  };
}
