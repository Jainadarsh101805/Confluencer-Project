# LEDGER//ONE — Architectural Assumptions & Invariant Guarantees

This document formally records the technical assumptions, monetary rules, isolation models, and financial integrity invariants underpinning **LEDGER//ONE — The Transaction Integrity Console**.

---

## 1. Currency & Monetary Precision

- **Storage Representation**: Fixed-precision `NUMERIC(18, 4)` is used in the database schema. Calculations in Python use Python's built-in `decimal.Decimal` with explicit quantizing to `Decimal("0.01")`.
- **No Floating-Point Operations**: IEEE 754 binary floating-point numbers (`float` in Python or `number` in JavaScript without rounding) are strictly forbidden for balance computations to eliminate cumulative rounding drift.
- **Precision Validation**: The API accepts monetary strings (e.g. `"100.50"`) and rejects any value with more than 2 decimal places (fractional cents) with an HTTP 400 error rather than silently rounding it.
- **Monetary Directionality**: Transaction amounts must be strictly positive (`amount > 0.00`). Positive signs represent magnitude; directionality is determined exclusively by the `type` field (`credit` or `debit`).
- **Default Currency**: Default currency is USD (`$`), configurable via the `CURRENCY_CODE` and `CURRENCY_SYMBOL` environment variables.

---

## 2. Account Lifecycle & Opening Balances

- **Initial State**: Newly created accounts start with a default balance of `0.00` and an immutable `opening_balance` of `0.00`.
- **No Deletions or Balance Overrides**: Accounts cannot be deleted or have their balances directly overwritten via any API endpoint. All balance changes must originate from committed transactions.
- **Non-Negative Balance Invariant**: Check constraint `chk_account_balance_non_negative` (`balance >= 0`) is enforced at the database level. An account balance can never drop below zero.

---

## 3. Transaction Immutability Strategy

- **Immutable Ledger**: In strict accordance with GAAP, double-entry bookkeeping, and banking regulations, once a transaction is committed to the database, it cannot be updated or deleted.
- **No Mutation Endpoints**: No `PUT`, `PATCH`, or `DELETE` endpoints exist under `/api/v1/transactions`.
- **ORM-Level Defense**: SQLAlchemy event listeners (`before_update` and `before_delete`) are attached to the `Transaction` entity. Any programmatic attempt to execute an UPDATE or DELETE on a transaction row immediately raises a `TransactionImmutabilityError` (HTTP 403 Forbidden).

---

## 4. Idempotency & Reference ID Uniqueness

- **Account-Scoped Uniqueness**: A database-level unique constraint `uq_account_reference` is enforced on `(account_id, reference_id)`.
- **Replay Protection**: If a client sends a transaction request with a reference ID that has already been recorded for that account:
  - The request is rejected with `HTTP 409 Conflict`.
  - The response payload returns error code `"DUPLICATE_REFERENCE"`.
  - The account balance and transaction history remain completely unaltered.
- **Transfer Uniqueness**: Transfer reference IDs are unique across all transfers via a global unique constraint on `transfers.reference_id`.

---

## 5. Atomicity & Concurrency Model

### 5.1 Single-Account Transaction Execution
1. Begin database transaction.
2. Acquire row-level lock on the target account (`SELECT ... FOR UPDATE` in PostgreSQL; connection-level WAL lock in SQLite).
3. Validate account existence.
4. Verify reference ID uniqueness.
5. For debit transactions, verify available funds: `account.balance >= amount`.
6. Insert immutable transaction entity into the ledger.
7. Mutate account balance atomically:
   - Credit: `account.balance += amount`
   - Debit: `account.balance -= amount`
8. Commit database transaction.
9. Return confirmed transaction details and resulting balance.

*If any step fails, the session immediately rolls back. No partial changes persist.*

### 5.2 Deterministic Lock Ordering in Transfers
When transferring funds from Account A to Account B:
- Deadlocks can occur if concurrent requests transfer from A → B and B → A simultaneously.
- To prevent this, LEDGER//ONE sorts account IDs deterministically (`first_id = min(src, dst)`, `second_id = max(src, dst)`) and always acquires row-level locks in alphabetical UUID order before verifying balances and inserting ledger legs.
- The transfer record, source debit entry, destination credit entry, and both balance updates are committed in **one atomic database transaction**.

---

## 6. Balance Consistency & Integrity Reconciliation

### Mathematical Invariant
$$\text{Current Balance} = \text{Opening Balance} + \sum \text{Credits} - \sum \text{Debits}$$

### Independent Verification
The `/api/v1/integrity` endpoint performs real-time forensic reconciliation:
- It aggregates all raw credits and debits directly from the `transactions` table.
- It compares the calculated ledger sum against each account's cached `balance`.
- Any discrepancy is flagged with `status: "DISCREPANCY_DETECTED"`, the exact discrepancy delta, and a human-readable explanation.
- System integrity status is visible directly in the Command Center and Integrity Observatory.

---

## 7. Pagination & Deterministic Sorting

- **Parameters**: `page` (default 1, minimum 1) and `limit` (default 20, maximum 100).
- **Ordering**: Transactions are strictly ordered **latest-first** by `created_at DESC`. A secondary tiebreaker `id DESC` guarantees deterministic sorting even if two transactions share the identical millisecond timestamp.
- **Metadata Returned**:
  ```json
  {
    "data": [...],
    "pagination": {
      "current_page": 1,
      "page_size": 20,
      "total_records": 100,
      "total_pages": 5
    }
  }
  ```

---

## 8. Security & Scope Boundaries

- **Authentication**: In line with the assessment scope, complex auth (JWT/OAuth) was omitted to prioritize financial correctness, concurrency safety, row-level locking, and mathematical integrity. In production, session verification or mTLS would sit as upstream middleware.
- **Input Sanitization**: All inputs are validated via Pydantic v2 schemas and parameterized queries via SQLAlchemy ORM, mitigating SQL injection and type confusion attacks.
- **CORS**: Configurable via settings, permitting local frontend development origins while preventing unauthorized cross-origin requests.
