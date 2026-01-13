import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Suppress evmAsk errors from Facilitator SDK ONLY when not in payment flow
// This error occurs when SDK tries to detect network on import
// It doesn't affect functionality, just a console warning
// BUT we need to allow errors during payment to see what's wrong
if (typeof window !== 'undefined') {
  let isPaymentFlow = false;
  
  // Track when payment flow starts
  window.addEventListener('payment-flow-start', () => {
    isPaymentFlow = true;
  });
  
  // Track when payment flow ends
  window.addEventListener('payment-flow-end', () => {
    isPaymentFlow = false;
  });
  
  const originalError = console.error;
  console.error = (...args: any[]) => {
    const errorString = args.join(' ');
    // Only suppress evmAsk errors when NOT in payment flow
    // During payment, we need to see all errors to debug
    if (!isPaymentFlow && (
        errorString.includes('evmAsk') || 
        errorString.includes('Unexpected error') ||
        errorString.includes('selectExtension'))) {
      return; // Silently ignore only outside payment flow
    }
    originalError.apply(console, args);
  };
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
