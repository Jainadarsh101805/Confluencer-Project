import pytest
from decimal import Decimal
from pydantic import ValidationError
from app.schemas.account import AccountCreate
from app.schemas.transaction import TransactionCreate
from app.schemas.transfer import TransferCreate
from app.schemas.common import parse_and_validate_amount, format_decimal


def test_account_create_validation():
    # Valid account
    acc = AccountCreate(name="  Operating Alpha  ")
    assert acc.name == "Operating Alpha"

    # Empty name should fail
    with pytest.raises(ValidationError):
        AccountCreate(name="")

    # Whitespace-only name should fail
    with pytest.raises(ValidationError):
        AccountCreate(name="   ")


def test_amount_validation():
    # Valid amounts
    assert parse_and_validate_amount("100.50") == Decimal("100.50")
    assert parse_and_validate_amount(50) == Decimal("50.00")
    assert parse_and_validate_amount("0.01") == Decimal("0.01")

    # Zero amount must fail
    with pytest.raises(ValueError, match="strictly greater than 0"):
        parse_and_validate_amount("0.00")

    # Negative amount must fail
    with pytest.raises(ValueError, match="strictly greater than 0"):
        parse_and_validate_amount("-10.00")

    # More than 2 decimal places must fail
    with pytest.raises(ValueError, match="precision of 2 decimal places"):
        parse_and_validate_amount("100.555")

    # Invalid non-numeric string must fail
    with pytest.raises(ValueError, match="valid numeric decimal"):
        parse_and_validate_amount("abc")


def test_transaction_create_validation():
    # Valid transaction
    tx = TransactionCreate(
        account_id="acc-123",
        type="credit",
        amount="100.00",
        reference_id="REF-001",
        description="Funding",
    )
    assert tx.type == "credit"
    assert tx.amount == "100.00"

    # Invalid type
    with pytest.raises(ValidationError):
        TransactionCreate(
            account_id="acc-123",
            type="invalid_type",
            amount="100.00",
            reference_id="REF-001",
        )

    # Empty reference_id
    with pytest.raises(ValidationError):
        TransactionCreate(
            account_id="acc-123",
            type="credit",
            amount="100.00",
            reference_id="   ",
        )


def test_transfer_create_validation():
    # Valid transfer
    trf = TransferCreate(
        source_account_id="acc-1",
        destination_account_id="acc-2",
        amount="50.00",
        reference_id="TRF-001",
    )
    assert trf.amount == "50.00"

    # Empty account id
    with pytest.raises(ValidationError):
        TransferCreate(
            source_account_id="",
            destination_account_id="acc-2",
            amount="50.00",
            reference_id="TRF-001",
        )
