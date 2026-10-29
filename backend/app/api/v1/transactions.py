from typing import Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.schemas.common import PaginatedResponse
from app.schemas.transaction import TransactionCreate, TransactionResponse
from app.services.transaction_service import TransactionService

router = APIRouter(prefix="/transactions", tags=["Transactions"])


@router.post(
    "",
    response_model=TransactionResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Record an immutable transaction",
    description=(
        "Atomically creates a transaction (credit or debit) and updates the target account balance. "
        "Enforces row-level locking, non-negative balance checks for debits, and unique reference ID per account. "
        "Once committed, the transaction is immutable and cannot be updated or deleted."
    ),
)
def create_transaction(data: TransactionCreate, db: Session = Depends(get_db)):
    tx, balance_after = TransactionService.create_transaction(db, data)
    return TransactionResponse.from_orm_model(tx, balance_after=balance_after)


@router.get(
    "",
    response_model=PaginatedResponse[TransactionResponse],
    summary="List transactions with pagination and filters",
    description=(
        "Returns a paginated list of transactions in deterministic latest-first order (based on created_at and id). "
        "Supports filtering by account_id, transaction type, reference_id, or search query."
    ),
)
def list_transactions(
    page: int = Query(1, ge=1, description="Page number (1-indexed)"),
    limit: int = Query(20, ge=1, le=100, description="Page size (max 100)"),
    account_id: Optional[str] = Query(None, description="Filter by account UUID"),
    type: Optional[str] = Query(None, description="Filter by type ('credit' or 'debit')"),
    reference_id: Optional[str] = Query(None, description="Filter by exact reference ID"),
    search: Optional[str] = Query(None, description="Search across reference ID or description"),
    db: Session = Depends(get_db),
):
    transactions, pagination = TransactionService.list_transactions(
        db=db,
        page=page,
        limit=limit,
        account_id=account_id,
        type=type,
        reference_id=reference_id,
        search=search,
    )
    return PaginatedResponse(data=transactions, pagination=pagination)


@router.get(
    "/{transaction_id}",
    response_model=TransactionResponse,
    summary="Get transaction by ID",
    description="Retrieves the immutable recorded details of a specific transaction.",
)
def get_transaction(transaction_id: str, db: Session = Depends(get_db)):
    tx = TransactionService.get_transaction_by_id(db, transaction_id)
    return TransactionResponse.from_orm_model(tx)
