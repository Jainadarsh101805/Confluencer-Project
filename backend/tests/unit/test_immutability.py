import pytest
from decimal import Decimal
from app.models.account import Account
from app.models.transaction import Transaction
from app.core.errors import TransactionImmutabilityError


def test_transaction_update_raises_error(db_session):
    # Setup account and transaction
    account = Account(name="Test Account", balance=Decimal("100.00"))
    db_session.add(account)
    db_session.commit()

    tx = Transaction(
        account_id=account.id,
        type="credit",
        amount=Decimal("100.00"),
        description="Initial credit",
        reference_id="IMMUTABLE-001",
    )
    db_session.add(tx)
    db_session.commit()

    # Attempting to modify amount and commit should trigger TransactionImmutabilityError
    tx.amount = Decimal("200.00")
    with pytest.raises(TransactionImmutabilityError):
        db_session.commit()

    db_session.rollback()


def test_transaction_delete_raises_error(db_session):
    account = Account(name="Test Account", balance=Decimal("100.00"))
    db_session.add(account)
    db_session.commit()

    tx = Transaction(
        account_id=account.id,
        type="credit",
        amount=Decimal("100.00"),
        description="Initial credit",
        reference_id="IMMUTABLE-002",
    )
    db_session.add(tx)
    db_session.commit()

    # Attempting to delete transaction should trigger TransactionImmutabilityError
    db_session.delete(tx)
    with pytest.raises(TransactionImmutabilityError):
        db_session.commit()

    db_session.rollback()
