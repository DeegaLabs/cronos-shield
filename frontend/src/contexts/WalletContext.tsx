/**
 * Wallet Context
 * 
 * Provides wallet state to all components via React Context
 */

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { connectWallet, disconnectWallet, saveWalletAddress, tryReconnectWallet, type WalletState } from '../lib/wallet/wallet';

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

  // Try to reconnect to wallet on mount
  useEffect(() => {
    let mounted = true;
    let reconnectTimeout: NodeJS.Timeout | null = null;
    
    const attemptReconnect = async () => {
      // Debounce: only attempt reconnect if not already connecting
      if (isConnecting) {
        return;
      }
      
      try {
        const reconnectedWallet = await tryReconnectWallet();
        if (mounted && reconnectedWallet) {
          setWallet(reconnectedWallet);
        }
      } catch (error) {
        // Silently fail - user will need to reconnect manually
        console.debug('Auto-reconnect failed:', error);
      }
    };

    // Delay initial reconnect to avoid conflicts
    reconnectTimeout = setTimeout(() => {
      attemptReconnect();
    }, 1000);

    // Listen for account changes
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
              // Account changed, try to reconnect after a delay
              setTimeout(() => {
                if (mounted) {
                  attemptReconnect();
                }
              }, 500);
            }
          }
        };

        const handleChainChanged = () => {
          if (mounted) {
            // Network changed, wait a bit then try to reconnect
            setTimeout(() => {
              if (mounted) {
                attemptReconnect();
              }
            }, 1000);
          }
        };

        ethereum.on('accountsChanged', handleAccountsChanged);
        ethereum.on('chainChanged', handleChainChanged);

        return () => {
          mounted = false;
          if (reconnectTimeout) {
            clearTimeout(reconnectTimeout);
          }
          if (ethereum && typeof ethereum.removeListener === 'function') {
            ethereum.removeListener('accountsChanged', handleAccountsChanged);
            ethereum.removeListener('chainChanged', handleChainChanged);
          }
        };
      }
    }

    return () => {
      mounted = false;
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }
    };
  }, [isConnecting]); // Re-run if connection state changes

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
