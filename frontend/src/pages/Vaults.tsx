import { useState } from 'react'
import { GlassCard } from '../components/cards/GlassCard'

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
    <>
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
          <svg className="w-8 h-8 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
          </svg>
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
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/>
                    </svg>
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg">
                <span className="text-sm text-slate-400">Maximum Risk Score</span>
                <div className="flex items-center gap-3">
                  <div className="w-32 h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div className="w-[30%] h-full bg-green-500"></div>
                  </div>
                  <span className="font-bold text-green-400">{maxRiskScore}/100</span>
                  <span className="px-2 py-1 bg-green-500/10 text-green-400 rounded text-xs font-bold">🟢 Safe</span>
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
                <span className="gradient-text">0.0000</span>
                <span className="text-2xl text-slate-400 ml-2">CRO</span>
              </div>
              <div className="text-slate-500">~$0.00 USD</div>
            </div>

            <div className="p-4 bg-indigo-950/20 border border-indigo-900/30 rounded-lg mb-6">
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                <div className="text-sm">
                  <div className="font-semibold mb-1">Circuit Breaker Protection</div>
                  <div className="text-slate-400">Transactions to high-risk contracts will be automatically blocked</div>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-6 border-b border-slate-700 mb-6">
              <button
                onClick={() => setActiveTab('deposit')}
                className={`tab pb-3 font-semibold ${activeTab === 'deposit' ? 'active' : 'text-slate-400'}`}
              >
                Deposit
              </button>
              <button
                onClick={() => setActiveTab('withdraw')}
                className={`tab pb-3 font-semibold ${activeTab === 'withdraw' ? 'active' : 'text-slate-400'}`}
              >
                Withdraw
              </button>
            </div>

            {/* Deposit Tab */}
            {activeTab === 'deposit' && (
              <div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-300 mb-2">Amount (CRO)</label>
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
              </div>
            )}

            {/* Withdraw Tab */}
            {activeTab === 'withdraw' && (
              <div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-300 mb-2">Amount (CRO)</label>
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
                      <span>Deposited: 0.0000 CRO</span>
                      <span>~$0.00 USD</span>
                    </div>
                  </div>

                  <button className="w-full py-4 bg-slate-700 hover:bg-slate-600 rounded-lg font-bold text-lg transition-all">
                    Withdraw CRO
                  </button>
                </div>
              </div>
            )}
          </GlassCard>

          {/* Transaction History */}
          <GlassCard className="rounded-2xl p-6">
            <h3 className="text-lg font-bold mb-4">Transaction History</h3>
            
            <div className="text-center py-12">
              <svg className="w-16 h-16 text-slate-700 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
              </svg>
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
                  <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
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
              <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
              </svg>
              Security Features
            </h3>

            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-green-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg className="w-3 h-3 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/>
                  </svg>
                </div>
                <div>
                  <div className="font-semibold text-sm mb-1">Risk Oracle Integration</div>
                  <div className="text-xs text-slate-400">Real-time contract risk analysis</div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-green-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg className="w-3 h-3 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/>
                  </svg>
                </div>
                <div>
                  <div className="font-semibold text-sm mb-1">Circuit Breaker</div>
                  <div className="text-xs text-slate-400">Auto-blocks high-risk transactions</div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-green-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg className="w-3 h-3 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/>
                  </svg>
                </div>
                <div>
                  <div className="font-semibold text-sm mb-1">Transparent Decisions</div>
                  <div className="text-xs text-slate-400">All AI decisions logged on-chain</div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-green-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg className="w-3 h-3 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/>
                  </svg>
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
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
                </svg>
                View Contract on Explorer
              </button>
              
              <button className="w-full py-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                </svg>
                Read Documentation
              </button>

              <button className="w-full py-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z"/>
                </svg>
                Need Help?
              </button>
            </div>
          </GlassCard>
        </div>
      </div>
    </>
  )
}
