/**
 * App Component
 * 
 * Main application component with routing
 */

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WalletProvider } from './contexts/WalletContext';
import Layout from './components/common/Layout';
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
        <BrowserRouter>
          <Layout>
            <Routes>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/risk" element={<RiskPage />} />
              <Route path="/vaults" element={<VaultsPage />} />
              <Route path="/divergence" element={<DivergencePage />} />
            </Routes>
          </Layout>
        </BrowserRouter>
      </WalletProvider>
    </QueryClientProvider>
  );
}

export default App;
