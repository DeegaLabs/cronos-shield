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
    if (errorString.includes('evmAsk') || 
        errorString.includes('Unexpected error') ||
        errorString.includes('selectExtension')) {
      // Only show during payment flow for debugging
      if (isPaymentFlow) {
        originalError.apply(console, args);
      }
      // Otherwise suppress silently
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
