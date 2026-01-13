/**
 * Wallet Context
 * 
 * Provides wallet state to all components via React Context
 */

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { connectWallet, disconnectWallet, saveWalletAddress, checkWalletAvailability, type WalletState } from '../lib/wallet/wallet';

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

  // Check wallet availability on mount (only identify, don't connect)
  useEffect(() => {
    let mounted = true;
    
    const checkWallet = async () => {
      // Only check if ethereum provider exists and is ready
      if (typeof window === 'undefined') {
        return;
      }

      const ethereum = (window as any).ethereum;
      if (!ethereum || typeof ethereum.request !== 'function') {
        return;
      }

      try {
        const availableAddress = await checkWalletAvailability();
        if (mounted && availableAddress) {
          // Only set address, don't create provider/signer
          // User must click "Connect Wallet" to establish full connection
          setWallet((prev) => ({
            ...prev,
            address: availableAddress,
            isConnected: false, // Not fully connected until user clicks
            provider: null,
            signer: null,
          }));
        } else if (mounted && !availableAddress) {
          // No wallet available or no permission
          setWallet({
            address: null,
            isConnected: false,
            provider: null,
            signer: null,
          });
        }
      } catch (error) {
        // Silently fail - don't log to avoid console noise
        // This prevents errors from appearing when wallet is not connected
      }
    };

    // Delay check slightly to ensure page is fully loaded
    const timeoutId = setTimeout(() => {
      checkWallet();
    }, 100);

    // Listen for account changes (only to update address, not to reconnect)
    if (typeof window !== 'undefined' && (window as any).ethereum) {
      const ethereum = (window as any).ethereum;
      
      // Only set up listeners if ethereum provider is valid
      if (ethereum && typeof ethereum.on === 'function') {
        const handleAccountsChanged = (accounts: string[]) => {
          if (mounted) {
            if (accounts.length === 0) {
              // User disconnected
              disconnect();
            } else {
              // Account changed, just check availability again
              checkWallet();
            }
          }
        };

        const handleChainChanged = () => {
          if (mounted) {
            // Network changed, just check availability again
            checkWallet();
          }
        };

        ethereum.on('accountsChanged', handleAccountsChanged);
        ethereum.on('chainChanged', handleChainChanged);

        return () => {
          mounted = false;
          if (ethereum && typeof ethereum.removeListener === 'function') {
            ethereum.removeListener('accountsChanged', handleAccountsChanged);
            ethereum.removeListener('chainChanged', handleChainChanged);
          }
        };
      }
    }

    return () => {
      mounted = false;
      clearTimeout(timeoutId);
    };
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
