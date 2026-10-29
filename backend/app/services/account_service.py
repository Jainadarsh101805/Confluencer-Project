from math import ceil
from typing import List, Optional, Tuple
from sqlalchemy import func
from sqlalchemy.orm import Session
from app.core.config import settings
from app.core.errors import AccountNotFoundError, InvalidPaginationError
from app.models.account import Account
from app.models.transaction import Transaction
from app.schemas.account import AccountCreate, AccountResponse
from app.schemas.common import PaginationMeta


class AccountService:
    @staticmethod
    def create_account(db: Session, data: AccountCreate) -> Account:
        account = Account(
            name=data.name,
        )
        db.add(account)
        db.commit()
        db.refresh(account)
        return account

    @staticmethod
    def get_account_by_id(db: Session, account_id: str) -> Account:
        account = db.query(Account).filter(Account.id == account_id).first()
        if not account:
            raise AccountNotFoundError(account_id)
        return account

    @staticmethod
    def list_accounts(
        db: Session,
        page: int = 1,
        limit: int = 20,
        search: Optional[str] = None,
    ) -> Tuple[List[AccountResponse], PaginationMeta]:
        if page < 1:
            raise InvalidPaginationError("Page must be an integer greater than or equal to 1.", {"page": page})
        if limit < 1 or limit > settings.MAX_PAGE_SIZE:
            raise InvalidPaginationError(
                f"Limit must be between 1 and {settings.MAX_PAGE_SIZE}.",
                {"limit": limit, "max_limit": settings.MAX_PAGE_SIZE},
            )

        query = db.query(Account)
        if search:
            query = query.filter(Account.name.ilike(f"%{search.strip()}%"))

        total_records = query.count()
        total_pages = ceil(total_records / limit) if total_records > 0 else 0

        # Subquery or count for transactions per account
        accounts = (
            query.order_by(Account.created_at.desc(), Account.id.desc())
            .offset((page - 1) * limit)
            .limit(limit)
            .all()
        )

        # Get transaction counts
        account_ids = [a.id for a in accounts]
        counts_map = {}
        if account_ids:
            counts = (
                db.query(Transaction.account_id, func.count(Transaction.id))
                .filter(Transaction.account_id.in_(account_ids))
                .group_by(Transaction.account_id)
                .all()
            )
            counts_map = {acc_id: count for acc_id, count in counts}

        response_list = [
            AccountResponse.from_orm_model(acc, counts_map.get(acc.id, 0))
            for acc in accounts
        ]

        pagination = PaginationMeta(
            current_page=page,
            page_size=limit,
            total_records=total_records,
            total_pages=total_pages,
        )

        return response_list, pagination
