/**
 * Hook to get ethers.Signer from wagmi walletClient
 * 
 * This avoids the deadlock issue between BrowserProvider.getSigner() and RainbowKit/wagmi
 * by reusing the already-resolved walletClient from wagmi.
 */

import { useWalletClient } from 'wagmi';
import { BrowserProvider, JsonRpcSigner } from 'ethers';
import { useEffect, useState } from 'react';

export function useEthersSigner() {
  const { data: walletClient } = useWalletClient();
  const [signer, setSigner] = useState<JsonRpcSigner | null>(null);

  useEffect(() => {
    if (!walletClient) {
      setSigner(null);
      return;
    }

    let cancelled = false;

    async function createSigner() {
      try {
        if (!walletClient) {
          return;
        }
        // Use walletClient.transport which is EIP-1193 compatible
        // This avoids deadlock because walletClient already has account and chain resolved
        const provider = new BrowserProvider(walletClient.transport, 'any');
        const s = await provider.getSigner(walletClient.account.address);

        if (!cancelled) {
          setSigner(s);
        }
      } catch (error) {
        console.error('Failed to create ethers signer:', error);
        if (!cancelled) {
          setSigner(null);
        }
      }
    }

    createSigner();

    return () => {
      cancelled = true;
    };
  }, [walletClient]);

  return signer;
}
