/**
 * useWallet Hook
 * 
 * React hook for wallet connection management
 */

import { useState, useEffect, useCallback } from 'react';
import { connectWallet, disconnectWallet, getWalletAddress, saveWalletAddress, type WalletState } from '../lib/wallet/wallet';

export function useWallet() {
  const [wallet, setWallet] = useState<WalletState>({
    address: null,
    isConnected: false,
    provider: null,
    signer: null,
  });
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check for existing connection on mount
  // Note: We don't auto-reconnect to avoid _detectNetwork errors
  // User must click "Connect Wallet" to establish connection
  useEffect(() => {
    const savedAddress = getWalletAddress();
    if (savedAddress) {
      // Only restore address, don't create provider/signer automatically
      // This avoids the _detectNetwork error on page load
      setWallet((prev) => ({ 
        ...prev, 
        address: savedAddress,
        // Keep provider and signer as null until user explicitly connects
      }));
    }
  }, []);

  const connect = useCallback(async () => {
    setIsConnecting(true);
    setError(null);
    try {
      console.log('useWallet: Connecting wallet...');
      const walletState = await connectWallet();
      console.log('useWallet: Wallet connected:', { 
        address: walletState.address, 
        hasProvider: !!walletState.provider, 
        hasSigner: !!walletState.signer 
      });
      setWallet(walletState);
      if (walletState.address) {
        saveWalletAddress(walletState.address);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to connect wallet';
      setError(errorMessage);
      console.error('Wallet connection error:', err);
      setWallet({
        address: null,
        isConnected: false,
        provider: null,
        signer: null,
      });
      // Show user-friendly error
      alert(`Wallet Connection Error: ${errorMessage}`);
    } finally {
      setIsConnecting(false);
    }
  }, []);

  const disconnect = useCallback(async () => {
    await disconnectWallet();
    setWallet({
      address: null,
      isConnected: false,
      provider: null,
      signer: null,
    });
    setError(null);
  }, []);

  return {
    wallet,
    isConnecting,
    error,
    connect,
    disconnect,
  };
}
