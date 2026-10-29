# LEDGER//ONE — API Specification Reference

All endpoints are versioned under the `/api/v1` namespace.

---

## 1. Accounts API

### Create Account
`POST /api/v1/accounts`

**Request Body:**
```json
{
  "name": "Operating Liquidity Reserve"
}
```

**Response (201 Created):**
```json
{
  "id": "e4b2d184-7a31-4c74-9f2d-8b01a1c90001",
  "name": "Operating Liquidity Reserve",
  "balance": "0.00",
  "opening_balance": "0.00",
  "created_at": "2026-10-27T18:00:00Z",
  "updated_at": "2026-10-27T18:00:00Z",
  "transaction_count": 0
}
```

---

### List Accounts
`GET /api/v1/accounts?page=1&limit=20&search=Liquidity`

**Response (200 OK):**
```json
{
  "data": [
    {
      "id": "e4b2d184-7a31-4c74-9f2d-8b01a1c90001",
      "name": "Operating Liquidity Reserve",
      "balance": "100.00",
      "opening_balance": "0.00",
      "created_at": "2026-10-27T18:00:00Z",
      "updated_at": "2026-10-27T18:05:00Z",
      "transaction_count": 4
    }
  ],
  "pagination": {
    "current_page": 1,
    "page_size": 20,
    "total_records": 1,
    "total_pages": 1
  }
}
```

---

### Get Account Details
`GET /api/v1/accounts/{account_id}`

**Response (200 OK):**
```json
{
  "id": "e4b2d184-7a31-4c74-9f2d-8b01a1c90001",
  "name": "Operating Liquidity Reserve",
  "balance": "100.00",
  "opening_balance": "0.00",
  "created_at": "2026-10-27T18:00:00Z",
  "updated_at": "2026-10-27T18:05:00Z",
  "transaction_count": 4
}
```

---

## 2. Transactions API

### Record Transaction (Atomic Credit / Debit)
`POST /api/v1/transactions`

**Request Body (Credit):**
```json
{
  "account_id": "e4b2d184-7a31-4c74-9f2d-8b01a1c90001",
  "type": "credit",
  "amount": "100.00",
  "description": "Initial funding tranche",
  "reference_id": "CR-TX-001"
}
```

**Response (201 Created):**
```json
{
  "id": "7f13b942-0fbc-4990-a359-c2901a88df54",
  "account_id": "e4b2d184-7a31-4c74-9f2d-8b01a1c90001",
  "type": "credit",
  "amount": "100.00",
  "description": "Initial funding tranche",
  "reference_id": "CR-TX-001",
  "transfer_id": null,
  "created_at": "2026-10-27T18:02:15Z",
  "account_balance_after": "100.00"
}
```

---

### List Transactions (Paginated, Latest-First)
`GET /api/v1/transactions?page=1&limit=20&type=credit`

**Response (200 OK):**
```json
{
  "data": [
    {
      "id": "7f13b942-0fbc-4990-a359-c2901a88df54",
      "account_id": "e4b2d184-7a31-4c74-9f2d-8b01a1c90001",
      "type": "credit",
      "amount": "100.00",
      "description": "Initial funding tranche",
      "reference_id": "CR-TX-001",
      "transfer_id": null,
      "created_at": "2026-10-27T18:02:15Z",
      "account_balance_after": "100.00"
    }
  ],
  "pagination": {
    "current_page": 1,
    "page_size": 20,
    "total_records": 1,
    "total_pages": 1
  }
}
```

---

## 3. Money Transfers API (Bonus Feature)

### Create Atomic Transfer
`POST /api/v1/transfers`

**Request Body:**
```json
{
  "source_account_id": "e4b2d184-7a31-4c74-9f2d-8b01a1c90001",
  "destination_account_id": "91a273b1-8b42-4912-a10c-9821cb914022",
  "amount": "30.00",
  "reference_id": "TRF-2026-001",
  "description": "Liquidity rebalancing"
}
```

**Response (201 Created):**
```json
{
  "id": "c8e2193b-5a12-4091-bf9a-28e4692790a1",
  "source_account_id": "e4b2d184-7a31-4c74-9f2d-8b01a1c90001",
  "destination_account_id": "91a273b1-8b42-4912-a10c-9821cb914022",
  "amount": "30.00",
  "reference_id": "TRF-2026-001",
  "description": "Liquidity rebalancing",
  "created_at": "2026-10-27T18:10:00Z",
  "source_balance_after": "70.00",
  "destination_balance_after": "80.00",
  "transactions": [
    {
      "id": "11111111-2222-3333-4444-555555555555",
      "account_id": "e4b2d184-7a31-4c74-9f2d-8b01a1c90001",
      "type": "debit",
      "amount": "30.00",
      "description": "Transfer to Liquidity Beta: Liquidity rebalancing",
      "reference_id": "TRF-TRF-2026-001-OUT",
      "transfer_id": "c8e2193b-5a12-4091-bf9a-28e4692790a1",
      "created_at": "2026-10-27T18:10:00Z",
      "account_balance_after": "70.00"
    },
    {
      "id": "66666666-7777-8888-9999-000000000000",
      "account_id": "91a273b1-8b42-4912-a10c-9821cb914022",
      "type": "credit",
      "amount": "30.00",
      "description": "Transfer from Operating Alpha: Liquidity rebalancing",
      "reference_id": "TRF-TRF-2026-001-IN",
      "transfer_id": "c8e2193b-5a12-4091-bf9a-28e4692790a1",
      "created_at": "2026-10-27T18:10:00Z",
      "account_balance_after": "80.00"
    }
  ]
}
```

---

## 4. Integrity API

### Reconcile Ledger
`GET /api/v1/integrity`

**Response (200 OK):**
```json
{
  "status": "HEALTHY",
  "audited_at": "2026-10-27T18:15:00Z",
  "total_accounts_audited": 3,
  "total_ledger_entries": 8,
  "total_transfers_recorded": 1,
  "total_system_stored_balance": "850.00",
  "total_system_calculated_balance": "850.00",
  "discrepancy_count": 0,
  "accounts": [
    {
      "account_id": "e4b2d184-7a31-4c74-9f2d-8b01a1c90001",
      "account_name": "Operating Liquidity Reserve",
      "stored_balance": "70.00",
      "calculated_balance": "70.00",
      "opening_balance": "0.00",
      "total_credits": "150.00",
      "total_debits": "80.00",
      "transaction_count": 5,
      "is_consistent": true,
      "discrepancy_amount": "0.00",
      "explanation": "RECONCILED: Stored balance (70.00) perfectly reconciles with ledger history (5 transactions: +150.00 credits, -80.00 debits)."
    }
  ],
  "invariants_verified": [
    "Mathematical Balance Invariant: Balance = Opening Balance + Sum(Credits) - Sum(Debits)",
    "Transaction Immutability: Transactions cannot be modified or deleted via API or ORM",
    "Non-Negative Balances: Account balances are strictly non-negative (Balance >= 0)",
    "Strict Uniqueness: (account_id, reference_id) unique constraint enforced",
    "Transfer Conservation: Every transfer has an identical matching debit and credit entry"
  ],
  "system_message": "Ledger reconciliation passed with 100% mathematical precision across 3 accounts and 8 immutable transactions. Zero discrepancies detected."
}
```

---

## 5. Error Format Contract

All error responses adhere to the following machine-readable JSON structure:

```json
{
  "error": {
    "code": "INSUFFICIENT_BALANCE",
    "message": "Transaction declined. This account does not have enough available funds. No balance change was recorded.",
    "details": {
      "account_id": "e4b2d184-7a31-4c74-9f2d-8b01a1c90001",
      "available_balance": "70.00",
      "required_amount": "150.00"
    }
  }
}
```

### Standard Error Codes:
- `ACCOUNT_NOT_FOUND` (404)
- `INSUFFICIENT_BALANCE` (400)
- `DUPLICATE_REFERENCE` (409)
- `INVALID_TRANSACTION_TYPE` (400)
- `INVALID_AMOUNT` (400)
- `INVALID_PAGINATION` (422 / 400)
- `SAME_ACCOUNT_TRANSFER` (400)
- `IMMUTABLE_RECORD` (403)
- `VALIDATION_ERROR` (422)
