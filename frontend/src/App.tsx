import React, { useState, useEffect, useCallback } from 'react';
import { api, ApiError } from './api/client';
import {
  Account,
  Transaction,
  Transfer,
  PaginationMeta,
  CommandCenterSummary,
  IntegrityReport,
} from './types';
import { Header } from './components/layout/Header';
import { Navigation, TabKey } from './components/layout/Navigation';
import { PrecisionCursor } from './components/layout/PrecisionCursor';
import { CommandCenter } from './components/dashboard/CommandCenter';
import { AccountsObservatory } from './components/accounts/AccountsObservatory';
import { CreateAccountModal } from './components/accounts/CreateAccountModal';
import { AccountTimelineModal } from './components/accounts/AccountTimelineModal';
import { TransactionExplorer } from './components/transactions/TransactionExplorer';
import { NewTransactionModal } from './components/transactions/NewTransactionModal';
import { TransactionInspectorModal } from './components/transactions/TransactionInspectorModal';
import { TransferStudio } from './components/transfers/TransferStudio';
import { IntegrityObservatory } from './components/integrity/IntegrityObservatory';
import { Toast, ToastMessage } from './components/ui/Toast';

export const App: React.FC = () => {
  // Navigation
  const [activeTab, setActiveTab] = useState<TabKey>('dashboard');
  const [cursorEnabled, setCursorEnabled] = useState(true);

  // Data State
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [commandSummary, setCommandSummary] = useState<CommandCenterSummary | null>(null);
  const [integrityReport, setIntegrityReport] = useState<IntegrityReport | null>(null);

  // Filters & Pagination for Transaction Explorer
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [filterAccountId, setFilterAccountId] = useState('');
  const [filterType, setFilterType] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Loading States
  const [loadingAccounts, setLoadingAccounts] = useState(false);
  const [loadingTransactions, setLoadingTransactions] = useState(false);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [loadingIntegrity, setLoadingIntegrity] = useState(false);

  // Modals & Inspectors
  const [selectedTxForInspect, setSelectedTxForInspect] = useState<Transaction | null>(null);
  const [selectedAccForTimeline, setSelectedAccForTimeline] = useState<Account | null>(null);
  const [isNewTxModalOpen, setIsNewTxModalOpen] = useState(false);
  const [preselectedAccount, setPreselectedAccount] = useState<Account | null>(null);
  const [isCreateAccountOpen, setIsCreateAccountOpen] = useState(false);

  // Notifications
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (type: 'success' | 'warning' | 'error', title: string, message: string) => {
    const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    setToasts((prev) => [...prev, { id, type, title, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Fetch functions
  const loadAccounts = useCallback(async () => {
    try {
      setLoadingAccounts(true);
      const res = await api.getAccounts(1, 100);
      setAccounts(res.data);
    } catch (err: any) {
      console.error('Failed to load accounts', err);
    } finally {
      setLoadingAccounts(false);
    }
  }, []);

  const loadTransactions = useCallback(async () => {
    try {
      setLoadingTransactions(true);
      const res = await api.getTransactions(
        page,
        limit,
        filterAccountId || undefined,
        filterType || undefined,
        undefined,
        searchQuery || undefined
      );
      setTransactions(res.data);
      setPagination(res.pagination);
    } catch (err: any) {
      console.error('Failed to load transactions', err);
    } finally {
      setLoadingTransactions(false);
    }
  }, [page, limit, filterAccountId, filterType, searchQuery]);

  const loadSummary = useCallback(async () => {
    try {
      setLoadingSummary(true);
      const data = await api.getCommandCenterSummary();
      setCommandSummary(data);
    } catch (err: any) {
      console.error('Failed to load summary', err);
    } finally {
      setLoadingSummary(false);
    }
  }, []);

  const loadIntegrity = useCallback(async () => {
    try {
      setLoadingIntegrity(true);
      const data = await api.getIntegrityReport();
      setIntegrityReport(data);
    } catch (err: any) {
      console.error('Failed to load integrity report', err);
    } finally {
      setLoadingIntegrity(false);
    }
  }, []);

  // Initial telemetry mount
  useEffect(() => {
    loadAccounts();
    loadTransactions();
    loadSummary();
    loadIntegrity();
  }, [loadAccounts, loadTransactions, loadSummary, loadIntegrity]);

  // Refresh everything after financial mutation
  const refreshAll = () => {
    loadAccounts();
    loadTransactions();
    loadSummary();
    loadIntegrity();
  };

  // Handlers
  const handleTransactionCreated = (tx: Transaction) => {
    refreshAll();
    addToast(
      'success',
      'TRANSACTION COMMITTED',
      `Recorded ${tx.type.toUpperCase()} of $${tx.amount} (Ref: ${tx.reference_id}) with guaranteed balance atomicity.`
    );
  };

  const handleAccountCreated = (acc: Account) => {
    refreshAll();
    addToast(
      'success',
      'ACCOUNT PROVISIONED',
      `Account '${acc.name}' was created with zero initial balance and registered in the ledger.`
    );
  };

  const handleTransferSuccess = (transfer: Transfer) => {
    refreshAll();
    addToast(
      'success',
      'ATOMIC TRANSFER CONFIRMED',
      `Transferred $${transfer.amount} atomically. Both debit and credit legs have been committed.`
    );
  };

  const handleResetFilters = () => {
    setFilterAccountId('');
    setFilterType('');
    setSearchQuery('');
    setPage(1);
  };

  return (
    <div className="min-h-screen bg-ledger-bg text-ledger-text flex flex-col font-sans selection:bg-ledger-lime selection:text-ledger-bg">
      {/* Precision Cursor */}
      <PrecisionCursor enabled={cursorEnabled} />

      {/* Global Toast Container */}
      <Toast toasts={toasts} onDismiss={dismissToast} />

      {/* Application Header */}
      <Header
        onNewTransaction={() => {
          setPreselectedAccount(null);
          setIsNewTxModalOpen(true);
        }}
        onNewTransfer={() => setActiveTab('transfers')}
        cursorEnabled={cursorEnabled}
        onToggleCursor={() => setCursorEnabled((prev) => !prev)}
      />

      {/* Primary Navigation */}
      <Navigation
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        discrepancyCount={integrityReport?.discrepancy_count || 0}
      />

      {/* Main View Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-8">
        {activeTab === 'dashboard' && (
          <CommandCenter
            summary={commandSummary}
            loading={loadingSummary}
            onRefresh={refreshAll}
            onSelectTransaction={(tx) => setSelectedTxForInspect(tx)}
            onNewTransaction={() => {
              setPreselectedAccount(null);
              setIsNewTxModalOpen(true);
            }}
            onNewTransfer={() => setActiveTab('transfers')}
            onCreateAccount={() => setIsCreateAccountOpen(true)}
            onGoToIntegrity={() => setActiveTab('integrity')}
          />
        )}

        {activeTab === 'accounts' && (
          <AccountsObservatory
            accounts={accounts}
            loading={loadingAccounts}
            onRefresh={loadAccounts}
            onCreateAccount={() => setIsCreateAccountOpen(true)}
            onSelectAccount={(acc) => setSelectedAccForTimeline(acc)}
            onTransferFromAccount={(acc) => {
              setActiveTab('transfers');
            }}
          />
        )}

        {activeTab === 'transactions' && (
          <TransactionExplorer
            transactions={transactions}
            pagination={pagination}
            accounts={accounts}
            loading={loadingTransactions}
            onRefresh={loadTransactions}
            onPageChange={(p) => setPage(p)}
            onPageSizeChange={(lim) => {
              setLimit(lim);
              setPage(1);
            }}
            selectedAccountId={filterAccountId}
            onSelectAccountId={(id) => {
              setFilterAccountId(id);
              setPage(1);
            }}
            selectedType={filterType}
            onSelectType={(t) => {
              setFilterType(t);
              setPage(1);
            }}
            searchQuery={searchQuery}
            onSearchChange={(q) => {
              setSearchQuery(q);
              setPage(1);
            }}
            onResetFilters={handleResetFilters}
            onSelectTransaction={(tx) => setSelectedTxForInspect(tx)}
            onNewTransaction={() => {
              setPreselectedAccount(null);
              setIsNewTxModalOpen(true);
            }}
          />
        )}

        {activeTab === 'transfers' && (
          <TransferStudio
            accounts={accounts}
            onTransferSuccess={handleTransferSuccess}
          />
        )}

        {activeTab === 'integrity' && (
          <IntegrityObservatory
            report={integrityReport}
            loading={loadingIntegrity}
            onRunAudit={loadIntegrity}
          />
        )}
      </main>

      {/* Modals & Drawers */}
      <NewTransactionModal
        isOpen={isNewTxModalOpen}
        onClose={() => {
          setIsNewTxModalOpen(false);
          setPreselectedAccount(null);
        }}
        accounts={accounts}
        preselectedAccount={preselectedAccount}
        onTransactionCreated={handleTransactionCreated}
      />

      <CreateAccountModal
        isOpen={isCreateAccountOpen}
        onClose={() => setIsCreateAccountOpen(false)}
        onAccountCreated={handleAccountCreated}
      />

      <AccountTimelineModal
        account={selectedAccForTimeline}
        isOpen={Boolean(selectedAccForTimeline)}
        onClose={() => setSelectedAccForTimeline(null)}
        onSelectTransaction={(tx) => setSelectedTxForInspect(tx)}
        onRecordForAccount={(acc) => {
          setPreselectedAccount(acc);
          setIsNewTxModalOpen(true);
        }}
      />

      <TransactionInspectorModal
        transaction={selectedTxForInspect}
        isOpen={Boolean(selectedTxForInspect)}
        onClose={() => setSelectedTxForInspect(null)}
      />

      {/* Footer */}
      <footer className="border-t border-ledger-border py-6 px-6 bg-ledger-surface/50 text-xs font-mono text-ledger-dim">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <span className="w-1.5 h-1.5 rounded-full bg-ledger-lime" />
            <span className="text-ledger-muted font-bold">LEDGER//ONE</span>
            <span>— The Transaction Integrity Console. Every balance has a reason.</span>
          </div>
          <div className="flex items-center space-x-4">
            <a
              href="http://localhost:8000/docs"
              target="_blank"
              rel="noreferrer"
              className="hover:text-ledger-lime transition-colors"
            >
              OpenAPI 3.1 Specification
            </a>
            <span>·</span>
            <span>Deterministic Concurrency & Row Locking Active</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
