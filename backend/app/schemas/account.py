from datetime import datetime
from decimal import Decimal
from typing import Optional
from pydantic import BaseModel, Field, field_validator
from app.schemas.common import format_decimal


class AccountCreate(BaseModel):
    name: str = Field(..., description="Account legal or operational name", min_length=1, max_length=255)

    @field_validator("name")
    @classmethod
    def validate_name(cls, v: str) -> str:
        trimmed = v.strip()
        if not trimmed:
            raise ValueError("Account name must not be blank.")
        return trimmed


class AccountResponse(BaseModel):
    id: str
    name: str
    balance: str
    opening_balance: str
    created_at: datetime
    updated_at: datetime
    transaction_count: Optional[int] = 0

    @classmethod
    def from_orm_model(cls, account, transaction_count: Optional[int] = None):
        return cls(
            id=str(account.id),
            name=account.name,
            balance=format_decimal(account.balance),
            opening_balance=format_decimal(account.opening_balance),
            created_at=account.created_at,
            updated_at=account.updated_at,
            transaction_count=transaction_count if transaction_count is not None else (len(account.transactions) if getattr(account, "transactions", None) is not None else 0),
        )

    model_config = {
        "from_attributes": True,
        "json_schema_extra": {
            "example": {
                "id": "e4b2d184-7a31-4c74-9f2d-8b01a1c90001",
                "name": "Operating Liquidity Account",
                "balance": "100.00",
                "opening_balance": "0.00",
                "created_at": "2026-10-27T18:00:00Z",
                "updated_at": "2026-10-27T18:05:00Z",
                "transaction_count": 4,
            }
        }
    }
