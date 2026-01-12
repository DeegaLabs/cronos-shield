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
    console.log('WalletContext: Mount effect - savedAddress:', savedAddress, 'current wallet.address:', wallet.address);
    if (savedAddress && !wallet.address) {
      // Only set address if wallet is not already connected
      console.log('WalletContext: Restoring address from localStorage');
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
      console.log('WalletContext: Connecting wallet...');
      const walletState = await connectWallet();
      console.log('WalletContext: Wallet connected:', { 
        address: walletState.address, 
        hasProvider: !!walletState.provider, 
        hasSigner: !!walletState.signer 
      });
      console.log('WalletContext: Setting wallet state...');
      setWallet(walletState);
      console.log('WalletContext: Wallet state set. New state:', {
        address: walletState.address,
        isConnected: walletState.isConnected,
        hasProvider: !!walletState.provider,
        hasSigner: !!walletState.signer
      });
      if (walletState.address) {
        saveWalletAddress(walletState.address);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to connect wallet';
      setError(errorMessage);
      console.error('WalletContext: Connection error:', err);
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
