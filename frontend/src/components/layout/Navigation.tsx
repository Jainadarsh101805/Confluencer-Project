import React from 'react';
import { LayoutDashboard, Users, Receipt, ArrowLeftRight, ShieldCheck } from 'lucide-react';

export type TabKey = 'dashboard' | 'accounts' | 'transactions' | 'transfers' | 'integrity';

interface NavigationProps {
  activeTab: TabKey;
  onSelectTab: (tab: TabKey) => void;
  discrepancyCount: number;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  onSelectTab,
  discrepancyCount,
}) => {
  const tabs = [
    {
      key: 'dashboard' as TabKey,
      index: '01',
      label: 'COMMAND CENTER',
      icon: LayoutDashboard,
    },
    {
      key: 'accounts' as TabKey,
      index: '02',
      label: 'ACCOUNTS OBSERVATORY',
      icon: Users,
    },
    {
      key: 'transactions' as TabKey,
      index: '03',
      label: 'TRANSACTION EXPLORER',
      icon: Receipt,
    },
    {
      key: 'transfers' as TabKey,
      index: '04',
      label: 'TRANSFER STUDIO',
      icon: ArrowLeftRight,
    },
    {
      key: 'integrity' as TabKey,
      index: '05',
      label: 'INTEGRITY OBSERVATORY',
      icon: ShieldCheck,
      badge: discrepancyCount > 0 ? `${discrepancyCount} ALERTS` : 'VERIFIED',
      badgeColor: discrepancyCount > 0 ? 'bg-ledger-coral text-ledger-bg' : 'bg-ledger-lime/10 text-ledger-lime border border-ledger-lime/30',
    },
  ];

  return (
    <nav className="border-b border-ledger-border bg-ledger-bg px-6 overflow-x-auto">
      <div className="max-w-7xl mx-auto flex space-x-1 sm:space-x-4">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.key;
          const Icon = tab.icon;

          return (
            <button
              key={tab.key}
              onClick={() => onSelectTab(tab.key)}
              className={`flex items-center space-x-2.5 py-3 px-3.5 border-b-2 text-xs font-mono tracking-wider transition-all whitespace-nowrap ${
                isActive
                  ? 'border-ledger-lime text-ledger-text bg-ledger-surface/40 font-semibold'
                  : 'border-transparent text-ledger-muted hover:text-ledger-text hover:border-ledger-border'
              }`}
            >
              <span className={`text-[10px] ${isActive ? 'text-ledger-lime' : 'text-ledger-dim'}`}>
                {tab.index}
              </span>
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-ledger-lime' : 'text-ledger-dim'}`} />
              <span>{tab.label}</span>
              {tab.badge && (
                <span className={`ml-1 text-[9px] px-1.5 py-0.5 rounded font-mono font-bold ${tab.badgeColor}`}>
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
