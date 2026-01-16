import { useState } from 'react'
import { Lock, Copy, Info, CheckCircle, ExternalLink, FileText, HelpCircle, Clipboard } from 'lucide-react'
import { GlassCard } from '../components/cards/GlassCard'
import { GradientText } from '../components/animations/GradientText'

export default function VaultsPage() {
  const [activeTab, setActiveTab] = useState<'deposit' | 'withdraw'>('deposit')
  const [depositAmount, setDepositAmount] = useState('')
  const [withdrawAmount, setWithdrawAmount] = useState('')

  const vaultAddress = '0x8b58f3A33AFDF...F6071Dc364'
  const riskOracleAddress = '0x391e8fA8d8...7C73452A'
  const ownerAddress = '0xae4fF89Ac2...dC8Fd8ad'
  const balance = '0.0000'
  const maxRiskScore = 30

  const handleMaxDeposit = () => {
    // Get wallet balance and set as max
    setDepositAmount('0.0000')
  }

  const handleMaxWithdraw = () => {
    // Get vault balance and set as max
    setWithdrawAmount(balance)
  }

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
          <Lock className="w-8 h-8 text-orange-400" />
          Shielded Vaults
        </h1>
        <p className="text-slate-400">Protected vaults with automated circuit breakers</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Vault Interface */}
        <div className="lg:col-span-2 space-y-6">
          {/* Vault Information */}
          <GlassCard className="rounded-2xl p-6">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold mb-2">Vault Information</h2>
                <p className="text-sm text-slate-400">Protected by AI-powered risk oracle</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                <span className="text-sm text-green-400 font-semibold">Active</span>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg">
                <span className="text-sm text-slate-400">Contract Address</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm">{vaultAddress}</span>
                  <button
                    onClick={() => handleCopy(vaultAddress)}
                    className="text-indigo-400 hover:text-indigo-300"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg">
                <span className="text-sm text-slate-400">Maximum Risk Score</span>
                <div className="flex items-center gap-3">
                  <div className="w-32 h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div className="h-full bg-green-500" style={{ width: `${maxRiskScore}%` }}></div>
                  </div>
                  <span className="font-bold text-green-400">{maxRiskScore}/100</span>
                  <span className="px-2 py-1 bg-green-500/10 text-green-400 rounded text-xs font-bold">
                    🟢 Safe
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg">
                <span className="text-sm text-slate-400">Risk Oracle</span>
                <span className="font-mono text-sm">{riskOracleAddress}</span>
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg">
                <span className="text-sm text-slate-400">Owner</span>
                <span className="font-mono text-sm">{ownerAddress}</span>
              </div>
            </div>
          </GlassCard>

          {/* Your Position */}
          <GlassCard className="rounded-2xl p-8">
            <h3 className="text-lg font-bold mb-6">Your Position</h3>
            
            <div className="text-center mb-8">
              <div className="text-sm text-slate-400 mb-2">Your Balance</div>
              <div className="text-5xl font-bold mb-2">
                <GradientText>{balance}</GradientText>
                <span className="text-2xl text-slate-400 ml-2">CRO</span>
              </div>
              <div className="text-slate-500">~$0.00 USD</div>
            </div>

            <div className="p-4 bg-indigo-950/20 border border-indigo-900/30 rounded-lg mb-6">
              <div className="flex items-center gap-3">
                <Info className="w-5 h-5 text-indigo-400" />
                <div className="text-sm">
                  <div className="font-semibold mb-1">Circuit Breaker Protection</div>
                  <div className="text-slate-400">
                    Transactions to high-risk contracts will be automatically blocked
                  </div>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-6 border-b border-slate-700 mb-6">
              <button
                onClick={() => setActiveTab('deposit')}
                className={`pb-3 font-semibold transition-colors relative ${
                  activeTab === 'deposit'
                    ? 'text-indigo-500'
                    : 'text-slate-400'
                }`}
              >
                Deposit
                {activeTab === 'deposit' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500"></div>
                )}
              </button>
              <button
                onClick={() => setActiveTab('withdraw')}
                className={`pb-3 font-semibold transition-colors relative ${
                  activeTab === 'withdraw'
                    ? 'text-indigo-500'
                    : 'text-slate-400'
                }`}
              >
                Withdraw
                {activeTab === 'withdraw' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500"></div>
                )}
              </button>
            </div>

            {/* Deposit Tab */}
            {activeTab === 'deposit' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">
                    Amount (CRO)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      placeholder="0.0"
                      value={depositAmount}
                      onChange={(e) => setDepositAmount(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg focus:border-indigo-500 focus:outline-none transition-colors pr-20"
                    />
                    <button
                      onClick={handleMaxDeposit}
                      className="absolute right-3 top-1/2 -translate-y-1/2 px-3 py-1 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-400 rounded text-sm font-semibold transition-colors"
                    >
                      MAX
                    </button>
                  </div>
                  <div className="flex items-center justify-between mt-2 text-xs text-slate-500">
                    <span>Available: 0.0000 CRO</span>
                    <span>~$0.00 USD</span>
                  </div>
                </div>

                <button className="w-full py-4 bg-orange-600 hover:bg-orange-500 rounded-lg font-bold text-lg transition-all transform hover:scale-[1.02]">
                  Deposit CRO
                </button>
              </div>
            )}

            {/* Withdraw Tab */}
            {activeTab === 'withdraw' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">
                    Amount (CRO)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      placeholder="0.0"
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg focus:border-indigo-500 focus:outline-none transition-colors pr-20"
                    />
                    <button
                      onClick={handleMaxWithdraw}
                      className="absolute right-3 top-1/2 -translate-y-1/2 px-3 py-1 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-400 rounded text-sm font-semibold transition-colors"
                    >
                      MAX
                    </button>
                  </div>
                  <div className="flex items-center justify-between mt-2 text-xs text-slate-500">
                    <span>Deposited: {balance} CRO</span>
                    <span>~$0.00 USD</span>
                  </div>
                </div>

                <button className="w-full py-4 bg-slate-700 hover:bg-slate-600 rounded-lg font-bold text-lg transition-all">
                  Withdraw CRO
                </button>
              </div>
            )}
          </GlassCard>

          {/* Transaction History */}
          <GlassCard className="rounded-2xl p-6">
            <h3 className="text-lg font-bold mb-4">Transaction History</h3>
            
            <div className="text-center py-12">
              <Clipboard className="w-16 h-16 text-slate-700 mx-auto mb-4" />
              <p className="text-slate-400 mb-2">No transactions yet</p>
              <p className="text-sm text-slate-500">Your transaction history will appear here</p>
            </div>
          </GlassCard>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Stats Card */}
          <GlassCard className="rounded-2xl p-6">
            <h3 className="text-lg font-bold mb-4">Vault Stats</h3>
            
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-slate-400">Total Value Locked</span>
                  <Info className="w-4 h-4 text-slate-500" />
                </div>
                <div className="text-2xl font-bold">0.0000 CRO</div>
                <div className="text-xs text-slate-500">~$0.00 USD</div>
              </div>

              <div className="h-px bg-slate-700"></div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-slate-400">Total Depositors</span>
                </div>
                <div className="text-2xl font-bold">0</div>
              </div>

              <div className="h-px bg-slate-700"></div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-slate-400">Transactions Blocked</span>
                </div>
                <div className="text-2xl font-bold text-red-400">0</div>
              </div>
            </div>
          </GlassCard>

          {/* Security Features */}
          <GlassCard className="rounded-2xl p-6">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-400" />
              Security Features
            </h3>

            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-green-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <CheckCircle className="w-3 h-3 text-green-400" />
                </div>
                <div>
                  <div className="font-semibold text-sm mb-1">Risk Oracle Integration</div>
                  <div className="text-xs text-slate-400">Real-time contract risk analysis</div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-green-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <CheckCircle className="w-3 h-3 text-green-400" />
                </div>
                <div>
                  <div className="font-semibold text-sm mb-1">Circuit Breaker</div>
                  <div className="text-xs text-slate-400">Auto-blocks high-risk transactions</div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-green-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <CheckCircle className="w-3 h-3 text-green-400" />
                </div>
                <div>
                  <div className="font-semibold text-sm mb-1">Transparent Decisions</div>
                  <div className="text-xs text-slate-400">All AI decisions logged on-chain</div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-green-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <CheckCircle className="w-3 h-3 text-green-400" />
                </div>
                <div>
                  <div className="font-semibold text-sm mb-1">Non-Custodial</div>
                  <div className="text-xs text-slate-400">You always control your funds</div>
                </div>
              </div>
            </div>
          </GlassCard>

          {/* Quick Actions */}
          <GlassCard className="rounded-2xl p-6">
            <h3 className="text-lg font-bold mb-4">Quick Actions</h3>
            
            <div className="space-y-2">
              <button className="w-full py-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2">
                <ExternalLink className="w-4 h-4" />
                View Contract on Explorer
              </button>
              
              <button className="w-full py-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2">
                <FileText className="w-4 h-4" />
                Read Documentation
              </button>

              <button className="w-full py-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2">
                <HelpCircle className="w-4 h-4" />
                Need Help?
              </button>
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  )
}
