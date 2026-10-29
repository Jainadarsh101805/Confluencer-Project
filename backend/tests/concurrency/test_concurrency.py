import concurrent.futures
from decimal import Decimal
from fastapi import status
from app.models.account import Account


def test_concurrent_debits_prevent_overspend(client, db_session):
    # Setup account with 100.00 balance
    res = client.post("/api/v1/accounts", json={"name": "Concurrency Test Account"})
    acc_id = res.json()["id"]

    # Fund with 100.00
    client.post(
        "/api/v1/transactions",
        json={
            "account_id": acc_id,
            "type": "credit",
            "amount": "100.00",
            "reference_id": "CONC-CR-001",
        },
    )

    # Launch two concurrent debits of 80.00 each (total 160.00 > 100.00)
    def submit_debit(ref_suffix):
        return client.post(
            "/api/v1/transactions",
            json={
                "account_id": acc_id,
                "type": "debit",
                "amount": "80.00",
                "reference_id": f"CONC-DR-{ref_suffix}",
            },
        )

    with concurrent.futures.ThreadPoolExecutor(max_workers=2) as executor:
        f1 = executor.submit(submit_debit, "A")
        f2 = executor.submit(submit_debit, "B")
        r1 = f1.result()
        r2 = f2.result()

    status_codes = [r1.status_code, r2.status_code]
    # Exactly one must succeed and one must fail with 400
    assert status.HTTP_201_CREATED in status_codes
    assert status.HTTP_400_BAD_REQUEST in status_codes

    # Verify final account balance is 20.00 (100 - 80)
    acc_res = client.get(f"/api/v1/accounts/{acc_id}")
    assert acc_res.json()["balance"] == "20.00"


def test_concurrent_duplicate_reference(client, db_session):
    res = client.post("/api/v1/accounts", json={"name": "Race Reference Account"})
    acc_id = res.json()["id"]

    # Submit two simultaneous transactions with identical reference_id
    def submit_tx():
        return client.post(
            "/api/v1/transactions",
            json={
                "account_id": acc_id,
                "type": "credit",
                "amount": "25.00",
                "reference_id": "IDENTICAL-RACE-REF",
            },
        )

    with concurrent.futures.ThreadPoolExecutor(max_workers=2) as executor:
        f1 = executor.submit(submit_tx)
        f2 = executor.submit(submit_tx)
        r1 = f1.result()
        r2 = f2.result()

    status_codes = [r1.status_code, r2.status_code]
    assert status.HTTP_201_CREATED in status_codes
    assert status.HTTP_409_CONFLICT in status_codes

    # Verify balance changed by only 25.00, not 50.00
    acc_res = client.get(f"/api/v1/accounts/{acc_id}")
    assert acc_res.json()["balance"] == "25.00"
