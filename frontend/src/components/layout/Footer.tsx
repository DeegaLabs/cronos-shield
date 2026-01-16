import { Shield } from 'lucide-react'
import { Link } from 'react-router-dom'

export const Footer = () => {
  return (
    <footer className="py-12 px-6 border-t border-slate-800">
      <div className="max-w-7xl mx-auto">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Shield className="w-6 h-6 text-indigo-400" />
              <span className="font-bold">Cronos Shield</span>
            </div>
            <p className="text-slate-400 text-sm">AI-Powered Security for Cronos</p>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Product</h4>
            <div className="space-y-2 text-sm text-slate-400">
              <div>
                <Link to="/risk" className="hover:text-indigo-400 transition-colors">
                  Risk Oracle
                </Link>
              </div>
              <div>
                <Link to="/vaults" className="hover:text-indigo-400 transition-colors">
                  Shielded Vaults
                </Link>
              </div>
              <div>
                <Link to="/divergence" className="hover:text-indigo-400 transition-colors">
                  CEX-DEX Synergy
                </Link>
              </div>
              <div>
                <Link to="/dashboard" className="hover:text-indigo-400 transition-colors">
                  Observability
                </Link>
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Resources</h4>
            <div className="space-y-2 text-sm text-slate-400">
              <div>
                <a href="#docs" className="hover:text-indigo-400 transition-colors">
                  Documentation
                </a>
              </div>
              <div>
                <a href="#api" className="hover:text-indigo-400 transition-colors">
                  API Reference
                </a>
              </div>
              <div>
                <a href="https://github.com" className="hover:text-indigo-400 transition-colors">
                  GitHub
                </a>
              </div>
              <div>
                <a href="#discord" className="hover:text-indigo-400 transition-colors">
                  Discord
                </a>
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Connect</h4>
            <div className="space-y-2 text-sm text-slate-400">
              <div>
                <a href="#twitter" className="hover:text-indigo-400 transition-colors">
                  Twitter
                </a>
              </div>
              <div>
                <a href="#telegram" className="hover:text-indigo-400 transition-colors">
                  Telegram
                </a>
              </div>
              <div>
                <a href="#medium" className="hover:text-indigo-400 transition-colors">
                  Medium
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-slate-400">
          <div>© 2025 Cronos Shield. Built for Cronos x402 Paytech Hackathon.</div>
          <div className="flex gap-6">
            <a href="#privacy" className="hover:text-indigo-400 transition-colors">
              Privacy
            </a>
            <a href="#terms" className="hover:text-indigo-400 transition-colors">
              Terms
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
