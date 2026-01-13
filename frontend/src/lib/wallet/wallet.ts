/**
 * Wallet Integration
 * 
 * MetaMask and wallet connection utilities
 */

import { ethers } from 'ethers';

export interface WalletState {
  address: string | null;
  isConnected: boolean;
  provider: ethers.BrowserProvider | null;
  signer: ethers.JsonRpcSigner | null;
}

const CRONOS_TESTNET = {
  chainId: '0x152', // 338 in hex
  chainName: 'Cronos Testnet',
  nativeCurrency: {
    name: 'CRO',
    symbol: 'CRO',
    decimals: 18,
  },
  rpcUrls: ['https://evm-t3.cronos.org'],
  blockExplorerUrls: ['https://testnet.cronoscan.com'],
};

export async function connectWallet(): Promise<WalletState> {
  if (typeof window === 'undefined') {
    throw new Error('This function must be called in a browser environment');
  }

  // Get ethereum provider - handle multiple wallet extensions
  let ethereum: any;
  
  if ((window as any).ethereum) {
    ethereum = (window as any).ethereum;
    // Prefer MetaMask if multiple providers exist
    if (ethereum.providers && Array.isArray(ethereum.providers)) {
      ethereum = ethereum.providers.find((p: any) => p.isMetaMask) || ethereum.providers[0];
    }
  } else {
    throw new Error('MetaMask is not installed. Please install MetaMask extension.');
  }

  // Validate ethereum provider is ready
  if (!ethereum || typeof ethereum.request !== 'function') {
    throw new Error('Invalid wallet provider. Please refresh the page and try again.');
  }

  try {
    // Request account access with better error handling
    let accounts: string[];
    try {
      accounts = await ethereum.request({
        method: 'eth_requestAccounts',
      });
    } catch (requestError: any) {
      if (requestError.code === 4001) {
        throw new Error('User rejected connection request');
      }
      throw new Error(`Failed to connect: ${requestError.message || 'Unknown error'}`);
    }

    if (!accounts || accounts.length === 0) {
      throw new Error('No accounts found. Please unlock MetaMask.');
    }

    // Check if we're on the correct network
    let chainId: string;
    try {
      chainId = await ethereum.request({ method: 'eth_chainId' });
    } catch (error) {
      throw new Error('Failed to get chain ID. Please check MetaMask.');
    }
    
    if (chainId !== CRONOS_TESTNET.chainId) {
      try {
        await ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: CRONOS_TESTNET.chainId }],
        });
        // Wait a bit for the network to switch
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (switchError: any) {
        // This error code indicates that the chain has not been added to MetaMask
        if (switchError.code === 4902) {
          try {
            await ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [CRONOS_TESTNET],
            });
            // Wait a bit for the network to be added
            await new Promise(resolve => setTimeout(resolve, 1000));
          } catch (addError: any) {
            throw new Error(`Failed to add Cronos Testnet: ${addError.message}`);
          }
        } else if (switchError.code === 4001) {
          throw new Error('User rejected network switch');
        } else {
          throw new Error(`Failed to switch network: ${switchError.message}`);
        }
      }
    }

    // Create provider and signer
    // Use a more robust approach to avoid _detectNetwork errors
    // Wait a bit to ensure network is stable
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Verify chain ID again after potential switch
    const finalChainId = await ethereum.request({ method: 'eth_chainId' });
    if (finalChainId !== CRONOS_TESTNET.chainId) {
      throw new Error(`Network mismatch. Expected Cronos Testnet (${CRONOS_TESTNET.chainId}), got ${finalChainId}`);
    }

    let provider: ethers.BrowserProvider;
    let signer: ethers.JsonRpcSigner;
    let address: string;
    
    // Try creating provider with explicit network first
    try {
      // Create provider with explicit network config to avoid auto-detection
      provider = new ethers.BrowserProvider(ethereum, {
        name: 'Cronos Testnet',
        chainId: 338,
      });
      
      // Get signer with error handling
      signer = await provider.getSigner();
      address = await signer.getAddress();
    } catch (providerError: any) {
      const errorMsg = providerError?.message || String(providerError);
      const isNetworkError = errorMsg.includes('_detectNetwork') || 
                            errorMsg.includes('Unexpected error') ||
                            errorMsg.includes('evmAsk') ||
                            errorMsg.includes('selectExtension');
      
      if (isNetworkError) {
        // Fallback: Create provider without explicit network, but ensure network is correct first
        // This is a workaround for the ethers.js _detectNetwork issue
        try {
          // Wait a bit more before retry
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Verify network is still correct
          const verifyChainId = await ethereum.request({ method: 'eth_chainId' });
          if (verifyChainId !== CRONOS_TESTNET.chainId) {
            throw new Error('Network changed during provider creation');
          }
          
          // Create provider without network spec (ethers will use current network)
          provider = new ethers.BrowserProvider(ethereum);
          signer = await provider.getSigner();
          address = await signer.getAddress();
        } catch (fallbackError: any) {
          throw new Error(`Failed to create wallet provider: ${fallbackError.message || 'Unknown error'}. Please refresh the page and try again.`);
        }
      } else {
        throw providerError;
      }
    }

    return {
      address,
      isConnected: true,
      provider,
      signer,
    };
  } catch (error: any) {
    if (error.code === 4001) {
      throw new Error('User rejected connection request');
    }
    throw new Error(error.message || 'Failed to connect wallet');
  }
}

export async function disconnectWallet(): Promise<void> {
  // MetaMask doesn't have a disconnect method, just clear local state
  localStorage.removeItem('wallet-address');
}

export function getWalletAddress(): string | null {
  return localStorage.getItem('wallet-address');
}

export function saveWalletAddress(address: string): void {
  localStorage.setItem('wallet-address', address);
}

/**
 * Try to reconnect to a previously connected wallet
 * This checks if MetaMask is still connected and restores the connection
 */
export async function tryReconnectWallet(): Promise<WalletState | null> {
  if (typeof window === 'undefined') {
    return null;
  }

  const savedAddress = getWalletAddress();
  if (!savedAddress) {
    return null;
  }

  // Check if MetaMask is available
  if (!(window as any).ethereum) {
    return null;
  }

  try {
    const ethereum = (window as any).ethereum;
    
    // Validate ethereum provider
    if (!ethereum || typeof ethereum.request !== 'function') {
      return null;
    }
    
    // Check if we have permission to access accounts
    let accounts: string[];
    try {
      accounts = await ethereum.request({ method: 'eth_accounts' });
    } catch {
      // No permission, user needs to reconnect
      return null;
    }

    // Check if saved address is in the list of connected accounts
    if (!accounts || accounts.length === 0 || !accounts.includes(savedAddress)) {
      // Account not connected anymore
      localStorage.removeItem('wallet-address');
      return null;
    }

    // Check network
    let chainId: string;
    try {
      chainId = await ethereum.request({ method: 'eth_chainId' });
    } catch {
      return null;
    }

    // Switch to correct network if needed (but don't throw if user rejects)
    if (chainId !== CRONOS_TESTNET.chainId) {
      try {
        await ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: CRONOS_TESTNET.chainId }],
        });
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (switchError: any) {
        if (switchError.code === 4902) {
          try {
            await ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [CRONOS_TESTNET],
            });
            await new Promise(resolve => setTimeout(resolve, 1000));
          } catch {
            // User rejected or failed, but continue with current network
          }
        }
        // If user rejected, continue anyway
      }
    }

    // Create provider and signer with robust error handling
    // Wait a bit to ensure network is stable
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Verify chain ID
    const finalChainId = await ethereum.request({ method: 'eth_chainId' });
    if (finalChainId !== CRONOS_TESTNET.chainId) {
      // Network not correct, but don't throw - just return null
      return null;
    }

    let provider: ethers.BrowserProvider;
    let signer: ethers.JsonRpcSigner;
    
    try {
      // Try with explicit network first
      provider = new ethers.BrowserProvider(ethereum, {
        name: 'Cronos Testnet',
        chainId: 338,
      });
      signer = await provider.getSigner();
      const address = await signer.getAddress();
      
      // Verify address matches saved address
      if (address.toLowerCase() !== savedAddress.toLowerCase()) {
        // Different account selected, update saved address
        saveWalletAddress(address);
      }

      return {
        address,
        isConnected: true,
        provider,
        signer,
      };
    } catch (providerError: any) {
      const errorMsg = providerError?.message || String(providerError);
      const isNetworkError = errorMsg.includes('_detectNetwork') || 
                            errorMsg.includes('Unexpected error') ||
                            errorMsg.includes('evmAsk') ||
                            errorMsg.includes('selectExtension');
      
      if (isNetworkError) {
        // Fallback: try without explicit network
        try {
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Verify network is still correct
          const verifyChainId = await ethereum.request({ method: 'eth_chainId' });
          if (verifyChainId !== CRONOS_TESTNET.chainId) {
            return null;
          }
          
          provider = new ethers.BrowserProvider(ethereum);
          signer = await provider.getSigner();
          const address = await signer.getAddress();
          
          if (address.toLowerCase() !== savedAddress.toLowerCase()) {
            saveWalletAddress(address);
          }

          return {
            address,
            isConnected: true,
            provider,
            signer,
          };
        } catch {
          // Silent fail for auto-reconnect
          return null;
        }
      }
      // For other errors, return null (silent fail for auto-reconnect)
      return null;
    }
  } catch {
    // Any error means we can't reconnect
    return null;
  }
}

// Extend Window interface for TypeScript
declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: any[] }) => Promise<any>;
      on?: (event: string, handler: (...args: any[]) => void) => void;
      removeListener?: (event: string, handler: (...args: any[]) => void) => void;
      isMetaMask?: boolean;
      providers?: any[];
    };
  }
}
