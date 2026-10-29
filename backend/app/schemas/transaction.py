from datetime import datetime
from decimal import Decimal
from typing import Optional, Literal
from pydantic import BaseModel, Field, field_validator
from app.schemas.common import parse_and_validate_amount, format_decimal


class TransactionCreate(BaseModel):
    account_id: str = Field(..., description="Target Account UUID")
    type: Literal["credit", "debit"] = Field(..., description="Transaction type: strictly 'credit' or 'debit'")
    amount: str = Field(..., description="Monetary transaction amount (> 0, max 2 decimal places)")
    description: Optional[str] = Field("", description="Transaction narrative or explanation", max_length=500)
    reference_id: str = Field(..., description="External unique reference identifier", min_length=1, max_length=100)

    @field_validator("account_id")
    @classmethod
    def validate_account_id(cls, v: str) -> str:
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


class TransactionResponse(BaseModel):
    id: str
    account_id: str
    type: str
    amount: str
    description: str
    reference_id: str
    transfer_id: Optional[str] = None
    created_at: datetime
    account_balance_after: Optional[str] = None

    @classmethod
    def from_orm_model(cls, tx, balance_after: Optional[Decimal] = None):
        return cls(
            id=str(tx.id),
            account_id=str(tx.account_id),
            type=str(tx.type),
            amount=format_decimal(tx.amount),
            description=tx.description or "",
            reference_id=tx.reference_id,
            transfer_id=str(tx.transfer_id) if tx.transfer_id else None,
            created_at=tx.created_at,
            account_balance_after=format_decimal(balance_after) if balance_after is not None else None,
        )

    model_config = {
        "from_attributes": True,
        "json_schema_extra": {
            "example": {
                "id": "7f13b942-0fbc-4990-a359-c2901a88df54",
                "account_id": "e4b2d184-7a31-4c74-9f2d-8b01a1c90001",
                "type": "credit",
                "amount": "100.00",
                "description": "Initial funding",
                "reference_id": "REF-001",
                "transfer_id": None,
                "created_at": "2026-10-27T18:02:15Z",
                "account_balance_after": "100.00",
            }
        }
    }
