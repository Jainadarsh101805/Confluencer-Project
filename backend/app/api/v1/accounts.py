from typing import Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.schemas.account import AccountCreate, AccountResponse
from app.schemas.common import PaginatedResponse
from app.schemas.transaction import TransactionResponse
from app.services.account_service import AccountService
from app.services.transaction_service import TransactionService

router = APIRouter(prefix="/accounts", tags=["Accounts"])


@router.post(
    "",
    response_model=AccountResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new financial account",
    description="Registers a new account in the ledger with an initial balance of 0.00.",
)
def create_account(data: AccountCreate, db: Session = Depends(get_db)):
    account = AccountService.create_account(db, data)
    return AccountResponse.from_orm_model(account)


@router.get(
    "",
    response_model=PaginatedResponse[AccountResponse],
    summary="List accounts with pagination",
    description="Returns a paginated list of accounts ordered latest first.",
)
def list_accounts(
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(20, ge=1, le=100, description="Records per page"),
    search: Optional[str] = Query(None, description="Search account name"),
    db: Session = Depends(get_db),
):
    accounts, pagination = AccountService.list_accounts(db, page=page, limit=limit, search=search)
    return PaginatedResponse(data=accounts, pagination=pagination)


@router.get(
    "/{account_id}",
    response_model=AccountResponse,
    summary="Get account by ID",
    description="Retrieves current account status and balance from the ledger.",
)
def get_account(account_id: str, db: Session = Depends(get_db)):
    account = AccountService.get_account_by_id(db, account_id)
    return AccountResponse.from_orm_model(account)


@router.get(
    "/{account_id}/transactions",
    response_model=PaginatedResponse[TransactionResponse],
    summary="Get transactions for a specific account",
    description="Returns paginated transaction history for an account in latest-first order.",
)
def get_account_transactions(
    account_id: str,
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(20, ge=1, le=100, description="Records per page"),
    type: Optional[str] = Query(None, description="Filter by 'credit' or 'debit'"),
    db: Session = Depends(get_db),
):
    # Ensure account exists first
    AccountService.get_account_by_id(db, account_id)
    transactions, pagination = TransactionService.list_transactions(
        db, page=page, limit=limit, account_id=account_id, type=type
    )
    return PaginatedResponse(data=transactions, pagination=pagination)
