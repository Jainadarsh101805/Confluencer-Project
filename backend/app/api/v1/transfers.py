from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.schemas.transaction import TransactionResponse
from app.schemas.transfer import TransferCreate, TransferResponse
from app.services.transfer_service import TransferService

router = APIRouter(prefix="/transfers", tags=["Transfers"])


@router.post(
    "",
    response_model=TransferResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Execute an atomic money transfer between accounts",
    description=(
        "Atomically transfers funds from a source account to a destination account. "
        "Applies deterministic row-level locking to prevent deadlocks, verifies available balance, "
        "and creates two linked ledger entries (source debit and destination credit) in one database transaction. "
        "If any part fails, the entire transfer is rolled back."
    ),
)
def create_transfer(data: TransferCreate, db: Session = Depends(get_db)):
    transfer, src_bal_after, dst_bal_after, txs = TransferService.create_transfer(db, data)
    tx_responses = [TransactionResponse.from_orm_model(tx) for tx in txs]
    return TransferResponse.from_orm_model(
        transfer=transfer,
        source_balance_after=src_bal_after,
        destination_balance_after=dst_bal_after,
        transactions=tx_responses,
    )


@router.get(
    "/{transfer_id}",
    response_model=TransferResponse,
    summary="Get transfer details by ID",
    description="Retrieves a transfer record and both of its linked immutable ledger entries.",
)
def get_transfer(transfer_id: str, db: Session = Depends(get_db)):
    transfer, txs = TransferService.get_transfer_by_id(db, transfer_id)
    tx_responses = [TransactionResponse.from_orm_model(tx) for tx in txs]
    return TransferResponse.from_orm_model(transfer=transfer, transactions=tx_responses)
