/**
 * useWallet Hook
 * 
 * React hook for wallet connection management
 */

import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
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

  // Check for existing connection on mount and reconnect to get signer
  useEffect(() => {
    const reconnectWallet = async () => {
      const savedAddress = getWalletAddress();
      if (savedAddress && typeof window !== 'undefined' && (window as any).ethereum) {
        try {
          // Reconnect to get provider and signer
          const ethereum = (window as any).ethereum;
          const provider = new ethers.BrowserProvider(ethereum);
          const signer = await provider.getSigner();
          const currentAddress = await signer.getAddress();
          
          // Verify it's the same address
          if (currentAddress.toLowerCase() === savedAddress.toLowerCase()) {
            setWallet({
              address: currentAddress,
              isConnected: true,
              provider,
              signer,
            });
          } else {
            // Address changed, clear saved address
            localStorage.removeItem('wallet-address');
            setWallet({
              address: null,
              isConnected: false,
              provider: null,
              signer: null,
            });
          }
        } catch (error) {
          // Failed to reconnect, clear saved address
          console.warn('Failed to reconnect wallet:', error);
          localStorage.removeItem('wallet-address');
          setWallet({
            address: null,
            isConnected: false,
            provider: null,
            signer: null,
          });
        }
      }
    };
    
    reconnectWallet();
  }, []);

  const connect = useCallback(async () => {
    setIsConnecting(true);
    setError(null);
    try {
      const walletState = await connectWallet();
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
