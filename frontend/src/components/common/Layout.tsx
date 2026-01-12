/**
 * Layout Component
 * 
 * Main layout with navigation and wallet connection
 */

import type { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useWallet } from '../../contexts/WalletContext';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const { wallet, isConnecting, error, connect, disconnect } = useWallet();

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      {/* Header */}
      <header className="bg-slate-800 border-b border-slate-700">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">🛡️ Cronos Shield</h1>
              <p className="text-slate-400 text-sm">AI-powered security layer for Cronos</p>
            </div>
            <div className="flex items-center gap-4">
              {wallet.address ? (
                <>
                  <div className="text-sm">
                    <span className="text-slate-400">Connected:</span>{' '}
                    <span className="font-mono text-blue-400">
                      {wallet.address.slice(0, 6)}...{wallet.address.slice(-4)}
                    </span>
                  </div>
                  <button
                    onClick={disconnect}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                  >
                    Disconnect
                  </button>
                </>
              ) : (
                <div className="flex flex-col items-end gap-2">
                  <button
                    onClick={connect}
                    disabled={isConnecting}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 disabled:cursor-not-allowed rounded-lg transition-colors"
                  >
                    {isConnecting ? 'Connecting...' : 'Connect Wallet'}
                  </button>
                  {error && (
                    <span className="text-xs text-red-400 max-w-xs text-right">
                      {error}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-slate-800 border-b border-slate-700">
        <div className="container mx-auto px-4">
          <div className="flex space-x-1">
            <Link
              to="/"
              className={`px-4 py-3 rounded-t-lg transition-colors ${
                isActive('/')
                  ? 'bg-slate-900 text-blue-400 border-t-2 border-blue-400'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              📊 Dashboard
            </Link>
            <Link
              to="/risk"
              className={`px-4 py-3 rounded-t-lg transition-colors ${
                isActive('/risk')
                  ? 'bg-slate-900 text-blue-400 border-t-2 border-blue-400'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              🔍 Risk Oracle
            </Link>
            <Link
              to="/vaults"
              className={`px-4 py-3 rounded-t-lg transition-colors ${
                isActive('/vaults')
                  ? 'bg-slate-900 text-blue-400 border-t-2 border-blue-400'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              🏦 Shielded Vaults
            </Link>
            <Link
              to="/divergence"
              className={`px-4 py-3 rounded-t-lg transition-colors ${
                isActive('/divergence')
                  ? 'bg-slate-900 text-blue-400 border-t-2 border-blue-400'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              📈 CEX-DEX Synergy
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        {children}
      </main>
    </div>
  );
}
