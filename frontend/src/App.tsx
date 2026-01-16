/**
 * App Component
 * 
 * Main application component with routing
 */

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider } from 'wagmi';
import { RainbowKitProvider } from '@rainbow-me/rainbowkit';
import { config } from './lib/wagmi';
import { ToastProvider } from './components/common/Toast';
import Layout from './components/common/Layout';
import { Landing } from './pages/Landing';
import DashboardPage from './pages/Dashboard';
import RiskPage from './pages/Risk';
import VaultsPage from './pages/Vaults';
import DivergencePage from './pages/Divergence';
import '@rainbow-me/rainbowkit/styles.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function App() {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>
          <ToastProvider />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/dashboard" element={<Layout><DashboardPage /></Layout>} />
              <Route path="/risk" element={<Layout><RiskPage /></Layout>} />
              <Route path="/vaults" element={<Layout><VaultsPage /></Layout>} />
              <Route path="/divergence" element={<Layout><DivergencePage /></Layout>} />
            </Routes>
          </BrowserRouter>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

export default App;
