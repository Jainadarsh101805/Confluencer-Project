from datetime import datetime
from decimal import Decimal
from typing import Optional, List
from pydantic import BaseModel, Field, field_validator
from app.schemas.common import parse_and_validate_amount, format_decimal
from app.schemas.transaction import TransactionResponse


class TransferCreate(BaseModel):
    source_account_id: str = Field(..., description="Source Account UUID (to debit)")
    destination_account_id: str = Field(..., description="Destination Account UUID (to credit)")
    amount: str = Field(..., description="Monetary transfer amount (> 0, max 2 decimal places)")
    reference_id: str = Field(..., description="Unique transfer reference identifier", min_length=1, max_length=100)
    description: Optional[str] = Field("Inter-account Transfer", description="Transfer narrative", max_length=500)

    @field_validator("source_account_id", "destination_account_id")
    @classmethod
    def validate_ids(cls, v: str) -> str:
        trimmed = v.strip()
        if not trimmed:
            raise ValueError("Account ID is required and must not be empty.")
        return trimmed

    @field_validator("reference_id")
    @classmethod
    def validate_reference_id(cls, v: str) -> str:
        trimmed = v.strip()
        if not trimmed:
            raise ValueError("Reference ID is required and must not be blank.")
        return trimmed

    @field_validator("amount")
    @classmethod
    def validate_amount_field(cls, v: str) -> str:
        parsed = parse_and_validate_amount(v)
        return str(parsed)


class TransferResponse(BaseModel):
    id: str
    source_account_id: str
    destination_account_id: str
    amount: str
    reference_id: str
    description: str
    created_at: datetime
    source_balance_after: Optional[str] = None
    destination_balance_after: Optional[str] = None
    transactions: Optional[List[TransactionResponse]] = None

    @classmethod
    def from_orm_model(
        cls,
        transfer,
        source_balance_after: Optional[Decimal] = None,
        destination_balance_after: Optional[Decimal] = None,
        transactions: Optional[List[TransactionResponse]] = None,
    ):
        return cls(
            id=str(transfer.id),
            source_account_id=str(transfer.source_account_id),
            destination_account_id=str(transfer.destination_account_id),
            amount=format_decimal(transfer.amount),
            reference_id=transfer.reference_id,
            description=transfer.description or "",
            created_at=transfer.created_at,
            source_balance_after=format_decimal(source_balance_after) if source_balance_after is not None else None,
            destination_balance_after=format_decimal(destination_balance_after) if destination_balance_after is not None else None,
            transactions=transactions or [],
        )

    model_config = {
        "from_attributes": True,
        "json_schema_extra": {
            "example": {
                "id": "c8e2193b-5a12-4091-bf9a-28e4692790a1",
                "source_account_id": "e4b2d184-7a31-4c74-9f2d-8b01a1c90001",
                "destination_account_id": "91a273b1-8b42-4912-a10c-9821cb914022",
                "amount": "30.00",
                "reference_id": "TRF-2026-001",
                "description": "Liquidity rebalance",
                "created_at": "2026-10-27T18:10:00Z",
                "source_balance_after": "70.00",
                "destination_balance_after": "80.00",
            }
        }
    }
