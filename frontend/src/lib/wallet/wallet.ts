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
    // Specify network explicitly to avoid _detectNetwork error
    const provider = new ethers.BrowserProvider(ethereum, {
      name: 'Cronos Testnet',
      chainId: 338,
    });
    const signer = await provider.getSigner();
    const address = await signer.getAddress();

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

// Extend Window interface for TypeScript
declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: any[] }) => Promise<any>;
      on: (event: string, handler: (...args: any[]) => void) => void;
      removeListener: (event: string, handler: (...args: any[]) => void) => void;
      isMetaMask?: boolean;
    };
  }
}
