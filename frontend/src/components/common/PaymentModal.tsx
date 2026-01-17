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

      console.log('📦 Step 2: Checking network first (following SDK pattern)...');
      // Following SDK examples: verify network BEFORE creating provider
      // This avoids _detectNetwork issues
      const targetChainId = accept.network === 'cronos-mainnet' ? 25 : 338;
      const targetChainIdBigInt = BigInt(targetChainId);
      const chainIdHex = accept.network === 'cronos-mainnet' ? '0x19' : '0x152';
      
      let currentChainId: bigint;
      if (walletClient?.chain?.id) {
        currentChainId = BigInt(walletClient.chain.id);
        console.log('✅ Current chain ID from walletClient:', currentChainId.toString());
      } else {
        const ethereumProvider = (window as any).ethereum;
        if (!ethereumProvider) {
          throw new Error('MetaMask not found');
        }
        const chainId = await ethereumProvider.request({ method: 'eth_chainId' });
        const chainIdNum = parseInt(chainId, 16);
        currentChainId = BigInt(chainIdNum);
        console.log('✅ Current chain ID from provider:', currentChainId.toString());
      }
      
      if (currentChainId !== targetChainIdBigInt) {
        console.log(`⚠️ Wrong network. Current: ${currentChainId}, Expected: ${targetChainIdBigInt}`);
        console.log('🔄 Requesting network switch...');
        const ethereumProvider = (window as any).ethereum;
        const switchPromise = ethereumProvider.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: chainIdHex }],
        });
        const switchTimeout = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error('Network switch timed out')), 30000);
        });
        await Promise.race([switchPromise, switchTimeout]);
        console.log('✅ Network switched successfully');
        await new Promise(resolve => setTimeout(resolve, 2000));
      } else {
        console.log('✅ Already on correct network');
      }

      console.log('📦 Step 3: Importing ethers...');
      const { ethers } = await import('ethers');
      console.log('✅ Ethers imported');
      
      console.log('📦 Step 4: Converting walletClient to ethers signer (ZkVanguard pattern)...');
      // Since we're using RainbowKit/wagmi, we need to convert walletClient to ethers signer
      // Following ZkVanguard pattern: use walletClient.transport to create provider
      if (!walletClient) {
        throw new Error('Wallet client not available. Please reconnect your wallet.');
      }
      
      console.log('📋 Converting walletClient to ethers signer...');
      let currentSigner: any;
      try {
        // Get transport from walletClient (this is the ethereum provider)
        const transport = (walletClient as any).transport?.value || (walletClient as any).transport;
        if (!transport) {
          throw new Error('WalletClient transport not available');
        }
        
        // Get chain info from walletClient
        const chain = walletClient.chain;
        if (!chain) {
          throw new Error('WalletClient chain not available');
        }
        
        console.log('📋 Creating provider from walletClient transport...');
        const network = {
          chainId: chain.id,
          name: chain.name,
          ensAddress: chain.contracts?.ensRegistry?.address,
        };
        
        const provider = new ethers.BrowserProvider(transport, network);
        console.log('✅ Provider created from walletClient');
        
        // Get signer using the account from walletClient
        const account = walletClient.account;
        if (!account) {
          throw new Error('WalletClient account not available');
        }
        
        console.log('⏳ Getting signer for address:', account.address);
        const signerPromise = provider.getSigner(account.address);
        const signerTimeout = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error('getSigner() timed out')), 10000);
        });
        
        currentSigner = await Promise.race([signerPromise, signerTimeout]);
        console.log('✅ Signer obtained from walletClient');
      } catch (walletClientError: any) {
        console.error('❌ Failed to convert walletClient to signer:', walletClientError);
        console.log('🔄 Falling back to direct window.ethereum approach...');
        
        // Fallback: use window.ethereum directly (like x402-examples)
        const ethereumProvider = (window as any).ethereum;
        if (!ethereumProvider) {
          throw new Error('MetaMask not found. Please refresh the page.');
        }
        
        const provider = new ethers.BrowserProvider(ethereumProvider);
        console.log('⏳ Trying getSigner() without address...');
        try {
          const signerPromise = provider.getSigner();
          const signerTimeout = new Promise<never>((_, reject) => {
            setTimeout(() => reject(new Error('Fallback getSigner() timed out')), 10000);
          });
          currentSigner = await Promise.race([signerPromise, signerTimeout]);
          console.log('✅ Signer obtained via fallback');
        } catch (fallbackError: any) {
          console.error('❌ Fallback also failed:', fallbackError);
          throw new Error(`Failed to get wallet signer: ${walletClientError.message}. Please refresh the page and try again.`);
        }
      }
      
      console.log('📦 Step 5: Validating signer address...');
      let signerAddress: string;
      try {
        signerAddress = await currentSigner.getAddress();
        console.log('✅ Signer created, address:', signerAddress);
        if (signerAddress.toLowerCase() !== walletAddress.toLowerCase()) {
          console.warn('⚠️ Signer address does not match walletAddress prop');
        }
      } catch (addressError: any) {
        console.error('❌ Signer validation failed:', addressError);
        throw new Error('Wallet signer is not valid. Please reconnect your wallet.');
      }
      
      // Network already checked and switched above (Step 2)
      // Signer is already created above (Step 4)

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
          
          console.log('🔐 Verifying signer before requesting signature...');
          console.log('📝 Signer details:', {
            hasSigner: !!currentSigner,
            signerType: currentSigner?.constructor?.name,
            signerAddress: signerAddress,
          });
          
          // Verify signer has signTypedData method before calling
          console.log('🔍 Verifying signer capabilities...');
          console.log('📋 Signer details:', {
            hasSigner: !!currentSigner,
            signerType: currentSigner?.constructor?.name,
            hasSignTypedData: typeof currentSigner?.signTypedData === 'function',
            hasProvider: !!currentSigner?.provider,
          });
          
          // Check if signer has signTypedData (required for EIP-712)
          if (!currentSigner || typeof currentSigner.signTypedData !== 'function') {
            console.error('❌ Signer does not have signTypedData method');
            console.error('Available methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(currentSigner)));
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
          
          // Test if signer.provider is accessible (this might be the issue)
          try {
            const provider = currentSigner.provider;
            if (provider) {
              console.log('✅ Signer has provider:', provider.constructor?.name);
              // Try to get network to ensure provider is working
              try {
                const network = await provider.getNetwork();
                console.log('✅ Provider network:', network.chainId.toString());
              } catch (networkError: any) {
                console.warn('⚠️ Failed to get network from provider:', networkError);
              }
            } else {
              console.warn('⚠️ Signer does not have provider');
            }
          } catch (providerError: any) {
            console.warn('⚠️ Could not access signer.provider:', providerError);
          }
          
          // CRITICAL: Test signTypedData directly before calling Facilitator SDK
          // This ensures MetaMask can actually open for signing
          console.log('🧪 Testing signTypedData directly to ensure MetaMask opens...');
          try {
            const testDomain = {
              name: 'Test',
              version: '1',
              chainId: 338,
              verifyingContract: '0x0000000000000000000000000000000000000000' as `0x${string}`,
            };
            const testTypes = {
              Test: [{ name: 'message', type: 'string' }],
            };
            const testMessage = { message: 'test' };
            
            console.log('📝 Calling signer.signTypedData() directly...');
            const testSignaturePromise = currentSigner.signTypedData(testDomain, testTypes, testMessage);
            const testTimeout = new Promise<never>((_, reject) => {
              setTimeout(() => reject(new Error('Test signTypedData timed out')), 10000);
            });
            
            const testSignature = await Promise.race([testSignaturePromise, testTimeout]);
            console.log('✅ Test signature successful! MetaMask opened and signed.');
            console.log('✅ Test signature preview:', testSignature.substring(0, 20) + '...');
          } catch (testError: any) {
            console.error('❌ Test signTypedData failed:', testError);
            console.error('Test error details:', {
              message: testError?.message,
              code: testError?.code,
              name: testError?.name,
            });
            if (testError?.code === 4001) {
              throw new Error('Test signature rejected. Please approve the test signature in MetaMask first.');
            }
            if (testError?.message?.includes('timed out')) {
              throw new Error('MetaMask did not respond to test signature. Please check: 1) MetaMask is unlocked, 2) No popup blocker, 3) Check MetaMask extension for pending notifications.');
            }
            // Don't proceed if test fails - this indicates a fundamental problem
            throw new Error(`Test signature failed: ${testError?.message || 'Unknown error'}. Please refresh the page and try again.`);
          }
          
          try {
            console.log('📝 Calling facilitator.generatePaymentHeader()...');
            console.log('📋 Payment parameters:', {
              to: accept.payTo,
              value: accept.maxAmountRequired,
              asset: accept.asset,
              signerAddress: signerAddress,
              validBefore,
            });
            
            // Call generatePaymentHeader with detailed logging
            const generateHeaderPromise = facilitator.generatePaymentHeader({
              to: accept.payTo,
              value: accept.maxAmountRequired,
              asset: accept.asset as any,
              signer: currentSigner,
              validBefore,
              validAfter: 0,
            });
            
            console.log('⏳ Waiting for MetaMask signature (this may take a moment)...');
            console.log('💡 MetaMask should open now for EIP-712 signature');
            console.log('💡 If MetaMask does not open, check:');
            console.log('   1. MetaMask is unlocked');
            console.log('   2. No other popup is blocking it');
            console.log('   3. Browser popup blocker is disabled');
            console.log('   4. Check MetaMask extension icon for pending notifications');
            
            paymentHeader = await Promise.race([generateHeaderPromise, timeoutPromise]);
            
            console.log('✅ Payment header generated successfully!');
            console.log('✅ Payment header length:', paymentHeader.length);
            console.log('✅ Payment header preview:', paymentHeader.substring(0, 50) + '...');
          } catch (signError: any) {
            console.error('❌ Signature error caught:', signError);
            console.error('Error type:', signError?.constructor?.name);
            console.error('Error message:', signError?.message);
            console.error('Error code:', signError?.code);
            console.error('Error name:', signError?.name);
            console.error('Error stack:', signError?.stack);
            
            // Check if it's a user rejection
            if (signError?.code === 4001 || signError?.message?.includes('rejected') || signError?.message?.includes('denied') || signError?.message?.includes('User rejected')) {
              throw new Error('Signature rejected. Please approve the transaction in MetaMask.');
            }
            
            // Check if it's a timeout
            if (signError?.message?.includes('timed out')) {
              throw new Error('MetaMask did not respond. Please check: 1) MetaMask is unlocked, 2) No popup blocker, 3) Check MetaMask extension for pending notifications, 4) Try refreshing the page.');
            }
            
            // Check for common MetaMask errors
            if (signError?.message?.includes('not connected') || signError?.message?.includes('not authorized')) {
              throw new Error('MetaMask is not connected. Please reconnect your wallet.');
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
