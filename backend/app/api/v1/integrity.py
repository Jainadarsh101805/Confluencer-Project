from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.schemas.integrity import IntegrityReport
from app.services.integrity_service import IntegrityService

router = APIRouter(prefix="/integrity", tags=["Integrity"])


@router.get(
    "",
    response_model=IntegrityReport,
    status_code=status.HTTP_200_OK,
    summary="Perform comprehensive ledger reconciliation",
    description=(
        "Executes a real-time mathematical reconciliation across all accounts. "
        "Calculates expected balance from opening balance and the sum of all immutable transactions, "
        "and checks for any discrepancies or invariant violations."
    ),
)
def run_integrity_reconciliation(db: Session = Depends(get_db)):
    return IntegrityService.reconcile_ledger(db)
