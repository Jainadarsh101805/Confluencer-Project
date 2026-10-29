from datetime import datetime
from typing import List, Literal, Optional
from pydantic import BaseModel, Field


class AccountReconciliationReport(BaseModel):
    account_id: str
    account_name: str
    stored_balance: str
    calculated_balance: str
    opening_balance: str
    total_credits: str
    total_debits: str
    transaction_count: int
    is_consistent: bool
    discrepancy_amount: str
    explanation: str


class IntegrityReport(BaseModel):
    status: Literal["HEALTHY", "DISCREPANCY_DETECTED"]
    audited_at: datetime
    total_accounts_audited: int
    total_ledger_entries: int
    total_transfers_recorded: int
    total_system_stored_balance: str
    total_system_calculated_balance: str
    discrepancy_count: int
    accounts: List[AccountReconciliationReport]
    invariants_verified: List[str]
    system_message: str
