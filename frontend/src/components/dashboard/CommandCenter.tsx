import React from 'react';
import {
  ShieldCheck,
  TrendingUp,
  Activity,
  ArrowRight,
  Plus,
  ArrowLeftRight,
  UserPlus,
  RefreshCw,
} from 'lucide-react';
import { CommandCenterSummary, Transaction } from '../../types';
import { StatCard } from '../ui/StatCard';
import { VolumeChart } from './VolumeChart';
import { TransactionBadge } from '../ui/Badge';

interface CommandCenterProps {
  summary: CommandCenterSummary | null;
  loading: boolean;
  onRefresh: () => void;
  onSelectTransaction: (tx: Transaction) => void;
  onNewTransaction: () => void;
  onNewTransfer: () => void;
  onCreateAccount: () => void;
  onGoToIntegrity: () => void;
}

export const CommandCenter: React.FC<CommandCenterProps> = ({
  summary,
  loading,
  onRefresh,
  onSelectTransaction,
  onNewTransaction,
  onNewTransfer,
  onCreateAccount,
  onGoToIntegrity,
}) => {
  if (loading && !summary) {
    return (
      <div className="py-20 flex flex-col items-center justify-center space-y-4">
        <RefreshCw className="w-8 h-8 text-ledger-lime animate-spin" />
        <p className="text-xs font-mono text-ledger-muted">POLLING LIVE FINANCIAL TELEMETRY...</p>
      </div>
    );
  }

  const isHealthy = summary?.integrity_status === 'HEALTHY';

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Top Banner: Integrity Assurance */}
      <div className="flex flex-col md:flex-row md:items-center justify-between p-4 rounded-xl bg-ledger-surface border border-ledger-border">
        <div className="flex items-center space-x-3.5">
          <div
            className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
              isHealthy
                ? 'bg-ledger-lime/10 text-ledger-lime border border-ledger-lime/30'
                : 'bg-ledger-coral/10 text-ledger-coral border border-ledger-coral/30'
            }`}
          >
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-editorial text-sm font-bold text-ledger-text">
                LEDGER INTEGRITY OBSERVATORY
              </span>
              <span
                className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase tracking-wider ${
                  isHealthy
                    ? 'bg-ledger-lime/15 text-ledger-lime border border-ledger-lime/30'
                    : 'bg-ledger-coral/15 text-ledger-coral border border-ledger-coral/30'
                }`}
              >
                {isHealthy ? '100% RECONCILED' : 'DISCREPANCY ALERT'}
              </span>
            </div>
            <p className="text-xs text-ledger-muted mt-0.5 font-mono">
              Balance invariant holds: Every stored balance perfectly equals Opening Balance + Credits − Debits.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3 mt-4 md:mt-0">
          <button
            onClick={onRefresh}
            className="p-2 rounded bg-ledger-surface2 hover:bg-ledger-elevated text-ledger-muted hover:text-ledger-text border border-ledger-border text-xs font-mono transition-colors"
            title="Refresh telemetry"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onGoToIntegrity}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded bg-ledger-surface2 hover:bg-ledger-elevated text-ledger-text border border-ledger-border text-xs font-mono transition-colors"
          >
            <span>AUDIT LEDGER</span>
            <ArrowRight className="w-3.5 h-3.5 text-ledger-lime" />
          </button>
        </div>
      </div>

      {/* KPI Instrument Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="COMBINED LIQUIDITY"
          value={summary?.combined_liquid_balance || '0.00'}
          prefix="$"
          subtext="Net balance across all accounts"
          indicatorColor="lime"
          badge="LIVE"
        />
        <StatCard
          label="TOTAL INFLOW (CREDITS)"
          value={summary?.total_successful_credits_volume || '0.00'}
          prefix="$"
          subtext="Cumulative successful deposits"
          indicatorColor="lime"
        />
        <StatCard
          label="TOTAL OUTFLOW (DEBITS)"
          value={summary?.total_successful_debits_volume || '0.00'}
          prefix="$"
          subtext="Cumulative successful withdrawals"
          indicatorColor="coral"
        />
        <StatCard
          label="LEDGER MOVEMENTS"
          value={summary?.total_transactions_count || 0}
          subtext={`${summary?.total_accounts || 0} accounts · ${summary?.total_transfers_count || 0} transfers`}
          indicatorColor="amber"
          badge="IMMUTABLE"
        />
      </div>

      {/* Two Column Section: Chart + Live Stream */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: 7-Day Volume Trends */}
        <div className="lg:col-span-2 bg-ledger-surface border border-ledger-border rounded-xl p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="font-editorial text-sm font-bold text-ledger-text tracking-wide">
                CREDIT VS DEBIT VOLUME SPECTRUM
              </h4>
              <p className="text-xs font-mono text-ledger-muted mt-0.5">
                Daily financial movements recorded across accounts (last 7 days)
              </p>
            </div>
            <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-ledger-surface2 text-ledger-dim border border-ledger-border">
              TELEMETRY
            </span>
          </div>

          <VolumeChart data={summary?.volume_timeline || []} />
        </div>

        {/* Right 1 Col: Quick Actions & Live Stream */}
        <div className="space-y-6">
          {/* Quick Actions Panel */}
          <div className="bg-ledger-surface border border-ledger-border rounded-xl p-5 space-y-3">
            <div className="text-xs font-mono text-ledger-muted uppercase tracking-wider mb-2">
              TRANSACTION ACTIONS
            </div>
            <button
              onClick={onNewTransaction}
              className="w-full flex items-center justify-between px-4 py-2.5 rounded-lg bg-ledger-lime/10 hover:bg-ledger-lime/20 text-ledger-lime border border-ledger-lime/30 text-xs font-mono font-medium transition-colors"
            >
              <div className="flex items-center space-x-2">
                <Plus className="w-4 h-4" />
                <span>RECORD TRANSACTION</span>
              </div>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onNewTransfer}
              className="w-full flex items-center justify-between px-4 py-2.5 rounded-lg bg-ledger-surface2 hover:bg-ledger-elevated text-ledger-text border border-ledger-border text-xs font-mono font-medium transition-colors"
            >
              <div className="flex items-center space-x-2">
                <ArrowLeftRight className="w-4 h-4 text-ledger-amber" />
                <span>TRANSFER MONEY</span>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-ledger-muted" />
            </button>
            <button
              onClick={onCreateAccount}
              className="w-full flex items-center justify-between px-4 py-2.5 rounded-lg bg-ledger-surface2 hover:bg-ledger-elevated text-ledger-text border border-ledger-border text-xs font-mono font-medium transition-colors"
            >
              <div className="flex items-center space-x-2">
                <UserPlus className="w-4 h-4 text-ledger-muted" />
                <span>PROVISION NEW ACCOUNT</span>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-ledger-muted" />
            </button>
          </div>

          {/* Recent Activity Mini-stream */}
          <div className="bg-ledger-surface border border-ledger-border rounded-xl p-5 flex flex-col">
            <div className="flex items-center justify-between text-xs font-mono text-ledger-muted uppercase tracking-wider mb-3">
              <div className="flex items-center space-x-1.5">
                <Activity className="w-3.5 h-3.5 text-ledger-lime" />
                <span>LATEST MOVEMENTS</span>
              </div>
              <span className="text-[10px] text-ledger-dim">REAL-TIME</span>
            </div>

            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {summary?.recent_transactions && summary.recent_transactions.length > 0 ? (
                summary.recent_transactions.map((tx) => (
                  <div
                    key={tx.id}
                    onClick={() => onSelectTransaction(tx)}
                    className="flex items-center justify-between p-2.5 rounded bg-ledger-surface2/60 hover:bg-ledger-elevated border border-transparent hover:border-ledger-border cursor-pointer transition-all"
                  >
                    <div className="min-w-0 pr-2">
                      <div className="flex items-center space-x-2">
                        <TransactionBadge type={tx.type} />
                        <span className="text-xs font-mono text-ledger-text truncate">
                          {tx.reference_id}
                        </span>
                      </div>
                      <div className="text-[11px] text-ledger-dim font-mono truncate mt-0.5">
                        {tx.description || 'No description'}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div
                        className={`text-xs font-mono font-bold ${
                          tx.type === 'credit' ? 'text-ledger-lime' : 'text-ledger-coral'
                        }`}
                      >
                        {tx.type === 'credit' ? '+' : '-'}${tx.amount}
                      </div>
                      <div className="text-[10px] font-mono text-ledger-dim">
                        {new Date(tx.created_at).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-xs font-mono text-ledger-dim">
                  Your ledger is clear. Create an account and record your first transaction to begin.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
