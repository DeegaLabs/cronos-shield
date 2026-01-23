import { Link } from 'react-router-dom'
import { CheckCircle, Lock, TrendingUp, Eye } from 'lucide-react'
import { Header } from '../components/layout/Header'
import { Footer } from '../components/layout/Footer'
import { GlassCard } from '../components/cards/GlassCard'
import { GradientText } from '../components/animations/GradientText'
import { AnimatedBorder } from '../components/animations/AnimatedBorder'

export const Landing = () => {
  return (
    <>
      <Header />
      
      {/* Hero Section */}
      <section className="hero-bg relative min-h-screen flex items-center justify-center pt-20 grid-bg">
        <div className="max-w-6xl mx-auto px-6 text-center relative z-10">
          <div className="fade-in">
            <div className="inline-block px-4 py-2 bg-indigo-950/50 border border-indigo-500/30 rounded-full text-indigo-300 text-sm mb-8">
              🏆 Cronos x402 Paytech Hackathon 2025
            </div>
            
            <h1 className="orbitron text-6xl md:text-8xl font-black mb-6 glow-effect">
              <span className="gradient-text">CRONOS SHIELD</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-slate-400 mb-4 max-w-3xl mx-auto">
              AI-Powered Security Ecosystem for Cronos
            </p>
            
            <p className="text-base md:text-lg text-slate-500 mb-12 max-w-2xl mx-auto">
              The only security layer combining on-chain risk analysis, automated protection, 
              CEX-DEX validation, and transparent AI decision monitoring.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
              <Link
                to="/dashboard"
                className="btn-primary px-8 py-4 bg-indigo-600 hover:bg-indigo-500 rounded-lg font-semibold text-lg transition-all transform hover:scale-105 relative z-10"
              >
                Launch Dashboard →
              </Link>
              <button className="px-8 py-4 border-2 border-indigo-500/30 hover:border-indigo-500 rounded-lg font-semibold text-lg transition-all">
                View Documentation
              </button>
            </div>

            {/* Stats Bar */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
              <GlassCard className="rounded-2xl p-6 fade-in fade-in-delay-1">
                <div className="text-3xl font-bold gradient-text stat-number">1,234</div>
                <div className="text-sm text-slate-400 mt-2">Risk Analyses</div>
              </GlassCard>
              <GlassCard className="rounded-2xl p-6 fade-in fade-in-delay-2">
                <div className="text-3xl font-bold text-green-400 stat-number">$2.5M</div>
                <div className="text-sm text-slate-400 mt-2">TVL Protected</div>
              </GlassCard>
              <GlassCard className="rounded-2xl p-6 fade-in fade-in-delay-3">
                <div className="text-3xl font-bold text-red-400 stat-number">89</div>
                <div className="text-sm text-slate-400 mt-2">Attacks Blocked</div>
              </GlassCard>
              <GlassCard className="rounded-2xl p-6 fade-in fade-in-delay-4">
                <div className="text-3xl font-bold text-cyan-400 stat-number">567</div>
                <div className="text-sm text-slate-400 mt-2">x402 Payments</div>
              </GlassCard>
            </div>
          </div>
        </div>

        {/* Decorative elements */}
        <div className="absolute top-1/4 left-10 w-64 h-64 bg-indigo-600/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-10 w-96 h-96 bg-cyan-600/10 rounded-full blur-3xl"></div>
      </section>

      {/* Tools Section */}
      <section id="tools" className="py-24 px-6 relative">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="orbitron text-4xl md:text-5xl font-bold mb-4">
              <GradientText>Our Tools</GradientText>
            </h2>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto">
              Four independent tools that work together to create an impenetrable security layer
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Tool 1: Risk Oracle */}
            <AnimatedBorder className="rounded-2xl p-8 glass-card group cursor-pointer">
              <div className="flex items-start justify-between mb-6">
                <div className="p-3 bg-green-500/10 rounded-xl">
                  <CheckCircle className="w-8 h-8 text-green-400" />
                </div>
                <span className="text-xs px-3 py-1 bg-indigo-500/10 border border-indigo-500/30 rounded-full text-indigo-300 uppercase tracking-wide">
                  Track 1 & 4
                </span>
              </div>
              
              <h3 className="text-2xl font-bold mb-3 group-hover:text-green-400 transition-colors">
                🔍 Risk Oracle
              </h3>
              
              <p className="text-slate-200 mb-6">
                Analyze smart contracts with AI-powered risk scoring. Get instant insights on liquidity, 
                verification status, and security vulnerabilities.
              </p>

              <div className="flex flex-wrap gap-2 mb-6">
                <span className="px-3 py-1 bg-slate-800 rounded-full text-xs text-slate-300">On-chain Analysis</span>
                <span className="px-3 py-1 bg-slate-800 rounded-full text-xs text-slate-300">x402 Enabled</span>
                <span className="px-3 py-1 bg-slate-800 rounded-full text-xs text-slate-300">AI Powered</span>
              </div>

              <Link
                to="/risk"
                className="block w-full py-3 bg-green-600/10 hover:bg-green-600 border border-green-500/30 hover:border-green-500 rounded-lg font-semibold transition-all group-hover:translate-x-2 text-center"
              >
                Launch Tool →
              </Link>
            </AnimatedBorder>

            {/* Tool 2: Shielded Vaults */}
            <AnimatedBorder className="rounded-2xl p-8 glass-card group cursor-pointer">
              <div className="flex items-start justify-between mb-6">
                <div className="p-3 bg-orange-500/10 rounded-xl">
                  <Lock className="w-8 h-8 text-orange-400" />
                </div>
                <span className="text-xs px-3 py-1 bg-indigo-500/10 border border-indigo-500/30 rounded-full text-indigo-300 uppercase tracking-wide">
                  Track 2
                </span>
              </div>
              
              <h3 className="text-2xl font-bold mb-3 group-hover:text-orange-400 transition-colors">
                🔒 Shielded Vaults
              </h3>
              
              <p className="text-slate-200 mb-6">
                Protected vaults with programmable circuit breakers. Automatically blocks dangerous 
                transactions based on real-time risk analysis.
              </p>

              <div className="flex flex-wrap gap-2 mb-6">
                <span className="px-3 py-1 bg-slate-800 rounded-full text-xs text-slate-300">Smart Contract</span>
                <span className="px-3 py-1 bg-slate-800 rounded-full text-xs text-slate-300">Auto-Protection</span>
                <span className="px-3 py-1 bg-slate-800 rounded-full text-xs text-slate-300">Circuit Breaker</span>
              </div>

              <Link
                to="/vaults"
                className="block w-full py-3 bg-orange-600/10 hover:bg-orange-600 border border-orange-500/30 hover:border-orange-500 rounded-lg font-semibold transition-all group-hover:translate-x-2 text-center"
              >
                Launch Tool →
              </Link>
            </AnimatedBorder>

            {/* Tool 3: CEX-DEX Synergy */}
            <AnimatedBorder className="rounded-2xl p-8 glass-card group cursor-pointer">
              <div className="flex items-start justify-between mb-6">
                <div className="p-3 bg-purple-500/10 rounded-xl">
                  <TrendingUp className="w-8 h-8 text-purple-400" />
                </div>
                <span className="text-xs px-3 py-1 bg-indigo-500/10 border border-indigo-500/30 rounded-full text-indigo-300 uppercase tracking-wide">
                  Track 3
                </span>
              </div>
              
              <h3 className="text-2xl font-bold mb-3 group-hover:text-purple-400 transition-colors">
                📊 CEX-DEX Synergy
              </h3>
              
              <p className="text-slate-200 mb-6">
                Real-time price divergence detection between Crypto.com and DEXs. 
                Prevent arbitrage attacks and protect your liquidity.
              </p>

              <div className="flex flex-wrap gap-2 mb-6">
                <span className="px-3 py-1 bg-slate-800 rounded-full text-xs text-slate-300">Price Monitoring</span>
                <span className="px-3 py-1 bg-slate-800 rounded-full text-xs text-slate-300">x402 Enabled</span>
                <span className="px-3 py-1 bg-slate-800 rounded-full text-xs text-slate-300">Real-time</span>
              </div>

              <Link
                to="/divergence"
                className="block w-full py-3 bg-purple-600/10 hover:bg-purple-600 border border-purple-500/30 hover:border-purple-500 rounded-lg font-semibold transition-all group-hover:translate-x-2 text-center"
              >
                Launch Tool →
              </Link>
            </AnimatedBorder>

            {/* Tool 4: Observability */}
            <AnimatedBorder className="rounded-2xl p-8 glass-card group cursor-pointer">
              <div className="flex items-start justify-between mb-6">
                <div className="p-3 bg-blue-500/10 rounded-xl">
                  <Eye className="w-8 h-8 text-blue-400" />
                </div>
                <span className="text-xs px-3 py-1 bg-indigo-500/10 border border-indigo-500/30 rounded-full text-indigo-300 uppercase tracking-wide">
                  Track 4
                </span>
              </div>
              
              <h3 className="text-2xl font-bold mb-3 group-hover:text-blue-400 transition-colors">
                👁️ Observability
              </h3>
              
              <p className="text-slate-200 mb-6">
                Transparent AI decision monitoring. See every decision your AI makes, 
                with full logs, metrics, and explainability.
              </p>

              <div className="flex flex-wrap gap-2 mb-6">
                <span className="px-3 py-1 bg-slate-800 rounded-full text-xs text-slate-300">Dashboard</span>
                <span className="px-3 py-1 bg-slate-800 rounded-full text-xs text-slate-300">Metrics</span>
                <span className="px-3 py-1 bg-slate-800 rounded-full text-xs text-slate-300">Transparency</span>
              </div>

              <Link
                to="/dashboard"
                className="block w-full py-3 bg-blue-600/10 hover:bg-blue-600 border border-blue-500/30 hover:border-blue-500 rounded-lg font-semibold transition-all group-hover:translate-x-2 text-center"
              >
                Launch Tool →
              </Link>
            </AnimatedBorder>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="about" className="py-24 px-6 bg-slate-900/50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="orbitron text-4xl md:text-5xl font-bold mb-4">
              <GradientText>How It Works</GradientText>
            </h2>
            <p className="text-slate-400 text-lg">Integration creates exponential value</p>
          </div>

          <div className="relative">
            {/* Flow diagram */}
            <div className="grid md:grid-cols-3 gap-8">
              <GlassCard className="rounded-2xl p-8 text-center">
                <div className="w-16 h-16 bg-indigo-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-indigo-400">1</span>
                </div>
                <h3 className="text-xl font-bold mb-3">Analyze</h3>
                <p className="text-slate-400 text-sm">Risk Oracle scans contracts and provides real-time security scores</p>
              </GlassCard>

              <GlassCard className="rounded-2xl p-8 text-center">
                <div className="w-16 h-16 bg-indigo-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-indigo-400">2</span>
                </div>
                <h3 className="text-xl font-bold mb-3">Protect</h3>
                <p className="text-slate-400 text-sm">Shielded Vaults automatically blocks dangerous transactions</p>
              </GlassCard>

              <GlassCard className="rounded-2xl p-8 text-center">
                <div className="w-16 h-16 bg-indigo-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-indigo-400">3</span>
                </div>
                <h3 className="text-xl font-bold mb-3">Monitor</h3>
                <p className="text-slate-400 text-sm">Observability tracks all decisions for full transparency</p>
              </GlassCard>
            </div>
          </div>
        </div>
      </section>

      {/* For Developers Section */}
      <section id="developers" className="py-24 px-6 relative">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="orbitron text-4xl md:text-5xl font-bold mb-4">
              <GradientText>For Developers</GradientText>
            </h2>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto">
              Integrate Cronos Shield into your applications with our TypeScript SDK and MCP Server
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* SDK */}
            <AnimatedBorder className="rounded-2xl p-8 glass-card group">
              <div className="flex items-start justify-between mb-6">
                <div className="p-3 bg-cyan-500/10 rounded-xl">
                  <svg className="w-8 h-8 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"/>
                  </svg>
                </div>
                <span className="text-xs px-3 py-1 bg-indigo-500/10 border border-indigo-500/30 rounded-full text-indigo-300 uppercase tracking-wide">
                  Track 4
                </span>
              </div>
              
              <h3 className="text-2xl font-bold mb-3 group-hover:text-cyan-400 transition-colors">
                📦 TypeScript SDK
              </h3>
              
              <p className="text-slate-200 mb-6">
                Complete TypeScript SDK for easy integration. One line of code to access all Cronos Shield features: risk analysis, vault operations, divergence detection, and more.
              </p>

              <div className="bg-slate-900/50 rounded-lg p-4 mb-6 font-mono text-sm">
                <div className="text-slate-500">import</div>
                <div className="text-cyan-400"> {'{ CronosShieldClient }'} </div>
                <div className="text-slate-500">from</div>
                <div className="text-green-400"> '@cronos-shield/sdk'</div>
                <div className="mt-2 text-slate-300">
                  const client = <span className="text-cyan-400">new</span> CronosShieldClient()
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mb-6">
                <span className="px-3 py-1 bg-slate-800 rounded-full text-xs text-slate-300">TypeScript</span>
                <span className="px-3 py-1 bg-slate-800 rounded-full text-xs text-slate-300">x402 Support</span>
                <span className="px-3 py-1 bg-slate-800 rounded-full text-xs text-slate-300">Full API</span>
              </div>

              <a
                href="https://github.com/DeegaLabs/cronos-shield/tree/main/sdk"
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full py-3 bg-cyan-600/10 hover:bg-cyan-600 border border-cyan-500/30 hover:border-cyan-500 rounded-lg font-semibold transition-all group-hover:translate-x-2 text-center"
              >
                View SDK Docs →
              </a>
            </AnimatedBorder>

            {/* MCP Server */}
            <AnimatedBorder className="rounded-2xl p-8 glass-card group">
              <div className="flex items-start justify-between mb-6">
                <div className="p-3 bg-purple-500/10 rounded-xl">
                  <svg className="w-8 h-8 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
                  </svg>
                </div>
                <span className="text-xs px-3 py-1 bg-indigo-500/10 border border-indigo-500/30 rounded-full text-indigo-300 uppercase tracking-wide">
                  Track 4
                </span>
              </div>
              
              <h3 className="text-2xl font-bold mb-3 group-hover:text-purple-400 transition-colors">
                🤖 MCP Server
              </h3>
              
              <p className="text-slate-200 mb-6">
                Model Context Protocol server with 8 tools for AI assistants. Claude, GPT-4, or any AI agent can analyze risks, check vaults, and monitor divergences natively.
              </p>

              <div className="bg-slate-900/50 rounded-lg p-4 mb-6 font-mono text-sm">
                <div className="text-slate-500">8 Tools Available:</div>
                <div className="mt-2 text-slate-300 space-y-1">
                  <div>• analyzeRisk</div>
                  <div>• getVaultBalance</div>
                  <div>• analyzeDivergence</div>
                  <div>• getMetrics</div>
                  <div className="text-slate-500">+ 4 more...</div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mb-6">
                <span className="px-3 py-1 bg-slate-800 rounded-full text-xs text-slate-300">MCP Protocol</span>
                <span className="px-3 py-1 bg-slate-800 rounded-full text-xs text-slate-300">AI Agents</span>
                <span className="px-3 py-1 bg-slate-800 rounded-full text-xs text-slate-300">8 Tools</span>
              </div>

              <a
                href="https://github.com/DeegaLabs/cronos-shield/tree/main/mcp-server"
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full py-3 bg-purple-600/10 hover:bg-purple-600 border border-purple-500/30 hover:border-purple-500 rounded-lg font-semibold transition-all group-hover:translate-x-2 text-center"
              >
                View MCP Docs →
              </a>
            </AnimatedBorder>
          </div>

          {/* API Documentation Links */}
          <div className="mt-12">
            <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              {/* Swagger UI */}
              <GlassCard className="rounded-2xl p-8 text-center">
                <h3 className="text-xl font-bold mb-3">📚 Swagger UI</h3>
                <p className="text-slate-200 mb-4">Interactive API documentation with testing capabilities</p>
                <a
                  href="https://cronos-shield-backend-production.up.railway.app/api-doc"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block px-6 py-3 bg-indigo-600 hover:bg-indigo-500 rounded-lg font-semibold transition-all"
                >
                  Open Swagger →
                </a>
              </GlassCard>

              {/* Redoc */}
              <GlassCard className="rounded-2xl p-8 text-center">
                <h3 className="text-xl font-bold mb-3">📖 Redoc</h3>
                <p className="text-slate-200 mb-4">Beautiful, responsive API documentation</p>
                <a
                  href="https://cronos-shield-backend-production.up.railway.app/docs"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block px-6 py-3 bg-purple-600 hover:bg-purple-500 rounded-lg font-semibold transition-all"
                >
                  Open Redoc →
                </a>
              </GlassCard>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </>
  )
}
