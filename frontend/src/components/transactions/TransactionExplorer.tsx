import React, { useState } from 'react';
import { Account, Transaction, PaginationMeta } from '../../types';
import { TransactionBadge } from '../ui/Badge';
import {
  Search,
  Filter,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Plus,
  RefreshCw,
  Copy,
  Check,
  Receipt,
  ArrowUpDown,
} from 'lucide-react';

interface TransactionExplorerProps {
  transactions: Transaction[];
  pagination: PaginationMeta | null;
  accounts: Account[];
  loading: boolean;
  onRefresh: () => void;
  onPageChange: (page: number) => void;
  onPageSizeChange: (limit: number) => void;
  selectedAccountId: string;
  onSelectAccountId: (id: string) => void;
  selectedType: string;
  onSelectType: (type: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onResetFilters: () => void;
  onSelectTransaction: (tx: Transaction) => void;
  onNewTransaction: () => void;
}

export const TransactionExplorer: React.FC<TransactionExplorerProps> = ({
  transactions,
  pagination,
  accounts,
  loading,
  onRefresh,
  onPageChange,
  onPageSizeChange,
  selectedAccountId,
  onSelectAccountId,
  selectedType,
  onSelectType,
  searchQuery,
  onSearchChange,
  onResetFilters,
  onSelectTransaction,
  onNewTransaction,
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyRef = (e: React.MouseEvent, ref: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(ref);
    setCopiedId(ref);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const getAccountName = (accId: string) => {
    const acc = accounts.find((a) => a.id === accId);
    return acc ? acc.name : `Account (${accId.slice(0, 8)}...)`;
  };

  const hasActiveFilters = Boolean(selectedAccountId || selectedType || searchQuery);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Filter and Search Bar */}
      <div className="bg-ledger-surface border border-ledger-border rounded-xl p-4 space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-ledger-dim" />
            <input
              type="text"
              placeholder="Search by reference ID, description, or transaction ID..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded bg-ledger-surface2 border border-ledger-border focus:border-ledger-lime focus:outline-none text-xs font-mono text-ledger-text placeholder-ledger-dim transition-colors"
            />
          </div>

          {/* Account Filter */}
          <div className="w-full md:w-56">
            <select
              value={selectedAccountId}
              onChange={(e) => onSelectAccountId(e.target.value)}
              className="w-full px-3 py-2 rounded bg-ledger-surface2 border border-ledger-border focus:border-ledger-lime focus:outline-none text-xs font-mono text-ledger-text transition-colors"
            >
              <option value="">ALL ACCOUNTS</option>
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.name}
                </option>
              ))}
            </select>
          </div>

          {/* Type Filter */}
          <div className="w-full md:w-36">
            <select
              value={selectedType}
              onChange={(e) => onSelectType(e.target.value)}
              className="w-full px-3 py-2 rounded bg-ledger-surface2 border border-ledger-border focus:border-ledger-lime focus:outline-none text-xs font-mono text-ledger-text transition-colors"
            >
              <option value="">ALL TYPES</option>
              <option value="credit">CREDIT (+)</option>
              <option value="debit">DEBIT (-)</option>
            </select>
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-2 shrink-0">
            {hasActiveFilters && (
              <button
                onClick={onResetFilters}
                className="flex items-center space-x-1 px-3 py-2 rounded bg-ledger-surface2 hover:bg-ledger-elevated text-ledger-dim hover:text-ledger-coral border border-ledger-border text-xs font-mono transition-colors"
                title="Reset filters"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>RESET</span>
              </button>
            )}

            <button
              onClick={onRefresh}
              className="p-2 rounded bg-ledger-surface2 hover:bg-ledger-elevated text-ledger-muted hover:text-ledger-text border border-ledger-border text-xs font-mono transition-colors"
              title="Refresh ledger"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-ledger-lime' : ''}`} />
            </button>

            <button
              onClick={onNewTransaction}
              className="flex items-center space-x-1.5 px-3.5 py-2 rounded bg-ledger-lime hover:bg-ledger-limeHover text-ledger-bg font-mono font-bold text-xs tracking-wider transition-colors shadow-glow-lime"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>RECORD</span>
            </button>
          </div>
        </div>

        {/* Sorting Indicator */}
        <div className="flex items-center justify-between text-[11px] font-mono text-ledger-dim pt-2 border-t border-ledger-border/40">
          <div className="flex items-center space-x-2">
            <ArrowUpDown className="w-3 h-3 text-ledger-lime" />
            <span>ORDERING: LATEST-FIRST BASED ON CREATED_AT (DETERMINISTIC)</span>
          </div>
          {pagination && (
            <span>
              SHOWING {(pagination.current_page - 1) * pagination.page_size + (transactions.length ? 1 : 0)} –{' '}
              {Math.min(pagination.current_page * pagination.page_size, pagination.total_records)} OF{' '}
              {pagination.total_records} RECORDS
            </span>
          )}
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-ledger-surface border border-ledger-border rounded-xl overflow-hidden shadow-card">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-ledger-border bg-ledger-surface2/60 text-[10px] font-mono text-ledger-muted uppercase tracking-wider">
                <th className="py-3 px-4">TIMESTAMP</th>
                <th className="py-3 px-4">TYPE</th>
                <th className="py-3 px-4">REFERENCE ID</th>
                <th className="py-3 px-4">ACCOUNT</th>
                <th className="py-3 px-4 text-right">AMOUNT</th>
                <th className="py-3 px-4">NARRATIVE / DESCRIPTION</th>
                <th className="py-3 px-4 text-right">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ledger-border/60 text-xs font-mono">
              {loading && transactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-ledger-muted">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <RefreshCw className="w-5 h-5 text-ledger-lime animate-spin" />
                      <span>RETRIEVING IMMUTABLE TRANSACTIONS...</span>
                    </div>
                  </td>
                </tr>
              ) : transactions.length > 0 ? (
                transactions.map((tx) => {
                  const isCredit = tx.type === 'credit';

                  return (
                    <tr
                      key={tx.id}
                      onClick={() => onSelectTransaction(tx)}
                      className="hover:bg-ledger-surface2/80 cursor-pointer transition-colors group"
                    >
                      <td className="py-3 px-4 text-ledger-dim whitespace-nowrap">
                        {new Date(tx.created_at).toLocaleString([], {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        <TransactionBadge type={tx.type} />
                      </td>

                      <td className="py-3 px-4 text-ledger-text font-medium whitespace-nowrap">
                        <div className="flex items-center space-x-1.5">
                          <span>{tx.reference_id}</span>
                          <button
                            onClick={(e) => copyRef(e, tx.reference_id)}
                            className="opacity-0 group-hover:opacity-100 text-ledger-dim hover:text-ledger-lime transition-opacity"
                            title="Copy reference ID"
                          >
                            {copiedId === tx.reference_id ? (
                              <Check className="w-3 h-3 text-ledger-lime" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                      </td>

                      <td className="py-3 px-4 text-ledger-muted whitespace-nowrap truncate max-w-[160px]">
                        {getAccountName(tx.account_id)}
                      </td>

                      <td
                        className={`py-3 px-4 text-right font-bold whitespace-nowrap ${
                          isCredit ? 'text-ledger-lime' : 'text-ledger-coral'
                        }`}
                      >
                        {isCredit ? '+' : '-'}${tx.amount}
                      </td>

                      <td className="py-3 px-4 text-ledger-dim truncate max-w-[220px]">
                        {tx.description || '—'}
                      </td>

                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <span className="text-[10px] text-ledger-dim group-hover:text-ledger-lime font-mono transition-colors">
                          INSPECT →
                        </span>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-ledger-dim">
                    <div className="space-y-2">
                      <Receipt className="w-6 h-6 mx-auto text-ledger-dim/60" />
                      <div>No transactions found matching your criteria.</div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {pagination && (
          <div className="flex flex-col sm:flex-row items-center justify-between px-4 py-3.5 bg-ledger-surface2/60 border-t border-ledger-border text-xs font-mono gap-3">
            <div className="flex items-center space-x-2 text-ledger-muted">
              <span>PAGE {pagination.current_page} OF {pagination.total_pages || 1}</span>
              <span className="text-ledger-dim">·</span>
              <span>{pagination.total_records} TOTAL TRANSACTIONS</span>
            </div>

            <div className="flex items-center space-x-4">
              {/* Page size selector */}
              <div className="flex items-center space-x-1.5 text-ledger-dim">
                <span>PAGE SIZE:</span>
                <select
                  value={pagination.page_size}
                  onChange={(e) => onPageSizeChange(Number(e.target.value))}
                  className="px-2 py-1 rounded bg-ledger-surface border border-ledger-border text-xs font-mono text-ledger-text focus:outline-none"
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>

              {/* Prev / Next Buttons */}
              <div className="flex items-center space-x-1.5">
                <button
                  onClick={() => onPageChange(pagination.current_page - 1)}
                  disabled={pagination.current_page <= 1 || loading}
                  className="p-1.5 rounded bg-ledger-surface border border-ledger-border disabled:opacity-40 hover:bg-ledger-elevated text-ledger-text transition-colors"
                  title="Previous page"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onPageChange(pagination.current_page + 1)}
                  disabled={pagination.current_page >= pagination.total_pages || loading}
                  className="p-1.5 rounded bg-ledger-surface border border-ledger-border disabled:opacity-40 hover:bg-ledger-elevated text-ledger-text transition-colors"
                  title="Next page"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
