from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.schemas.analytics import CommandCenterSummary
from app.services.analytics_service import AnalyticsService

router = APIRouter(prefix="/analytics", tags=["Analytics"])


@router.get(
    "/summary",
    response_model=CommandCenterSummary,
    status_code=status.HTTP_200_OK,
    summary="Get Command Center live metrics",
    description="Retrieves live system-wide financial statistics, liquidity, volume timelines, and recent transactions.",
)
def get_command_center_summary(db: Session = Depends(get_db)):
    return AnalyticsService.get_command_center_summary(db)
