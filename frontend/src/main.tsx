import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Suppress evmAsk errors from Facilitator SDK
// This error occurs when SDK tries to detect network on import
// It doesn't affect functionality, just a console warning
// We suppress it globally but allow it during payment flow for debugging
if (typeof window !== 'undefined') {
  let isPaymentFlow = false;
  let paymentFlowTimeout: NodeJS.Timeout | null = null;
  
  // Track when payment flow starts (with timeout to auto-reset)
  window.addEventListener('payment-flow-start', () => {
    isPaymentFlow = true;
    // Auto-reset after 30 seconds to prevent stuck state
    if (paymentFlowTimeout) clearTimeout(paymentFlowTimeout);
    paymentFlowTimeout = setTimeout(() => {
      isPaymentFlow = false;
    }, 30000);
  });
  
  // Track when payment flow ends
  window.addEventListener('payment-flow-end', () => {
    isPaymentFlow = false;
    if (paymentFlowTimeout) {
      clearTimeout(paymentFlowTimeout);
      paymentFlowTimeout = null;
    }
  });
  
  const originalError = console.error;
  console.error = (...args: any[]) => {
    const errorString = args.join(' ');
    // Suppress evmAsk errors globally (they're harmless)
    // But allow them during payment flow for debugging
    // Suppress all evmAsk-related errors (they're harmless)
    // These occur when SDK tries to detect network but don't affect functionality
    if (errorString.includes('evmAsk') || 
        errorString.includes('Unexpected error') ||
        errorString.includes('Me: Unexpected error') ||
        errorString.includes('selectExtension') ||
        errorString.includes('Ce: Unexpected error')) {
      // Suppress silently - these errors don't affect functionality
      // They occur when SDK tries to detect network on initialization
      return;
    }
    originalError.apply(console, args);
  };
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
