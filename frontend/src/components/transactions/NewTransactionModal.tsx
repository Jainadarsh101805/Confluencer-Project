import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Account, Transaction } from '../../types';
import { api, ApiError } from '../../api/client';
import { AlertTriangle, Sparkles, Check, ArrowRight } from 'lucide-react';

interface NewTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  accounts: Account[];
  preselectedAccount?: Account | null;
  onTransactionCreated: (tx: Transaction) => void;
}

export const NewTransactionModal: React.FC<NewTransactionModalProps> = ({
  isOpen,
  onClose,
  accounts,
  preselectedAccount,
  onTransactionCreated,
}) => {
  const [accountId, setAccountId] = useState('');
  const [type, setType] = useState<'credit' | 'debit'>('credit');
  const [amount, setAmount] = useState('');
  const [referenceId, setReferenceId] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (preselectedAccount) {
      setAccountId(preselectedAccount.id);
    } else if (accounts.length > 0 && !accountId) {
      setAccountId(accounts[0].id);
    }
  }, [preselectedAccount, accounts]);

  useEffect(() => {
    if (isOpen && !referenceId) {
      generateRef();
    }
  }, [isOpen]);

  const generateRef = () => {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    setReferenceId(`REF-${timestamp}-${random}`);
  };

  const selectedAccount = accounts.find((a) => a.id === accountId);
  const currentBalanceNum = selectedAccount ? parseFloat(selectedAccount.balance) : 0;
  const amountNum = parseFloat(amount) || 0;
  const isOverdrawn = type === 'debit' && amountNum > currentBalanceNum;

  const estimatedNewBalance =
    type === 'credit'
      ? currentBalanceNum + amountNum
      : Math.max(0, currentBalanceNum - amountNum);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountId) {
      setError('Please select an account.');
      return;
    }
    if (!amountNum || amountNum <= 0) {
      setError('Amount must be strictly greater than 0.');
      return;
    }
    if (isOverdrawn) {
      setError('Insufficient funds. Debit cannot exceed current available balance.');
      return;
    }
    if (!referenceId.trim()) {
      setError('Reference ID is required.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      const createdTx = await api.createTransaction({
        account_id: accountId,
        type,
        amount: amountNum.toFixed(2),
        reference_id: referenceId.trim(),
        description: description.trim(),
      });

      onTransactionCreated(createdTx);
      onClose();
      // Reset form
      setAmount('');
      setDescription('');
      setReferenceId('');
    } catch (err: any) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Failed to record transaction. Check backend connection.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="RECORD IMMUTABLE TRANSACTION"
      subtitle="Creates a permanent, non-editable financial record and atomically updates account balance"
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="p-3 rounded bg-ledger-coral/10 border border-ledger-coral/30 text-xs font-mono text-ledger-coral flex items-start space-x-2">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Account Selector */}
        <div>
          <label className="block text-xs font-mono uppercase text-ledger-muted mb-2 tracking-wider">
            Target Account
          </label>
          <select
            value={accountId}
            onChange={(e) => {
              setAccountId(e.target.value);
              if (error) setError(null);
            }}
            className="w-full px-3.5 py-2.5 rounded bg-ledger-surface2 border border-ledger-border focus:border-ledger-lime focus:outline-none text-xs font-mono text-ledger-text transition-colors"
          >
            {accounts.map((acc) => (
              <option key={acc.id} value={acc.id}>
                {acc.name} — Available: ${acc.balance}
              </option>
            ))}
          </select>
        </div>

        {/* Type Toggle: Credit vs Debit */}
        <div>
          <label className="block text-xs font-mono uppercase text-ledger-muted mb-2 tracking-wider">
            Transaction Type
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => {
                setType('credit');
                if (error) setError(null);
              }}
              className={`py-2.5 px-4 rounded border text-xs font-mono font-bold tracking-wider transition-all flex items-center justify-center space-x-2 ${
                type === 'credit'
                  ? 'bg-ledger-lime/15 border-ledger-lime text-ledger-lime shadow-glow-lime'
                  : 'bg-ledger-surface2 border-ledger-border text-ledger-muted hover:text-ledger-text'
              }`}
            >
              <span>+ CREDIT (DEPOSIT)</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setType('debit');
                if (error) setError(null);
              }}
              className={`py-2.5 px-4 rounded border text-xs font-mono font-bold tracking-wider transition-all flex items-center justify-center space-x-2 ${
                type === 'debit'
                  ? 'bg-ledger-coral/15 border-ledger-coral text-ledger-coral shadow-glow-coral'
                  : 'bg-ledger-surface2 border-ledger-border text-ledger-muted hover:text-ledger-text'
              }`}
            >
              <span>- DEBIT (WITHDRAWAL)</span>
            </button>
          </div>
        </div>

        {/* Amount Input */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-mono uppercase text-ledger-muted tracking-wider">
              Monetary Amount
            </label>
            {selectedAccount && (
              <span className="text-[11px] font-mono text-ledger-dim">
                Available: <span className="text-ledger-text">${selectedAccount.balance}</span>
              </span>
            )}
          </div>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ledger-dim font-mono text-sm">
              $
            </span>
            <input
              type="number"
              step="0.01"
              min="0.01"
              required
              placeholder="0.00"
              value={amount}
              onChange={(e) => {
                setAmount(e.target.value);
                if (error) setError(null);
              }}
              className="w-full pl-8 pr-4 py-2.5 rounded bg-ledger-surface2 border border-ledger-border focus:border-ledger-lime focus:outline-none text-sm font-mono text-ledger-text placeholder-ledger-dim transition-colors"
            />
          </div>
          {isOverdrawn && (
            <p className="text-[11px] font-mono text-ledger-coral mt-1.5 flex items-center space-x-1">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Warning: Amount exceeds available funds. Backend will reject with INSUFFICIENT_BALANCE.</span>
            </p>
          )}
        </div>

        {/* Reference ID with generator */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-mono uppercase text-ledger-muted tracking-wider">
              External Reference ID (Unique per account)
            </label>
            <button
              type="button"
              onClick={generateRef}
              className="flex items-center space-x-1 text-[11px] font-mono text-ledger-lime hover:underline"
            >
              <Sparkles className="w-3 h-3" />
              <span>Generate New</span>
            </button>
          </div>
          <input
            type="text"
            required
            value={referenceId}
            onChange={(e) => {
              setReferenceId(e.target.value);
              if (error) setError(null);
            }}
            placeholder="e.g. REF-2026-001"
            className="w-full px-3.5 py-2.5 rounded bg-ledger-surface2 border border-ledger-border focus:border-ledger-lime focus:outline-none text-xs font-mono text-ledger-text placeholder-ledger-dim transition-colors"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-mono uppercase text-ledger-muted mb-2 tracking-wider">
            Narrative / Description
          </label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g. Treasury Liquidity Allocation"
            className="w-full px-3.5 py-2.5 rounded bg-ledger-surface2 border border-ledger-border focus:border-ledger-lime focus:outline-none text-xs font-mono text-ledger-text placeholder-ledger-dim transition-colors"
          />
        </div>

        {/* Pre-flight Review Preview */}
        {amountNum > 0 && selectedAccount && (
          <div className="p-3.5 rounded bg-ledger-surface2/60 border border-ledger-border text-xs font-mono">
            <div className="text-[10px] text-ledger-dim uppercase tracking-wider mb-1">
              PRE-FLIGHT BALANCE PROJECTION
            </div>
            <div className="flex items-center justify-between text-ledger-muted">
              <span>Current Balance: ${selectedAccount.balance}</span>
              <ArrowRight className="w-3 h-3 text-ledger-dim" />
              <span className="text-ledger-lime font-bold">
                Projected Balance: ${estimatedNewBalance.toFixed(2)}
              </span>
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="flex items-center justify-end space-x-3 pt-4 border-t border-ledger-border">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded text-xs font-mono text-ledger-muted hover:text-ledger-text transition-colors"
          >
            CANCEL
          </button>
          <button
            type="submit"
            disabled={submitting || isOverdrawn || !amountNum || !referenceId}
            className="px-5 py-2.5 rounded bg-ledger-lime hover:bg-ledger-limeHover disabled:opacity-50 text-ledger-bg font-mono font-bold text-xs tracking-wider transition-colors shadow-glow-lime flex items-center space-x-1.5"
          >
            <Check className="w-4 h-4" />
            <span>{submitting ? 'COMMITTING ATOMICALLY...' : 'COMMIT TRANSACTION'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};
