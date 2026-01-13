import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Suppress evmAsk errors from Facilitator SDK
// This error occurs when SDK tries to detect network on import
// It doesn't affect functionality, just a console warning
if (typeof window !== 'undefined') {
  const originalError = console.error;
  console.error = (...args: any[]) => {
    const errorString = args.join(' ');
    // Suppress evmAsk errors from Facilitator SDK
    if (errorString.includes('evmAsk') || 
        errorString.includes('Unexpected error') ||
        errorString.includes('selectExtension')) {
      return; // Silently ignore
    }
    originalError.apply(console, args);
  };
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
