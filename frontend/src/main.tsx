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
  const originalWarn = console.warn;
  
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

  // Suppress zustand deprecation warning (comes from wagmi/rainbowkit dependencies)
  // This is a known issue and doesn't affect functionality
  console.warn = (...args: any[]) => {
    const warnString = args.join(' ');
    if (warnString.includes('[DEPRECATED] Default export is deprecated') && 
        warnString.includes('zustand')) {
      // Suppress zustand deprecation warning from dependencies
      return;
    }
    originalWarn.apply(console, args);
  };
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
