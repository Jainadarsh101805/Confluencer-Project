from typing import List, Optional
from pydantic import BaseModel
from app.schemas.transaction import TransactionResponse


class VolumeTimelinePoint(BaseModel):
    date: str
    credits: str
    debits: str


class CommandCenterSummary(BaseModel):
    total_accounts: int
    combined_liquid_balance: str
    total_successful_credits_volume: str
    total_successful_debits_volume: str
    total_transactions_count: int
    total_transfers_count: int
    integrity_status: str
    last_integrity_check: Optional[str]
    recent_transactions: List[TransactionResponse]
    volume_timeline: List[VolumeTimelinePoint]
