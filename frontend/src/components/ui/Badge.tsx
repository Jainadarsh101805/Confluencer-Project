import React from 'react';
import { TransactionType } from '../../types';

interface TransactionBadgeProps {
  type: TransactionType;
}

export const TransactionBadge: React.FC<TransactionBadgeProps> = ({ type }) => {
  const isCredit = type === 'credit';

  return (
    <span
      className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold tracking-wider uppercase border ${
        isCredit
          ? 'bg-ledger-lime/10 text-ledger-lime border-ledger-lime/30'
          : 'bg-ledger-coral/10 text-ledger-coral border-ledger-coral/30'
      }`}
    >
      <span>{isCredit ? '+' : '-'}</span>
      <span>{type}</span>
    </span>
  );
};
