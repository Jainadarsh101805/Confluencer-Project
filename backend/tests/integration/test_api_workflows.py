import pytest
from fastapi import status


def test_complete_financial_lifecycle(client):
    # 1. Create Account A
    res_a = client.post("/api/v1/accounts", json={"name": "Treasury Account Alpha"})
    assert res_a.status_code == status.HTTP_201_CREATED
    data_a = res_a.json()
    acc_a_id = data_a["id"]
    assert data_a["name"] == "Treasury Account Alpha"
    assert data_a["balance"] == "0.00"

    # 2. Create Account B
    res_b = client.post("/api/v1/accounts", json={"name": "Liquidity Account Beta"})
    assert res_b.status_code == status.HTTP_201_CREATED
    data_b = res_b.json()
    acc_b_id = data_b["id"]
    assert data_b["balance"] == "0.00"

    # 3. Assessment Core Test Sequence on Account A:
    # Initial balance: 0.00
    # Credit 100.00
    res_c1 = client.post(
        "/api/v1/transactions",
        json={
            "account_id": acc_a_id,
            "type": "credit",
            "amount": "100.00",
            "description": "Funding tranche 1",
            "reference_id": "REF-CR-001",
        },
    )
    assert res_c1.status_code == status.HTTP_201_CREATED
    assert res_c1.json()["account_balance_after"] == "100.00"

    # Credit 50.00
    res_c2 = client.post(
        "/api/v1/transactions",
        json={
            "account_id": acc_a_id,
            "type": "credit",
            "amount": "50.00",
            "description": "Funding tranche 2",
            "reference_id": "REF-CR-002",
        },
    )
    assert res_c2.status_code == status.HTTP_201_CREATED
    assert res_c2.json()["account_balance_after"] == "150.00"

    # Debit 30.00
    res_d1 = client.post(
        "/api/v1/transactions",
        json={
            "account_id": acc_a_id,
            "type": "debit",
            "amount": "30.00",
            "description": "Operating expense 1",
            "reference_id": "REF-DR-001",
        },
    )
    assert res_d1.status_code == status.HTTP_201_CREATED
    assert res_d1.json()["account_balance_after"] == "120.00"

    # Debit 20.00
    res_d2 = client.post(
        "/api/v1/transactions",
        json={
            "account_id": acc_a_id,
            "type": "debit",
            "amount": "20.00",
            "description": "Operating expense 2",
            "reference_id": "REF-DR-002",
        },
    )
    assert res_d2.status_code == status.HTTP_201_CREATED
    assert res_d2.json()["account_balance_after"] == "100.00"

    # Verify Account A balance is exactly 100.00
    acc_check = client.get(f"/api/v1/accounts/{acc_a_id}")
    assert acc_check.status_code == status.HTTP_200_OK
    assert acc_check.json()["balance"] == "100.00"

    # 4. Insufficient Balance Test:
    # Account A has 100.00. Attempt to debit 150.00.
    res_fail_debit = client.post(
        "/api/v1/transactions",
        json={
            "account_id": acc_a_id,
            "type": "debit",
            "amount": "150.00",
            "description": "Excessive withdrawal",
            "reference_id": "REF-OVERDRAFT",
        },
    )
    assert res_fail_debit.status_code == status.HTTP_400_BAD_REQUEST
    err_body = res_fail_debit.json()
    assert err_body["error"]["code"] == "INSUFFICIENT_BALANCE"

    # Verify balance was NOT altered
    acc_check_after = client.get(f"/api/v1/accounts/{acc_a_id}")
    assert acc_check_after.json()["balance"] == "100.00"

    # 5. Duplicate Reference Test:
    # Attempt to post duplicate reference 'REF-CR-001' to Account A
    res_dup = client.post(
        "/api/v1/transactions",
        json={
            "account_id": acc_a_id,
            "type": "credit",
            "amount": "500.00",
            "description": "Replay attack attempt",
            "reference_id": "REF-CR-001",
        },
    )
    assert res_dup.status_code == status.HTTP_409_CONFLICT
    assert res_dup.json()["error"]["code"] == "DUPLICATE_REFERENCE"

    # Verify balance remains strictly 100.00
    acc_check_dup = client.get(f"/api/v1/accounts/{acc_a_id}")
    assert acc_check_dup.json()["balance"] == "100.00"

    # 6. Fund Account B with 50.00
    res_b_fund = client.post(
        "/api/v1/transactions",
        json={
            "account_id": acc_b_id,
            "type": "credit",
            "amount": "50.00",
            "description": "Account B seed",
            "reference_id": "REF-B-001",
        },
    )
    assert res_b_fund.status_code == status.HTTP_201_CREATED
    assert res_b_fund.json()["account_balance_after"] == "50.00"

    # 7. Bonus Assessment Test: Transfer 30.00 from Account A (100) to Account B (50)
    # Expected: Account A = 70.00, Account B = 80.00
    res_trf = client.post(
        "/api/v1/transfers",
        json={
            "source_account_id": acc_a_id,
            "destination_account_id": acc_b_id,
            "amount": "30.00",
            "reference_id": "TRF-ASSESSMENT-001",
            "description": "Inter-account rebalance",
        },
    )
    assert res_trf.status_code == status.HTTP_201_CREATED
    trf_data = res_trf.json()
    assert trf_data["source_balance_after"] == "70.00"
    assert trf_data["destination_balance_after"] == "80.00"
    assert len(trf_data["transactions"]) == 2

    # Verify balances via GET /accounts
    assert client.get(f"/api/v1/accounts/{acc_a_id}").json()["balance"] == "70.00"
    assert client.get(f"/api/v1/accounts/{acc_b_id}").json()["balance"] == "80.00"

    # 8. Same Account Transfer Rejection
    res_same = client.post(
        "/api/v1/transfers",
        json={
            "source_account_id": acc_a_id,
            "destination_account_id": acc_a_id,
            "amount": "10.00",
            "reference_id": "TRF-SAME-ACC",
        },
    )
    assert res_same.status_code == status.HTTP_400_BAD_REQUEST
    assert res_same.json()["error"]["code"] == "SAME_ACCOUNT_TRANSFER"

    # 9. Pagination and Sorting:
    # Query transactions with limit=3, page=1
    res_txs = client.get("/api/v1/transactions?page=1&limit=3")
    assert res_txs.status_code == status.HTTP_200_OK
    page_data = res_txs.json()
    assert page_data["pagination"]["current_page"] == 1
    assert page_data["pagination"]["page_size"] == 3
    assert page_data["pagination"]["total_records"] == 7  # 4 on A + 1 on B + 2 from transfer
    assert len(page_data["data"]) == 3

    # Verify latest-first ordering (first record should be one of the transfer transactions)
    tx_list = page_data["data"]
    for i in range(len(tx_list) - 1):
        assert tx_list[i]["created_at"] >= tx_list[i + 1]["created_at"]

    # 10. Ledger Integrity Reconciliation:
    res_integrity = client.get("/api/v1/integrity")
    assert res_integrity.status_code == status.HTTP_200_OK
    audit = res_integrity.json()
    assert audit["status"] == "HEALTHY"
    assert audit["discrepancy_count"] == 0
    assert audit["total_accounts_audited"] == 2
    assert audit["total_ledger_entries"] == 7
    # Total system balance: 70 + 80 = 150.00
    assert audit["total_system_stored_balance"] == "150.00"
    assert audit["total_system_calculated_balance"] == "150.00"
