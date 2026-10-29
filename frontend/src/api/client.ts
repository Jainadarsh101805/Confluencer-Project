import {
  Account,
  ApiErrorResponse,
  CommandCenterSummary,
  IntegrityReport,
  PaginatedResponse,
  Transaction,
  Transfer,
} from '../types';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

export class ApiError extends Error {
  code: string;
  details?: Record<string, any>;
  status: number;

  constructor(message: string, code: string = 'API_ERROR', status: number = 400, details?: Record<string, any>) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${BASE_URL}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  try {
    const response = await fetch(url, { ...options, headers });
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const errData = data as ApiErrorResponse;
      const code = errData?.error?.code || 'HTTP_ERROR';
      const message = errData?.error?.message || `Request failed with status ${response.status}`;
      const details = errData?.error?.details;
      throw new ApiError(message, code, response.status, details);
    }

    return data as T;
  } catch (err: any) {
    if (err instanceof ApiError) {
      throw err;
    }
    throw new ApiError(err?.message || 'Network connectivity error with ledger backend.', 'NETWORK_ERROR', 0);
  }
}

export const api = {
  // Accounts
  async getAccounts(page = 1, limit = 20, search?: string): Promise<PaginatedResponse<Account>> {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (search) params.append('search', search);
    return request<PaginatedResponse<Account>>(`/accounts?${params.toString()}`);
  },

  async getAccount(accountId: string): Promise<Account> {
    return request<Account>(`/accounts/${accountId}`);
  },

  async createAccount(name: string): Promise<Account> {
    return request<Account>('/accounts', {
      method: 'POST',
      body: JSON.stringify({ name }),
    });
  },

  async getAccountTransactions(
    accountId: string,
    page = 1,
    limit = 20,
    type?: string
  ): Promise<PaginatedResponse<Transaction>> {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (type) params.append('type', type);
    return request<PaginatedResponse<Transaction>>(`/accounts/${accountId}/transactions?${params.toString()}`);
  },

  // Transactions
  async getTransactions(
    page = 1,
    limit = 20,
    accountId?: string,
    type?: string,
    referenceId?: string,
    search?: string
  ): Promise<PaginatedResponse<Transaction>> {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (accountId) params.append('account_id', accountId);
    if (type) params.append('type', type);
    if (referenceId) params.append('reference_id', referenceId);
    if (search) params.append('search', search);
    return request<PaginatedResponse<Transaction>>(`/transactions?${params.toString()}`);
  },

  async getTransaction(transactionId: string): Promise<Transaction> {
    return request<Transaction>(`/transactions/${transactionId}`);
  },

  async createTransaction(payload: {
    account_id: string;
    type: 'credit' | 'debit';
    amount: string;
    description: string;
    reference_id: string;
  }): Promise<Transaction> {
    return request<Transaction>('/transactions', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  // Transfers
  async createTransfer(payload: {
    source_account_id: string;
    destination_account_id: string;
    amount: string;
    reference_id: string;
    description?: string;
  }): Promise<Transfer> {
    return request<Transfer>('/transfers', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async getTransfer(transferId: string): Promise<Transfer> {
    return request<Transfer>(`/transfers/${transferId}`);
  },

  // Integrity Reconciliation
  async getIntegrityReport(): Promise<IntegrityReport> {
    return request<IntegrityReport>('/integrity');
  },

  // Command Center Summary
  async getCommandCenterSummary(): Promise<CommandCenterSummary> {
    return request<CommandCenterSummary>('/analytics/summary');
  },
};
