/**
 * Vault Management Component
 * 
 * Complete interface for Shielded Vault operations
 */

import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import apiClient from '../../lib/api/client';
import { useWallet } from '../../contexts/WalletContext';
import type { VaultInfo, VaultBalance, TransactionResult } from '../../types/vault.types';

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

  // Load vault info and balance
  useEffect(() => {
    if (VAULT_CONTRACT_ADDRESS) {
      loadVaultInfo();
    }
    if (wallet.address) {
      loadBalance();
    }
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

  const handleWithdraw = async () => {
    if (!wallet.signer || !wallet.address) {
      setError('Please connect your wallet first');
      return;
    }

    if (!withdrawAmount || parseFloat(withdrawAmount) <= 0) {
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

  const handleExecuteTransaction = async () => {
    if (!wallet.signer || !wallet.address) {
      setError('Please connect your wallet first');
      return;
    }

    if (!targetAddress) {
      setError('Please enter a target contract address');
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(null);
    setTransactionResult(null);

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
      } else if (response.data.blocked) {
        setError(`Transaction blocked: ${response.data.reason}`);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Transaction execution failed');
    } finally {
      setIsLoading(false);
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
        <h3 className="text-xl font-bold mb-4">Execute Transaction with Risk Check</h3>
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

      {!wallet.signer && (
        <div className="bg-yellow-900/50 border border-yellow-500 p-4 rounded-lg">
          <p className="text-yellow-400">⚠️ Please connect your wallet to interact with the vault</p>
        </div>
      )}
    </div>
  );
}
