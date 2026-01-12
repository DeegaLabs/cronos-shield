/**
 * Vault Management Component
 * 
 * Complete interface for Shielded Vault operations
 */

import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import toast from 'react-hot-toast';
import apiClient from '../../lib/api/client';
import { useWallet } from '../../contexts/WalletContext';
import ConfirmModal from '../common/ConfirmModal';
import { InfoTooltip } from '../common/Tooltip';
import type { VaultInfo, VaultBalance, TransactionResult } from '../../types/vault.types';
import type { BlockedTransaction } from '../../types';

const SHIELDED_VAULT_ABI = [
  'function deposit() payable',
  'function withdraw(uint256 amount)',
  'function balances(address) view returns (uint256)',
  'function maxRiskScore() view returns (uint256)',
  'function executeWithRiskCheck(address target, bytes calldata, uint256 value, uint256 riskScore, bytes calldata proof) payable returns (bool)',
  'event Deposited(address indexed user, uint256 amount)',
  'event Withdrawn(address indexed user, uint256 amount)',
  'event TransactionBlocked(address indexed user, address indexed target, uint256 riskScore, string reason)',
  'event TransactionAllowed(address indexed user, address indexed target, uint256 riskScore)',
];

const VAULT_CONTRACT_ADDRESS = import.meta.env.VITE_SHIELDED_VAULT_ADDRESS || '';

export default function VaultManagement() {
  const { wallet } = useWallet();
  const [vaultInfo, setVaultInfo] = useState<VaultInfo | null>(null);
  const [balance, setBalance] = useState<VaultBalance | null>(null);
  const [depositAmount, setDepositAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [targetAddress, setTargetAddress] = useState('');
  const [transactionValue, setTransactionValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [transactionResult, setTransactionResult] = useState<TransactionResult | null>(null);
  const [blockedTransactions, setBlockedTransactions] = useState<BlockedTransaction[]>([]);
  const [isLoadingBlocked, setIsLoadingBlocked] = useState(false);
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    action: 'deposit' | 'withdraw' | 'execute' | null;
    data?: any;
  }>({ isOpen: false, action: null });

  // Load vault info and balance
  useEffect(() => {
    if (VAULT_CONTRACT_ADDRESS) {
      loadVaultInfo();
    }
    if (wallet.address) {
      loadBalance();
      loadBlockedTransactions();
    }
  }, [wallet.address]);

  // Auto-refresh blocked transactions every 10 seconds
  useEffect(() => {
    if (!wallet.address) return;
    
    const interval = setInterval(() => {
      loadBlockedTransactions();
    }, 10000);
    
    return () => clearInterval(interval);
  }, [wallet.address]);

  const loadVaultInfo = async () => {
    try {
      const response = await apiClient.get('/api/vault/info');
      setVaultInfo(response.data);
    } catch (err: any) {
      console.error('Failed to load vault info:', err);
    }
  };

  const loadBalance = async () => {
    if (!wallet.address) return;
    
    try {
      const response = await apiClient.get('/api/vault/balance', {
        params: { address: wallet.address },
      });
      setBalance(response.data);
    } catch (err: any) {
      console.error('Failed to load balance:', err);
    }
  };

  const loadBlockedTransactions = async () => {
    if (!wallet.address) return;
    
    setIsLoadingBlocked(true);
    try {
      const response = await apiClient.get('/api/vault/blocked-transactions', {
        params: { 
          limit: 20,
          userAddress: wallet.address,
        },
      });
      setBlockedTransactions(response.data || []);
    } catch (err: any) {
      console.error('Failed to load blocked transactions:', err);
    } finally {
      setIsLoadingBlocked(false);
    }
  };

  const handleDeposit = async () => {
    if (!wallet.signer || !wallet.address) {
      setError('Please connect your wallet first');
      return;
    }

    if (!depositAmount || parseFloat(depositAmount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Direct contract interaction via frontend
      const vaultContract = new ethers.Contract(
        VAULT_CONTRACT_ADDRESS,
        SHIELDED_VAULT_ABI,
        wallet.signer
      );

      const amountWei = ethers.parseEther(depositAmount);
      const tx = await vaultContract.deposit({ value: amountWei });
      setSuccess(`Transaction sent: ${tx.hash}`);
      
      const receipt = await tx.wait();
      setSuccess(`Deposit successful! Tx: ${receipt.hash}`);
      setDepositAmount('');
      await loadBalance();
    } catch (err: any) {
      setError(err.message || 'Deposit failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleWithdraw = () => {
    if (!wallet.signer || !wallet.address) {
      toast.error('Please connect your wallet first');
      return;
    }

    if (!withdrawAmount || parseFloat(withdrawAmount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    setConfirmModal({
      isOpen: true,
      action: 'withdraw',
      data: { amount: withdrawAmount },
    });
  };

  const executeWithdraw = async () => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);
    setConfirmModal({ isOpen: false, action: null });

    try {
      // Direct contract interaction via frontend
      const vaultContract = new ethers.Contract(
        VAULT_CONTRACT_ADDRESS,
        SHIELDED_VAULT_ABI,
        wallet.signer
      );

      const amountWei = ethers.parseEther(withdrawAmount);
      const tx = await vaultContract.withdraw(amountWei);
      setSuccess(`Transaction sent: ${tx.hash}`);
      
      const receipt = await tx.wait();
      setSuccess(`Withdraw successful! Tx: ${receipt.hash}`);
      setWithdrawAmount('');
      await loadBalance();
    } catch (err: any) {
      setError(err.message || 'Withdraw failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExecuteTransaction = () => {
    if (!wallet.signer || !wallet.address) {
      toast.error('Please connect your wallet first');
      return;
    }

    if (!targetAddress) {
      toast.error('Please enter a target contract address');
      return;
    }

    setConfirmModal({
      isOpen: true,
      action: 'execute',
      data: { target: targetAddress, value: transactionValue },
    });
  };

  const executeTransaction = async () => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);
    setTransactionResult(null);
    setConfirmModal({ isOpen: false, action: null });

    try {
      // Risk analysis will be done by the backend
      // We just need to pass the target address

      // Execute transaction via backend
      const response = await apiClient.post('/api/vault/execute', {
        userAddress: wallet.address,
        target: targetAddress,
        callData: '0x',
        value: transactionValue || '0',
        contractAddress: targetAddress,
      });

      setTransactionResult(response.data);
      
      if (response.data.success) {
        setSuccess(`Transaction executed! Tx: ${response.data.txHash}`);
        await loadBalance();
        await loadBlockedTransactions(); // Refresh blocked transactions
      } else if (response.data.blocked) {
        setError(`Transaction blocked: ${response.data.reason}`);
        await loadBlockedTransactions(); // Refresh blocked transactions
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Transaction execution failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirm = () => {
    if (confirmModal.action === 'deposit') {
      executeDeposit();
    } else if (confirmModal.action === 'withdraw') {
      executeWithdraw();
    } else if (confirmModal.action === 'execute') {
      executeTransaction();
    }
  };

  if (!VAULT_CONTRACT_ADDRESS) {
    return (
      <div className="bg-slate-800 p-6 rounded-lg border border-yellow-500">
        <h3 className="text-xl font-bold text-yellow-400 mb-2">⚠️ Vault Not Configured</h3>
        <p className="text-slate-300">
          Please set VITE_SHIELDED_VAULT_ADDRESS in your environment variables.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, action: null })}
        onConfirm={handleConfirm}
        title={
          confirmModal.action === 'deposit' ? 'Confirm Deposit' :
          confirmModal.action === 'withdraw' ? 'Confirm Withdrawal' :
          'Confirm Transaction Execution'
        }
        message={
          confirmModal.action === 'deposit' 
            ? `Are you sure you want to deposit ${confirmModal.data?.amount} tokens?`
            : confirmModal.action === 'withdraw'
            ? `Are you sure you want to withdraw ${confirmModal.data?.amount} tokens?`
            : `This will execute a transaction to ${confirmModal.data?.target}. Risk analysis will be performed automatically.`
        }
        confirmText={
          confirmModal.action === 'deposit' ? 'Deposit' :
          confirmModal.action === 'withdraw' ? 'Withdraw' :
          'Execute'
        }
        variant={confirmModal.action === 'execute' ? 'warning' : 'info'}
        isLoading={isLoading}
      />
      {/* Vault Info */}
      {vaultInfo && (
        <div className="bg-slate-800 p-6 rounded-lg border border-slate-700">
          <h3 className="text-xl font-bold mb-4">Vault Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="text-slate-400 text-sm mb-1">Contract Address</div>
              <div className="text-slate-200 font-mono text-sm break-all">{vaultInfo.contractAddress}</div>
            </div>
            <div>
              <div className="text-slate-400 text-sm mb-1">Max Risk Score</div>
              <div className="text-slate-200 text-lg font-bold">{vaultInfo.maxRiskScore}/100</div>
            </div>
            <div>
              <div className="text-slate-400 text-sm mb-1">Status</div>
              <div className={vaultInfo.isPaused ? 'text-red-400' : 'text-green-400'}>
                {vaultInfo.isPaused ? '⏸️ Paused' : '✅ Active'}
              </div>
            </div>
            <div>
              <div className="text-slate-400 text-sm mb-1">Risk Oracle</div>
              <div className="text-slate-200 font-mono text-xs break-all">{vaultInfo.riskOracleAddress}</div>
            </div>
          </div>
        </div>
      )}

      {/* Balance */}
      {balance && (
        <div className="bg-slate-800 p-6 rounded-lg border border-slate-700">
          <h3 className="text-xl font-bold mb-4">Your Balance</h3>
          <div className="text-4xl font-bold text-blue-400 mb-2">
            {parseFloat(balance.balanceFormatted).toFixed(4)} CRO
          </div>
          <div className="text-slate-400 text-sm">
            Address: {balance.address.slice(0, 6)}...{balance.address.slice(-4)}
          </div>
        </div>
      )}

      {/* Deposit */}
      <div className="bg-slate-800 p-6 rounded-lg border border-slate-700">
        <h3 className="text-xl font-bold mb-4">Deposit CRO</h3>
        <div className="flex gap-4">
          <input
            type="number"
            step="0.0001"
            value={depositAmount}
            onChange={(e) => setDepositAmount(e.target.value)}
            placeholder="0.0"
            className="flex-1 px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
          />
          <button
            onClick={handleDeposit}
            disabled={isLoading || !wallet.signer}
            className="px-6 py-2 bg-green-600 hover:bg-green-700 disabled:bg-slate-600 disabled:cursor-not-allowed rounded-lg transition-colors"
          >
            {isLoading ? 'Processing...' : 'Deposit'}
          </button>
        </div>
      </div>

      {/* Withdraw */}
      <div className="bg-slate-800 p-6 rounded-lg border border-slate-700">
        <h3 className="text-xl font-bold mb-4">Withdraw CRO</h3>
        <div className="flex gap-4">
          <input
            type="number"
            step="0.0001"
            value={withdrawAmount}
            onChange={(e) => setWithdrawAmount(e.target.value)}
            placeholder="0.0"
            className="flex-1 px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
          />
          <button
            onClick={handleWithdraw}
            disabled={isLoading || !wallet.signer}
            className="px-6 py-2 bg-red-600 hover:bg-red-700 disabled:bg-slate-600 disabled:cursor-not-allowed rounded-lg transition-colors"
          >
            {isLoading ? 'Processing...' : 'Withdraw'}
          </button>
        </div>
      </div>

      {/* Execute Transaction */}
      <div className="bg-slate-800 p-6 rounded-lg border border-slate-700">
          <div className="flex items-center gap-2 mb-4">
            <h3 className="text-xl font-bold">Execute Transaction with Risk Check</h3>
            <InfoTooltip content="Execute a transaction from the vault. The system will automatically analyze the risk before allowing execution. High-risk transactions will be blocked." />
          </div>
        <div className="space-y-4">
          <div>
            <label className="block text-slate-400 text-sm mb-2">Target Contract Address</label>
            <input
              type="text"
              value={targetAddress}
              onChange={(e) => setTargetAddress(e.target.value)}
              placeholder="0x..."
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-slate-400 text-sm mb-2">Value (CRO) - Optional</label>
            <input
              type="number"
              step="0.0001"
              value={transactionValue}
              onChange={(e) => setTransactionValue(e.target.value)}
              placeholder="0.0"
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
            />
          </div>
          <button
            onClick={handleExecuteTransaction}
            disabled={isLoading || !wallet.signer}
            className="w-full px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 disabled:cursor-not-allowed rounded-lg transition-colors"
          >
            {isLoading ? 'Processing...' : 'Execute Transaction'}
          </button>
        </div>
      </div>

      {/* Transaction Result */}
      {transactionResult && (
        <div className={`bg-slate-800 p-6 rounded-lg border ${
          transactionResult.success 
            ? 'border-green-500' 
            : transactionResult.blocked 
            ? 'border-red-500' 
            : 'border-yellow-500'
        }`}>
          <h3 className="text-xl font-bold mb-4">
            {transactionResult.success ? '✅ Transaction Allowed' : transactionResult.blocked ? '❌ Transaction Blocked' : '⚠️ Transaction Result'}
          </h3>
          {transactionResult.txHash && (
            <div className="mb-2">
              <div className="text-slate-400 text-sm mb-1">Transaction Hash</div>
              <div className="text-slate-200 font-mono text-sm break-all">{transactionResult.txHash}</div>
            </div>
          )}
          {transactionResult.riskScore !== undefined && (
            <div className="mb-2">
              <div className="text-slate-400 text-sm mb-1">Risk Score</div>
              <div className={`text-lg font-bold ${
                transactionResult.riskScore < 30 ? 'text-green-400' :
                transactionResult.riskScore < 70 ? 'text-yellow-400' : 'text-red-400'
              }`}>
                {transactionResult.riskScore}/100
              </div>
            </div>
          )}
          {transactionResult.reason && (
            <div>
              <div className="text-slate-400 text-sm mb-1">Reason</div>
              <div className="text-red-400">{transactionResult.reason}</div>
            </div>
          )}
        </div>
      )}

      {/* Messages */}
      {error && (
        <div className="bg-red-900/50 border border-red-500 p-4 rounded-lg">
          <p className="text-red-400">{error}</p>
        </div>
      )}

      {success && (
        <div className="bg-green-900/50 border border-green-500 p-4 rounded-lg">
          <p className="text-green-400">{success}</p>
        </div>
      )}

      {/* Blocked Transactions History */}
      <div className="bg-slate-800 p-6 rounded-lg border border-slate-700">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold">🚫 Blocked Transactions History</h3>
          <button
            onClick={loadBlockedTransactions}
            disabled={isLoadingBlocked}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 disabled:bg-slate-600 disabled:cursor-not-allowed rounded-lg transition-colors text-sm"
          >
            {isLoadingBlocked ? 'Loading...' : 'Refresh'}
          </button>
        </div>
        
        {blockedTransactions.length === 0 ? (
          <div className="text-slate-400 text-center py-8">
            <p>No blocked transactions found</p>
            <p className="text-sm mt-2">Transactions blocked by risk checks will appear here</p>
          </div>
        ) : (
          <div className="space-y-3">
            {blockedTransactions.map((tx) => (
              <div
                key={tx.id}
                className="bg-slate-700/50 p-4 rounded-lg border border-red-500/30"
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <div className="text-red-400 font-semibold">Blocked</div>
                    <div className="text-slate-300 text-sm mt-1">
                      {new Date(tx.timestamp).toLocaleString()}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-lg font-bold ${
                      tx.riskScore < 30 ? 'text-green-400' :
                      tx.riskScore < 70 ? 'text-yellow-400' : 'text-red-400'
                    }`}>
                      {tx.riskScore}/100
                    </div>
                    <div className="text-slate-400 text-xs">Risk Score</div>
                  </div>
                </div>
                <div className="mt-3 space-y-1 text-sm">
                  <div>
                    <span className="text-slate-400">Target:</span>
                    <span className="text-slate-200 font-mono ml-2">
                      {tx.target.slice(0, 10)}...{tx.target.slice(-8)}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400">User:</span>
                    <span className="text-slate-200 font-mono ml-2">
                      {tx.user.slice(0, 10)}...{tx.user.slice(-8)}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400">Reason:</span>
                    <span className="text-red-300 ml-2">{tx.reason}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {!wallet.signer && (
        <div className="bg-yellow-900/50 border border-yellow-500 p-4 rounded-lg">
          <p className="text-yellow-400">⚠️ Please connect your wallet to interact with the vault</p>
        </div>
      )}
    </div>
  );
}
