from decimal import Decimal
from math import ceil
from typing import List, Optional, Tuple
from sqlalchemy import func
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session
from app.core.config import settings
from app.core.errors import (
    AccountNotFoundError,
    DuplicateReferenceError,
    InsufficientBalanceError,
    InvalidAmountError,
    InvalidPaginationError,
    InvalidTransactionTypeError,
    LedgerException,
)
from app.models.account import Account
from app.models.transaction import Transaction
from app.schemas.common import PaginationMeta, format_decimal, parse_and_validate_amount
from app.schemas.transaction import TransactionCreate, TransactionResponse


class TransactionService:
    @staticmethod
    def create_transaction(db: Session, data: TransactionCreate) -> Tuple[Transaction, Decimal]:
        """
        Creates an immutable transaction and updates the account balance atomically.
        Guarantees:
        - Row-level lock on the account record prevents race conditions.
        - Balance deduction occurs only after confirming sufficient available funds.
        - Idempotency & unique reference constraint enforced per account.
        - Rollback on any failure leaves account state completely untouched.
        """
        # Validate transaction type
        tx_type = data.type.lower().strip()
        if tx_type not in ("credit", "debit"):
            raise InvalidTransactionTypeError(data.type)

        # Validate amount
        amount = parse_and_validate_amount(data.amount)

        # Reference ID check
        ref_id = data.reference_id.strip()
        if not ref_id:
            raise LedgerException(
                code="INVALID_REFERENCE",
                message="Reference ID must be provided and cannot be blank.",
                details={"reference_id": data.reference_id},
            )

        try:
            # Step 1: Acquire row-level lock on the account to serialize concurrent operations
            # with_for_update() locks the row in PostgreSQL. In SQLite, the connection-level WAL lock applies.
            account_query = db.query(Account).filter(Account.id == data.account_id)
            if not settings.DATABASE_URL.startswith("sqlite"):
                account_query = account_query.with_for_update()

            account = account_query.first()
            if not account:
                raise AccountNotFoundError(data.account_id)

            # Step 2: Check for existing duplicate reference on this account
            existing_ref = (
                db.query(Transaction)
                .filter(
                    Transaction.account_id == data.account_id,
                    Transaction.reference_id == ref_id,
                )
                .first()
            )
            if existing_ref:
                raise DuplicateReferenceError(data.account_id, ref_id)

            # Step 3: Check balance sufficiency for debits
            current_balance = Decimal(str(account.balance))
            if tx_type == "debit":
                if current_balance < amount:
                    raise InsufficientBalanceError(
                        account_id=data.account_id,
                        available_balance=format_decimal(current_balance),
                        required_amount=format_decimal(amount),
                    )
                new_balance = current_balance - amount
            else:
                new_balance = current_balance + amount

            # Step 4: Create immutable transaction record
            transaction = Transaction(
                account_id=data.account_id,
                type=tx_type,
                amount=amount,
                description=data.description.strip() if data.description else "",
                reference_id=ref_id,
            )
            db.add(transaction)

            # Step 5: Update account balance
            account.balance = new_balance

            # Step 6: Atomic commit
            db.commit()
            db.refresh(transaction)
            db.refresh(account)

            return transaction, account.balance

        except (AccountNotFoundError, DuplicateReferenceError, InsufficientBalanceError, InvalidTransactionTypeError, InvalidAmountError):
            db.rollback()
            raise
        except IntegrityError as exc:
            db.rollback()
            err_str = str(exc).lower()
            if "uq_account_reference" in err_str or "unique constraint" in err_str or "reference_id" in err_str:
                raise DuplicateReferenceError(data.account_id, ref_id)
            if "chk_account_balance_non_negative" in err_str or "check constraint" in err_str:
                raise InsufficientBalanceError(
                    account_id=data.account_id,
                    available_balance="0.00",
                    required_amount=format_decimal(amount),
                )
            raise LedgerException(
                code="DATABASE_INTEGRITY_ERROR",
                message="Database constraint violation while executing transaction.",
                details={"error": str(exc)},
            )
        except Exception:
            db.rollback()
            raise

    @staticmethod
    def get_transaction_by_id(db: Session, transaction_id: str) -> Transaction:
        tx = db.query(Transaction).filter(Transaction.id == transaction_id).first()
        if not tx:
            raise LedgerException(
                code="TRANSACTION_NOT_FOUND",
                message=f"Transaction '{transaction_id}' was not found.",
                status_code=404,
                details={"transaction_id": transaction_id},
            )
        return tx

    @staticmethod
    def list_transactions(
        db: Session,
        page: int = 1,
        limit: int = 20,
        account_id: Optional[str] = None,
        type: Optional[str] = None,
        reference_id: Optional[str] = None,
        search: Optional[str] = None,
    ) -> Tuple[List[TransactionResponse], PaginationMeta]:
        if page < 1:
            raise InvalidPaginationError("Page must be an integer greater than or equal to 1.", {"page": page})
        if limit < 1 or limit > settings.MAX_PAGE_SIZE:
            raise InvalidPaginationError(
                f"Limit must be between 1 and {settings.MAX_PAGE_SIZE}.",
                {"limit": limit, "max_limit": settings.MAX_PAGE_SIZE},
            )

        query = db.query(Transaction)

        if account_id:
            query = query.filter(Transaction.account_id == account_id.strip())
        if type:
            type_clean = type.strip().lower()
            if type_clean not in ("credit", "debit"):
                raise InvalidTransactionTypeError(type)
            query = query.filter(Transaction.type == type_clean)
        if reference_id:
            query = query.filter(Transaction.reference_id == reference_id.strip())
        if search:
            search_pattern = f"%{search.strip()}%"
            query = query.filter(
                (Transaction.reference_id.ilike(search_pattern))
                | (Transaction.description.ilike(search_pattern))
                | (Transaction.id.ilike(search_pattern))
            )

        total_records = query.count()
        total_pages = ceil(total_records / limit) if total_records > 0 else 0

        # Latest-first ordering with secondary deterministic sort
        transactions = (
            query.order_by(Transaction.created_at.desc(), Transaction.id.desc())
            .offset((page - 1) * limit)
            .limit(limit)
            .all()
        )

        response_list = [TransactionResponse.from_orm_model(tx) for tx in transactions]

        pagination = PaginationMeta(
            current_page=page,
            page_size=limit,
            total_records=total_records,
            total_pages=total_pages,
        )

        return response_list, pagination
