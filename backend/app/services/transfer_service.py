from decimal import Decimal
from typing import List, Optional, Tuple
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session
from app.core.config import settings
from app.core.errors import (
    AccountNotFoundError,
    DuplicateReferenceError,
    InsufficientBalanceError,
    InvalidAmountError,
    LedgerException,
    SameAccountTransferError,
)
from app.models.account import Account
from app.models.transaction import Transaction
from app.models.transfer import Transfer
from app.schemas.common import format_decimal, parse_and_validate_amount
from app.schemas.transaction import TransactionResponse
from app.schemas.transfer import TransferCreate


class TransferService:
    @staticmethod
    def create_transfer(
        db: Session, data: TransferCreate
    ) -> Tuple[Transfer, Decimal, Decimal, List[Transaction]]:
        """
        Executes an atomic money transfer between two distinct accounts.
        Guarantees:
        - Deterministic ID-sorted locking avoids deadlocks during concurrent bidirectional transfers.
        - Source and destination balance updates are executed in the exact same DB transaction.
        - Both legs (source debit and destination credit) are inserted with a common transfer_id.
        - Complete rollback on any failure leaves both account balances and histories untouched.
        """
        # Step 1: Ensure distinct accounts
        src_id = data.source_account_id.strip()
        dst_id = data.destination_account_id.strip()
        if src_id == dst_id:
            raise SameAccountTransferError(src_id)

        # Step 2: Validate amount
        amount = parse_and_validate_amount(data.amount)
        ref_id = data.reference_id.strip()

        # Step 3: Check transfer reference uniqueness
        existing_transfer = db.query(Transfer).filter(Transfer.reference_id == ref_id).first()
        if existing_transfer:
            raise DuplicateReferenceError(account_id="TRANSFERS", reference_id=ref_id)

        try:
            # Step 4: Deterministic two-phase locking in sorted UUID order to prevent deadlocks
            first_id, second_id = sorted([src_id, dst_id])

            query_first = db.query(Account).filter(Account.id == first_id)
            query_second = db.query(Account).filter(Account.id == second_id)

            if not settings.DATABASE_URL.startswith("sqlite"):
                query_first = query_first.with_for_update()
                query_second = query_second.with_for_update()

            first_acc = query_first.first()
            second_acc = query_second.first()

            # Verify both accounts exist
            if not first_acc or not second_acc:
                missing_id = src_id if (not first_acc and first_id == src_id) or (not second_acc and second_id == src_id) else dst_id
                raise AccountNotFoundError(missing_id)

            source_acc = first_acc if first_acc.id == src_id else second_acc
            dest_acc = second_acc if second_acc.id == dst_id else first_acc

            # Step 5: Check source account balance sufficiency
            src_balance = Decimal(str(source_acc.balance))
            if src_balance < amount:
                raise InsufficientBalanceError(
                    account_id=src_id,
                    available_balance=format_decimal(src_balance),
                    required_amount=format_decimal(amount),
                )

            # Step 6: Create Transfer entity
            transfer = Transfer(
                source_account_id=src_id,
                destination_account_id=dst_id,
                amount=amount,
                reference_id=ref_id,
                description=data.description.strip() if data.description else "Inter-account Transfer",
            )
            db.add(transfer)
            db.flush()  # Populates transfer.id

            # Step 7: Create Source Debit Transaction
            debit_ref = f"TRF-{ref_id}-OUT"
            debit_tx = Transaction(
                account_id=src_id,
                type="debit",
                amount=amount,
                description=f"Transfer to {dest_acc.name}: {transfer.description}",
                reference_id=debit_ref,
                transfer_id=transfer.id,
            )
            db.add(debit_tx)

            # Step 8: Create Destination Credit Transaction
            credit_ref = f"TRF-{ref_id}-IN"
            credit_tx = Transaction(
                account_id=dst_id,
                type="credit",
                amount=amount,
                description=f"Transfer from {source_acc.name}: {transfer.description}",
                reference_id=credit_ref,
                transfer_id=transfer.id,
            )
            db.add(credit_tx)

            # Step 9: Update account balances atomically
            source_acc.balance = src_balance - amount
            dest_acc.balance = Decimal(str(dest_acc.balance)) + amount

            # Step 10: Commit atomic transaction
            db.commit()
            db.refresh(transfer)
            db.refresh(source_acc)
            db.refresh(dest_acc)
            db.refresh(debit_tx)
            db.refresh(credit_tx)

            return transfer, source_acc.balance, dest_acc.balance, [debit_tx, credit_tx]

        except (SameAccountTransferError, AccountNotFoundError, DuplicateReferenceError, InsufficientBalanceError, InvalidAmountError):
            db.rollback()
            raise
        except IntegrityError as exc:
            db.rollback()
            err_str = str(exc).lower()
            if "reference_id" in err_str or "unique constraint" in err_str:
                raise DuplicateReferenceError(account_id="TRANSFERS", reference_id=ref_id)
            raise LedgerException(
                code="TRANSFER_INTEGRITY_VIOLATION",
                message="Transfer failed due to a database constraint violation. State rolled back.",
                details={"error": str(exc)},
            )
        except Exception:
            db.rollback()
            raise

    @staticmethod
    def get_transfer_by_id(db: Session, transfer_id: str) -> Tuple[Transfer, List[Transaction]]:
        transfer = db.query(Transfer).filter(Transfer.id == transfer_id).first()
        if not transfer:
            raise LedgerException(
                code="TRANSFER_NOT_FOUND",
                message=f"Transfer '{transfer_id}' was not found.",
                status_code=404,
                details={"transfer_id": transfer_id},
            )
        transactions = db.query(Transaction).filter(Transaction.transfer_id == transfer_id).all()
        return transfer, transactions
