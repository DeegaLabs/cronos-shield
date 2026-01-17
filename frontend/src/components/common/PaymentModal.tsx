/**
 * Payment Modal Component
 * 
 * Modal for x402 payment flow
 */

import { useEffect, useState } from 'react';
import { useWalletClient } from 'wagmi';
import type { PaymentChallenge } from '../../types/x402.types';
// DO NOT import Facilitator here - it causes evmAsk error on page load
// Import it dynamically only when needed (inside handlePay)

interface PaymentModalProps {
  challenge: PaymentChallenge | null;
  walletAddress: string | null;
  signer?: any; // Deprecated: signer is now created internally
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (paymentId: string) => void;
}

export default function PaymentModal({
  challenge,
  walletAddress,
  signer: _signer, // Deprecated: kept for backward compatibility but not used
  isOpen,
  onClose,
  onSuccess,
}: PaymentModalProps) {
  // Get walletClient from wagmi - this is already connected and working
  const { data: walletClient } = useWalletClient();
  // ALL HOOKS MUST BE CALLED BEFORE ANY EARLY RETURNS
  // This is a React rule - hooks must be called in the same order every render
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setIsProcessing(false);
      setError(null);
      setTxHash(null);
    }
  }, [isOpen]);

  // Early return AFTER all hooks
  if (!isOpen || !challenge) {
    return null;
  }
  
  // CRITICAL: Don't access signer or any wallet-related code during render
  // This prevents evmAsk errors when PaymentModal is lazy-loaded
  // Only access signer inside handlePay when user actually clicks "Pay"
  
  const accept = challenge.accepts[0];
  const amount = accept
    ? (parseInt(accept.maxAmountRequired) / 1000000).toFixed(1)
    : '1.0';

  // Show modal even if wallet not connected, but show warning
  // Check if wallet is connected via window.ethereum instead of relying on signer prop
  // The signer will be created internally in handlePay if needed
  const ethereum = typeof window !== 'undefined' ? (window as any).ethereum : null;
  const hasEthereum = !!ethereum;
  // Wallet is ready if we have address and ethereum provider (signer will be created on demand)
  const isWalletReady = !!(walletAddress && hasEthereum);
  
  if (!walletAddress || !hasEthereum) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-slate-800 rounded-lg border border-yellow-500 max-w-md w-full p-6">
          <h3 className="text-xl font-bold text-yellow-400 mb-4">⚠️ Wallet Not Connected</h3>
          <p className="text-slate-300 mb-4">
            Please connect your wallet first to make payments. Click "Connect Wallet" in the header.
          </p>
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  const handlePay = async () => {
    console.log('🚀 handlePay called');
    console.log('📋 Initial state:', {
      walletAddress,
      hasChallenge: !!challenge,
      isProcessing,
    });
    
    if (!walletAddress || !challenge) {
      console.error('❌ Missing requirements:', { walletAddress, challenge: !!challenge });
      return;
    }
    
    // Dispatch event to allow errors during payment flow
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('payment-flow-start'));
    }
    
    console.log('⏳ Starting payment process...');
    setIsProcessing(true);
    setError(null);
    setTxHash(null);

    try {
      console.log('📦 Step 1: Getting payment requirements...');
      // Get payment requirements first to know which network we need
      const accept = challenge.accepts[0];
      if (!accept) {
        throw new Error('No payment method available');
      }
      console.log('✅ Payment requirements obtained:', {
        payTo: accept.payTo,
        value: accept.maxAmountRequired,
        network: accept.network,
      });

      console.log('📦 Step 2: Using walletClient from wagmi to create signer...');
      // Use walletClient from wagmi (already connected) instead of creating new provider
      // This avoids the BrowserProvider.getSigner() hang issue
      if (!walletClient) {
        throw new Error('Wallet client not available. Please reconnect your wallet.');
      }
      console.log('✅ WalletClient found');

      console.log('📦 Step 3: Importing ethers...');
      const { ethers } = await import('ethers');
      console.log('✅ Ethers imported');
      
      console.log('📦 Step 4: Creating signer from walletClient transport...');
      // Use walletClient.transport which is the ethereum provider
      // This is the same provider that wagmi is using, so it should work
      const expectedChainId = accept.network === 'cronos-mainnet' ? 25 : 338;
      const networkConfig = {
        chainId: expectedChainId,
        name: accept.network === 'cronos-mainnet' ? 'Cronos Mainnet' : 'Cronos Testnet',
      };
      
      let currentSigner: any;
      try {
        // Get transport from walletClient (this is the ethereum provider)
        const transport = (walletClient as any).transport?.value || (walletClient as any).transport;
        if (!transport) {
          throw new Error('WalletClient transport not available');
        }
        
        console.log('📋 Creating provider from walletClient transport...');
        const provider = new ethers.BrowserProvider(transport, networkConfig);
        console.log('✅ Provider created from walletClient');
        
        console.log('⏳ Getting signer...');
        // Try to get signer with timeout
        const signerPromise = provider.getSigner(walletAddress);
        const signerTimeout = new Promise<never>((_, reject) => {
          setTimeout(() => {
            reject(new Error('getSigner() timed out'));
          }, 3000); // 3 seconds
        });
        
        currentSigner = await Promise.race([signerPromise, signerTimeout]);
        console.log('✅ Signer obtained from walletClient');
      } catch (transportError: any) {
        console.warn('⚠️ Failed with walletClient transport, trying window.ethereum directly...', transportError);
        // Fallback: use window.ethereum directly
        const ethereumProvider = (window as any).ethereum;
        if (!ethereumProvider) {
          throw new Error('MetaMask not found. Please refresh the page.');
        }
        
        const provider = new ethers.BrowserProvider(ethereumProvider, networkConfig);
        console.log('⏳ Getting signer from window.ethereum...');
        currentSigner = await provider.getSigner(walletAddress);
        console.log('✅ Signer obtained from window.ethereum');
      }
      
      console.log('📦 Step 7: Validating signer address...');
      // Verify we can get the address from the signer
      let signerAddress: string;
      try {
        signerAddress = await currentSigner.getAddress();
        console.log('✅ Signer created, address:', signerAddress);
        
        // Verify the address matches the walletAddress prop
        if (signerAddress.toLowerCase() !== walletAddress.toLowerCase()) {
          console.warn('⚠️ Signer address does not match walletAddress prop, using signer address');
        }
      } catch (addressError: any) {
        console.error('❌ Signer validation failed:', addressError);
        throw new Error('Wallet signer is not valid. Please reconnect your wallet.');
      }

      console.log('📦 Step 8: Checking network...');
      // Check network using walletClient first (faster, already available)
      const targetChainId = accept.network === 'cronos-mainnet' ? 25 : 338;
      const expectedChainIdBigInt = BigInt(targetChainId);
      const chainIdHex = accept.network === 'cronos-mainnet' ? '0x19' : '0x152';
      
      let currentChainId: bigint;
      if (walletClient?.chain?.id) {
        // Use chain ID from walletClient (already available, no async call needed)
        currentChainId = BigInt(walletClient.chain.id);
        console.log('✅ Current chain ID from walletClient:', currentChainId.toString());
      } else {
        // Fallback: get chain ID from ethereum provider
        console.log('⚠️ walletClient chain not available, checking via ethereum provider...');
        const ethereumProvider = (window as any).ethereum;
        if (!ethereumProvider) {
          throw new Error('MetaMask not found');
        }

        try {
          const chainIdPromise = ethereumProvider.request({ method: 'eth_chainId' });
          const chainIdTimeout = new Promise<never>((_, reject) => {
            setTimeout(() => reject(new Error('eth_chainId request timed out')), 5000);
          });
          const chainId = await Promise.race([chainIdPromise, chainIdTimeout]);
          console.log('✅ Current chain ID from provider:', chainId);
          const chainIdNum = parseInt(chainId, 16);
          currentChainId = BigInt(chainIdNum);
        } catch (error: any) {
          console.error('❌ Failed to get chain ID:', error);
          throw new Error('Failed to get chain ID. Please check MetaMask.');
        }
      }
      
      if (currentChainId !== expectedChainIdBigInt) {
        console.log(`⚠️ Wrong network. Current: ${currentChainId}, Expected: ${expectedChainIdBigInt}`);
        console.log('🔄 Requesting network switch...');
        const ethereumProvider = (window as any).ethereum;
        if (!ethereumProvider) {
          throw new Error('MetaMask not found');
        }
        
        try {
          const switchPromise = ethereumProvider.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: chainIdHex }],
          });
          const switchTimeout = new Promise<never>((_, reject) => {
            setTimeout(() => reject(new Error('Network switch request timed out. Please switch manually in MetaMask.')), 30000); // 30 seconds for user to approve
          });
          await Promise.race([switchPromise, switchTimeout]);
          console.log('✅ Network switched successfully');
          await new Promise(resolve => setTimeout(resolve, 2000)); // Wait longer after switch
        } catch (e: any) {
          if (e?.code === 4902 && accept.network === 'cronos-testnet') {
            console.log('📝 Network not added, adding Cronos Testnet...');
            const addPromise = ethereumProvider.request({
              method: 'wallet_addEthereumChain',
              params: [{
                chainId: '0x152',
                chainName: 'Cronos Testnet',
                nativeCurrency: { name: 'tCRO', symbol: 'tCRO', decimals: 18 },
                rpcUrls: ['https://evm-t3.cronos.org'],
                blockExplorerUrls: ['https://testnet.cronoscan.com'],
              }],
            });
            const addTimeout = new Promise<never>((_, reject) => {
              setTimeout(() => reject(new Error('Add network request timed out. Please add Cronos Testnet manually in MetaMask.')), 30000);
            });
            await Promise.race([addPromise, addTimeout]);
            console.log('✅ Network added successfully');
            await new Promise(resolve => setTimeout(resolve, 2000));
          } else if (e?.code === 4001) {
            throw new Error('Network switch rejected. Please switch to Cronos Testnet manually in MetaMask.');
          } else {
            console.error('❌ Network switch error:', e);
            const networkName = accept.network === 'cronos-mainnet' ? 'Mainnet' : 'Testnet';
            throw new Error(`Failed to switch network: ${e?.message || `Please switch to Cronos ${networkName} manually in MetaMask.`}`);
          }
        }
      } else {
        console.log('✅ Already on correct network');
      }
      
      // Verify signer is still valid and get a fresh one if needed
      // Following the official examples pattern: create provider WITHOUT network config
      // Network is ensured separately via ensureCronosChain
      // currentSigner is already created above

      // CRITICAL: Import Facilitator dynamically ONLY when needed (inside handlePay)
      // This prevents the SDK from loading on page load, which causes evmAsk error
      console.log('📦 Importing Facilitator SDK...');
      const { Facilitator, CronosNetwork } = await import('@crypto.com/facilitator-client');
      console.log('✅ Facilitator SDK imported');
      
      // Map network string to CronosNetwork enum (following official docs)
      const cronosNetwork = accept.network === 'cronos-mainnet' 
        ? CronosNetwork.CronosMainnet 
        : CronosNetwork.CronosTestnet;
      
      const facilitator = new Facilitator({ network: cronosNetwork });
      console.log('✅ Facilitator instance created for network:', accept.network);

      // Get payment ID from challenge
      const paymentId = accept.extra?.paymentId;
      if (!paymentId) {
        throw new Error('Payment ID not found in challenge');
      }

      // Generate payment header with retry logic
      const validBefore = Math.floor(Date.now() / 1000) + accept.maxTimeoutSeconds;
      console.log('💰 Payment parameters:', {
        to: accept.payTo,
        value: accept.maxAmountRequired,
        asset: accept.asset,
        validBefore,
        signerAddress,
      });
      
      let paymentHeader: string | null = null;
      let retries = 2;
      let lastError: Error | null = null;
      
      while (retries > 0 && !paymentHeader) {
        try {
          // Small delay before attempting to generate header
          await new Promise(resolve => setTimeout(resolve, 200));
          
          console.log(`🔄 Attempting to generate payment header (attempt ${3 - retries}/2)...`);
          // Don't access signer.provider here - it can trigger evmAsk error
          // Only access signer methods that are safe
          try {
            const addr = await currentSigner.getAddress();
            console.log('🔍 Signer check:', {
              hasSigner: !!currentSigner,
              signerAddress: addr,
            });
          } catch (e) {
            console.log('🔍 Signer check: signer exists but address check failed');
          }
          
          // This should trigger MetaMask to open for signing
          console.log('⏳ Calling facilitator.generatePaymentHeader() - MetaMask should open now...');
          console.log('📋 Payment parameters:', {
            to: accept.payTo,
            value: accept.maxAmountRequired,
            asset: accept.asset,
            signerAddress: signerAddress,
            validBefore,
          });
          
          // Check if MetaMask is available and unlocked
          const ethereum = (window as any).ethereum;
          if (ethereum) {
            try {
              const accounts = await ethereum.request({ method: 'eth_accounts' });
              if (accounts.length === 0) {
                throw new Error('No accounts found. Please connect your wallet in MetaMask.');
              }
              console.log('✅ MetaMask accounts found:', accounts.length);
            } catch (accountError: any) {
              console.error('❌ MetaMask account check failed:', accountError);
              throw new Error('MetaMask is not connected. Please connect your wallet and try again.');
            }
          }
          
          // Add timeout to detect if MetaMask is not responding
          const timeoutPromise = new Promise<never>((_, reject) => {
            setTimeout(() => {
              reject(new Error('Payment header generation timed out after 60 seconds. MetaMask may not have opened for signing. Please check: 1) MetaMask is unlocked, 2) No other popup is blocking it, 3) Try refreshing the page.'));
            }, 60000); // 60 seconds timeout
          });
          
          console.log('🔐 Requesting signature from MetaMask...');
          console.log('📝 Signer details:', {
            hasSigner: !!currentSigner,
            signerType: currentSigner?.constructor?.name,
            signerAddress: signerAddress,
          });
          
          // Verify signer has the _signTypedData method (required for EIP-712)
          if (!currentSigner || typeof (currentSigner as any)._signTypedData !== 'function') {
            console.warn('⚠️ Signer may not support EIP-712 signing');
          }
          
          // Verify signer has signTypedData method before calling
          console.log('🔍 Verifying signer capabilities...');
          if (!currentSigner || typeof currentSigner.signTypedData !== 'function') {
            console.error('❌ Signer does not have signTypedData method');
            console.error('Signer type:', typeof currentSigner);
            console.error('Signer methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(currentSigner)));
            throw new Error('Signer does not support EIP-712 signing. Please reconnect your wallet.');
          }
          console.log('✅ Signer has signTypedData method');
          
          // Test if we can get the address (this should work)
          try {
            const testAddress = await currentSigner.getAddress();
            console.log('✅ Signer address verification:', testAddress);
          } catch (addrError: any) {
            console.error('❌ Failed to get signer address:', addrError);
            throw new Error('Signer is not valid. Please reconnect your wallet.');
          }
          
          try {
            console.log('📝 Calling facilitator.generatePaymentHeader()...');
            console.log('📋 Signer details:', {
              hasSigner: !!currentSigner,
              hasSignTypedData: typeof currentSigner.signTypedData === 'function',
              signerType: currentSigner.constructor?.name,
            });
            
            const generateHeaderPromise = facilitator.generatePaymentHeader({
              to: accept.payTo,
              value: accept.maxAmountRequired,
              asset: accept.asset as any, // Cast to SDK's Contract type (compatible structure)
              signer: currentSigner,
              validBefore,
              validAfter: 0,
            });
            
            console.log('⏳ Waiting for MetaMask signature (this may take a moment)...');
            console.log('💡 If MetaMask does not open, check:');
            console.log('   1. MetaMask is unlocked');
            console.log('   2. No other popup is blocking it');
            console.log('   3. Browser popup blocker is disabled');
            
            paymentHeader = await Promise.race([generateHeaderPromise, timeoutPromise]);
            
            console.log('✅ Payment header generated successfully, length:', paymentHeader.length);
            console.log('✅ Payment header preview:', paymentHeader.substring(0, 50) + '...');
          } catch (signError: any) {
            console.error('❌ Signature error caught:', signError);
            console.error('Error type:', signError?.constructor?.name);
            console.error('Error message:', signError?.message);
            console.error('Error code:', signError?.code);
            console.error('Error stack:', signError?.stack);
            
            // Check if it's a user rejection
            if (signError?.code === 4001 || signError?.message?.includes('rejected') || signError?.message?.includes('denied')) {
              throw new Error('Signature rejected. Please approve the transaction in MetaMask.');
            }
            
            // Check if it's a timeout
            if (signError?.message?.includes('timed out')) {
              throw new Error('MetaMask did not respond. Please check: 1) MetaMask is unlocked, 2) No popup blocker, 3) Try refreshing the page.');
            }
            
            throw signError;
          }
          
          // Success, break out of retry loop
          break;
        } catch (headerError: any) {
          console.error('Payment header generation failed:', headerError);
          console.error('Error details:', {
            message: headerError?.message,
            stack: headerError?.stack,
            code: headerError?.code,
            name: headerError?.name,
          });
          
          retries--;
          const errorMsg = headerError?.message || String(headerError);
          const isUnexpectedError = errorMsg.includes('Unexpected error') || 
                                    errorMsg.includes('evmAsk') ||
                                    errorMsg.includes('selectExtension') ||
                                    errorMsg.includes('_detectNetwork');
          
          if (isUnexpectedError && retries > 0) {
            console.log('Retrying with fresh signer...');
            // Wait a bit longer before retry
            await new Promise(resolve => setTimeout(resolve, 1000));
            // Try to get a fresh signer (without network config to avoid _detectNetwork error)
            try {
              const { ethers } = await import('ethers');
              const ethereum = (window as any).ethereum;
              if (!ethereum) {
                throw new Error('MetaMask not found');
              }
              // Create provider WITHOUT explicit network config (like official examples)
              const provider = new ethers.BrowserProvider(ethereum);
              await provider.send('eth_requestAccounts', []);
              currentSigner = await provider.getSigner();
              console.log('Fresh signer obtained:', await currentSigner.getAddress());
            } catch (refreshError) {
              console.error('Failed to refresh signer:', refreshError);
              // If we can't refresh, fail
              retries = 0;
            }
            lastError = headerError;
            continue;
          }
          
          if (isUnexpectedError) {
            lastError = new Error(
              'MetaMask connection error. Please: 1) Refresh the page, 2) Reconnect your wallet, 3) Ensure MetaMask is unlocked, 4) Try again'
            );
          } else {
            lastError = new Error(`Failed to generate payment header: ${errorMsg}. Please ensure MetaMask is unlocked and you have sufficient balance.`);
          }
        }
      }
      
      if (!paymentHeader) {
        throw lastError || new Error('Failed to generate payment header after retries. Please try again.');
      }

      // Determine endpoint based on service name or resource URL
      const serviceName = challenge.service?.name?.toLowerCase() || '';
      const resourceUrl = accept.resource || '';
      let endpoint = 'risk'; // default
      
      if (serviceName.includes('divergence') || serviceName.includes('cex-dex') || resourceUrl.includes('divergence')) {
        endpoint = 'divergence';
      } else if (serviceName.includes('risk') || resourceUrl.includes('risk')) {
        endpoint = 'risk';
      }

      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';
      const settleResponse = await fetch(`${backendUrl}/api/${endpoint}/pay`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paymentId,
          paymentHeader,
          paymentRequirements: accept,
        }),
      });

      if (!settleResponse.ok) {
        const error = await settleResponse.json();
        throw new Error(`Settlement failed: ${JSON.stringify(error)}`);
      }

      const settleResult = await settleResponse.json();

      setIsProcessing(false);
      setError(null);
      setTxHash(settleResult.txHash || null);

      // Store payment ID for retry
      localStorage.setItem('x-payment-id', paymentId);

      if (paymentId) {
        onSuccess(paymentId);
      }
    } catch (error: any) {
      const errorMessage = error instanceof Error ? error.message : 'Payment failed';
      setIsProcessing(false);
      setError(errorMessage);
      setTxHash(null);
      console.error('Payment error:', error); // Log full error during payment
      console.error('Full error details:', {
        message: error?.message,
        stack: error?.stack,
        code: error?.code,
        name: error?.name,
      });
    } finally {
      // Dispatch event to end payment flow
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('payment-flow-end'));
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-lg border border-slate-700 max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold">💰 x402 Payment</h3>
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="text-slate-400 hover:text-slate-200 disabled:opacity-50"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <p className="text-slate-300 mb-2">{challenge.message}</p>
            <div className="bg-slate-700 p-4 rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <span className="text-slate-400">Amount:</span>
                <span className="text-xl font-bold text-blue-400">{amount} devUSDC.e</span>
              </div>
              {accept && (
                <>
                  <div className="flex justify-between text-sm mt-2">
                    <span className="text-slate-400">Network:</span>
                    <span className="text-slate-300">{accept.network}</span>
                  </div>
                  <div className="flex justify-between text-sm mt-1">
                    <span className="text-slate-400">Valid for:</span>
                    <span className="text-slate-300">{accept.maxTimeoutSeconds}s</span>
                  </div>
                </>
              )}
            </div>
          </div>

          {error && (
            <div className="bg-red-900/50 border border-red-500 p-3 rounded-lg">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {txHash && (
            <div className="bg-green-900/50 border border-green-500 p-3 rounded-lg">
              <p className="text-green-400 text-sm mb-1">✅ Payment successful!</p>
              <p className="text-green-300 text-xs break-all">Tx: {txHash}</p>
            </div>
          )}

          {!isWalletReady && (
            <div className="bg-yellow-900/50 border border-yellow-500 p-3 rounded-lg mb-4">
              <p className="text-yellow-400 text-sm">
                ⚠️ Please connect your wallet first to make payments. Click "Connect Wallet" in the header.
              </p>
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={handlePay}
              disabled={isProcessing || !!txHash || !isWalletReady}
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 disabled:cursor-not-allowed rounded-lg transition-colors"
            >
              {isProcessing ? 'Processing...' : txHash ? 'Paid' : 'Pay with x402'}
            </button>
            <button
              onClick={onClose}
              disabled={isProcessing}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 rounded-lg transition-colors"
            >
              {txHash ? 'Close' : 'Cancel'}
            </button>
          </div>

          {challenge.service && (
            <div className="mt-4 pt-4 border-t border-slate-700">
              <p className="text-xs text-slate-400">
                Service: {challenge.service.name} v{challenge.service.version}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
