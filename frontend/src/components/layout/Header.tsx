import { Shield } from 'lucide-react'
import { Link } from 'react-router-dom'
import { GradientText } from '../animations/GradientText'

export const Header = () => {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-card border-b border-slate-700/50">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <Shield className="w-8 h-8 text-indigo-400" />
            <span className="font-display text-xl font-bold">
              <GradientText>CRONOS SHIELD</GradientText>
            </span>
          </Link>
          
          <div className="hidden md:flex items-center gap-8 text-sm">
            <a href="#tools" className="text-slate-400 hover:text-indigo-400 transition-colors">
              Tools
            </a>
            <a href="#about" className="text-slate-400 hover:text-indigo-400 transition-colors">
              About
            </a>
            <a href="#docs" className="text-slate-400 hover:text-indigo-400 transition-colors">
              Docs
            </a>
            <button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-all transform hover:scale-105">
              Connect Wallet
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
}
