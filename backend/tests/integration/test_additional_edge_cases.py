import pytest
from decimal import Decimal
from fastapi import status
from app.models.account import Account
from app.services.integrity_service import IntegrityService


def test_pagination_validation_errors(client):
    # Invalid page 0
    res1 = client.get("/api/v1/transactions?page=0")
    assert res1.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

    # Invalid negative limit
    res2 = client.get("/api/v1/transactions?limit=-5")
    assert res2.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

    # Limit greater than max (100)
    res3 = client.get("/api/v1/transactions?limit=250")
    assert res3.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY


def test_nonexistent_account_transaction_rejection(client):
    res = client.post(
        "/api/v1/transactions",
        json={
            "account_id": "non-existent-account-uuid",
            "type": "credit",
            "amount": "50.00",
            "reference_id": "REF-NONEXISTENT",
        },
    )
    assert res.status_code == status.HTTP_404_NOT_FOUND
    assert res.json()["error"]["code"] == "ACCOUNT_NOT_FOUND"


def test_reconciliation_detects_out_of_band_discrepancy(client, db_session):
    # 1. Create account and record transaction
    res = client.post("/api/v1/accounts", json={"name": "Audit Discrepancy Account"})
    acc_id = res.json()["id"]

    client.post(
        "/api/v1/transactions",
        json={
            "account_id": acc_id,
            "type": "credit",
            "amount": "100.00",
            "reference_id": "REF-AUDIT-001",
        },
    )

    # 2. Simulate an unauthorized out-of-band tampering directly at the DB level
    account = db_session.query(Account).filter(Account.id == acc_id).first()
    account.balance = Decimal("150.00")  # Corrupted by 50.00!
    db_session.commit()

    # 3. Call Integrity Reconciliation endpoint
    res_integrity = client.get("/api/v1/integrity")
    assert res_integrity.status_code == status.HTTP_200_OK
    data = res_integrity.json()

    assert data["status"] == "DISCREPANCY_DETECTED"
    assert data["discrepancy_count"] >= 1

    # Find the audited account
    acc_report = next(a for a in data["accounts"] if a["account_id"] == acc_id)
    assert acc_report["is_consistent"] is False
    assert acc_report["discrepancy_amount"] == "50.00"
    assert "DISCREPANCY" in acc_report["explanation"]


def test_transfer_insufficient_funds_rollback(client):
    # Account 1 has 20.00
    res1 = client.post("/api/v1/accounts", json={"name": "Source Account Low Balance"})
    acc1_id = res1.json()["id"]
    client.post(
        "/api/v1/transactions",
        json={
            "account_id": acc1_id,
            "type": "credit",
            "amount": "20.00",
            "reference_id": "REF-FUND-20",
        },
    )

    # Account 2 has 0.00
    res2 = client.post("/api/v1/accounts", json={"name": "Dest Account Empty"})
    acc2_id = res2.json()["id"]

    # Try to transfer 50.00 (exceeds 20.00 balance)
    res_trf = client.post(
        "/api/v1/transfers",
        json={
            "source_account_id": acc1_id,
            "destination_account_id": acc2_id,
            "amount": "50.00",
            "reference_id": "TRF-FAILED-001",
        },
    )
    assert res_trf.status_code == status.HTTP_400_BAD_REQUEST
    assert res_trf.json()["error"]["code"] == "INSUFFICIENT_BALANCE"

    # Verify both balances remain unchanged
    assert client.get(f"/api/v1/accounts/{acc1_id}").json()["balance"] == "20.00"
    assert client.get(f"/api/v1/accounts/{acc2_id}").json()["balance"] == "0.00"

    # Verify no transactions were created for this failed transfer
    tx_list = client.get(f"/api/v1/accounts/{acc1_id}/transactions").json()["data"]
    assert len(tx_list) == 1  # Only the original credit
