import React, { useEffect, useState } from 'react';
import { Modal } from '../ui/Modal';
import { Account, Transaction } from '../../types';
import { api } from '../../api/client';
import { TransactionBadge } from '../ui/Badge';
import { Copy, Check, ArrowRight, RefreshCw, Receipt } from 'lucide-react';

interface AccountTimelineModalProps {
  account: Account | null;
  isOpen: boolean;
  onClose: () => void;
  onSelectTransaction: (tx: Transaction) => void;
  onRecordForAccount: (account: Account) => void;
}

export const AccountTimelineModal: React.FC<AccountTimelineModalProps> = ({
  account,
  isOpen,
  onClose,
  onSelectTransaction,
  onRecordForAccount,
}) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (account && isOpen) {
      loadHistory();
    }
  }, [account, isOpen]);

  const loadHistory = async () => {
    if (!account) return;
    try {
      setLoading(true);
      const res = await api.getAccountTransactions(account.id, 1, 50);
      setTransactions(res.data);
    } catch (err) {
      console.error('Failed to load account history', err);
    } finally {
      setLoading(false);
    }
  };

  const copyId = () => {
    if (!account) return;
    navigator.clipboard.writeText(account.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!account) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={account.name}
      subtitle="Account statement ledger & immutable transaction journal"
      maxWidth="xl"
    >
      <div className="space-y-6">
        {/* Account Header Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-lg bg-ledger-surface2/60 border border-ledger-border">
          <div>
            <div className="text-[11px] font-mono text-ledger-dim uppercase tracking-wider">
              CURRENT BALANCE
            </div>
            <div className="text-xl font-bold font-mono text-ledger-lime mt-1">
              ${account.balance}
            </div>
          </div>
          <div>
            <div className="text-[11px] font-mono text-ledger-dim uppercase tracking-wider">
              ACCOUNT IDENTIFIER
            </div>
            <div className="flex items-center space-x-1.5 mt-1">
              <span className="text-xs font-mono text-ledger-muted truncate max-w-[120px]">
                {account.id}
              </span>
              <button
                onClick={copyId}
                className="p-1 rounded hover:bg-ledger-elevated text-ledger-dim hover:text-ledger-lime transition-colors"
                title="Copy Account ID"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-ledger-lime" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
          <div>
            <div className="text-[11px] font-mono text-ledger-dim uppercase tracking-wider">
              CREATED AT
            </div>
            <div className="text-xs font-mono text-ledger-muted mt-1">
              {new Date(account.created_at).toLocaleDateString([], {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </div>
          </div>
        </div>

        {/* Action button */}
        <div className="flex justify-end">
          <button
            onClick={() => {
              onClose();
              onRecordForAccount(account);
            }}
            className="flex items-center space-x-2 px-3.5 py-1.5 rounded bg-ledger-lime/10 hover:bg-ledger-lime/20 text-ledger-lime border border-ledger-lime/30 text-xs font-mono transition-colors"
          >
            <Receipt className="w-3.5 h-3.5" />
            <span>RECORD TRANSACTION ON THIS ACCOUNT</span>
          </button>
        </div>

        {/* Transaction Journal Timeline */}
        <div>
          <div className="flex items-center justify-between mb-3 text-xs font-mono text-ledger-muted uppercase tracking-wider">
            <span>TRANSACTION TIMELINE (LATEST FIRST)</span>
            <span>{transactions.length} RECORDS</span>
          </div>

          {loading ? (
            <div className="py-12 flex justify-center items-center space-x-2 text-xs font-mono text-ledger-muted">
              <RefreshCw className="w-4 h-4 text-ledger-lime animate-spin" />
              <span>RETRIEVING STATEMENT...</span>
            </div>
          ) : transactions.length > 0 ? (
            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {transactions.map((tx) => (
                <div
                  key={tx.id}
                  onClick={() => {
                    onClose();
                    onSelectTransaction(tx);
                  }}
                  className="flex items-center justify-between p-3 rounded bg-ledger-surface2/60 hover:bg-ledger-elevated border border-ledger-border/60 hover:border-ledger-border cursor-pointer transition-colors"
                >
                  <div className="flex items-start space-x-3 min-w-0 pr-2">
                    <TransactionBadge type={tx.type} />
                    <div className="min-w-0">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-mono font-medium text-ledger-text">
                          {tx.reference_id}
                        </span>
                        {tx.transfer_id && (
                          <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-ledger-surface text-ledger-amber border border-ledger-border">
                            TRANSFER
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] font-mono text-ledger-dim truncate mt-0.5">
                        {tx.description || 'No description recorded'}
                      </p>
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
                    <div className="text-[10px] font-mono text-ledger-dim mt-0.5">
                      {new Date(tx.created_at).toLocaleString([], {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-10 text-center text-xs font-mono text-ledger-dim border border-dashed border-ledger-border rounded-lg">
              No transactions recorded for this account yet.
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};
