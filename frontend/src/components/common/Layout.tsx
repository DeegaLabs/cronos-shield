/**
 * Layout Component
 * 
 * Main layout with navigation matching HTML prototypes exactly
 */

import type { ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { ConnectButton } from '@rainbow-me/rainbowkit'

interface LayoutProps {
  children: ReactNode
}

export default function Layout({ children }: LayoutProps) {
  const location = useLocation()

  const isActive = (path: string) => location.pathname === path

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
      {/* Navigation - Exactly as in HTML */}
      <nav className="glass-card border-b border-slate-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-8">
              <div className="flex items-center gap-3">
                <svg className="w-8 h-8 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
                </svg>
                <span className="font-bold text-lg">Cronos Shield</span>
              </div>
              
              <div className="hidden md:flex items-center gap-6 text-sm">
                <Link
                  to="/dashboard"
                  className={isActive('/dashboard') ? 'text-blue-400 font-semibold' : 'text-slate-400 hover:text-white transition-colors'}
                >
                  Dashboard
                </Link>
                <Link
                  to="/risk"
                  className={isActive('/risk') ? 'text-green-400 font-semibold' : 'text-slate-400 hover:text-white transition-colors'}
                >
                  Risk Oracle
                </Link>
                <Link
                  to="/vaults"
                  className={isActive('/vaults') ? 'text-orange-400 font-semibold' : 'text-slate-400 hover:text-white transition-colors'}
                >
                  Vaults
                </Link>
                <Link
                  to="/divergence"
                  className={isActive('/divergence') ? 'text-purple-400 font-semibold' : 'text-slate-400 hover:text-white transition-colors'}
                >
                  CEX-DEX
                </Link>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <ConnectButton />
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {children}
      </div>
    </div>
  )
}
