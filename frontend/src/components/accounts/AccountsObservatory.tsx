import React, { useState } from 'react';
import { Account } from '../../types';
import { Search, UserPlus, ArrowRight, History, ArrowLeftRight, RefreshCw } from 'lucide-react';

interface AccountsObservatoryProps {
  accounts: Account[];
  loading: boolean;
  onRefresh: () => void;
  onCreateAccount: () => void;
  onSelectAccount: (account: Account) => void;
  onTransferFromAccount: (account: Account) => void;
}

export const AccountsObservatory: React.FC<AccountsObservatoryProps> = ({
  accounts,
  loading,
  onRefresh,
  onCreateAccount,
  onSelectAccount,
  onTransferFromAccount,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredAccounts = accounts.filter((acc) =>
    acc.name.toLowerCase().includes(searchTerm.toLowerCase().trim()) ||
    acc.id.toLowerCase().includes(searchTerm.toLowerCase().trim())
  );

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Controls Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-ledger-surface border border-ledger-border">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-ledger-dim" />
          <input
            type="text"
            placeholder="Search accounts by name or identifier..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded bg-ledger-surface2 border border-ledger-border focus:border-ledger-lime focus:outline-none text-xs font-mono text-ledger-text placeholder-ledger-dim transition-colors"
          />
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={onRefresh}
            className="p-2 rounded bg-ledger-surface2 hover:bg-ledger-elevated text-ledger-muted hover:text-ledger-text border border-ledger-border text-xs font-mono transition-colors"
            title="Refresh accounts"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-ledger-lime' : ''}`} />
          </button>
          <button
            onClick={onCreateAccount}
            className="flex items-center space-x-2 px-3.5 py-2 rounded bg-ledger-lime hover:bg-ledger-limeHover text-ledger-bg font-bold font-mono text-xs tracking-wider transition-colors shadow-glow-lime"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>PROVISION ACCOUNT</span>
          </button>
        </div>
      </div>

      {/* Account Cards Grid */}
      {filteredAccounts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAccounts.map((account) => (
            <div
              key={account.id}
              className="bg-ledger-surface border border-ledger-border hover:border-ledger-borderLight rounded-xl p-5 flex flex-col justify-between transition-all group"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <h4 className="text-sm font-bold font-editorial text-ledger-text group-hover:text-ledger-lime transition-colors">
                    {account.name}
                  </h4>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-ledger-surface2 text-ledger-muted border border-ledger-border shrink-0">
                    {account.transaction_count || 0} TXS
                  </span>
                </div>
                <div className="text-[10px] font-mono text-ledger-dim truncate mt-1">
                  ID: {account.id}
                </div>

                <div className="mt-4 pt-3 border-t border-ledger-border/60">
                  <div className="text-[10px] font-mono text-ledger-dim uppercase tracking-wider">
                    RECONCILED BALANCE
                  </div>
                  <div className="text-2xl font-bold font-mono text-ledger-text mt-1">
                    <span className="text-ledger-dim text-lg mr-1">$</span>
                    <span>{account.balance}</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-3 border-t border-ledger-border flex items-center justify-between text-xs font-mono">
                <button
                  onClick={() => onSelectAccount(account)}
                  className="flex items-center space-x-1.5 text-ledger-muted hover:text-ledger-lime transition-colors"
                >
                  <History className="w-3.5 h-3.5" />
                  <span>Statement</span>
                </button>

                <button
                  onClick={() => onTransferFromAccount(account)}
                  className="flex items-center space-x-1.5 text-ledger-muted hover:text-ledger-amber transition-colors"
                >
                  <ArrowLeftRight className="w-3.5 h-3.5" />
                  <span>Transfer Out</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-12 text-center rounded-xl bg-ledger-surface border border-dashed border-ledger-border space-y-3">
          <p className="text-xs font-mono text-ledger-dim">
            {searchTerm
              ? `No accounts matching '${searchTerm}'`
              : 'Your ledger is clear. Provision an account to begin recording transactions.'}
          </p>
          {!searchTerm && (
            <button
              onClick={onCreateAccount}
              className="inline-flex items-center space-x-1.5 px-4 py-2 rounded bg-ledger-lime text-ledger-bg font-bold font-mono text-xs shadow-glow-lime"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>PROVISION FIRST ACCOUNT</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};
