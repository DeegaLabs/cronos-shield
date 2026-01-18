/**
 * Payment Modal Component
 * 
 * Modal for x402 payment flow
 */

import { useEffect, useState } from 'react';
import { useChainId } from 'wagmi';
import { useEthersSigner } from '../../hooks/useEthersSigner';
import { logger } from '../../lib/logger';
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
  // Get ethers signer from wagmi walletClient (avoids deadlock with BrowserProvider.getSigner())
  const signer = useEthersSigner();
  const chainId = useChainId();
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
    logger.debug('handlePay called', {
      walletAddress,
      hasChallenge: !!challenge,
      isProcessing,
    });
    
    if (!walletAddress || !challenge) {
      logger.error('Missing requirements for payment', undefined, { walletAddress, challenge: !!challenge });
      return;
    }
    
    // Dispatch event to allow errors during payment flow
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('payment-flow-start'));
    }
    
    logger.info('Starting payment process');
    setIsProcessing(true);
    setError(null);
    setTxHash(null);

    try {
      logger.debug('Step 1: Getting payment requirements');
      // Get payment requirements first to know which network we need
      const accept = challenge.accepts[0];
      if (!accept) {
        throw new Error('No payment method available');
      }
      logger.debug('Payment requirements obtained', {
        payTo: accept.payTo,
        value: accept.maxAmountRequired,
        network: accept.network,
      });
      
      // Validate signer is available before proceeding
      if (!signer) {
        throw new Error('Wallet signer not available. Please ensure your wallet is connected.');
      }

      logger.debug('Step 2: Validating wallet connection and network');
      // Validate that signer is available (from useEthersSigner hook)
      if (!signer) {
        throw new Error('Wallet not connected. Please connect your wallet first.');
      }
      
      // Validate chain is Cronos (25 = Mainnet, 338 = Testnet)
      const CRONOS_CHAINS = [25, 338];
      if (!CRONOS_CHAINS.includes(chainId)) {
        throw new Error(`Please switch to Cronos ${accept.network === 'cronos-mainnet' ? 'Mainnet' : 'Testnet'}. Current chain: ${chainId}`);
      }
      logger.debug('Wallet connected and on correct Cronos network', { chainId });
      
      // Get signer address for validation
      let signerAddress: string;
      try {
        signerAddress = await signer.getAddress();
        logger.debug('Signer address obtained', { signerAddress });
        if (signerAddress.toLowerCase() !== walletAddress.toLowerCase()) {
          logger.warn('Signer address does not match walletAddress prop', {
            signerAddress,
            walletAddress,
          });
        }
      } catch (addressError: any) {
        logger.error('Failed to get signer address', addressError);
        throw new Error('Wallet signer is not valid. Please reconnect your wallet.');
      }
      
      // Use the signer from useEthersSigner hook (already created, no timeout!)
      // No need to create a new signer - useEthersSigner already provides it

      // CRITICAL: Import Facilitator dynamically ONLY when needed (inside handlePay)
      // This prevents the SDK from loading on page load, which causes evmAsk error
      logger.debug('Importing Facilitator SDK');
      const { Facilitator, CronosNetwork } = await import('@crypto.com/facilitator-client');
      logger.debug('Facilitator SDK imported');
      
      // Map network string to CronosNetwork enum (following official docs)
      const cronosNetwork = accept.network === 'cronos-mainnet' 
        ? CronosNetwork.CronosMainnet 
        : CronosNetwork.CronosTestnet;
      
      const facilitator = new Facilitator({ network: cronosNetwork });
      logger.debug('Facilitator instance created', { network: accept.network });

      // Get payment ID from challenge
      const paymentId = accept.extra?.paymentId;
      if (!paymentId) {
        throw new Error('Payment ID not found in challenge');
      }

      // Generate payment header with retry logic
      const validBefore = Math.floor(Date.now() / 1000) + accept.maxTimeoutSeconds;
      logger.debug('Payment parameters', {
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
          
          logger.debug(`Attempting to generate payment header (attempt ${3 - retries}/2)`);
          // Validate signer is still available
          if (!signer) {
            throw new Error('Signer no longer available. Please reconnect your wallet.');
          }
          
          try {
            const addr = await signer.getAddress();
            logger.debug('Signer check', {
              hasSigner: !!signer,
              signerAddress: addr,
            });
          } catch (e) {
            logger.debug('Signer check: signer exists but address check failed');
          }
          
          // Use signer directly (from useEthersSigner hook)
          const currentSigner = signer;
          
          // MetaMask is already connected via RainbowKit, no need to check again
          // The signer from useEthersSigner is ready to use
          logger.debug('Signer ready, proceeding to generate payment header');
          
          // Add timeout to detect if MetaMask is not responding
          const timeoutPromise = new Promise<never>((_, reject) => {
            setTimeout(() => {
              reject(new Error('Payment header generation timed out after 60 seconds. MetaMask may not have opened for signing. Please check: 1) MetaMask is unlocked, 2) No other popup is blocking it, 3) Try refreshing the page.'));
            }, 60000); // 60 seconds timeout
          });
          
          logger.debug('Verifying signer before requesting signature', {
            hasSigner: !!currentSigner,
            signerType: currentSigner?.constructor?.name,
            signerAddress: signerAddress,
          });
          
          // Verify signer has signTypedData method before calling
          logger.debug('Verifying signer capabilities', {
            hasSigner: !!currentSigner,
            signerType: currentSigner?.constructor?.name,
            hasSignTypedData: typeof currentSigner?.signTypedData === 'function',
            hasProvider: !!currentSigner?.provider,
          });
          
          // Check if signer has signTypedData (required for EIP-712)
          if (!currentSigner || typeof currentSigner.signTypedData !== 'function') {
            logger.error('Signer does not have signTypedData method', undefined, {
              availableMethods: Object.getOwnPropertyNames(Object.getPrototypeOf(currentSigner)),
            });
            throw new Error('Signer does not support EIP-712 signing. Please reconnect your wallet.');
          }
          logger.debug('Signer has signTypedData method');
          
          // Test if we can get the address (this should work)
          try {
            const testAddress = await currentSigner.getAddress();
            logger.debug('Signer address verification', { testAddress });
          } catch (addrError: any) {
            logger.error('Failed to get signer address', addrError);
            throw new Error('Signer is not valid. Please reconnect your wallet.');
          }
          
          // Test if signer.provider is accessible (this might be the issue)
          try {
            const provider = currentSigner.provider;
            if (provider) {
              logger.debug('Signer has provider', { providerType: provider.constructor?.name });
              // Try to get network to ensure provider is working
              try {
                const network = await provider.getNetwork();
                logger.debug('Provider network', { chainId: network.chainId.toString() });
              } catch (networkError: any) {
                logger.warn('Failed to get network from provider', { error: networkError.message });
              }
            } else {
              logger.warn('Signer does not have provider');
            }
          } catch (providerError: any) {
            logger.warn('Could not access signer.provider', { error: providerError.message });
          }
          
          // Call facilitator.generatePaymentHeader() directly
          // This will internally call signer.signTypedData() which opens MetaMask
          // No need for a test signature - the Facilitator SDK handles everything
          try {
            logger.debug('Calling facilitator.generatePaymentHeader', {
              to: accept.payTo,
              value: accept.maxAmountRequired,
              asset: accept.asset,
              signerAddress: signerAddress,
              validBefore,
            });
            
            // Call generatePaymentHeader with detailed logging
            // This will internally call signer.signTypedData() which opens MetaMask
            const generateHeaderPromise = facilitator.generatePaymentHeader({
              to: accept.payTo,
              value: accept.maxAmountRequired,
              asset: accept.asset as any,
              signer: signer, // Use signer from useEthersSigner hook
              validBefore,
              validAfter: 0,
            });
            
            logger.info('Waiting for MetaMask signature - MetaMask should open now');
            
            paymentHeader = await Promise.race([generateHeaderPromise, timeoutPromise]);
            
            logger.info('Payment header generated successfully', {
              length: paymentHeader.length,
              preview: paymentHeader.substring(0, 50) + '...',
            });
          } catch (signError: any) {
            logger.error('Signature error caught', signError, {
              errorType: signError?.constructor?.name,
              errorCode: signError?.code,
              errorName: signError?.name,
            });
            
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
          logger.error('Payment header generation failed', headerError, {
            attempt: 3 - retries,
            retriesLeft: retries - 1,
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
            logger.debug('Retrying with fresh signer');
            // Wait a bit longer before retry
            await new Promise(resolve => setTimeout(resolve, 1000));
            // Signer is already available from useEthersSigner hook
            // No need to recreate - just validate it's still available
            if (!signer) {
              logger.error('Signer no longer available');
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
      logger.debug('Sending payment settlement request', {
        paymentId,
        paymentHeaderLength: paymentHeader.length,
        paymentRequirements: accept,
      });
      
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

      logger.debug('Settlement response status', { status: settleResponse.status });
      
      if (!settleResponse.ok) {
        const error = await settleResponse.json().catch(() => ({ message: 'Failed to parse error response' }));
        logger.error('Settlement failed', undefined, { error });
        throw new Error(`Settlement failed: ${JSON.stringify(error)}`);
      }

      const settleResult = await settleResponse.json();
      logger.info('Settlement successful', { txHash: settleResult.txHash });

      setIsProcessing(false);
      setError(null);
      setTxHash(settleResult.txHash || null);

      // Store payment ID for retry
      localStorage.setItem('x-payment-id', paymentId);

      logger.debug('Payment completed successfully, calling onSuccess', { paymentId });
      if (paymentId) {
        onSuccess(paymentId);
      } else {
        logger.error('PaymentId is null/undefined, cannot call onSuccess');
      }
    } catch (error: any) {
      const errorMessage = error instanceof Error ? error.message : 'Payment failed';
      setIsProcessing(false);
      setError(errorMessage);
      setTxHash(null);
      logger.error('Payment error', error, {
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
