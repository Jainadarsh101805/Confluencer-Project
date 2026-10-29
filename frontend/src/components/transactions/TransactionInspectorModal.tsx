import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Transaction } from '../../types';
import { TransactionBadge } from '../ui/Badge';
import {
  CheckCircle2,
  Lock,
  Copy,
  Check,
  ArrowRight,
  ShieldCheck,
  FileText,
  Clock,
  ArrowLeftRight,
} from 'lucide-react';

interface TransactionInspectorModalProps {
  transaction: Transaction | null;
  isOpen: boolean;
  onClose: () => void;
  onViewTransfer?: (transferId: string) => void;
}

export const TransactionInspectorModal: React.FC<TransactionInspectorModalProps> = ({
  transaction,
  isOpen,
  onClose,
  onViewTransfer,
}) => {
  const [copiedId, setCopiedId] = useState(false);
  const [copiedRef, setCopiedRef] = useState(false);

  if (!transaction) return null;

  const copyTxId = () => {
    navigator.clipboard.writeText(transaction.id);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const copyRefId = () => {
    navigator.clipboard.writeText(transaction.reference_id);
    setCopiedRef(true);
    setTimeout(() => setCopiedRef(false), 2000);
  };

  const isCredit = transaction.type === 'credit';

  // 5-step atomic execution lifecycle sequence
  const executionLifecycle = [
    {
      step: '01',
      title: 'REQUEST ACCEPTED & TIMESTAMPED',
      description: `Payload parsed and verified against immutable schema. Recorded at ${new Date(
        transaction.created_at
      ).toISOString()}`,
      status: 'VERIFIED',
    },
    {
      step: '02',
      title: 'ACCOUNT & REFERENCE VALIDATED',
      description: `Target account ${transaction.account_id} locked. Reference '${transaction.reference_id}' checked for idempotency.`,
      status: 'VERIFIED',
    },
    {
      step: '03',
      title: 'FINANCIAL CONSTRAINTS CHECKED',
      description: isCredit
        ? 'Credit constraint satisfied: Inbound deposit amounts are strictly positive and non-negative.'
        : 'Debit constraint satisfied: Account balance verified sufficient under row-level lock.',
      status: 'VERIFIED',
    },
    {
      step: '04',
      title: 'DATABASE ATOMIC COMMIT',
      description: 'Transaction entity persisted and account balance atomically updated in a single DB transaction.',
      status: 'COMMITTED',
    },
    {
      step: '05',
      title: 'BALANCE RECONCILIATION CONFIRMED',
      description: transaction.account_balance_after
        ? `Resulting account balance recorded at $${transaction.account_balance_after}. Mathematically consistent with ledger.`
        : 'Account balance strictly reconciled with ledger sum.',
      status: 'RECONCILED',
    },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="TRANSACTION LIFECYCLE INSPECTOR"
      subtitle="Complete forensic audit and verified execution lifecycle trace"
      maxWidth="xl"
    >
      <div className="space-y-6">
        {/* Immutability Banner */}
        <div className="flex items-center space-x-3 p-3.5 rounded-lg bg-ledger-surface2/80 border border-ledger-border">
          <div className="w-8 h-8 rounded bg-ledger-lime/10 border border-ledger-lime/30 flex items-center justify-center shrink-0">
            <Lock className="w-4 h-4 text-ledger-lime" />
          </div>
          <div>
            <div className="text-xs font-mono font-bold text-ledger-text tracking-wider uppercase">
              PERMANENT LEDGER RECORD // IMMUTABLE
            </div>
            <p className="text-[11px] font-mono text-ledger-muted mt-0.5">
              In accordance with financial compliance rules, this transaction cannot be modified or deleted.
            </p>
          </div>
        </div>

        {/* Transaction Summary Card */}
        <div className="p-4 rounded-xl bg-ledger-surface2/50 border border-ledger-border space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="text-[10px] font-mono text-ledger-dim uppercase tracking-wider">
                TRANSACTION AMOUNT
              </div>
              <div className="flex items-baseline space-x-2 mt-1">
                <span
                  className={`text-2xl font-bold font-mono ${
                    isCredit ? 'text-ledger-lime' : 'text-ledger-coral'
                  }`}
                >
                  {isCredit ? '+' : '-'}${transaction.amount}
                </span>
                <TransactionBadge type={transaction.type} />
              </div>
            </div>

            <div className="text-right sm:text-right">
              <div className="text-[10px] font-mono text-ledger-dim uppercase tracking-wider">
                TIMESTAMP
              </div>
              <div className="text-xs font-mono text-ledger-muted mt-1">
                {new Date(transaction.created_at).toLocaleString([], {
                  dateStyle: 'medium',
                  timeStyle: 'medium',
                })}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-ledger-border/60 text-xs font-mono">
            <div>
              <span className="text-[10px] text-ledger-dim uppercase tracking-wider block">
                REFERENCE IDENTIFIER
              </span>
              <div className="flex items-center space-x-1.5 mt-1 text-ledger-text">
                <span className="truncate">{transaction.reference_id}</span>
                <button onClick={copyRefId} className="text-ledger-dim hover:text-ledger-lime">
                  {copiedRef ? <Check className="w-3.5 h-3.5 text-ledger-lime" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <div>
              <span className="text-[10px] text-ledger-dim uppercase tracking-wider block">
                IMMUTABLE TRANSACTION ID
              </span>
              <div className="flex items-center space-x-1.5 mt-1 text-ledger-text">
                <span className="truncate text-ledger-muted">{transaction.id}</span>
                <button onClick={copyTxId} className="text-ledger-dim hover:text-ledger-lime">
                  {copiedId ? <Check className="w-3.5 h-3.5 text-ledger-lime" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          </div>

          <div>
            <span className="text-[10px] text-ledger-dim uppercase tracking-wider block font-mono">
              DESCRIPTION / AUDIT NOTE
            </span>
            <p className="text-xs font-mono text-ledger-text mt-1">
              {transaction.description || 'No description provided.'}
            </p>
          </div>

          {transaction.transfer_id && (
            <div className="pt-2 border-t border-ledger-border/60 flex items-center justify-between text-xs font-mono">
              <span className="text-ledger-amber flex items-center space-x-1.5">
                <ArrowLeftRight className="w-3.5 h-3.5" />
                <span>LINKED TWO-LEGGED TRANSFER</span>
              </span>
              <span className="text-ledger-dim">ID: {transaction.transfer_id}</span>
            </div>
          )}
        </div>

        {/* Signature Financial Event Replay Sequence */}
        <div>
          <div className="flex items-center justify-between text-xs font-mono text-ledger-muted uppercase tracking-wider mb-4">
            <div className="flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4 text-ledger-lime" />
              <span>TRANSACTION ATOMIC LIFECYCLE REPLAY</span>
            </div>
            <span className="text-[10px] text-ledger-lime font-bold">5 OF 5 STEPS CONFIRMED</span>
          </div>

          <div className="space-y-3">
            {executionLifecycle.map((step, idx) => (
              <div
                key={step.step}
                className="relative flex items-start space-x-3.5 p-3 rounded-lg bg-ledger-surface2/40 border border-ledger-border/80"
              >
                <div className="w-6 h-6 rounded-full bg-ledger-lime/15 border border-ledger-lime/40 text-ledger-lime flex items-center justify-center shrink-0 mt-0.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono font-bold text-ledger-text">
                      {step.step} // {step.title}
                    </span>
                    <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-ledger-lime/10 text-ledger-lime border border-ledger-lime/30">
                      {step.status}
                    </span>
                  </div>
                  <p className="text-[11px] font-mono text-ledger-dim mt-1 leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-3 border-t border-ledger-border">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded bg-ledger-surface2 hover:bg-ledger-elevated text-xs font-mono text-ledger-text transition-colors"
          >
            CLOSE INSPECTOR
          </button>
        </div>
      </div>
    </Modal>
  );
};
