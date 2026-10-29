import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { api, ApiError } from '../../api/client';
import { Account } from '../../types';

interface CreateAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAccountCreated: (account: Account) => void;
}

export const CreateAccountModal: React.FC<CreateAccountModalProps> = ({
  isOpen,
  onClose,
  onAccountCreated,
}) => {
  const [name, setName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Account name is required and cannot be blank.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      const newAcc = await api.createAccount(trimmed);
      setName('');
      onAccountCreated(newAcc);
      onClose();
    } catch (err: any) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Failed to provision account. Check backend connection.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="PROVISION NEW ACCOUNT"
      subtitle="Registers a new account in the immutable ledger with initial 0.00 balance"
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="p-3 rounded bg-ledger-coral/10 border border-ledger-coral/30 text-xs font-mono text-ledger-coral">
            {error}
          </div>
        )}

        <div>
          <label className="block text-xs font-mono uppercase text-ledger-muted mb-2 tracking-wider">
            Account Legal / Operational Name
          </label>
          <input
            type="text"
            required
            autoFocus
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (error) setError(null);
            }}
            placeholder="e.g. Operating Liquidity Reserve"
            className="w-full px-3.5 py-2.5 rounded bg-ledger-surface2 border border-ledger-border focus:border-ledger-lime focus:outline-none text-sm text-ledger-text placeholder-ledger-dim font-sans transition-colors"
          />
          <p className="text-[11px] font-mono text-ledger-dim mt-1.5">
            Account name will be validated and tied to an immutable UUID primary key.
          </p>
        </div>

        <div className="flex items-center justify-end space-x-3 pt-3 border-t border-ledger-border">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded text-xs font-mono text-ledger-muted hover:text-ledger-text transition-colors"
          >
            CANCEL
          </button>
          <button
            type="submit"
            disabled={submitting || !name.trim()}
            className="px-5 py-2 rounded bg-ledger-lime hover:bg-ledger-limeHover disabled:opacity-50 text-ledger-bg font-mono font-bold text-xs tracking-wider transition-colors shadow-glow-lime"
          >
            {submitting ? 'PROVISIONING...' : 'PROVISION ACCOUNT'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
