import React from 'react';
import { ShieldCheck, Plus, ArrowLeftRight, Terminal, MousePointer } from 'lucide-react';

interface HeaderProps {
  onNewTransaction: () => void;
  onNewTransfer: () => void;
  cursorEnabled: boolean;
  onToggleCursor: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onNewTransaction,
  onNewTransfer,
  cursorEnabled,
  onToggleCursor,
}) => {
  return (
    <header className="border-b border-ledger-border bg-ledger-surface/90 backdrop-blur sticky top-0 z-40 px-6 py-3.5">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Brand identity */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2.5">
            <div className="w-7 h-7 rounded bg-ledger-surface2 border border-ledger-lime/40 flex items-center justify-center shadow-glow-lime">
              <span className="w-2.5 h-2.5 rounded-sm bg-ledger-lime" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-editorial text-lg font-bold tracking-tight text-ledger-text">
                  LEDGER<span className="text-ledger-lime">//</span>ONE
                </span>
                <span className="text-[10px] uppercase font-mono tracking-wider px-1.5 py-0.5 rounded bg-ledger-surface2 text-ledger-muted border border-ledger-border">
                  v1.0.0
                </span>
              </div>
              <p className="text-[11px] font-mono text-ledger-muted uppercase tracking-wider">
                The Transaction Integrity Console
              </p>
            </div>
          </div>

          <div className="hidden lg:flex items-center space-x-2 pl-4 border-l border-ledger-border text-[11px] font-mono text-ledger-muted">
            <span className="w-1.5 h-1.5 rounded-full bg-ledger-lime animate-pulse" />
            <span>ENGINE: ATOMIC // CONSISTENCY GUARANTEED</span>
          </div>
        </div>

        {/* Global Action Controls */}
        <div className="flex items-center space-x-3">
          {/* Precision cursor toggle */}
          <button
            onClick={onToggleCursor}
            title={cursorEnabled ? 'Disable custom precision cursor' : 'Enable custom precision cursor'}
            className={`hidden md:flex items-center space-x-1.5 px-2.5 py-1.5 rounded text-xs font-mono transition-colors border ${
              cursorEnabled
                ? 'bg-ledger-lime/10 text-ledger-lime border-ledger-lime/40'
                : 'bg-ledger-surface2 text-ledger-muted border-ledger-border hover:text-ledger-text'
            }`}
          >
            <MousePointer className="w-3.5 h-3.5" />
            <span>CURSOR: {cursorEnabled ? 'ON' : 'OFF'}</span>
          </button>

          {/* OpenAPI Docs Link */}
          <a
            href="http://localhost:8000/docs"
            target="_blank"
            rel="noreferrer"
            className="hidden sm:flex items-center space-x-1.5 px-3 py-1.5 rounded bg-ledger-surface2 hover:bg-ledger-elevated text-ledger-muted hover:text-ledger-text border border-ledger-border text-xs font-mono transition-colors"
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>API DOCS</span>
          </a>

          {/* Quick Action: Transfer */}
          <button
            onClick={onNewTransfer}
            className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded bg-ledger-surface2 hover:bg-ledger-elevated text-ledger-text border border-ledger-border text-xs font-medium transition-colors"
          >
            <ArrowLeftRight className="w-3.5 h-3.5 text-ledger-amber" />
            <span>Transfer</span>
          </button>

          {/* Quick Action: New Transaction */}
          <button
            onClick={onNewTransaction}
            className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded bg-ledger-lime hover:bg-ledger-limeHover text-ledger-bg font-semibold text-xs transition-colors shadow-glow-lime"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Record Transaction</span>
          </button>
        </div>
      </div>
    </header>
  );
};
