/**
 * Wallet Context
 * 
 * Provides wallet state to all components via React Context
 */

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { connectWallet, disconnectWallet, getWalletAddress, saveWalletAddress, type WalletState } from '../lib/wallet/wallet';

interface WalletContextType {
  wallet: WalletState;
  isConnecting: boolean;
  error: string | null;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function WalletProvider({ children }: { children: ReactNode }) {
  const [wallet, setWallet] = useState<WalletState>({
    address: null,
    isConnected: false,
    provider: null,
    signer: null,
  });
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check for existing connection on mount
  // Only restore address, don't create provider/signer automatically
  // User must click "Connect Wallet" to establish full connection
  useEffect(() => {
    const savedAddress = getWalletAddress();
    if (savedAddress && !wallet.address) {
      // Only set address if wallet is not already connected
      setWallet((prev) => ({ 
        ...prev, 
        address: savedAddress,
        isConnected: false, // Not fully connected until user clicks connect
        provider: null,
        signer: null,
      }));
    }
  }, []); // Only run once on mount

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

  return (
    <WalletContext.Provider value={{ wallet, isConnecting, error, connect, disconnect }}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
}
