import React from 'react';
import { IntegrityReport } from '../../types';
import { StatCard } from '../ui/StatCard';
import {
  ShieldCheck,
  AlertTriangle,
  RefreshCw,
  CheckCircle2,
  XCircle,
  FileCheck,
  Lock,
} from 'lucide-react';

interface IntegrityObservatoryProps {
  report: IntegrityReport | null;
  loading: boolean;
  onRunAudit: () => void;
}

export const IntegrityObservatory: React.FC<IntegrityObservatoryProps> = ({
  report,
  loading,
  onRunAudit,
}) => {
  const isHealthy = report?.status === 'HEALTHY';

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Top Banner */}
      <div
        className={`p-6 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all ${
          isHealthy
            ? 'bg-ledger-lime/10 border-ledger-lime/40'
            : 'bg-ledger-coral/10 border-ledger-coral/40'
        }`}
      >
        <div className="flex items-start space-x-4">
          <div
            className={`w-12 h-12 rounded-lg flex items-center justify-center shrink-0 ${
              isHealthy
                ? 'bg-ledger-lime/20 text-ledger-lime'
                : 'bg-ledger-coral/20 text-ledger-coral'
            }`}
          >
            {isHealthy ? <ShieldCheck className="w-6 h-6" /> : <AlertTriangle className="w-6 h-6" />}
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="font-editorial text-lg font-bold text-ledger-text tracking-wide">
                {isHealthy ? 'LEDGER RECONCILIATION VERIFIED' : 'INTEGRITY ALERT DETECTED'}
              </h3>
              <span
                className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase tracking-wider ${
                  isHealthy
                    ? 'bg-ledger-lime text-ledger-bg'
                    : 'bg-ledger-coral text-ledger-bg'
                }`}
              >
                {report?.status || 'CHECKING'}
              </span>
            </div>
            <p className="text-xs font-mono text-ledger-muted mt-1 leading-relaxed max-w-2xl">
              {report?.system_message ||
                'Executing independent recomputation of all accounts from raw transaction journal...'}
            </p>
          </div>
        </div>

        <button
          onClick={onRunAudit}
          disabled={loading}
          className="flex items-center space-x-2 px-4 py-2.5 rounded bg-ledger-surface border border-ledger-border hover:border-ledger-lime text-ledger-text font-mono text-xs transition-colors shrink-0 shadow-card"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-ledger-lime' : ''}`} />
          <span>{loading ? 'AUDITING LEDGER...' : 'RUN LIVE AUDIT'}</span>
        </button>
      </div>

      {/* Audit Telemetry Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="AUDITED ACCOUNTS"
          value={report?.total_accounts_audited || 0}
          subtext="Independently recomputed"
          indicatorColor="lime"
        />
        <StatCard
          label="JOURNAL ENTRIES"
          value={report?.total_ledger_entries || 0}
          subtext={`${report?.total_transfers_recorded || 0} transfer records`}
          indicatorColor="neutral"
        />
        <StatCard
          label="SYSTEM STORED BALANCE"
          value={report?.total_system_stored_balance || '0.00'}
          prefix="$"
          subtext={`Calculated: $${report?.total_system_calculated_balance || '0.00'}`}
          indicatorColor={isHealthy ? 'lime' : 'coral'}
        />
        <StatCard
          label="DISCREPANCIES DETECTED"
          value={report?.discrepancy_count || 0}
          subtext={isHealthy ? 'Zero variance across ledger' : 'Immediate review required'}
          indicatorColor={isHealthy ? 'lime' : 'coral'}
          badge={isHealthy ? 'PASS' : 'FAIL'}
        />
      </div>

      {/* Invariants Checked Checklist */}
      <div className="bg-ledger-surface border border-ledger-border rounded-xl p-6">
        <div className="flex items-center space-x-2 text-xs font-mono text-ledger-muted uppercase tracking-wider mb-4">
          <FileCheck className="w-4 h-4 text-ledger-lime" />
          <span>GUARANTEED MATHEMATICAL INVARIANTS</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {report?.invariants_verified.map((inv, idx) => (
            <div
              key={idx}
              className="flex items-start space-x-3 p-3 rounded-lg bg-ledger-surface2/50 border border-ledger-border/60"
            >
              <CheckCircle2 className="w-4 h-4 text-ledger-lime shrink-0 mt-0.5" />
              <span className="text-xs font-mono text-ledger-muted leading-relaxed">
                {inv}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Account-by-Account Reconciliation Table */}
      <div className="bg-ledger-surface border border-ledger-border rounded-xl overflow-hidden shadow-card">
        <div className="p-4 border-b border-ledger-border bg-ledger-surface2/40 flex items-center justify-between">
          <span className="text-xs font-mono font-bold text-ledger-text uppercase tracking-wider">
            ACCOUNT-LEVEL RECONCILIATION BREAKDOWN
          </span>
          <span className="text-[11px] font-mono text-ledger-dim">
            FORMULA: OPENING + CREDITS − DEBITS
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs font-mono">
            <thead>
              <tr className="border-b border-ledger-border bg-ledger-surface2/60 text-[10px] text-ledger-muted uppercase tracking-wider">
                <th className="py-3 px-4">ACCOUNT NAME</th>
                <th className="py-3 px-4 text-right">STORED BALANCE</th>
                <th className="py-3 px-4 text-right">CALCULATED BALANCE</th>
                <th className="py-3 px-4 text-right">TOTAL CREDITS</th>
                <th className="py-3 px-4 text-right">TOTAL DEBITS</th>
                <th className="py-3 px-4 text-center">STATUS</th>
                <th className="py-3 px-4">EXPLANATION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ledger-border/60">
              {report?.accounts && report.accounts.length > 0 ? (
                report.accounts.map((acc) => (
                  <tr
                    key={acc.account_id}
                    className="hover:bg-ledger-surface2/60 transition-colors"
                  >
                    <td className="py-3.5 px-4 font-bold text-ledger-text whitespace-nowrap">
                      <div>{acc.account_name}</div>
                      <div className="text-[10px] text-ledger-dim truncate max-w-[140px]">
                        ID: {acc.account_id}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-right font-bold text-ledger-text whitespace-nowrap">
                      ${acc.stored_balance}
                    </td>

                    <td className="py-3.5 px-4 text-right font-bold text-ledger-lime whitespace-nowrap">
                      ${acc.calculated_balance}
                    </td>

                    <td className="py-3.5 px-4 text-right text-ledger-lime whitespace-nowrap">
                      +${acc.total_credits}
                    </td>

                    <td className="py-3.5 px-4 text-right text-ledger-coral whitespace-nowrap">
                      -${acc.total_debits}
                    </td>

                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      {acc.is_consistent ? (
                        <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-bold bg-ledger-lime/10 text-ledger-lime border border-ledger-lime/30">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>PASS</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-bold bg-ledger-coral/10 text-ledger-coral border border-ledger-coral/30">
                          <XCircle className="w-3 h-3" />
                          <span>DISCREPANCY</span>
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-ledger-dim max-w-xs truncate">
                      {acc.explanation}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-ledger-dim">
                    No accounts available to reconcile.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
