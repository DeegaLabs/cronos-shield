import { Link } from 'react-router-dom'
import { ConnectButton } from '@rainbow-me/rainbowkit'

export const Header = () => {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-card border-b border-slate-700/50">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <svg className="w-8 h-8 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
            </svg>
            <span className="orbitron text-xl font-bold gradient-text">
              CRONOS SHIELD
            </span>
          </Link>
          
          <div className="hidden md:flex items-center gap-8 text-sm">
            <a href="#tools" className="text-slate-400 hover:text-indigo-400 transition-colors">
              Tools
            </a>
            <a href="#about" className="text-slate-400 hover:text-indigo-400 transition-colors">
              About
            </a>
            <a href="#developers" className="text-slate-400 hover:text-indigo-400 transition-colors">
              For Developers
            </a>
            <ConnectButton />
          </div>
        </div>
      </div>
    </nav>
  )
}
