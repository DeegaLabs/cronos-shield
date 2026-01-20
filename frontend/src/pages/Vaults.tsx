import { useState, lazy, Suspense } from 'react'
import { useAccount, useWalletClient } from 'wagmi'
import { GlassCard } from '../components/cards/GlassCard'
import { useVault } from '../hooks/useVault'
import { useWalletBalance } from '../hooks/useWalletBalance'
import { useVaultTransactions } from '../hooks/useVaultTransactions'
import { useVaultStats } from '../hooks/useVaultStats'
import { formatDistanceToNow } from 'date-fns'
import apiClient from '../lib/api/client'
import type { PaymentChallenge } from '../types/x402.types'

// Lazy load PaymentModal
const PaymentModalLazy = lazy(() => import('../components/common/PaymentModal'))

export default function VaultsPage() {
  const { address, isConnected } = useAccount()
  const { data: walletClient } = useWalletClient()
  const [activeTab, setActiveTab] = useState<'deposit' | 'withdraw' | 'protected'>('deposit')
  const [depositAmount, setDepositAmount] = useState('')
  const [withdrawAmount, setWithdrawAmount] = useState('')
  const [protectedTarget, setProtectedTarget] = useState('')
  const [protectedValue, setProtectedValue] = useState('')
  const [protectedCallData, setProtectedCallData] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [riskAnalysis, setRiskAnalysis] = useState<any>(null)
  const [isAnalyzingRisk, setIsAnalyzingRisk] = useState(false)
  const [paymentChallenge, setPaymentChallenge] = useState<PaymentChallenge | null>(null)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [paymentId, setPaymentId] = useState<string | null>(null)

  const {
    vaultInfo,
    balance: vaultBalance,
    isLoadingBalance,
    deposit,
    withdraw,
    executeProtectedTransaction,
    isDepositing,
    isWithdrawing,
    isExecutingProtectedTransaction,
    contractAddress,
  } = useVault()

  const { balance: walletBalance, isLoading: isLoadingWalletBalance } = useWalletBalance()
  const { transactions, isLoading: isLoadingTransactions } = useVaultTransactions(20)
  const { stats: vaultStats, isLoading: isLoadingStats } = useVaultStats()

  // Check if contract is configured
  const isContractConfigured = !!contractAddress

  const handleMaxDeposit = () => {
    console.log('🔵 handleMaxDeposit called', { walletBalance, isLoadingWalletBalance, isConnected })
    if (!isConnected) {
      setError('Please connect your wallet first')
      return
    }
    if (isLoadingWalletBalance) {
      setError('Loading wallet balance...')
      return
    }
    if (walletBalance?.formatted) {
      // Leave a small amount for gas (0.01 CRO)
      const maxAmount = Math.max(0, parseFloat(walletBalance.formatted) - 0.01)
      const amountToSet = maxAmount > 0 ? maxAmount.toFixed(4) : '0'
      console.log('✅ Setting deposit amount to:', amountToSet)
      setDepositAmount(amountToSet)
      setError(null)
    } else {
      const errorMsg = 'Wallet balance not available. Please wait a moment for balance to load.'
      console.error('❌', errorMsg)
      setError(errorMsg)
    }
  }

  const handleMaxWithdraw = () => {
    if (vaultBalance?.formatted) {
      setWithdrawAmount(vaultBalance.formatted)
    }
  }

  const handleDeposit = async () => {
    console.log('🔵 handleDeposit called', { 
      isConnected, 
      address, 
      depositAmount, 
      hasDepositFn: !!deposit,
      contractAddress,
      isContractConfigured
    })
    
    if (!isConnected || !address) {
      setError('Please connect your wallet first')
      return
    }

    if (!isContractConfigured) {
      setError('Vault contract not configured. Please set VITE_SHIELDED_VAULT_ADDRESS in environment variables.')
      console.error('❌ Contract address not configured')
      return
    }

    if (!depositAmount || parseFloat(depositAmount) <= 0) {
      setError('Please enter a valid amount')
      return
    }

    if (!deposit) {
      setError('Deposit function not available. Please check your wallet connection.')
      console.error('❌ deposit function is not available')
      return
    }

    setIsProcessing(true)
    setError(null)
    setSuccess(null)

    try {
      console.log('📤 Calling deposit function with amount:', depositAmount)
      const txHash = await deposit(depositAmount)
      console.log('✅ Deposit successful, txHash:', txHash)
      setSuccess(`Deposit successful! Transaction: ${txHash.slice(0, 10)}...`)
      setDepositAmount('')
    } catch (err: any) {
      console.error('❌ Deposit error:', err)
      const errorMessage = err.message || err.reason || 'Deposit failed. Check console for details.'
      setError(errorMessage)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleWithdraw = async () => {
    if (!isConnected || !address) {
      setError('Please connect your wallet first')
      return
    }

    if (!withdrawAmount || parseFloat(withdrawAmount) <= 0) {
      setError('Please enter a valid amount')
      return
    }

    if (vaultBalance && parseFloat(withdrawAmount) > parseFloat(vaultBalance.formatted)) {
      setError('Insufficient balance')
      return
    }

    setIsProcessing(true)
    setError(null)
    setSuccess(null)

    try {
      const txHash = await withdraw(withdrawAmount)
      setSuccess(`Withdrawal successful! Transaction: ${txHash.slice(0, 10)}...`)
      setWithdrawAmount('')
    } catch (err: any) {
      setError(err.message || 'Withdrawal failed')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleCheckRisk = async (overridePaymentId?: string) => {
    if (!isConnected || !address) {
      setError('Please connect your wallet first')
      return
    }

    if (!protectedTarget || !protectedTarget.trim()) {
      setError('Please enter a target contract address')
      return
    }

    setIsAnalyzingRisk(true)
    setError(null)
    setRiskAnalysis(null)
    setPaymentChallenge(null)
    setShowPaymentModal(false)

    try {
      // Use overridePaymentId if provided, otherwise use state paymentId or localStorage
      const currentPaymentId = overridePaymentId || paymentId || localStorage.getItem('x-payment-id')
      const headers: Record<string, string> = {}
      if (currentPaymentId) {
        headers['x-payment-id'] = currentPaymentId
      }

      const response = await apiClient.get('/api/risk/risk-analysis', {
        params: { contract: protectedTarget.trim() },
        headers,
      })
      
      console.log('🔍 Risk analysis response received:', {
        score: response.data.score,
        contract: response.data.contract,
        details: response.data.details,
        fullResponse: response.data,
      })
      
      setRiskAnalysis(response.data)
      setPaymentId(null) // Reset after successful request
      setSuccess(`Risk analysis complete. Score: ${response.data.score}/100`)
    } catch (err: any) {
      if (err.response?.status === 402) {
        const paymentData = err.response?.data as PaymentChallenge
        setPaymentChallenge(paymentData)
        if (!isConnected || !address || !walletClient) {
          setError('Please connect your wallet first to make payments')
        } else {
          setShowPaymentModal(true)
        }
      } else {
        setError(err.response?.data?.message || 'Failed to analyze risk')
      }
    } finally {
      setIsAnalyzingRisk(false)
    }
  }

  const handlePaymentSuccess = (newPaymentId: string) => {
    console.log('✅ Payment successful, paymentId:', newPaymentId)
    setPaymentId(newPaymentId)
    setPaymentChallenge(null)
    setShowPaymentModal(false)
    // Retry the risk analysis request automatically after payment
    setTimeout(() => {
      console.log('🔄 Retrying risk analysis with paymentId:', newPaymentId)
      handleCheckRisk(newPaymentId)
    }, 1000)
  }

  const handleExecuteProtectedTransaction = async () => {
    if (!isConnected || !address) {
      setError('Please connect your wallet first')
      return
    }

    if (!riskAnalysis) {
      setError('Please check risk first')
      return
    }

    const maxAllowed = vaultInfo?.maxRiskScore ?? 30; // Default to 30 if not loaded
    if (riskAnalysis.score > maxAllowed) {
      setError(`Risk score (${riskAnalysis.score}) exceeds maximum allowed (${maxAllowed})`)
      return
    }

    if (!protectedTarget || !protectedValue || parseFloat(protectedValue) <= 0) {
      setError('Please enter valid target address and amount')
      return
    }

    if (vaultBalance && parseFloat(protectedValue) > parseFloat(vaultBalance.formatted)) {
      setError('Insufficient balance in vault')
      return
    }

    setIsProcessing(true)
    setError(null)
    setSuccess(null)

    try {
      // Convert proof to hex string if needed
      const proofHex = riskAnalysis.proof || '0x'
      // Use empty callData if not provided (simple value transfer)
      const callDataHex = protectedCallData.trim() || '0x'

      const txHash = await executeProtectedTransaction({
        target: protectedTarget.trim(),
        callData: callDataHex,
        value: protectedValue,
        riskScore: riskAnalysis.score,
        proof: proofHex,
      })

      setSuccess(`Protected transaction executed! Transaction: ${txHash.slice(0, 10)}...`)
      setProtectedTarget('')
      setProtectedValue('')
      setProtectedCallData('')
      setRiskAnalysis(null)
    } catch (err: any) {
      setError(err.message || 'Transaction execution failed')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const formatAddressShort = (addr: string) => {
    if (!addr) return 'N/A'
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`
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
                  <span className="font-mono text-sm">
                    {contractAddress ? formatAddressShort(contractAddress) : 'Not configured'}
                  </span>
                  {contractAddress && (
                    <button
                      onClick={() => handleCopy(contractAddress)}
                      className="text-indigo-400 hover:text-indigo-300"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/>
                      </svg>
                    </button>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg">
                <span className="text-sm text-slate-400">Maximum Risk Score</span>
                <div className="flex items-center gap-3">
                  <div className="w-32 h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-green-500 transition-all"
                      style={{ width: `${vaultInfo ? (vaultInfo.maxRiskScore / 100) * 100 : 30}%` }}
                    ></div>
                  </div>
                  <span className="font-bold text-green-400">
                    {vaultInfo?.maxRiskScore ?? '...'}/100
                  </span>
                  <span className="px-2 py-1 bg-green-500/10 text-green-400 rounded text-xs font-bold">🟢 Safe</span>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg">
                <span className="text-sm text-slate-400">Risk Oracle</span>
                <span className="font-mono text-sm">
                  {vaultInfo?.riskOracleAddress ? formatAddressShort(vaultInfo.riskOracleAddress) : '...'}
                </span>
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg">
                <span className="text-sm text-slate-400">Owner</span>
                <span className="font-mono text-sm">
                  {vaultInfo?.owner ? formatAddressShort(vaultInfo.owner) : '...'}
                </span>
              </div>
            </div>
          </GlassCard>

          {/* Your Position */}
          <GlassCard className="rounded-2xl p-8">
            <h3 className="text-lg font-bold mb-6">Your Position</h3>
            
            <div className="text-center mb-8">
              <div className="text-sm text-slate-400 mb-2">Your Balance</div>
              {isLoadingBalance ? (
                <div className="text-5xl font-bold mb-2">
                  <span className="gradient-text">...</span>
                </div>
              ) : (
                <div className="text-5xl font-bold mb-2">
                  <span className="gradient-text">
                    {vaultBalance?.formatted ? parseFloat(vaultBalance.formatted).toFixed(4) : '0.0000'}
                  </span>
                  <span className="text-2xl text-slate-400 ml-2">CRO</span>
                </div>
              )}
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
              <button
                onClick={() => setActiveTab('protected')}
                className={`tab pb-3 font-semibold ${activeTab === 'protected' ? 'active' : 'text-slate-400'}`}
              >
                Protected Transaction
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
                      <span>
                        Available: {isLoadingWalletBalance ? '...' : (walletBalance?.formatted ? parseFloat(walletBalance.formatted).toFixed(4) : '0.0000')} CRO
                      </span>
                      <span>~$0.00 USD</span>
                    </div>
                  </div>

                  {error && (
                    <div className="p-3 bg-red-900/50 border border-red-500 rounded-lg text-red-400 text-sm">
                      {error}
                    </div>
                  )}

                  {success && (
                    <div className="p-3 bg-green-900/50 border border-green-500 rounded-lg text-green-400 text-sm">
                      {success}
                    </div>
                  )}

                  <button
                    onClick={handleDeposit}
                    disabled={!isConnected || isProcessing || isDepositing || !depositAmount || parseFloat(depositAmount) <= 0}
                    className="w-full py-4 bg-orange-600 hover:bg-orange-500 disabled:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-bold text-lg transition-all transform hover:scale-[1.02] disabled:transform-none"
                  >
                    {isProcessing || isDepositing ? 'Processing...' : 'Deposit CRO'}
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
                      <span>
                        Deposited: {isLoadingBalance ? '...' : (vaultBalance?.formatted ? parseFloat(vaultBalance.formatted).toFixed(4) : '0.0000')} CRO
                      </span>
                      <span>~$0.00 USD</span>
                    </div>
                  </div>

                  {error && (
                    <div className="p-3 bg-red-900/50 border border-red-500 rounded-lg text-red-400 text-sm">
                      {error}
                    </div>
                  )}

                  {success && (
                    <div className="p-3 bg-green-900/50 border border-green-500 rounded-lg text-green-400 text-sm">
                      {success}
                    </div>
                  )}

                  <button
                    onClick={handleWithdraw}
                    disabled={!isConnected || isProcessing || isWithdrawing || !withdrawAmount || parseFloat(withdrawAmount) <= 0 || (vaultBalance && parseFloat(withdrawAmount) > parseFloat(vaultBalance.formatted))}
                    className="w-full py-4 bg-slate-700 hover:bg-slate-600 disabled:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-bold text-lg transition-all"
                  >
                    {isProcessing || isWithdrawing ? 'Processing...' : 'Withdraw CRO'}
                  </button>
                </div>
              </div>
            )}

            {/* Protected Transaction Tab */}
            {activeTab === 'protected' && (
              <div>
                <div className="space-y-4">
                  <div className="p-4 bg-blue-950/20 border border-blue-900/30 rounded-lg mb-4">
                    <div className="flex items-center gap-3 mb-2">
                      <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
                      </svg>
                      <div className="font-semibold text-blue-400">Risk-Protected Transaction</div>
                    </div>
                    <div className="text-sm text-slate-400">
                      Execute transactions to external contracts with automatic risk verification. High-risk contracts will be blocked.
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-300 mb-2">Target Contract Address</label>
                    <input
                      type="text"
                      placeholder="0x..."
                      value={protectedTarget}
                      onChange={(e) => setProtectedTarget(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg focus:border-indigo-500 focus:outline-none transition-colors font-mono text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-300 mb-2">Amount (CRO)</label>
                    <input
                      type="number"
                      placeholder="0.0"
                      value={protectedValue}
                      onChange={(e) => setProtectedValue(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg focus:border-indigo-500 focus:outline-none transition-colors"
                    />
                    <div className="flex items-center justify-between mt-2 text-xs text-slate-500">
                      <span>
                        Available in Vault: {isLoadingBalance ? '...' : (vaultBalance?.formatted ? parseFloat(vaultBalance.formatted).toFixed(4) : '0.0000')} CRO
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-300 mb-2">Call Data (hex, optional)</label>
                    <input
                      type="text"
                      placeholder="0x..."
                      value={protectedCallData}
                      onChange={(e) => setProtectedCallData(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg focus:border-indigo-500 focus:outline-none transition-colors font-mono text-sm"
                    />
                    <div className="text-xs text-slate-500 mt-1">
                      Leave empty for simple value transfer
                    </div>
                  </div>

                  {isAnalyzingRisk ? (
                    <div className="p-4 rounded-lg border bg-slate-800/50 border-slate-700">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold">Risk Score</span>
                        <span className="text-slate-400">...</span>
                      </div>
                      <div className="text-center py-4">
                        <div className="text-slate-400">Loading risk analysis...</div>
                      </div>
                    </div>
                  ) : riskAnalysis && (() => {
                    const maxAllowed = vaultInfo?.maxRiskScore ?? 30; // Default to 30 if not loaded
                    const score = riskAnalysis.score ?? 0;
                    const isAllowed = score <= maxAllowed;
                    
                    console.log('📊 Displaying risk score:', {
                      score,
                      maxAllowed,
                      isAllowed,
                      riskAnalysis,
                    });
                    
                    return (
                      <div className={`p-4 rounded-lg border ${
                        isAllowed
                          ? 'bg-green-950/20 border-green-900/30'
                          : 'bg-red-950/20 border-red-900/30'
                      }`}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-semibold">Risk Score</span>
                          <span className={`font-bold text-lg ${
                            isAllowed
                              ? 'text-green-400'
                              : 'text-red-400'
                          }`}>
                            {score}/100
                          </span>
                        </div>
                        {!isAllowed && (
                          <div className="text-sm text-red-400 mt-2">
                            ⚠️ Risk score exceeds maximum allowed ({maxAllowed}/100). Transaction will be blocked.
                          </div>
                        )}
                        {riskAnalysis.details?.warnings && riskAnalysis.details.warnings.length > 0 && (
                          <div className="mt-3">
                            <div className="text-xs font-semibold text-slate-400 mb-1">Warnings:</div>
                            <ul className="text-xs text-slate-300 space-y-1">
                              {riskAnalysis.details.warnings.slice(0, 3).map((warning: string, idx: number) => (
                                <li key={idx}>• {warning}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {error && (
                    <div className="p-3 bg-red-900/50 border border-red-500 rounded-lg text-red-400 text-sm">
                      {error}
                    </div>
                  )}

                  {success && (
                    <div className="p-3 bg-green-900/50 border border-green-500 rounded-lg text-green-400 text-sm">
                      {success}
                    </div>
                  )}

                  {paymentChallenge && !showPaymentModal && (
                    <div className="p-4 bg-yellow-950/20 border border-yellow-900/30 rounded-lg mb-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-lg font-bold text-yellow-400 mb-2">💰 Payment Required</h4>
                          <p className="text-slate-300 text-sm">{paymentChallenge.message}</p>
                        </div>
                        <button
                          onClick={() => setShowPaymentModal(true)}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-semibold transition-colors"
                        >
                          Pay with x402
                        </button>
                      </div>
                    </div>
                  )}

                  {showPaymentModal && paymentChallenge && (
                    <Suspense fallback={
                      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                        <div className="bg-slate-800 p-6 rounded-lg">Loading payment modal...</div>
                      </div>
                    }>
                      <PaymentModalLazy
                        challenge={paymentChallenge}
                        walletAddress={address || null}
                        signer={walletClient as any}
                        isOpen={showPaymentModal}
                        onClose={() => {
                          setShowPaymentModal(false)
                          setPaymentChallenge(null)
                        }}
                        onSuccess={handlePaymentSuccess}
                      />
                    </Suspense>
                  )}

                  <div className="space-y-2">
                    <button
                      onClick={() => handleCheckRisk()}
                      disabled={!isConnected || isAnalyzingRisk || !protectedTarget || !protectedValue || parseFloat(protectedValue) <= 0}
                      className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-bold transition-all"
                    >
                      {isAnalyzingRisk ? 'Analyzing Risk...' : paymentChallenge ? 'Payment Required - Click to Pay' : 'Check Risk First'}
                    </button>

                    <button
                      onClick={handleExecuteProtectedTransaction}
                      disabled={
                        !isConnected || 
                        isProcessing || 
                        isExecutingProtectedTransaction || 
                        !riskAnalysis || 
                        !protectedTarget || 
                        !protectedValue || 
                        parseFloat(protectedValue) <= 0 || 
                        (riskAnalysis?.score ?? 101) > (vaultInfo?.maxRiskScore ?? 30)
                      }
                      className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-bold text-lg transition-all"
                    >
                      {isProcessing || isExecutingProtectedTransaction ? 'Processing...' : 'Execute Protected Transaction'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </GlassCard>

          {/* Transaction History */}
          <GlassCard className="rounded-2xl p-6">
            <h3 className="text-lg font-bold mb-4">Transaction History</h3>
            
            {isLoadingTransactions ? (
              <div className="text-center py-12">
                <div className="text-slate-400">Loading transactions...</div>
              </div>
            ) : transactions.length === 0 ? (
              <div className="text-center py-12">
                <svg className="w-16 h-16 text-slate-700 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
                </svg>
                <p className="text-slate-400 mb-2">No transactions yet</p>
                <p className="text-sm text-slate-500">Your transaction history will appear here</p>
              </div>
            ) : (
              <div className="space-y-3">
                {transactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="p-4 bg-slate-800/50 rounded-lg border border-slate-700/50 hover:border-slate-600 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        {tx.type === 'deposit' && (
                          <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center">
                            <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"/>
                            </svg>
                          </div>
                        )}
                        {tx.type === 'withdraw' && (
                          <div className="w-8 h-8 rounded-full bg-orange-500/10 flex items-center justify-center">
                            <svg className="w-4 h-4 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 12H4"/>
                            </svg>
                          </div>
                        )}
                        {tx.type === 'blocked' && (
                          <div className="w-8 h-8 rounded-full bg-red-500/10 flex items-center justify-center">
                            <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/>
                            </svg>
                          </div>
                        )}
                        {tx.type === 'allowed' && (
                          <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center">
                            <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/>
                            </svg>
                          </div>
                        )}
                        <div>
                          <div className="font-semibold capitalize">{tx.type}</div>
                          <div className="text-xs text-slate-400">
                            {formatDistanceToNow(tx.timestamp, { addSuffix: true })}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        {tx.formattedAmount && (
                          <div className="font-bold">
                            {parseFloat(tx.formattedAmount).toFixed(4)} CRO
                          </div>
                        )}
                        {tx.riskScore !== undefined && (
                          <div className="text-xs text-slate-400">
                            Risk: {tx.riskScore}/100
                          </div>
                        )}
                      </div>
                    </div>
                    {tx.target && (
                      <div className="text-xs text-slate-500 font-mono mt-2">
                        Target: {formatAddressShort(tx.target)}
                      </div>
                    )}
                    {tx.reason && (
                      <div className="text-xs text-red-400 mt-1">
                        {tx.reason}
                      </div>
                    )}
                    <a
                      href={`https://testnet.cronoscan.com/tx/${tx.txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-indigo-400 hover:text-indigo-300 mt-2 inline-block"
                    >
                      View on Explorer →
                    </a>
                  </div>
                ))}
              </div>
            )}
          </GlassCard>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Stats Card */}
          <GlassCard className="rounded-2xl p-6">
            <h3 className="text-lg font-bold mb-4">Vault Stats</h3>
            
            {isLoadingStats ? (
              <div className="text-center py-8">
                <div className="text-slate-400">Loading stats...</div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-slate-400">Total Value Locked</span>
                    <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                  </div>
                  <div className="text-2xl font-bold">
                    {parseFloat(vaultStats.totalValueLockedFormatted).toFixed(4)} CRO
                  </div>
                  <div className="text-xs text-slate-500">~$0.00 USD</div>
                </div>

                <div className="h-px bg-slate-700"></div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-slate-400">Total Depositors</span>
                  </div>
                  <div className="text-2xl font-bold">{vaultStats.totalDepositors}</div>
                </div>

                <div className="h-px bg-slate-700"></div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-slate-400">Transactions Blocked</span>
                  </div>
                  <div className="text-2xl font-bold text-red-400">{vaultStats.transactionsBlocked}</div>
                </div>
              </div>
            )}
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
