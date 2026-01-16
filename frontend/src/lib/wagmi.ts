/**
 * Wagmi Configuration
 * 
 * Web3 configuration for Cronos Shield using wagmi + viem
 */

import { createConfig, http } from 'wagmi'
import { cronosTestnet } from 'wagmi/chains'
import { injected, walletConnect } from 'wagmi/connectors'

export const config = createConfig({
  chains: [cronosTestnet],
  connectors: [
    injected(),
    walletConnect({ 
      projectId: import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || 'your-project-id'
    }),
  ],
  transports: {
    [cronosTestnet.id]: http(),
  },
})
