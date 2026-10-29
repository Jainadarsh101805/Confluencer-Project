import React from 'react';

interface StatCardProps {
  label: string;
  value: string | number;
  subtext?: string;
  prefix?: string;
  indicatorColor?: 'lime' | 'amber' | 'coral' | 'neutral';
  badge?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  subtext,
  prefix,
  indicatorColor = 'lime',
  badge,
}) => {
  const dotStyles = {
    lime: 'bg-ledger-lime',
    amber: 'bg-ledger-amber',
    coral: 'bg-ledger-coral',
    neutral: 'bg-ledger-muted',
  };

  return (
    <div className="bg-ledger-surface border border-ledger-border p-5 rounded-lg flex flex-col justify-between hover:border-ledger-borderLight transition-colors">
      <div className="flex items-center justify-between text-xs font-mono text-ledger-muted mb-2">
        <div className="flex items-center space-x-2">
          <span className={`w-1.5 h-1.5 rounded-full ${dotStyles[indicatorColor]}`} />
          <span className="uppercase tracking-wider text-[11px]">{label}</span>
        </div>
        {badge && (
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-ledger-surface2 text-ledger-muted border border-ledger-border">
            {badge}
          </span>
        )}
      </div>

      <div className="my-1">
        <div className="text-2xl font-bold font-mono text-ledger-text tracking-tight flex items-baseline">
          {prefix && <span className="text-lg text-ledger-dim mr-1">{prefix}</span>}
          <span>{value}</span>
        </div>
      </div>

      {subtext && (
        <div className="text-[11px] font-mono text-ledger-dim mt-2 truncate">
          {subtext}
        </div>
      )}
    </div>
  );
};
