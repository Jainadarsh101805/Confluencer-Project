import React, { useState } from 'react';
import { Account, Transfer } from '../../types';
import { api, ApiError } from '../../api/client';
import {
  ArrowRight,
  ArrowLeftRight,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  ShieldCheck,
  Check,
} from 'lucide-react';

interface TransferStudioProps {
  accounts: Account[];
  onTransferSuccess: (transfer: Transfer) => void;
}

export const TransferStudio: React.FC<TransferStudioProps> = ({
  accounts,
  onTransferSuccess,
}) => {
  const [sourceId, setSourceId] = useState(accounts[0]?.id || '');
  const [destId, setDestId] = useState(accounts[1]?.id || '');
  const [amount, setAmount] = useState('');
  const [referenceId, setReferenceId] = useState('');
  const [description, setDescription] = useState('Inter-account liquidity rebalance');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [completedTransfer, setCompletedTransfer] = useState<Transfer | null>(null);

  const generateRef = () => {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    setReferenceId(`TRF-${timestamp}-${random}`);
  };

  React.useEffect(() => {
    if (!referenceId) generateRef();
  }, []);

  const sourceAccount = accounts.find((a) => a.id === sourceId);
  const destAccount = accounts.find((a) => a.id === destId);

  const amountNum = parseFloat(amount) || 0;
  const sourceBalanceNum = sourceAccount ? parseFloat(sourceAccount.balance) : 0;
  const destBalanceNum = destAccount ? parseFloat(destAccount.balance) : 0;

  const isSameAccount = Boolean(sourceId && destId && sourceId === destId);
  const isOverdrawn = amountNum > sourceBalanceNum;

  const sourceAfter = Math.max(0, sourceBalanceNum - amountNum);
  const destAfter = destBalanceNum + amountNum;

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sourceId || !destId) {
      setError('Both source and destination accounts must be selected.');
      return;
    }
    if (isSameAccount) {
      setError('Source and destination accounts must be distinct.');
      return;
    }
    if (!amountNum || amountNum <= 0) {
      setError('Transfer amount must be strictly greater than 0.');
      return;
    }
    if (isOverdrawn) {
      setError('Source account has insufficient funds to fulfill this transfer.');
      return;
    }
    if (!referenceId.trim()) {
      setError('Transfer reference identifier is required.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      const res = await api.createTransfer({
        source_account_id: sourceId,
        destination_account_id: destId,
        amount: amountNum.toFixed(2),
        reference_id: referenceId.trim(),
        description: description.trim(),
      });

      setCompletedTransfer(res);
      onTransferSuccess(res);
      generateRef();
      setAmount('');
    } catch (err: any) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Transfer failed to commit. State was completely rolled back.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn max-w-4xl mx-auto">
      {/* Header Banner */}
      <div className="bg-ledger-surface border border-ledger-border rounded-xl p-6">
        <div className="flex items-center space-x-3 mb-2">
          <div className="w-8 h-8 rounded bg-ledger-amber/10 border border-ledger-amber/30 flex items-center justify-center text-ledger-amber">
            <ArrowLeftRight className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-editorial text-base font-bold text-ledger-text tracking-wide">
              ATOMIC MONEY TRANSFER STUDIO
            </h3>
            <p className="text-xs font-mono text-ledger-muted">
              Two-legged double entry: Debit from source and Credit to destination commit in a single database transaction.
            </p>
          </div>
        </div>
      </div>

      {/* Success Notification if recently completed */}
      {completedTransfer && (
        <div className="p-5 rounded-xl bg-ledger-lime/10 border border-ledger-lime/40 text-ledger-text space-y-3 animate-fadeIn">
          <div className="flex items-center space-x-2 text-ledger-lime font-mono text-xs font-bold">
            <CheckCircle2 className="w-4 h-4" />
            <span>TRANSFER COMMITTED ATOMICALLY</span>
          </div>
          <div className="text-xs font-mono text-ledger-muted leading-relaxed">
            Transferred <span className="text-ledger-lime font-bold">${completedTransfer.amount}</span> with reference{' '}
            <span className="text-ledger-text font-bold">{completedTransfer.reference_id}</span>.
            Both source debit and destination credit entries were atomically persisted with zero partial state risk.
          </div>
        </div>
      )}

      {/* Interactive Connected Account Nodes Diagram */}
      <div className="bg-ledger-surface border border-ledger-border rounded-xl p-6 space-y-6">
        <div className="text-xs font-mono text-ledger-muted uppercase tracking-wider mb-2">
          FUND MOVEMENT TOPOLOGY PREVIEW
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-center">
          {/* Source Account Node */}
          <div className="md:col-span-2 p-4 rounded-xl bg-ledger-surface2 border border-ledger-border">
            <div className="text-[10px] font-mono text-ledger-dim uppercase tracking-wider flex items-center justify-between">
              <span>SOURCE NODE (DEBIT)</span>
              <span className="text-ledger-coral font-bold">- OUT</span>
            </div>

            <div className="mt-3">
              <label className="text-[11px] font-mono text-ledger-muted block mb-1">Account</label>
              <select
                value={sourceId}
                onChange={(e) => {
                  setSourceId(e.target.value);
                  setError(null);
                }}
                className="w-full px-2.5 py-1.5 rounded bg-ledger-bg border border-ledger-border focus:border-ledger-lime focus:outline-none text-xs font-mono text-ledger-text"
              >
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name} (${acc.balance})
                  </option>
                ))}
              </select>
            </div>

            <div className="mt-4 pt-3 border-t border-ledger-border/60 flex items-center justify-between text-xs font-mono">
              <span className="text-ledger-dim">Balance:</span>
              <div className="text-right">
                <span className="text-ledger-muted">${sourceAccount?.balance || '0.00'}</span>
                {amountNum > 0 && (
                  <span className="text-ledger-coral font-bold ml-1.5">
                    → ${sourceAfter.toFixed(2)}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Central Flow Beam / Directional Motion */}
          <div className="md:col-span-1 flex flex-col items-center justify-center py-2">
            <div className="w-full relative h-1 bg-ledger-surface2 rounded overflow-hidden my-2">
              <div className="absolute inset-0 bg-gradient-to-r from-ledger-coral via-ledger-amber to-ledger-lime animate-flow-beam" />
            </div>
            <div className="px-2.5 py-1 rounded bg-ledger-surface2 border border-ledger-border text-[10px] font-mono text-ledger-amber font-bold flex items-center space-x-1">
              <span>${amountNum > 0 ? amountNum.toFixed(2) : '0.00'}</span>
              <ArrowRight className="w-3 h-3 text-ledger-lime" />
            </div>
            <span className="text-[9px] font-mono text-ledger-dim mt-1">ATOMIC BRIDGE</span>
          </div>

          {/* Destination Account Node */}
          <div className="md:col-span-2 p-4 rounded-xl bg-ledger-surface2 border border-ledger-border">
            <div className="text-[10px] font-mono text-ledger-dim uppercase tracking-wider flex items-center justify-between">
              <span>DESTINATION NODE (CREDIT)</span>
              <span className="text-ledger-lime font-bold">+ IN</span>
            </div>

            <div className="mt-3">
              <label className="text-[11px] font-mono text-ledger-muted block mb-1">Account</label>
              <select
                value={destId}
                onChange={(e) => {
                  setDestId(e.target.value);
                  setError(null);
                }}
                className="w-full px-2.5 py-1.5 rounded bg-ledger-bg border border-ledger-border focus:border-ledger-lime focus:outline-none text-xs font-mono text-ledger-text"
              >
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name} (${acc.balance})
                  </option>
                ))}
              </select>
            </div>

            <div className="mt-4 pt-3 border-t border-ledger-border/60 flex items-center justify-between text-xs font-mono">
              <span className="text-ledger-dim">Balance:</span>
              <div className="text-right">
                <span className="text-ledger-muted">${destAccount?.balance || '0.00'}</span>
                {amountNum > 0 && (
                  <span className="text-ledger-lime font-bold ml-1.5">
                    → ${destAfter.toFixed(2)}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Validation warnings */}
        {isSameAccount && (
          <div className="p-3 rounded bg-ledger-coral/10 border border-ledger-coral/30 text-xs font-mono text-ledger-coral flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>Source and destination accounts must be distinct. Transfers to the same account are rejected.</span>
          </div>
        )}
        {isOverdrawn && (
          <div className="p-3 rounded bg-ledger-coral/10 border border-ledger-coral/30 text-xs font-mono text-ledger-coral flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>Source account does not have sufficient funds for this transfer.</span>
          </div>
        )}
        {error && (
          <div className="p-3 rounded bg-ledger-coral/10 border border-ledger-coral/30 text-xs font-mono text-ledger-coral flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Transfer Inputs Form */}
        <form onSubmit={handleTransfer} className="space-y-4 pt-4 border-t border-ledger-border">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono uppercase text-ledger-muted mb-2 tracking-wider">
                Transfer Amount
              </label>
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
                    setError(null);
                  }}
                  className="w-full pl-8 pr-4 py-2.5 rounded bg-ledger-surface2 border border-ledger-border focus:border-ledger-lime focus:outline-none text-sm font-mono text-ledger-text"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-mono uppercase text-ledger-muted tracking-wider">
                  Transfer Reference ID
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
                  setError(null);
                }}
                className="w-full px-3.5 py-2.5 rounded bg-ledger-surface2 border border-ledger-border focus:border-ledger-lime focus:outline-none text-xs font-mono text-ledger-text"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono uppercase text-ledger-muted mb-2 tracking-wider">
              Transfer Purpose / Narrative
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded bg-ledger-surface2 border border-ledger-border focus:border-ledger-lime focus:outline-none text-xs font-mono text-ledger-text"
            />
          </div>

          <div className="flex items-center justify-end pt-4">
            <button
              type="submit"
              disabled={submitting || isSameAccount || isOverdrawn || !amountNum || !referenceId}
              className="px-6 py-2.5 rounded bg-ledger-lime hover:bg-ledger-limeHover disabled:opacity-40 text-ledger-bg font-mono font-bold text-xs tracking-wider transition-colors shadow-glow-lime flex items-center space-x-2"
            >
              <Check className="w-4 h-4" />
              <span>{submitting ? 'COMMITTING ATOMIC TRANSFER...' : 'EXECUTE ATOMIC TRANSFER'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
