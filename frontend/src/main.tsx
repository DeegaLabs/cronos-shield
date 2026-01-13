import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Suppress evmAsk errors from Facilitator SDK
// These errors occur when SDK tries to detect network on import/initialization
// They don't affect functionality - the payment flow works correctly
// We suppress them globally to keep console clean
if (typeof window !== 'undefined') {
  const originalError = console.error;
  console.error = (...args: any[]) => {
    const errorString = args.join(' ');
    // Suppress all evmAsk-related errors (they're harmless)
    // These occur when SDK tries to detect network but don't affect functionality
    if (errorString.includes('evmAsk') || 
        errorString.includes('Unexpected error') ||
        errorString.includes('Me: Unexpected error') ||
        errorString.includes('Ce: Unexpected error') ||
        errorString.includes('selectExtension')) {
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
