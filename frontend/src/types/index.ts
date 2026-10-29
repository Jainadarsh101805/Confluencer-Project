export type TransactionType = 'credit' | 'debit';

export interface PaginationMeta {
  current_page: number;
  page_size: number;
  total_records: number;
  total_pages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationMeta;
}

export interface Account {
  id: string;
  name: string;
  balance: string;
  opening_balance: string;
  created_at: string;
  updated_at: string;
  transaction_count?: number;
}

export interface Transaction {
  id: string;
  account_id: string;
  type: TransactionType;
  amount: string;
  description: string;
  reference_id: string;
  transfer_id?: string | null;
  created_at: string;
  account_balance_after?: string | null;
}

export interface Transfer {
  id: string;
  source_account_id: string;
  destination_account_id: string;
  amount: string;
  reference_id: string;
  description: string;
  created_at: string;
  source_balance_after?: string | null;
  destination_balance_after?: string | null;
  transactions?: Transaction[];
}

export interface AccountReconciliationReport {
  account_id: string;
  account_name: string;
  stored_balance: string;
  calculated_balance: string;
  opening_balance: string;
  total_credits: string;
  total_debits: string;
  transaction_count: number;
  is_consistent: boolean;
  discrepancy_amount: string;
  explanation: string;
}

export interface IntegrityReport {
  status: 'HEALTHY' | 'DISCREPANCY_DETECTED';
  audited_at: string;
  total_accounts_audited: number;
  total_ledger_entries: number;
  total_transfers_recorded: number;
  total_system_stored_balance: string;
  total_system_calculated_balance: string;
  discrepancy_count: number;
  accounts: AccountReconciliationReport[];
  invariants_verified: string[];
  system_message: string;
}

export interface VolumeTimelinePoint {
  date: string;
  credits: string;
  debits: string;
}

export interface CommandCenterSummary {
  total_accounts: number;
  combined_liquid_balance: string;
  total_successful_credits_volume: string;
  total_successful_debits_volume: string;
  total_transactions_count: number;
  total_transfers_count: number;
  integrity_status: string;
  last_integrity_check: string | null;
  recent_transactions: Transaction[];
  volume_timeline: VolumeTimelinePoint[];
}

export interface ApiErrorResponse {
  error: {
    code: string;
    message: string;
    details?: Record<string, any>;
  };
}
