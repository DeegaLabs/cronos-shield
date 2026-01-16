/**
 * App Component
 * 
 * Main application component with routing
 */

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WalletProvider } from './contexts/WalletContext';
import { ToastProvider } from './components/common/Toast';
import Layout from './components/common/Layout';
import { Landing } from './pages/Landing';
import DashboardPage from './pages/Dashboard';
import RiskPage from './pages/Risk';
import VaultsPage from './pages/Vaults';
import DivergencePage from './pages/Divergence';

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
    <QueryClientProvider client={queryClient}>
      <WalletProvider>
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
      </WalletProvider>
    </QueryClientProvider>
  );
}

export default App;
