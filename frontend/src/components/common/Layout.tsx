/**
 * Layout Component
 * 
 * Main layout with navigation and wallet connection
 */

import type { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ConnectButton } from '@rainbow-me/rainbowkit';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const location = useLocation();

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
              <ConnectButton />
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
