/**
 * Shielded Vaults Page
 * 
 * Vault management interface
 */

import VaultManagement from '../components/vaults/VaultManagement';

export default function VaultsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold mb-2">🏦 Shielded Vaults</h2>
        <p className="text-slate-400">Protected vaults with programmable circuit breakers</p>
      </div>

      <VaultManagement />
    </div>
  );
}
